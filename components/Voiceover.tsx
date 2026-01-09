
import React, { useState } from 'react';
import { geminiService } from '../services/geminiService';

interface VoiceoverProps {
  initialScript?: string;
}

const Voiceover: React.FC<VoiceoverProps> = ({ initialScript = '' }) => {
  const [text, setText] = useState(initialScript);
  const [voice, setVoice] = useState('Kore');
  const [loading, setLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const voices = [
    { name: 'Kore', desc: 'Cheerful & Clear' },
    { name: 'Puck', desc: 'Deep & Energetic' },
    { name: 'Charon', desc: 'Smooth & Professional' },
    { name: 'Fenrir', desc: 'Authoritative' },
    { name: 'Zephyr', desc: 'Friendly' },
  ];

  const handleGenerateVoice = async () => {
    if (!text.trim()) return;
    setLoading(true);
    try {
      const url = await geminiService.generateSpeech(text, voice);
      setAudioUrl(url);
    } catch (err) {
      console.error(err);
      alert("Voice generation failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header>
        <h2 className="text-3xl font-bold mb-2">Voiceover Studio</h2>
        <p className="text-slate-400">Convert your script into professional narration with lifelike AI voices.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Paste your script here for narration..."
              className="w-full h-80 bg-slate-950 border border-slate-800 rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-mono text-sm resize-none"
            />
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl">
            <h3 className="font-semibold mb-4 text-slate-300">Choose a Voice</h3>
            <div className="space-y-2">
              {voices.map((v) => (
                <button
                  key={v.name}
                  onClick={() => setVoice(v.name)}
                  className={`w-full text-left p-3 rounded-xl transition-all border ${
                    voice === v.name
                      ? 'bg-indigo-600/20 border-indigo-500 text-indigo-400'
                      : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="font-semibold">{v.name}</div>
                  <div className="text-xs opacity-70">{v.desc}</div>
                </button>
              ))}
            </div>

            <button
              onClick={handleGenerateVoice}
              disabled={loading || !text}
              className="w-full mt-6 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Generating...
                </>
              ) : 'Render Audio'}
            </button>
          </div>

          {audioUrl && (
            <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl animate-in zoom-in-95">
              <h3 className="font-semibold mb-4 text-cyan-400">Playback</h3>
              <audio controls src={audioUrl} className="w-full" />
              <a 
                href={audioUrl} 
                download="narration.wav"
                className="mt-4 block text-center text-xs text-indigo-400 hover:underline"
              >
                Download Audio File
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Voiceover;
