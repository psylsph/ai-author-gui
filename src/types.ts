export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface WorkflowStep {
  id: number;
  name: string;
  content: string;
  completed: boolean;
  feedback?: string;
  isProcessing?: boolean;
}

export interface Chapter {
  id: number;
  content: string;
  wordCount: number;
  completed: boolean;
  feedback?: string;
  isProcessing?: boolean;
}

export interface StoryConfig {
  model: string;
  temperature?: number; // Optional - only sent to API if set
  apiKey: string; // Current API key for selected base URL
  baseUrl: string;
  stream: boolean;
  chapterWordTarget?: number; // Target word count per chapter (default: 3000)
  storyType?: 'short-story' | 'novel'; // Type of story being generated
}

export interface WorkflowState {
  currentStep: number;
  steps: WorkflowStep[];
  chapters: Chapter[];
  config: StoryConfig;
  isProcessing: boolean;
  error?: string;
  streamingContent: string;
  isStreaming: boolean;
  showFeedback: boolean;
}

export interface CacheEntry {
  content: string;
  timestamp: number;
}

export interface PromptCache {
  [key: string]: CacheEntry;
}

// Workflow step definitions
export const WORKFLOW_STEPS = [
  { id: 1, name: 'Brainstorm & Reflection', filename: '01_brainstorm_and_reflection.md' },
  { id: 2, name: 'Intention & Chapter Planning', filename: '02_intention_and_chapter_planning.md' },
  { id: 3, name: 'Human vs LLM Critique', filename: '03_human_vs_llm_critique.md' },
  { id: 4, name: 'Final Plan', filename: '04_final_plan.md' },
  { id: 5, name: 'Characters', filename: '05_characters.md' },
  { id: 6, name: 'Write Chapters', filename: 'chapters' }
] as const;

export const CHAPTER_WORD_TARGET = 3000;
export const CHAPTER_MIN_WORDS = CHAPTER_WORD_TARGET;