
import React, { useState } from 'react';
import Layout from './components/Layout';
import Researcher from './components/Researcher';
import ScriptWriter from './components/ScriptWriter';
import Voiceover from './components/Voiceover';
import VideoGenerator from './components/VideoGenerator';
import LiveAssistant from './components/LiveAssistant';
import { AppView, ResearchSource } from './types';

const App: React.FC = () => {
  const [view, setView] = useState<AppView>(AppView.ASSISTANT);
  const [researchData, setResearchData] = useState<{ topic: string; summary: string; sources: ResearchSource[] } | null>(null);
  const [currentScript, setCurrentScript] = useState<string>('');

  const handleResearchComplete = (topic: string, summary: string, sources: ResearchSource[]) => {
    setResearchData({ topic, summary, sources });
  };

  const handleScriptGenerated = (script: string) => {
    setCurrentScript(script);
  };

  const renderView = () => {
    switch (view) {
      case AppView.ASSISTANT:
        return <LiveAssistant />;
      case AppView.RESEARCH:
        return <Researcher onResearchComplete={handleResearchComplete} />;
      case AppView.SCRIPT:
        return <ScriptWriter researchData={researchData} onScriptGenerated={handleScriptGenerated} />;
      case AppView.VOICE:
        return <Voiceover initialScript={currentScript} />;
      case AppView.VIDEO:
        return <VideoGenerator />;
      default:
        return <LiveAssistant />;
    }
  };

  return (
    <Layout activeView={view} onViewChange={setView}>
      {renderView()}
    </Layout>
  );
};

export default App;
