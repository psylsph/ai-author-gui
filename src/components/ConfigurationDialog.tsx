import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Box,
  Typography,
  Alert,
  CircularProgress,
  Chip
} from '@mui/material';
import { StoryConfig } from '../types';
import { saveSettings, PRESET_ENDPOINTS } from '../secureStorage';
import { apiService } from '../apiService';

interface ConfigurationDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (config: StoryConfig) => void;
  initialConfig?: Partial<StoryConfig>;
}

const DEFAULT_CONFIG: StoryConfig = {
  model: 'deepseek-reasoner',
  temperature: undefined, // Optional - only sent to API if set
  apiKey: '',
  baseUrl: 'https://api.deepseek.com',
  stream: true
};

// Model suggestions for different providers
const PROVIDER_MODELS: Record<string, string[]> = {
  'https://api.deepseek.com': ['deepseek-reasoner', 'deepseek-chat'],
  'https://openrouter.ai/api/v1': ['deepseek/deepseek-r1', 'openai/gpt-4', 'openai/gpt-3.5-turbo', 'anthropic/claude-3-sonnet-20240229'],
  'https://api.openai.com/v1': ['gpt-4', 'gpt-3.5-turbo'],
  'http://localhost:11434': ['llama2', 'codellama', 'mistral'],
  'http://localhost:1234': ['local-model']
};

