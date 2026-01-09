
import React, { useState } from 'react';
import { geminiService } from '../services/geminiService';
import { ResearchSource } from '../types';

interface ResearcherProps {
  onResearchComplete: (topic: string, summary: string, sources: ResearchSource[]) => void;
}

const Researcher: React.FC<ResearcherProps> = ({ onResearchComplete }) => {
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ summary: string; sources: ResearchSource[] } | null>(null);

  const handleResearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;
    setLoading(true);
    try {
      const data = await geminiService.researchTopic(topic);
      setResult(data);
      onResearchComplete(topic, data.summary, data.sources);
    } catch (err) {
      console.error(err);
      alert("Research failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header>
        <h2 className="text-3xl font-bold mb-2">Topic Researcher</h2>
        <p className="text-slate-400">Discover deep insights and verified sources for your next project.</p>
      </header>

      <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl shadow-xl backdrop-blur-sm">
        <form onSubmit={handleResearch} className="flex gap-4">
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="What would you like to research? (e.g. 'Future of Quantum Computing')"
            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
          />
          <button
            type="submit"
            disabled={loading || !topic}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:cursor-not-allowed px-8 py-3 rounded-xl font-semibold transition-all shadow-lg shadow-indigo-500/20"
          >
            {loading ? 'Researching...' : 'Start Research'}
          </button>
        </form>
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
          <p className="text-slate-400 animate-pulse">Sifting through the web for information...</p>
        </div>
      )}

      {result && !loading && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in duration-700">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl">
              <h3 className="text-xl font-semibold mb-4 text-indigo-400">Executive Summary</h3>
              <div className="prose prose-invert prose-slate max-w-none whitespace-pre-wrap leading-relaxed text-slate-300">
                {result.summary}
              </div>
            </div>
          </div>
          
          <div className="space-y-6">
            <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl">
              <h3 className="text-xl font-semibold mb-4 text-cyan-400">Key Sources</h3>
              <div className="space-y-3">
                {result.sources.length > 0 ? result.sources.map((source, i) => (
                  <a
                    key={i}
                    href={source.uri}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block p-3 rounded-lg bg-slate-950/50 border border-slate-800 hover:border-indigo-500/50 hover:bg-indigo-950/20 transition-all group"
                  >
                    <div className="text-sm font-medium text-slate-200 group-hover:text-indigo-400 line-clamp-1">{source.title}</div>
                    <div className="text-xs text-slate-500 truncate mt-1">{source.uri}</div>
                  </a>
                )) : (
                  <p className="text-slate-500 text-sm italic text-center py-4">No sources found.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Researcher;
