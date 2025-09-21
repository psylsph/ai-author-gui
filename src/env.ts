// Environment variable utilities for AI Author

export interface EnvConfig {
  openai: {
    apiKey: string;
    baseUrl: string;
  };
  deepseek: {
    apiKey: string;
    baseUrl: string;
  };
  openrouter: {
    apiKey: string;
    baseUrl: string;
  };
  defaults: {
    model: string;
    baseUrl: string;
    stream: boolean;
    chapterWordTarget: number;
  };
  app: {
    title: string;
  };
}

// Get environment variable with fallback
const getEnvVar = (key: string, fallback: string = ''): string => {
  // Check if process.env exists (for Create React App compatibility)
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key] || fallback;
  }
  return fallback;
};

// Get boolean environment variable
const getEnvBool = (key: string, fallback: boolean = false): boolean => {
  // Check if process.env exists (for Create React App compatibility)
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    const value = process.env[key];
    return value === 'true' || value === '1';
  }
  return fallback;
};

// Get number environment variable
const getEnvNumber = (key: string, fallback: number = 0): number => {
  // Check if process.env exists (for Create React App compatibility)
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    const value = process.env[key];
    const parsed = parseInt(value || '', 10);
    return isNaN(parsed) ? fallback : parsed;
  }
  return fallback;
};

// Load configuration from environment variables
export const loadEnvConfig = (): EnvConfig => {
  return {
    openai: {
      apiKey: getEnvVar('VITE_OPENAI_API_KEY', ''),
      baseUrl: getEnvVar('VITE_OPENAI_BASE_URL', 'https://api.openai.com/v1'),
    },
    deepseek: {
      apiKey: getEnvVar('VITE_DEEPSEEK_API_KEY', ''),
      baseUrl: getEnvVar('VITE_DEEPSEEK_BASE_URL', 'https://api.deepseek.com'),
    },
    openrouter: {
      apiKey: getEnvVar('VITE_OPENROUTER_API_KEY', ''),
      baseUrl: getEnvVar('VITE_OPENROUTER_BASE_URL', 'https://openrouter.ai/api/v1'),
    },
    defaults: {
      model: getEnvVar('VITE_DEFAULT_MODEL', 'meta-llama/llama-3.3-70b-instruct:free'),
      baseUrl: getEnvVar('VITE_DEFAULT_BASE_URL', 'https://openrouter.ai/api/v1'),
      stream: getEnvBool('VITE_DEFAULT_STREAM', true),
      chapterWordTarget: getEnvNumber('VITE_DEFAULT_CHAPTER_WORD_TARGET', 3000),
    },
    app: {
      title: getEnvVar('VITE_APP_TITLE', 'AI Author'),
    },
  };
};

// Get API key for a specific base URL from environment variables
export const getApiKeyFromEnv = (baseUrl: string): string => {
  const config = loadEnvConfig();

  switch (baseUrl) {
    case config.openai.baseUrl:
      return config.openai.apiKey;
    case config.deepseek.baseUrl:
      return config.deepseek.apiKey;
    case config.openrouter.baseUrl:
      return config.openrouter.apiKey;
    default:
      return '';
  }
};

// Check if environment variables are configured
export const hasEnvApiKeys = (): boolean => {
  const config = loadEnvConfig();
  return !!(config.openai.apiKey || config.deepseek.apiKey || config.openrouter.apiKey);
};

// Get default configuration from environment
export const getDefaultConfigFromEnv = () => {
  const config = loadEnvConfig();
  return {
    model: config.defaults.model,
    temperature: undefined,
    apiKey: getApiKeyFromEnv(config.defaults.baseUrl) || '',
    baseUrl: config.defaults.baseUrl,
    stream: config.defaults.stream,
    chapterWordTarget: config.defaults.chapterWordTarget,
  };
};