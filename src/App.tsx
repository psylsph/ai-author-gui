import React, { useState, useCallback } from 'react';
import {
  ThemeProvider,
  createTheme,
  CssBaseline,
  Container,
  Box,
  AppBar,
  Toolbar,
  IconButton,
  Tooltip,
  Alert,
  Typography,
  Paper,
  Chip
} from '@mui/material';
import {
  Settings as SettingsIcon,
  Download as DownloadIcon,
  Clear as ClearIcon,
  Refresh as RefreshIcon,
  FileUpload as FileUploadIcon
} from '@mui/icons-material';
import {
  TextField,
  Button
} from '@mui/material';
import {
  WorkflowState,
  StoryConfig,
  Message,
  WORKFLOW_STEPS,
  WorkflowStep,
  Chapter
} from './types';
import { apiService } from './apiService';
import ConfigurationDialog from './components/ConfigurationDialog';
import StepNavigation from './components/StepNavigation';
import { loadSettings, saveSettings, clearSettings, cleanupCorruptedData } from './secureStorage';
import { getApiKeyFromEnv, getDefaultConfigFromEnv } from './env';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

// Helper functions
const createInitialSteps = (): WorkflowStep[] => {
  return WORKFLOW_STEPS.map(stepInfo => ({
    id: stepInfo.id,
    name: stepInfo.name,
    content: '',
    completed: false,
    feedback: '',
    isProcessing: false
  }));
};

const createInitialChapters = (count: number): Chapter[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    content: '',
    wordCount: 0,
    completed: false,
    feedback: '',
    isProcessing: false
  }));
};

const createDefaultConfig = (): StoryConfig => {
  const envConfig = getDefaultConfigFromEnv();
  return {
    model: envConfig.model,
    temperature: envConfig.temperature,
    apiKey: envConfig.apiKey,
    baseUrl: envConfig.baseUrl,
    stream: envConfig.stream,
    chapterWordTarget: envConfig.chapterWordTarget,
    storyType: 'short-story',
  };
};

// Common model mappings for different providers
const MODEL_MAPPINGS: Record<string, Record<string, string>> = {
  'https://openrouter.ai/api/v1': {
    'deepseek-reasoner': 'deepseek/deepseek-r1',
    'gpt-4': 'openai/gpt-4',
    'gpt-3.5-turbo': 'openai/gpt-3.5-turbo',
    'claude-3': 'anthropic/claude-3-sonnet-20240229',
    'claude-3-haiku': 'anthropic/claude-3-haiku-20240307'
  },
  'https://api.openai.com/v1': {
    'gpt-4': 'gpt-4',
    'gpt-3.5-turbo': 'gpt-3.5-turbo'
  }
};

