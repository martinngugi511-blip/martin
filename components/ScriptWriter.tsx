
import React, { useState } from 'react';
import { geminiService } from '../services/geminiService';
import { ResearchSource } from '../types';

interface ScriptWriterProps {
  researchData: { topic: string; summary: string } | null;
  onScriptGenerated: (script: string) => void;
}

const ScriptWriter: React.FC<ScriptWriterProps> = ({ researchData, onScriptGenerated }) => {
  const [tone, setTone] = useState('Informative');
  const [loading, setLoading] = useState(false);
  const [script, setScript] = useState('');

  const tones = ['Informative', 'Dramatic', 'Energetic', 'Humorous', 'Educational', 'Professional'];

  const handleGenerateScript = async () => {
    setLoading(true);
    try {
      const content = researchData?.summary || "Write a creative script about technology.";
      const generated = await geminiService.writeScript(content, tone);
      setScript(generated || "");
      onScriptGenerated(generated || "");
    } catch (err) {
      console.error(err);
      alert("Failed to generate script.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header>
        <h2 className="text-3xl font-bold mb-2">AI Scriptwriter</h2>
        <p className="text-slate-400">Turn facts and research into engaging narratives.</p>
      </header>

      <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl shadow-xl backdrop-blur-sm">
        <div className="flex flex-col md:flex-row gap-6 items-end">
          <div className="flex-1 space-y-2">
            <label className="text-sm font-medium text-slate-400">Target Tone</label>
            <div className="flex flex-wrap gap-2">
              {tones.map((t) => (
                <button
                  key={t}
                  onClick={() => setTone(t)}
                  className={`px-4 py-2 rounded-full text-sm transition-all ${
                    tone === t 
                      ? 'bg-indigo-600 text-white font-medium shadow-lg shadow-indigo-600/30' 
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={handleGenerateScript}
            disabled={loading}
            className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 px-8 py-3 rounded-xl font-semibold transition-all"
          >
            {loading ? 'Drafting...' : 'Generate Full Script'}
          </button>
        </div>

        {researchData && (
          <div className="mt-4 p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-lg text-xs text-indigo-300">
            Using research data from: <strong>{researchData.topic}</strong>
          </div>
        )}
      </div>

      {(loading || script) && (
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
          <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/80 flex justify-between items-center">
            <h3 className="font-semibold text-indigo-400">Final Script Output</h3>
            {script && (
              <button 
                onClick={() => navigator.clipboard.writeText(script)}
                className="text-xs text-slate-400 hover:text-slate-200 bg-slate-800 px-3 py-1 rounded-md"
              >
                Copy to Clipboard
              </button>
            )}
          </div>
          <div className="p-8 min-h-[400px]">
            {loading ? (
              <div className="h-full flex flex-col items-center justify-center space-y-4 py-20">
                <div className="w-10 h-10 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
                <p className="text-slate-500">Orchestrating the narrative flow...</p>
              </div>
            ) : (
              <div className="prose prose-invert prose-slate max-w-none whitespace-pre-wrap font-mono text-sm leading-relaxed text-slate-300">
                {script}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ScriptWriter;
