
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Modality } from '@google/genai';
import { encode, decode, decodeAudioData } from '../services/geminiService';

type AssistantUIState = 'idle' | 'listening' | 'thinking' | 'speaking';

const NeuralAvatar: React.FC<{ state: AssistantUIState }> = ({ state }) => {
  return (
    <div className="relative w-64 h-64 flex items-center justify-center">
      {/* Background Glow */}
      <div className={`absolute inset-0 rounded-full blur-3xl transition-all duration-1000 opacity-20 ${
        state === 'listening' ? 'bg-indigo-500 scale-110' :
        state === 'speaking' ? 'bg-cyan-400 scale-125' :
        state === 'thinking' ? 'bg-violet-500 scale-100 animate-pulse' :
        'bg-slate-700 scale-90'
      }`} />
      
      {/* Outer Ring */}
      <div className={`absolute inset-0 border-2 rounded-full border-dashed transition-all duration-1000 ${
        state === 'speaking' ? 'border-cyan-400/50 animate-[spin_10s_linear_infinite]' :
        state === 'listening' ? 'border-indigo-400/30 animate-[spin_20s_linear_infinite]' :
        'border-slate-800'
      }`} />

      {/* Inner Rotating Rings */}
      <div className={`absolute w-48 h-48 border border-white/5 rounded-full transition-all duration-700 ${
        state !== 'idle' ? 'scale-100 opacity-100' : 'scale-75 opacity-0'
      }`}>
        <div className={`absolute inset-0 border-t-2 border-indigo-500 rounded-full animate-[spin_3s_linear_infinite] ${state === 'thinking' ? 'opacity-100' : 'opacity-30'}`} />
      </div>

      {/* Core Avatar Sphere */}
      <div className={`relative w-32 h-32 rounded-full shadow-2xl transition-all duration-500 flex items-center justify-center overflow-hidden border-4 ${
        state === 'listening' ? 'bg-indigo-600/20 border-indigo-500 shadow-indigo-500/40' :
        state === 'speaking' ? 'bg-cyan-500/20 border-cyan-400 shadow-cyan-400/40' :
        state === 'thinking' ? 'bg-violet-600/20 border-violet-500 animate-pulse' :
        'bg-slate-800 border-slate-700'
      }`}>
        {/* Particle/Wave visual */}
        <div className="absolute inset-0 flex items-center justify-center">
          {state === 'speaking' && (
            <div className="flex items-end gap-1 h-12">
              {[1, 2, 3, 4, 5].map(i => (
                <div 
                  key={i} 
                  className="w-1.5 bg-cyan-400 rounded-full animate-bounce" 
                  style={{ animationDelay: `${i * 0.1}s`, height: `${Math.random() * 100}%` }} 
                />
              ))}
            </div>
          )}
          {state === 'listening' && (
            <div className="w-12 h-12 rounded-full border-2 border-indigo-400 animate-ping" />
          )}
          {state === 'idle' && <div className="text-2xl opacity-50">💤</div>}
          {state === 'thinking' && <div className="w-8 h-8 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />}
        </div>
      </div>
    </div>
  );
};

const LiveAssistant: React.FC = () => {
  const [isActive, setIsActive] = useState(false);
  const [assistantState, setAssistantState] = useState<AssistantUIState>('idle');
  const [transcription, setTranscription] = useState<{ user: string; model: string }[]>([]);
  const [currentModelTurn, setCurrentModelTurn] = useState('');
  const [currentUserTurn, setCurrentUserTurn] = useState('');
  
  const sessionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef(0);
  const sourcesRef = useRef(new Set<AudioBufferSourceNode>());

  const stopSession = () => {
    if (sessionRef.current) {
      sessionRef.current.close();
      sessionRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    for (const source of sourcesRef.current) {
      source.stop();
    }
    sourcesRef.current.clear();
    setIsActive(false);
    setAssistantState('idle');
  };

  const startSession = async () => {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      audioContextRef.current = outputCtx;

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            setIsActive(true);
            setAssistantState('listening');
            const source = inputCtx.createMediaStreamSource(stream);
            const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const int16 = new Int16Array(inputData.length);
              for (let i = 0; i < inputData.length; i++) {
                int16[i] = inputData[i] * 32768;
              }
              const pcmBlob = {
                data: encode(new Uint8Array(int16.buffer)),
                mimeType: 'audio/pcm;rate=16000',
              };
              sessionPromise.then(session => session.sendRealtimeInput({ media: pcmBlob }));
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputCtx.destination);
          },
          onmessage: async (message: any) => {
            // Determine state
            if (message.serverContent?.modelTurn) {
               setAssistantState('speaking');
            } else if (message.serverContent?.turnComplete) {
               setAssistantState('listening');
            }

            // Audio processing
            const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData.data;
            if (base64Audio) {
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputCtx.currentTime);
              const buffer = await decodeAudioData(decode(base64Audio), outputCtx, 24000, 1);
              const source = outputCtx.createBufferSource();
              source.buffer = buffer;
              source.connect(outputCtx.destination);
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += buffer.duration;
              sourcesRef.current.add(source);
              source.onended = () => {
                sourcesRef.current.delete(source);
                if (sourcesRef.current.size === 0) setAssistantState('listening');
              };
            }

            // Interruptions
            if (message.serverContent?.interrupted) {
              for (const s of sourcesRef.current) s.stop();
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
              setAssistantState('listening');
            }

            // Transcription
            if (message.serverContent?.outputTranscription) {
              setCurrentModelTurn(prev => prev + message.serverContent.outputTranscription.text);
              setAssistantState('speaking');
            } else if (message.serverContent?.inputTranscription) {
              setCurrentUserTurn(prev => prev + message.serverContent.inputTranscription.text);
              setAssistantState('thinking');
            }

            if (message.serverContent?.turnComplete) {
              setTranscription(prev => [...prev, { user: currentUserTurn, model: currentModelTurn }]);
              setCurrentUserTurn('');
              setCurrentModelTurn('');
            }
          },
          onclose: () => stopSession(),
          onerror: (e) => {
            console.error("Live API Error:", e);
            setAssistantState('idle');
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          outputAudioTranscription: {},
          inputAudioTranscription: {},
          systemInstruction: 'You are Nova, an advanced AI creative partner. You have a visual neural avatar that reacts to your voice. Help the user brainstorm scripts, research topics, and offer creative advice in a friendly, high-energy, and professional way.',
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } }
        }
      });

      sessionRef.current = await sessionPromise;
    } catch (err) {
      console.error(err);
      alert("Microphone access or API connection failed.");
      setAssistantState('idle');
    }
  };

  useEffect(() => {
    return () => stopSession();
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto">
      <header className="text-center">
        <h2 className="text-4xl font-extrabold mb-3 bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">Meet Nova</h2>
        <p className="text-slate-400">Your real-time creative companion is ready to collaborate.</p>
      </header>

      <div className="flex flex-col items-center justify-center space-y-8">
        {/* Avatar Section */}
        <div className="relative flex flex-col items-center group">
          <NeuralAvatar state={assistantState} />
          
          <div className="absolute -bottom-4">
             <button
              onClick={isActive ? stopSession : startSession}
              className={`px-8 py-3 rounded-full font-bold transition-all shadow-xl flex items-center gap-2 ${
                isActive 
                ? 'bg-red-500/10 border border-red-500 text-red-500 hover:bg-red-500 hover:text-white' 
                : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-indigo-600/30'
              }`}
            >
              <span className="text-xl">{isActive ? '⏹️' : '🎙️'}</span>
              {isActive ? 'Disconnect' : 'Wake Nova Up'}
            </button>
          </div>
        </div>

        <div className="w-full mt-12 bg-slate-900/40 border border-slate-800 rounded-3xl p-8 min-h-[400px] flex flex-col shadow-2xl backdrop-blur-md">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-800">
            <div className={`w-3 h-3 rounded-full ${isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-700'}`} />
            <span className="text-xs font-bold tracking-widest text-slate-400 uppercase">Interaction Log</span>
          </div>

          <div className="flex-1 space-y-6 overflow-y-auto max-h-[450px] pr-4 custom-scrollbar">
            {transcription.map((entry, i) => (
              <div key={i} className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                <div className="flex justify-end">
                  <div className="flex flex-col items-end gap-1 max-w-[80%]">
                    <span className="text-[10px] text-slate-500 font-bold uppercase mr-2">You</span>
                    <div className="bg-indigo-600/10 border border-indigo-500/30 text-indigo-100 px-5 py-3 rounded-2xl rounded-tr-none text-sm leading-relaxed shadow-sm">
                      {entry.user}
                    </div>
                  </div>
                </div>
                <div className="flex justify-start">
                  <div className="flex flex-col items-start gap-1 max-w-[80%]">
                    <span className="text-[10px] text-cyan-500 font-bold uppercase ml-2">Nova</span>
                    <div className="bg-slate-800/80 border border-slate-700 text-slate-200 px-5 py-3 rounded-2xl rounded-tl-none text-sm leading-relaxed shadow-sm">
                      {entry.model}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {currentUserTurn && (
              <div className="flex justify-end">
                <div className="bg-indigo-600/5 border border-indigo-500/10 text-indigo-300/60 px-5 py-3 rounded-2xl rounded-tr-none text-sm italic animate-pulse">
                  {currentUserTurn}...
                </div>
              </div>
            )}
            
            {currentModelTurn && (
              <div className="flex justify-start">
                 <div className="flex flex-col items-start gap-1 max-w-[80%]">
                    <span className="text-[10px] text-cyan-500 font-bold uppercase ml-2">Nova</span>
                    <div className="bg-slate-800/80 border border-slate-700 text-slate-200 px-5 py-3 rounded-2xl rounded-tl-none text-sm leading-relaxed">
                      {currentModelTurn}
                    </div>
                  </div>
              </div>
            )}

            {!isActive && transcription.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-slate-600 space-y-4 py-20">
                <div className="text-4xl">🗨️</div>
                <p className="text-sm italic font-medium">Connect to start a conversation with your AI creative partner.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveAssistant;
