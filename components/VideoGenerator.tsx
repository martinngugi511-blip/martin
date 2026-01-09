
import React, { useState } from 'react';
import { geminiService } from '../services/geminiService';

const VideoGenerator: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setVideoUrl(null);
    try {
      const url = await geminiService.generateVideo(prompt, (msg) => setStatus(msg));
      setVideoUrl(url);
    } catch (err) {
      console.error(err);
      alert("Video generation failed. Ensure your API key has high-tier access.");
    } finally {
      setLoading(false);
      setStatus('');
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header>
        <h2 className="text-3xl font-bold mb-2">Cinematic Video Engine</h2>
        <p className="text-slate-400">Harness the power of Veo to generate high-quality cinematic clips from text.</p>
      </header>

      <div className="bg-slate-900/50 border border-slate-800 p-8 rounded-2xl shadow-xl backdrop-blur-sm">
        <div className="space-y-4">
          <label className="block text-sm font-medium text-slate-400">Visual Prompt</label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe your scene in detail... (e.g., 'A cyberpunk cityscape at night, neon lights reflecting on wet pavement, cinematic lighting, 4k')"
            className="w-full h-32 bg-slate-950 border border-slate-800 rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all resize-none"
          />
          <div className="flex justify-between items-center">
            <div className="text-xs text-slate-500 max-w-md">
              Note: High-quality video generation may take 1-3 minutes. Requires a paid API key for Veo.
            </div>
            <button
              onClick={handleGenerate}
              disabled={loading || !prompt}
              className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:from-slate-700 disabled:to-slate-800 px-8 py-3 rounded-xl font-bold transition-all shadow-xl shadow-indigo-600/20"
            >
              {loading ? 'Processing Cinematic...' : 'Generate Video'}
            </button>
          </div>
        </div>
      </div>

      {loading && (
        <div className="bg-slate-900/50 border border-slate-800 p-12 rounded-2xl flex flex-col items-center justify-center space-y-6">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-10 h-10 border-4 border-cyan-500/20 border-b-cyan-500 rounded-full animate-spin-slow"></div>
            </div>
          </div>
          <div className="text-center space-y-2">
            <p className="text-xl font-semibold text-slate-200">{status}</p>
            <p className="text-sm text-slate-500 max-w-xs mx-auto">Gemini is rendering pixels and simulating motion for your masterpiece...</p>
          </div>
        </div>
      )}

      {videoUrl && !loading && (
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-500">
          <video 
            src={videoUrl} 
            controls 
            autoPlay 
            loop 
            className="w-full aspect-video bg-black"
          />
          <div className="p-6 flex justify-between items-center bg-slate-900/80">
            <div>
              <h3 className="font-bold text-slate-200">Generated Sequence</h3>
              <p className="text-sm text-slate-400 truncate max-w-lg">{prompt}</p>
            </div>
            <a 
              href={videoUrl} 
              download="masterpiece.mp4"
              className="bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-lg text-sm font-medium transition-all"
            >
              Download MP4
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

// Simple helper for second spinner
const style = document.createElement('style');
style.innerHTML = `
@keyframes spin-slow {
  from { transform: rotate(360deg); }
  to { transform: rotate(0deg); }
}
.animate-spin-slow {
  animation: spin-slow 3s linear infinite;
}
`;
document.head.appendChild(style);

export default VideoGenerator;
