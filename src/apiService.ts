import { Message, PromptCache } from './types';

class APIService {
  private cache: PromptCache = {};
  private cacheKey: string;
  private currentController: AbortController | null = null;

  constructor(cacheKey: string = 'ai-author-cache') {
    this.cacheKey = cacheKey;
    this.loadCache();
  }

  private loadCache(): void {
    try {
      const stored = localStorage.getItem(this.cacheKey);
      if (stored) {
        this.cache = JSON.parse(stored);
      }
    } catch (error) {
      console.warn('Failed to load cache:', error);
      this.cache = {};
    }
  }

  private saveCache(): void {
    try {
      localStorage.setItem(this.cacheKey, JSON.stringify(this.cache));
    } catch (error) {
      console.warn('Failed to save cache:', error);
    }
  }

  private generateCacheKey(messages: Message[], temperature?: number): string {
    const payload = {
      messages,
      temperature: temperature ?? null // Use null for undefined to ensure consistent caching
    };
    // Use crypto API or fallback to create a hash that works with Unicode
    const jsonString = JSON.stringify(payload);
    let hash = 0;
    for (let i = 0; i < jsonString.length; i++) {
      const char = jsonString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36).substring(0, 32);
  }

  private getCachedResponse(messages: Message[], temperature?: number): string | null {
    const key = this.generateCacheKey(messages, temperature);
    const entry = this.cache[key];

    if (entry && Date.now() - entry.timestamp < 24 * 60 * 60 * 1000) { // 24 hours
      return entry.content;
    }

    return null;
  }

  private setCachedResponse(messages: Message[], temperature: number | undefined, content: string): void {
    const key = this.generateCacheKey(messages, temperature);
    this.cache[key] = {
      content,
      timestamp: Date.now()
    };
    this.saveCache();
  }

  async chatCompletion(
    messages: Message[],
    model: string,
    temperature: number | undefined,
    apiKey: string,
    baseUrl: string = 'https://api.openai.com/v1'
  ): Promise<string> {
    // Check cache first
    const cached = this.getCachedResponse(messages, temperature);
    if (cached) {
      return cached;
    }

    // Create new AbortController for this request
    this.currentController = new AbortController();

    try {
      // Build request body - only include temperature if it's defined
      const requestBody: any = {
        model,
        messages,
        stream: false
      };

      if (temperature !== undefined) {
        requestBody.temperature = temperature;
      }

      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        signal: this.currentController.signal,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content || '';

      // Cache the response
      this.setCachedResponse(messages, temperature, content);

      return content;
    } catch (error) {
      // Clear the controller if this was an abort
      if (error instanceof Error && error.name === 'AbortError') {
        this.currentController = null;
        throw new Error('Request was cancelled');
      }
      console.error('API Error:', error);
      throw new Error(`API request failed: ${error}`);
    } finally {
      // Always clear the controller when done
      this.currentController = null;
    }
  }

  async *chatCompletionStream(
    messages: Message[],
    model: string,
    temperature: number | undefined,
    apiKey: string,
    baseUrl: string = 'https://api.openai.com/v1',
    onChunk?: (chunk: string) => void
  ): AsyncGenerator<string, string, unknown> {
    console.log('Starting streaming request to:', `${baseUrl}/chat/completions`);
    console.log('Request payload:', { model, messages: messages.length, temperature, stream: true });

    // Create new AbortController for this request
    this.currentController = new AbortController();

    try {
      // Build request body - only include temperature if it's defined
      const requestBody: any = {
        model,
        messages,
        stream: true
      };

      if (temperature !== undefined) {
        requestBody.temperature = temperature;
      }

      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        signal: this.currentController.signal,
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Response error text:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Response body is not readable');
      }

      const decoder = new TextDecoder();
      let buffer = '';
      let fullContent = '';

      try {
        while (true) {
          const { done, value } = await reader.read();

          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);

              if (data === '[DONE]') {
                // Cache the final response
                this.setCachedResponse(messages, temperature, fullContent);
                return fullContent;
              }

              try {
                const parsed = JSON.parse(data);
                const content = parsed.choices?.[0]?.delta?.content;

                if (content) {
                  fullContent += content;
                  if (onChunk) {
                    onChunk(content);
                  }
                  yield content;
                }
              } catch (e) {
                // Ignore parsing errors for non-JSON lines
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }

      // Cache the final response
      this.setCachedResponse(messages, temperature, fullContent);
      return fullContent;

    } catch (error) {
      // Clear the controller if this was an abort
      if (error instanceof Error && error.name === 'AbortError') {
        this.currentController = null;
        throw new Error('Request was cancelled');
      }
      console.error('Streaming API Error:', error);
      throw new Error(`Streaming API request failed: ${error}`);
    } finally {
      // Always clear the controller when done
      this.currentController = null;
    }
  }

  clearCache(): void {
    this.cache = {};
    localStorage.removeItem(this.cacheKey);
  }

  getCacheSize(): number {
    return Object.keys(this.cache).length;
  }

  // Cancel the current request
  cancelCurrentRequest(): void {
    if (this.currentController) {
      this.currentController.abort();
      this.currentController = null;
    }
  }

  // Check if a request is currently in progress
  isRequestInProgress(): boolean {
    return this.currentController !== null;
  }

  async fetchAvailableModels(apiKey: string, baseUrl: string = 'https://api.openai.com/v1'): Promise<string[]> {
    try {
      // Handle OpenRouter models endpoint
      if (baseUrl.includes('openrouter.ai')) {
        const response = await fetch(`${baseUrl}/models`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
        }

        const data = await response.json();
        // OpenRouter returns models in a different format
        return data.data?.map((model: any) => model.id) || [];
      }

      // Handle standard OpenAI-compatible endpoints
      const response = await fetch(`${baseUrl}/models`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
      }

      const data = await response.json();
      // Extract model IDs from the response
      return data.data?.map((model: any) => model.id) || [];
    } catch (error) {
      console.error('Failed to fetch models:', error);
      throw new Error(`Failed to fetch available models: ${error}`);
    }
  }
}

export const apiService = new APIService();