function App() {
  const [workflowState, setWorkflowState] = useState<WorkflowState>({
    currentStep: 0,
    steps: createInitialSteps(),
    chapters: [],
    config: createDefaultConfig(),
    isProcessing: false,
    error: undefined,
    streamingContent: '',
    isStreaming: false,
    showFeedback: false
  });

  const [showConfig, setShowConfig] = useState(false);
  const [storyPrompt, setStoryPrompt] = useState('Write me a short story about a robot learning to understand human emotions.');
  const [storyType, setStoryType] = useState<'short-story' | 'novel'>('short-story');
  const [chapterCount, setChapterCount] = useState(3);
  const [suggestedChapterCount, setSuggestedChapterCount] = useState<number | null>(null);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({});
  const [messages, setMessages] = useState<Message[]>([
    { role: 'system', content: 'You are a helpful assistant' }
  ]);

  // Map model names between providers
  const mapModelForProvider = useCallback((model: string, baseUrl: string): string => {
    const mappings = MODEL_MAPPINGS[baseUrl];
    return mappings?.[model] || model;
  }, []);

  const updateConfig = useCallback(async (newConfig: Partial<StoryConfig>) => {
    let updatedConfig = { ...newConfig };

    // Map model name if base URL changed
    if (newConfig.baseUrl && newConfig.baseUrl !== workflowState.config.baseUrl) {
      const mappedModel = mapModelForProvider(workflowState.config.model, newConfig.baseUrl);
      updatedConfig.model = mappedModel;
    }

    setWorkflowState(prev => ({
      ...prev,
      config: { ...prev.config, ...updatedConfig }
    }));

    // Save settings to storage
    try {
      const settingsToSave: any = { ...updatedConfig };

      // Handle API key updates
      if (newConfig.apiKey !== undefined) {
        const currentBaseUrl = newConfig.baseUrl || workflowState.config.baseUrl;
        const updatedApiKeys = {
          ...apiKeys,
          [currentBaseUrl]: newConfig.apiKey
        };
        setApiKeys(updatedApiKeys);
        settingsToSave.apiKeys = updatedApiKeys;
        delete settingsToSave.apiKey; // Remove from settings since we're using apiKeys
      }

      saveSettings(settingsToSave);
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  }, [workflowState.config.baseUrl, workflowState.config.model, apiKeys, mapModelForProvider]);

  const toggleFeedback = useCallback(() => {
    setWorkflowState(prev => ({
      ...prev,
      showFeedback: !prev.showFeedback
    }));
  }, []);

  const parseChapterCountFromResponse = useCallback((content: string): number | null => {
    const match = content.match(/CHAPTER_COUNT:\s*(\d+)/i);
    return match ? parseInt(match[1], 10) : null;
  }, []);

  // Get current API key for selected base URL
  const getCurrentApiKey = useCallback(() => {
    // First check environment variables
    const envApiKey = getApiKeyFromEnv(workflowState.config.baseUrl);
    if (envApiKey) {
      return envApiKey;
    }

    // Fall back to localStorage
    return apiKeys[workflowState.config.baseUrl] || '';
  }, [apiKeys, workflowState.config.baseUrl]);

  // Load settings on app initialization
  React.useEffect(() => {
    const loadStoredSettings = () => {
      try {
        const storedSettings = loadSettings();
        setApiKeys(storedSettings.apiKeys);
        setWorkflowState(prev => ({
          ...prev,
          config: {
            ...prev.config,
            ...storedSettings
          }
        }));
      } catch (error) {
        console.error('Failed to load stored settings:', error);
      } finally {
        setIsLoadingSettings(false);
      }
    };

    loadStoredSettings();
  }, []);

  // Re-initialize chapters when chapter count changes
  React.useEffect(() => {
    if (workflowState.currentStep > 0) {
      setWorkflowState(prev => ({
        ...prev,
        chapters: createInitialChapters(chapterCount)
      }));
    }
  }, [chapterCount, workflowState.currentStep]);

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.includes('text') && !file.name.endsWith('.txt') && !file.name.endsWith('.md')) {
      setWorkflowState(prev => ({ ...prev, error: 'Please select a text file (.txt) or markdown file (.md)' }));
      return;
    }

    // Validate file size (max 1MB)
    if (file.size > 1024 * 1024) {
      setWorkflowState(prev => ({ ...prev, error: 'File size must be less than 1MB' }));
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (content) {
        setStoryPrompt(content);
        setWorkflowState(prev => ({ ...prev, error: undefined }));
      }
    };
    reader.onerror = () => {
      setWorkflowState(prev => ({ ...prev, error: 'Error reading file. Please try again.' }));
    };
    reader.readAsText(file);

    // Clear the file input
    event.target.value = '';
  }, []);

  const processStep = useCallback(async (stepId: number) => {
    if (workflowState.isProcessing) return;

    setWorkflowState(prev => ({
      ...prev,
      isProcessing: true,
      error: undefined,
      streamingContent: '',
      isStreaming: workflowState.config.stream,
      // Reset step completion status when re-running
      steps: prev.steps.map(step =>
        step.id === stepId ? { ...step, completed: false, content: '' } : step
      )
    }));

    try {
      // Use the full conversation history
      let messagesToUse: Message[] = [...messages];

      // Get feedback for current step
      const currentStep = workflowState.steps.find(step => step.id === stepId);
      const stepFeedback = currentStep?.feedback || '';

      // Build prompt based on step
      let prompt = '';
      const storyTypeLabel = storyType === 'short-story' ? 'short story' : 'novel';

      if (stepId === 1) {
        // Step 1: Brainstorm & Reflection
        prompt = `Initial Writing Prompt:\n${storyPrompt}\n--\nYour task is to create a writing plan for this prompt. The scope will be a ${storyTypeLabel}; do not assume a fixed number of chapters yet. Your plan should be comprehensive and in this format:\n# Brainstorming\n<Brainstorm ideas for characters, plot, tone, story beats, and possible pacing. The purpose of brainstorming is to cast a wide net of ideas, not to settle on any specific direction. Think about various ways you could take the prompt.>\n# Reflection\n<Reflect out loud on what works and doesn't work in these ideas. The purpose of this reflection is to narrow in on what you think will work best to make a piece that is a. compelling, and b. fits the prompt requirements. You are not making any decisions just yet, just reflecting.>\nFinally, propose the ideal number of chapters for this ${storyTypeLabel} based on the prompt and your analysis.\nOutput a single line at the end in this exact format so it can be parsed reliably:\nCHAPTER_COUNT: <integer>`;
      } else if (stepId === 2) {
        // Step 2: Intention & Chapter Planning - include original prompt context
        prompt = `Original Story Prompt:\n${storyPrompt}\n\nGreat now let's continue with planning the ${storyTypeLabel}. Output in this format:\n# Intention\n<State your formulated intentions for the piece, synthesised from the parts of the brainstorming session that worked, and avoiding the parts that didn't. Be explicit about the choices you have made about plot, voice, stylistic choices, things you intend to aim for & avoid.>\n# Chapter Planning\n<Write a brief chapter plan for all ${chapterCount} chapters.>`;
      } else if (stepId === 3) {
        // Step 3: Human vs LLM Critique - include original prompt and previous context
        prompt = `Original Story Prompt:\n${storyPrompt}\n\nWith a view to making the writing more human, discuss how a human might approach this particular piece (given the original prompt). Discuss telltale LLM approaches to writing (generally) and ways they might not serve this particular piece. For example, common LLM failings are to write safely, or to always wrap things up with a bow, or trying to write impressively at the expense of readability. Then do a deep dive on the intention & plan, critiquing ways it might be falling into typical LLM tropes & pitfalls. Brainstorm ideas to make it more human. Be comprehensive. We aren't doing any rewriting of the plan yet, just critique & brainstorming.`;
      } else if (stepId === 4) {
        // Step 4: Final Plan - include original prompt and all previous context
        const wordTarget = workflowState.config.chapterWordTarget || 3000;
        prompt = `Original Story Prompt:\n${storyPrompt}\n\nOk now with these considerations in mind, formulate the final plan for a human like, compelling ${storyTypeLabel} in ${chapterCount} chapters. Bear in mind the constraints of the piece (each chapter is approximately ${wordTarget} words). Above all things, the plan must serve the original prompt. We will use the same format as before:\n# Intention\n<State your formulated intentions for the piece, synthesised from the parts of the brainstorming session that worked, and avoiding the parts that didn't. Be explicit about the choices you have made about plot, voice, stylistic choices, things you intend to aim for & avoid.>\n# Chapter Planning\n<Write a brief chapter plan for all ${chapterCount} chapters.>`;
      } else if (stepId === 5) {
        // Step 5: Characters - include original prompt and all previous context
        prompt = `Original Story Prompt:\n${storyPrompt}\n\nPerfect. Now with the outline more crystallised, and bearing in mind the discussion on human writing vs LLM pitfalls, we will flesh out our characters. Lets go through each of our main characters:\n- Write about their background, personality, idiosyncrasies, flaws. Be specific and come up with examples to anchor & ground the character's profile (both core and trivial)\n- Briefly describe their physicality: appearance, how they carry themselves, express, interact with the world.\n- Concisely detail their motives, allegiances and existing relationships. Think from the perspective of the character as a real breathing thinking feeling individual in this world.\n- Write a couple quotes of flavour dialogue / internal monologue from the character to experiment with their voice.\nOutput like this:\n# Character 1 name\n<character exploration>\n# Character 2 name\n<character exploration>\n etc`;
      }

      // Add feedback to the prompt if it exists
      if (stepFeedback.trim()) {
        prompt += `\n\n--- FEEDBACK TO APPLY ---\n${stepFeedback}\n\nPlease incorporate this feedback into your response above.`;
      }

      messagesToUse.push({ role: 'user', content: prompt });

      if (workflowState.config.stream) {
        // Use streaming
        let fullContent = '';
        try {
          const mappedModel = mapModelForProvider(workflowState.config.model, workflowState.config.baseUrl);
          const streamGenerator = apiService.chatCompletionStream(
            messagesToUse,
            mappedModel,
            workflowState.config.temperature,
            getCurrentApiKey(),
            workflowState.config.baseUrl,
            (chunk: string) => {
              fullContent += chunk;
              setWorkflowState(prev => ({
                ...prev,
                streamingContent: fullContent
              }));
            }
          );

          for await (const chunk of streamGenerator) {
            console.info('Received chunk:', chunk);
          }
        } catch (error) {
          console.error('Streaming error:', error);
          // Fallback to regular API call
          const mappedModel = mapModelForProvider(workflowState.config.model, workflowState.config.baseUrl);
          const content = await apiService.chatCompletion(
            messagesToUse,
            mappedModel,
            workflowState.config.temperature,
            getCurrentApiKey(),
            workflowState.config.baseUrl
          );
          fullContent = content;
        }

        setWorkflowState(prev => ({
          ...prev,
          steps: prev.steps.map(step =>
            step.id === stepId ? { ...step, content: fullContent, completed: true } : step
          ),
          isProcessing: false,
          streamingContent: '',
          isStreaming: false
        }));

        setMessages(prev => [...prev, { role: 'assistant', content: fullContent }]);

        // Parse chapter count suggestion from step 1 response
        if (stepId === 1) {
          const suggestedCount = parseChapterCountFromResponse(fullContent);
          if (suggestedCount) {
            setSuggestedChapterCount(suggestedCount);
            setChapterCount(suggestedCount);
          }
        }
      } else {
        // Use regular API call
        const mappedModel = mapModelForProvider(workflowState.config.model, workflowState.config.baseUrl);
        const content = await apiService.chatCompletion(
          messagesToUse,
          mappedModel,
          workflowState.config.temperature,
          getCurrentApiKey(),
          workflowState.config.baseUrl
        );

        setWorkflowState(prev => ({
          ...prev,
          steps: prev.steps.map(step =>
            step.id === stepId ? { ...step, content, completed: true } : step
          ),
          isProcessing: false
        }));

        setMessages(prev => [...prev, { role: 'assistant', content }]);

        // Parse chapter count suggestion from step 1 response
        if (stepId === 1) {
          const suggestedCount = parseChapterCountFromResponse(content);
          if (suggestedCount) {
            setSuggestedChapterCount(suggestedCount);
            setChapterCount(suggestedCount);
          }
        }
      }

    } catch (error) {
      // Check if this was a cancellation
      if (error instanceof Error && error.message === 'Request was cancelled') {
        setWorkflowState(prev => ({
          ...prev,
          isProcessing: false,
          streamingContent: '',
          isStreaming: false,
          error: 'Step processing was cancelled'
        }));
      } else {
        setWorkflowState(prev => ({
          ...prev,
          isProcessing: false,
          streamingContent: '',
          isStreaming: false,
          error: error instanceof Error ? error.message : 'An error occurred'
        }));
      }
    }
  }, [workflowState.config, workflowState.isProcessing, workflowState.steps, messages, chapterCount, storyType, getCurrentApiKey, mapModelForProvider, parseChapterCountFromResponse, storyPrompt]);

  const processChapter = useCallback(async (chapterId: number) => {
    if (workflowState.isProcessing) return;

    setWorkflowState(prev => ({
      ...prev,
      isProcessing: true,
      error: undefined,
      streamingContent: '',
      isStreaming: workflowState.config.stream,
      chapters: prev.chapters.map(chapter =>
        chapter.id === chapterId ? { ...chapter, isProcessing: true, content: '' } : chapter
      )
    }));

    try {
      const wordTarget = workflowState.config.chapterWordTarget || 3000;
      const chapterStoryTypeLabel = workflowState.config.storyType === 'short-story' ? 'short story' : 'novel';

      // Get feedback for current chapter
      const currentChapter = workflowState.chapters.find(chapter => chapter.id === chapterId);
      const chapterFeedback = currentChapter?.feedback || '';

      let chapterPrompt = `Original Story Prompt:\n${storyPrompt}\n\nWrite Chapter ${chapterId} of the ${chapterStoryTypeLabel}, following the approved plan and prior chapters.\n- Produce at least ${wordTarget} words of narrative prose.\n- Count only the words in your final story text; do not include planning notes or analysis.\n- Output only the polished chapter text (you may open with a 'Chapter ${chapterId}' heading if that matches the style), and do not mention the word count or include any commentary.`;

      // Add feedback to the prompt if it exists
      if (chapterFeedback.trim()) {
        chapterPrompt += `\n\n--- FEEDBACK TO APPLY ---\n${chapterFeedback}\n\nPlease incorporate this feedback into your response above.`;
      }

      const chapterMessages: Message[] = [...messages, { role: 'user', content: chapterPrompt }];

      if (workflowState.config.stream) {
        // Use streaming for chapter writing
        let fullContent = '';
        try {
          const mappedModel = mapModelForProvider(workflowState.config.model, workflowState.config.baseUrl);
          const streamGenerator = apiService.chatCompletionStream(
            chapterMessages,
            mappedModel,
            workflowState.config.temperature,
            getCurrentApiKey(),
            workflowState.config.baseUrl,
            (chunk: string) => {
              fullContent += chunk;
              setWorkflowState(prev => ({
                ...prev,
                streamingContent: fullContent
              }));
            }
          );

          for await (const _chunk of streamGenerator) {
            // Streaming is handled by the callback above
            console.info('Received chapter chunk' + _chunk);
          }
        } catch (error) {
          console.error('Chapter streaming error:', error);
          // Fallback to regular API call
          const mappedModel = mapModelForProvider(workflowState.config.model, workflowState.config.baseUrl);
          const content = await apiService.chatCompletion(
            chapterMessages,
            mappedModel,
            workflowState.config.temperature,
            getCurrentApiKey(),
            workflowState.config.baseUrl
          );
          fullContent = content;
        }

        const wordCount = fullContent.split(/\s+/).filter(word => word.length > 0).length;

        setWorkflowState(prev => ({
          ...prev,
          chapters: prev.chapters.map(chapter =>
            chapter.id === chapterId
              ? { ...chapter, content: fullContent, wordCount, completed: true, isProcessing: false }
              : chapter
          ),
          isProcessing: false,
          streamingContent: '',
          isStreaming: false
        }));

        setMessages(prev => [...prev, { role: 'assistant', content: fullContent }]);
      } else {
        // Use regular API call for chapter writing
        const mappedModel = mapModelForProvider(workflowState.config.model, workflowState.config.baseUrl);
        const content = await apiService.chatCompletion(
          chapterMessages,
          mappedModel,
          workflowState.config.temperature,
          getCurrentApiKey(),
          workflowState.config.baseUrl
        );

        const wordCount = content.split(/\s+/).filter(word => word.length > 0).length;

        setWorkflowState(prev => ({
          ...prev,
          chapters: prev.chapters.map(chapter =>
            chapter.id === chapterId
              ? { ...chapter, content, wordCount, completed: true, isProcessing: false }
              : chapter
          ),
          isProcessing: false
        }));

        setMessages(prev => [...prev, { role: 'assistant', content }]);
      }

    } catch (error) {
      // Check if this was a cancellation
      if (error instanceof Error && error.message === 'Request was cancelled') {
        setWorkflowState(prev => ({
          ...prev,
          isProcessing: false,
          streamingContent: '',
          isStreaming: false,
          chapters: prev.chapters.map(chapter =>
            chapter.id === chapterId ? { ...chapter, isProcessing: false } : chapter
          ),
          error: 'Chapter generation was cancelled'
        }));
      } else {
        setWorkflowState(prev => ({
          ...prev,
          isProcessing: false,
          streamingContent: '',
          isStreaming: false,
          chapters: prev.chapters.map(chapter =>
            chapter.id === chapterId ? { ...chapter, isProcessing: false } : chapter
          ),
          error: error instanceof Error ? error.message : 'An error occurred'
        }));
      }
    }
  }, [workflowState.config, workflowState.isProcessing, workflowState.chapters, messages, storyPrompt, getCurrentApiKey, mapModelForProvider]);

  const advanceToNextStep = useCallback(() => {
    console.log('advanceToNextStep called');
    console.log('Current step:', workflowState.currentStep);
    console.log('WORKFLOW_STEPS.length:', WORKFLOW_STEPS.length);

    // Allow advancing to chapter writing phase (step 6 and beyond)
    if (workflowState.currentStep < WORKFLOW_STEPS.length + 1) {
      console.log('Advancing to step:', workflowState.currentStep + 1);
      setWorkflowState(prev => ({
        ...prev,
        currentStep: prev.currentStep + 1,
        error: undefined
      }));
    } else {
      console.log('Cannot advance further - at max step');
    }
  }, [workflowState.currentStep]);

  const handleFeedback = useCallback((stepId: number, feedback: string) => {
    setWorkflowState(prev => ({
      ...prev,
      steps: prev.steps.map(step =>
        step.id === stepId ? { ...step, feedback } : step
      )
    }));
    setMessages(prev => [...prev, { role: 'user', content: `FEEDBACK FOR STEP ${stepId}:\n${feedback}\nPlease apply this feedback in the next steps.` }]);

    // Automatically re-process the step with feedback applied
    setTimeout(() => {
      processStep(stepId);
    }, 500);
  }, [processStep]);

  const handleChapterFeedback = useCallback((chapterId: number, feedback: string) => {
    setWorkflowState(prev => ({
      ...prev,
      chapters: prev.chapters.map(chapter =>
        chapter.id === chapterId ? { ...chapter, feedback } : chapter
      )
    }));

    // Automatically re-process the chapter with feedback applied
    setTimeout(() => {
      processChapter(chapterId);
    }, 500);
  }, [processChapter]);

  const cancelCurrentRequest = useCallback(() => {
    apiService.cancelCurrentRequest();
    setWorkflowState(prev => ({
      ...prev,
      isProcessing: false,
      streamingContent: '',
      isStreaming: false,
      error: 'Request was cancelled by user'
    }));
  }, []);

  const exportStory = () => {
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    const filename = `story-${timestamp}.txt`;

    const storyContent = [
      `# Story Generated on ${new Date().toISOString()}`,
      '',
      `## Original Prompt`,
      storyPrompt,
      '',
      ...workflowState.steps.map(step => [
        `## ${step.name}`,
        step.content,
        step.feedback ? `### Feedback\n${step.feedback}` : '',
        ''
      ]).flat(),
      '## Chapters',
      ...workflowState.chapters.map(chapter => [
        `### Chapter ${chapter.id}`,
        chapter.content,
        `Word count: ${chapter.wordCount}`,
        chapter.feedback ? `### Feedback\n${chapter.feedback}` : '',
        ''
      ]).flat()
    ].filter(Boolean).join('\n');

    const blob = new Blob([storyContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const clearAll = () => {
    // Clear storage and cleanup any corrupted data
    clearSettings();
    cleanupCorruptedData();

    setWorkflowState({
      currentStep: 0,
      steps: createInitialSteps(),
      chapters: [],
      config: {
        ...createDefaultConfig(),
        model: 'deepseek/deepseek-r1', // Better default for OpenRouter
        temperature: undefined, // Reset to empty
        chapterWordTarget: 3000 // Reset to default
      },
      isProcessing: false,
      error: undefined,
      streamingContent: '',
      isStreaming: false,
      showFeedback: false
    });
    setStoryPrompt('');
    setStoryType('short-story');
    setChapterCount(5);
    setSuggestedChapterCount(null);
    setApiKeys({});
    setMessages([{ role: 'system', content: 'You are a helpful assistant' }]);
    apiService.clearCache();
  };

  const resetStoryData = () => {
    const currentModel = workflowState.config.model;
    const currentTemperature = workflowState.config.temperature;
    const currentBaseUrl = workflowState.config.baseUrl;

    setWorkflowState({
      currentStep: 0,
      steps: createInitialSteps(),
      chapters: [],
      config: {
        ...createDefaultConfig(),
        model: currentModel === 'deepseek-reasoner' ? 'deepseek/deepseek-r1' : currentModel, // Better default for OpenRouter
        temperature: currentTemperature, // Keep current temperature setting
        baseUrl: currentBaseUrl,
        chapterWordTarget: workflowState.config.chapterWordTarget, // Keep current chapter word target
        storyType: workflowState.config.storyType || 'short-story' // Keep current story type or default to short-story
      },
      isProcessing: false,
      error: undefined,
      streamingContent: '',
      isStreaming: false,
      showFeedback: false
    });
    setStoryPrompt('Write me a short story about a robot learning to understand human emotions.');
    setStoryType('short-story');
    setChapterCount(3);
    setSuggestedChapterCount(null);
    setMessages([{ role: 'system', content: 'You are a helpful assistant' }]);
    apiService.clearCache();
  };

  const startWorkflow = useCallback(() => {
    console.log('startWorkflow called with storyPrompt:', storyPrompt);
    console.log('storyPrompt length:', storyPrompt.length);
    console.log('storyPrompt trimmed:', storyPrompt.trim());
    console.log('storyPrompt trimmed length:', storyPrompt.trim().length);

    if (!storyPrompt || !storyPrompt.trim()) {
      setWorkflowState(prev => ({ ...prev, error: 'Please enter a story prompt' }));
      return;
    }

    const currentApiKey = getCurrentApiKey();
    if (!currentApiKey || !currentApiKey.trim()) {
      setWorkflowState(prev => ({ ...prev, error: 'Please enter an API key' }));
      return;
    }

    // Initialize chapters based on chapter count
    setWorkflowState(prev => ({
      ...prev,
      chapters: createInitialChapters(chapterCount),
      currentStep: 1,
      error: undefined,
      config: {
        ...prev.config,
        storyPrompt,
        chapterCount,
        storyType
      }
    }));
  }, [storyPrompt, storyType, chapterCount, getCurrentApiKey]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ flexGrow: 1 }}>
        <AppBar position="static">
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              AI Author
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Tooltip title="Configuration">
                <IconButton color="inherit" onClick={() => setShowConfig(true)}>
                  <SettingsIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Export Story">
                <span>
                  <IconButton
                    color="inherit"
                    onClick={exportStory}
                    disabled={workflowState.chapters.length === 0}
                  >
                    <DownloadIcon />
                  </IconButton>
                </span>
              </Tooltip>
              <Tooltip title="Clear All">
                <IconButton color="inherit" onClick={clearAll}>
                  <ClearIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Reset Story Data (Keep API Settings)">
                <IconButton color="inherit" onClick={resetStoryData}>
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Toolbar>
        </AppBar>

        <Container maxWidth="lg" sx={{ mt: 2, mb: 4 }}>
          {workflowState.error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {workflowState.error}
            </Alert>
          )}

          {isLoadingSettings && (
            <Alert severity="info" sx={{ mb: 2 }}>
              Loading saved settings...
            </Alert>
          )}

          <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>
              AI Author
            </Typography>

            {/* Story Configuration - Always Visible */}
            <Paper sx={{ p: 2, mb: 3, bgcolor: 'background.paper' }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                  <Typography variant="h6" sx={{ minWidth: 120 }}>
                    Story Type:
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      variant={storyType === 'short-story' ? 'contained' : 'outlined'}
                      onClick={() => setStoryType('short-story')}
                      size="small"
                    >
                      Short Story
                    </Button>
                    <Button
                      variant={storyType === 'novel' ? 'contained' : 'outlined'}
                      onClick={() => setStoryType('novel')}
                      size="small"
                    >
                      Novel
                    </Button>
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
                    {storyType === 'short-story'
                      ? "A focused, concise story (typically 1-10 chapters)"
                      : "A longer, more expansive story (typically 10+ chapters)"
                    }
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                  <Typography variant="h6" sx={{ minWidth: 120 }}>
                    Chapter Count:
                  </Typography>
                  <TextField
                    type="number"
                    value={chapterCount}
                    onChange={(e) => setChapterCount(parseInt(e.target.value) || 1)}
                    inputProps={{ min: 1, max: storyType === 'short-story' ? 20 : 50 }}
                    size="small"
                    sx={{ width: 80 }}
                  />
                  {suggestedChapterCount && suggestedChapterCount !== chapterCount && (
                    <Chip
                      label={`AI suggests: ${suggestedChapterCount}`}
                      color="info"
                      size="small"
                      onClick={() => setChapterCount(suggestedChapterCount)}
                      sx={{ cursor: 'pointer' }}
                    />
                  )}
                  <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
                    {workflowState.currentStep === 0
                      ? "Suggest the number of chapters for your story"
                      : "Adjust chapter count if needed"
                    }
                  </Typography>
                </Box>
              </Box>
            </Paper>

            {workflowState.currentStep === 0 ? (
              <>
                <Typography variant="body1" paragraph>
                  Create compelling stories with AI assistance. Enter your story details below and start the guided workflow.
                </Typography>

                <Box sx={{ maxWidth: 800, mx: 'auto', mt: 4 }}>
                  <TextField
                    label="Story Prompt"
                    multiline
                    rows={4}
                    value={storyPrompt}
                    onChange={(e) => setStoryPrompt(e.target.value)}
                    placeholder="Enter your story idea or prompt here..."
                    fullWidth
                    sx={{ mb: 2 }}
                    error={!storyPrompt.trim()}
                    helperText={!storyPrompt.trim() ? "Story prompt is required to start" : ""}
                  />

                  <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
                    <input
                      accept=".txt,.md,text/*"
                      style={{ display: 'none' }}
                      id="story-file-upload"
                      type="file"
                      onChange={handleFileUpload}
                    />
                    <label htmlFor="story-file-upload">
                      <Button
                        variant="outlined"
                        component="span"
                        startIcon={<FileUploadIcon />}
                        sx={{ minWidth: 150 }}
                      >
                        Load File
                      </Button>
                    </label>
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
                    <Button
                      variant="contained"
                      onClick={startWorkflow}
                      size="large"
                      sx={{ minWidth: 120 }}
                      disabled={!storyPrompt.trim()}
                    >
                      Start
                    </Button>
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                      <IconButton
                        color="primary"
                        onClick={() => setShowConfig(true)}
                        size="large"
                      >
                        <SettingsIcon fontSize="large" />
                      </IconButton>
                      <Typography variant="h6" sx={{ alignSelf: 'center' }}>
                        API Settings
                      </Typography>
                    </Box>
                  </Box>

                  <Typography variant="body2" color="text.secondary" sx={{ mt: 2, textAlign: 'center' }}>
                    Click the settings icon above to configure your API settings and preferences.
                  </Typography>

                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1, textAlign: 'center', fontStyle: 'italic' }}>
                    💡 Tip: You can also load your story prompt from a text file using the "Load File" button.
                  </Typography>
                </Box>
              </>
            ) : (
              <StepNavigation
                currentStep={workflowState.currentStep - 1}
                steps={workflowState.steps}
                chapters={workflowState.chapters}
                onProcessStep={workflowState.currentStep <= 5 ? processStep : processChapter}
                onAdvanceStep={advanceToNextStep}
                onFeedback={workflowState.currentStep <= 5 ? handleFeedback : handleChapterFeedback}
                onCancel={cancelCurrentRequest}
                isProcessing={workflowState.isProcessing}
                streamingContent={workflowState.streamingContent}
                isStreaming={workflowState.isStreaming}
                showFeedback={workflowState.showFeedback}
                onToggleFeedback={toggleFeedback}
                chapterWordTarget={workflowState.config.chapterWordTarget}
              />
            )}
          </Box>
        </Container>

        <ConfigurationDialog
          open={showConfig}
          onClose={() => setShowConfig(false)}
          onSave={(config) => {
            updateConfig(config);
            // Start workflow with the new config
            startWorkflow();
          }}
          initialConfig={workflowState.config}
        />
      </Box>
    </ThemeProvider>
  );
}

export default App;