const ConfigurationDialog: React.FC<ConfigurationDialogProps> = ({
  open,
  onClose,
  onSave,
  initialConfig = {}
}) => {
  const [config, setConfig] = useState<StoryConfig>({
    ...DEFAULT_CONFIG,
    ...initialConfig
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [modelsError, setModelsError] = useState<string | null>(null);
  const [selectedEndpoint, setSelectedEndpoint] = useState<string>('');
  const [customBaseUrl, setCustomBaseUrl] = useState<string>('');
  const [showFreeModelsOnly, setShowFreeModelsOnly] = useState(false);

  // Filter models based on free filter
  const filteredModels = availableModels.filter(model =>
    !showFreeModelsOnly || model.toLowerCase().includes('free')
  );

  // Fetch available models when API key and base URL are available
  const fetchModels = useCallback(async () => {
    if (!config.apiKey.trim() || !config.baseUrl.trim()) {
      setAvailableModels([]);
      setModelsError(null);
      return;
    }

    setIsLoadingModels(true);
    setModelsError(null);

    try {
      const models = await apiService.fetchAvailableModels(config.apiKey, config.baseUrl);
      setAvailableModels(models);

      // If current model is not in the list, reset to first available model
      if (models.length > 0 && !models.includes(config.model)) {
        setConfig(prev => ({ ...prev, model: models[0] }));
      }
    } catch (error) {
      setModelsError(error instanceof Error ? error.message : 'Failed to fetch models');
      setAvailableModels([]);
    } finally {
      setIsLoadingModels(false);
    }
  }, [config.apiKey, config.baseUrl, config.model]);

  // Handle base URL changes
  const handleEndpointChange = (endpoint: string) => {
    setSelectedEndpoint(endpoint);
    if (endpoint && endpoint !== 'custom') {
      const baseUrl = PRESET_ENDPOINTS[endpoint as keyof typeof PRESET_ENDPOINTS];
      const suggestedModels = PROVIDER_MODELS[baseUrl] || [];
      const newModel = suggestedModels.length > 0 ? suggestedModels[0] : config.model;

      setConfig(prev => ({ ...prev, baseUrl, model: newModel }));
      setCustomBaseUrl('');
    }
  };

  const handleCustomUrlChange = (url: string) => {
    setCustomBaseUrl(url);
    if (url.trim()) {
      setConfig(prev => ({ ...prev, baseUrl: url.trim() }));
    }
  };

  // Fetch models when API key or base URL changes
  useEffect(() => {
    fetchModels();
  }, [config.apiKey, config.baseUrl, fetchModels]);

  // Initialize selected endpoint based on current base URL
  useEffect(() => {
    const matchingEndpoint = Object.entries(PRESET_ENDPOINTS).find(
      ([, url]) => url === config.baseUrl
    );
    if (matchingEndpoint) {
      setSelectedEndpoint(matchingEndpoint[0]);
    } else {
      setSelectedEndpoint('custom');
      setCustomBaseUrl(config.baseUrl);
    }
  }, [config.baseUrl]);

  const validateConfig = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!config.apiKey.trim()) {
      newErrors.apiKey = 'API key is required';
    }

    if (config.temperature !== undefined && (config.temperature < 0 || config.temperature > 2)) {
      newErrors.temperature = 'Temperature must be between 0 and 2';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (validateConfig()) {
      try {
        // Save to storage
        saveSettings(config);
        onSave(config);
        onClose();
      } catch (error) {
        console.error('Failed to save settings:', error);
        // Still call onSave to update the UI even if storage fails
        onSave(config);
        onClose();
      }
    }
  };

  const handleChange = (field: keyof StoryConfig, value: any) => {
    setConfig(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        AI Configuration
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Configure your AI model settings and API parameters
        </Typography>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 2 }}>

         <FormControl fullWidth>
            <InputLabel>API Endpoint</InputLabel>
            <Select
              value={selectedEndpoint}
              onChange={(e) => handleEndpointChange(e.target.value)}
              label="API Endpoint"
            >
              {Object.entries(PRESET_ENDPOINTS).map(([name, url]) => (
                <MenuItem key={name} value={name}>
                  {name} ({url})
                </MenuItem>
              ))}
              <MenuItem value="custom">Custom URL</MenuItem>
            </Select>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
              Select your API provider or choose Custom URL for other endpoints
            </Typography>
          </FormControl>

          {selectedEndpoint === 'custom' && (
            <TextField
              label="Custom Base URL"
              value={customBaseUrl}
              onChange={(e) => handleCustomUrlChange(e.target.value)}
              placeholder="https://your-api-endpoint.com/v1"
              fullWidth
              helperText="Enter the base URL for your API endpoint (e.g., https://api.openai.com/v1)"
            />
          )}

          <TextField
            label="API Key"
            type="password"
            value={config.apiKey}
            onChange={(e) => handleChange('apiKey', e.target.value)}
            error={!!errors.apiKey}
            helperText={errors.apiKey || "Your API key for the selected endpoint"}
            fullWidth
          />

          <FormControl fullWidth>
            <InputLabel>Model</InputLabel>
            <Select
              value={config.model}
              onChange={(e) => handleChange('model', e.target.value)}
              label="Model"
              disabled={isLoadingModels}
              endAdornment={
                isLoadingModels ? (
                  <CircularProgress size={20} sx={{ mr: 2 }} />
                ) : null
              }
            >
              {filteredModels.length > 0 ? (
                filteredModels.map((model) => (
                  <MenuItem key={model} value={model}>
                    {model}
                    {model.toLowerCase().includes('free') && (
                      <Chip
                        label="FREE"
                        size="small"
                        color="success"
                        sx={{ ml: 1, height: 20, fontSize: '0.7rem' }}
                      />
                    )}
                  </MenuItem>
                ))
              ) : availableModels.length > 0 ? (
                <MenuItem disabled>
                  No free models available
                </MenuItem>
              ) : (
                <MenuItem value={config.model} disabled>
                  {config.model || 'No models available'}
                </MenuItem>
              )}
            </Select>
            {modelsError ? (
              <Typography variant="caption" color="error" sx={{ mt: 1 }}>
                {modelsError}
              </Typography>
            ) : (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                AI model to use for generation. Models are fetched from your API endpoint.
              </Typography>
            )}
          </FormControl>

          {/* Free Models Filter Toggle */}
          {availableModels.length > 0 && (
            <FormControlLabel
              control={
                <Switch
                  checked={showFreeModelsOnly}
                  onChange={(e) => setShowFreeModelsOnly(e.target.checked)}
                />
              }
              label="Show only free models"
              sx={{ mt: 1 }}
            />
          )}

           <TextField
             label="Temperature (optional)"
             type="number"
             value={config.temperature || ''}
             onChange={(e) => handleChange('temperature', e.target.value ? parseFloat(e.target.value) : undefined)}
             error={!!errors.temperature}
             helperText={errors.temperature || "Leave empty to use model's default temperature"}
             inputProps={{ min: 0, max: 2, step: 0.1 }}
             fullWidth
           />

          <FormControlLabel
            control={
              <Switch
                checked={config.stream}
                onChange={(e) => handleChange('stream', e.target.checked)}
              />
            }
            label="Enable streaming responses"
          />

          <Alert severity="info">
            <Typography variant="body2">
              <strong>Tip:</strong> Enable streaming to see the AI's response as it's being generated.
              This provides better feedback and allows you to stop generation if needed.
            </Typography>
          </Alert>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} variant="contained">
          Save Settings
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfigurationDialog;