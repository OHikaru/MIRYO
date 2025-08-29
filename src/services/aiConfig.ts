import { AIModelConfig } from '../types';
import { Provider } from './aiClient';

export interface AIProviderConfig {
  provider: Provider;
  apiKey: string;
  model: string;
  endpoint?: string;
}

// Get API keys from environment or local storage
export function getAPIKey(provider: Provider): string {
  // First check environment variables
  const envKey = getEnvAPIKey(provider);
  if (envKey) return envKey;
  
  // Fall back to localStorage for user-provided keys
  return localStorage.getItem(`ai_${provider}_key`) || '';
}

function getEnvAPIKey(provider: Provider): string {
  switch (provider) {
    case 'openai':
      return import.meta.env.VITE_OPENAI_API_KEY || '';
    case 'anthropic':
      return import.meta.env.VITE_CLAUDE_API_KEY || '';
    case 'gemini':
      return import.meta.env.VITE_GEMINI_API_KEY || '';
    default:
      return '';
  }
}

// Save API key to localStorage
export function saveAPIKey(provider: Provider, key: string): void {
  if (key.trim()) {
    localStorage.setItem(`ai_${provider}_key`, key.trim());
  } else {
    localStorage.removeItem(`ai_${provider}_key`);
  }
}

// Get default model for provider
export function getDefaultModel(provider: Provider): string {
  switch (provider) {
    case 'openai':
      return 'gpt-4o-mini';
    case 'anthropic':
      return 'claude-3-5-sonnet-latest';
    case 'gemini':
      return 'models/gemini-2.0-flash';
    default:
      return '';
  }
}

// Get current AI configuration
export function getCurrentAIConfig(): AIModelConfig {
  const provider = (localStorage.getItem('ai_provider') || 'openai') as Provider;
  const model = localStorage.getItem('ai_model') || getDefaultModel(provider);
  const apiKey = getAPIKey(provider);
  
  return {
    provider,
    model,
    apiKey,
    devKeyInBrowser: import.meta.env.VITE_DEV_MODE === 'true' || !import.meta.env.PROD,
    endpointBase: getEndpointBase(provider)
  };
}

function getEndpointBase(provider: Provider): string | undefined {
  switch (provider) {
    case 'openai':
      return import.meta.env.VITE_OPENAI_ENDPOINT;
    case 'anthropic':
      return import.meta.env.VITE_CLAUDE_ENDPOINT;
    case 'gemini':
      return import.meta.env.VITE_GEMINI_ENDPOINT;
    default:
      return undefined;
  }
}

// Save AI provider selection
export function saveAIProvider(provider: Provider, model?: string): void {
  localStorage.setItem('ai_provider', provider);
  if (model) {
    localStorage.setItem('ai_model', model);
  } else {
    localStorage.setItem('ai_model', getDefaultModel(provider));
  }
}

// Provider display names
export function getProviderDisplayName(provider: Provider): string {
  switch (provider) {
    case 'openai':
      return 'OpenAI GPT';
    case 'anthropic':
      return 'Anthropic Claude';
    case 'gemini':
      return 'Google Gemini';
    default:
      return provider;
  }
}