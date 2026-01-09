
export enum AppView {
  RESEARCH = 'RESEARCH',
  SCRIPT = 'SCRIPT',
  VOICE = 'VOICE',
  VIDEO = 'VIDEO',
  ASSISTANT = 'ASSISTANT'
}

export interface ResearchSource {
  title: string;
  uri: string;
}

export interface Script {
  id: string;
  title: string;
  content: string;
  timestamp: number;
}

export interface Voiceover {
  id: string;
  scriptId: string;
  audioUrl: string;
  voiceName: string;
  timestamp: number;
}

export interface GeneratedVideo {
  id: string;
  prompt: string;
  videoUrl: string;
  timestamp: number;
}

export interface AppState {
  view: AppView;
  scripts: Script[];
  currentResearch: {
    topic: string;
    summary: string;
    sources: ResearchSource[];
  } | null;
}
