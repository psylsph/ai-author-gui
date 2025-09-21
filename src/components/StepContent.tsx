import React, { useState } from 'react';
import {
  Paper,
  Typography,
  Box,
  Button,
  TextField,
  Collapse,
  Card,
  CardContent,
  CardActions,
  Chip
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Feedback as FeedbackIcon,
  CheckCircle as CheckCircleIcon,
  PlayArrow as PlayArrowIcon,
  SkipNext as SkipNextIcon
} from '@mui/icons-material';
import { WorkflowStep } from '../types';

interface StepContentProps {
  step?: WorkflowStep;
  onFeedback: (feedback: string) => void;
  onProcessStep?: (stepId: number) => void;
  onAdvanceStep?: () => void;
  isProcessing?: boolean;
  canAdvance?: boolean;
  onStreamingStateChange?: (isStreaming: boolean) => void;
}

const StepContent: React.FC<StepContentProps> = ({
  step,
  onFeedback,
  onProcessStep,
  onAdvanceStep,
  isProcessing = false,
  canAdvance = false,
  onStreamingStateChange
}) => {
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [streamingContent] = useState('');
  const [isStreaming] = useState(false);

  // Update parent component when streaming state changes
  React.useEffect(() => {
    console.log('StepContent streaming state changed:', isStreaming, 'content length:', streamingContent.length);
    if (onStreamingStateChange) {
      onStreamingStateChange(isStreaming);
    }
  }, [isStreaming, onStreamingStateChange, streamingContent.length]);

  // Debug: Log when component re-renders
  React.useEffect(() => {
    console.log('StepContent re-rendered, isStreaming:', isStreaming, 'content:', streamingContent.substring(0, 100) + '...');
  });

  if (!step) {
    return (
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" color="text.secondary">
          No step selected
        </Typography>
      </Paper>
    );
  }

  const handleFeedbackSubmit = () => {
    if (feedback.trim()) {
      onFeedback(feedback.trim());
      setFeedback('');
      setShowFeedback(false);
    }
  };

  const formatContent = (content: string) => {
    // Split content by headers and format
    const sections = content.split(/^#+\s/gm).filter(Boolean);

    return sections.map((section, index) => {
      const lines = section.trim().split('\n');
      const title = lines[0];
      const body = lines.slice(1).join('\n').trim();

      return (
        <Box key={index} sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            {renderMarkdown(title)}
          </Typography>
          <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
            {renderMarkdown(body)}
          </Typography>
        </Box>
      );
    });
  };

  const renderMarkdown = (text: string) => {
    // Handle bold text **text**
    let formatted = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    // Handle italic text *text*
    formatted = formatted.replace(/(?<!\*)\*(?!\*)([^*]+?)(?<!\*)\*(?!\*)/g, '<em>$1</em>');

    // Handle headers (but we already split by headers, so this is for sub-headers)
    formatted = formatted.replace(/^### (.*$)/gm, '<h4>$1</h4>');
    formatted = formatted.replace(/^## (.*$)/gm, '<h3>$1</h3>');
    formatted = formatted.replace(/^# (.*$)/gm, '<h2>$1</h2>');

    // Handle line breaks
    formatted = formatted.replace(/\n/g, '<br/>');

    return <span dangerouslySetInnerHTML={{ __html: formatted }} />;
  };

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5" component="h5" sx={{ flexGrow: 1 }}>
            {step.name}
          </Typography>
          {step.completed && (
            <Chip
              icon={<CheckCircleIcon />}
              label="Completed"
              color="success"
              variant="outlined"
            />
          )}
        </Box>

        <Box sx={{ mb: 2 }}>
          {isStreaming && (
            <Box sx={{ mb: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Generating response... ({streamingContent.length} chars)
              </Typography>
              {formatContent(streamingContent)}
            </Box>
          )}
          {!isStreaming && step.content && formatContent(step.content)}
        </Box>
      </CardContent>

      <CardActions>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button
            startIcon={showFeedback ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            onClick={() => setShowFeedback(!showFeedback)}
            size="small"
          >
            {showFeedback ? 'Hide' : 'Show'} Feedback
          </Button>

          {onProcessStep && !step.completed && (
            <Button
              startIcon={<PlayArrowIcon />}
              onClick={() => onProcessStep(step.id)}
              disabled={isProcessing}
              variant="contained"
              size="small"
            >
              {isProcessing ? 'Processing...' : 'Process Step'}
            </Button>
          )}

          {onAdvanceStep && step.completed && canAdvance && (
            <Button
              startIcon={<SkipNextIcon />}
              onClick={onAdvanceStep}
              variant="outlined"
              size="small"
            >
              Next Step
            </Button>
          )}
        </Box>
      </CardActions>

      <Collapse in={showFeedback}>
        <Box sx={{ p: 2, pt: 0 }}>
          <TextField
            label="Provide feedback for this step"
            multiline
            rows={3}
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            fullWidth
            placeholder="Enter your feedback or suggestions..."
            sx={{ mb: 2 }}
          />
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="contained"
              startIcon={<FeedbackIcon />}
              onClick={handleFeedbackSubmit}
              disabled={!feedback.trim()}
            >
              Submit Feedback
            </Button>
            <Button
              onClick={() => {
                setFeedback('');
                setShowFeedback(false);
              }}
            >
              Cancel
            </Button>
          </Box>
        </Box>
      </Collapse>
    </Card>
  );
};

export default StepContent;