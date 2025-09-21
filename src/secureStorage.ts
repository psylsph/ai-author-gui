/**
 * Simple Storage Utility
 * Provides plain text local storage for settings
 */

const STORAGE_KEY = 'ai_story_author_settings';

// Storage interface
export interface SecureStorageData {
  apiKeys: Record<string, string>; // API keys per base URL
  model: string;
  temperature?: number; // Optional - only sent to API if set
  baseUrl: string;
  stream: boolean;
}

// Preset API endpoints
export const PRESET_ENDPOINTS = {
  'DeepSeek': 'https://api.deepseek.com',
  'OpenRouter': 'https://openrouter.ai/api/v1',
  'Ollama': 'http://localhost:11434',
  'LM Studio': 'http://localhost:1234',
  'OpenAI': 'https://api.openai.com/v1'
} as const;

export type PresetEndpointKey = keyof typeof PRESET_ENDPOINTS;

// Save settings to local storage (plain text)
export function saveSettings(settings: Partial<SecureStorageData>): void {
  try {
    const existingData = loadSettings();
    const updatedData = { ...existingData, ...settings };

    const dataToStore = {
      model: settings.model || existingData.model,
      temperature: settings.temperature ?? existingData.temperature,
      baseUrl: settings.baseUrl || existingData.baseUrl,
      stream: settings.stream ?? existingData.stream,
      apiKeys: { ...existingData.apiKeys }
    };

    // Handle API keys - store as plain text
    if (settings.apiKeys) {
      for (const [url, apiKey] of Object.entries(settings.apiKeys)) {
        dataToStore.apiKeys[url] = apiKey || '';
      }
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToStore));
  } catch (error) {
    console.error('Failed to save settings:', error);
    throw new Error('Failed to save settings');
  }
}

// Load settings from local storage (plain text)
export function loadSettings(): SecureStorageData {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);

    if (!stored) {
      // Return default settings if nothing stored
      return {
        apiKeys: {},
        model: 'deepseek/deepseek-r1', // Better default for OpenRouter
        temperature: undefined, // Optional - only sent to API if set
        baseUrl: 'https://api.deepseek.com',
        stream: true
      };
    }

    const parsedData = JSON.parse(stored);

    return {
      apiKeys: parsedData.apiKeys || {},
      model: parsedData.model || 'deepseek-reasoner',
      temperature: parsedData.temperature, // Keep as undefined if not set
      baseUrl: parsedData.baseUrl || 'https://api.deepseek.com',
      stream: parsedData.stream ?? true
    };
  } catch (error) {
    console.error('Failed to load settings:', error);
    // Return default settings on error
    return {
      apiKeys: {},
      model: 'deepseek/deepseek-r1', // Better default for OpenRouter
      temperature: undefined, // Optional - only sent to API if set
      baseUrl: 'https://api.deepseek.com',
      stream: true
    };
  }
}

// Clear all stored settings
export function clearSettings(): void {
  localStorage.removeItem(STORAGE_KEY);
}

// Check if settings exist
export function hasStoredSettings(): boolean {
  return localStorage.getItem(STORAGE_KEY) !== null;
}

// Force cleanup of corrupted data
export function cleanupCorruptedData(): void {
  console.log('Manually cleaning up corrupted data...');
  localStorage.removeItem(STORAGE_KEY);
  console.log('Corrupted data cleanup completed');
}