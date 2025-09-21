import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Button,
  Chip,
  LinearProgress,
  Alert
} from '@mui/material';
import { WORKFLOW_STEPS, WorkflowStep, Chapter } from '../types';
import WorkflowStepComponent from './WorkflowStep';

interface StepNavigationProps {
  currentStep: number;
  steps: WorkflowStep[];
  chapters: Chapter[];
  onProcessStep: (stepId: number) => void;
  onAdvanceStep: () => void;
  onFeedback: (stepId: number, feedback: string) => void;
  onCancel?: () => void;
  isProcessing: boolean;
  streamingContent: string;
  isStreaming: boolean;
  showFeedback: boolean;
  onToggleFeedback: () => void;
}

const StepNavigation: React.FC<StepNavigationProps> = ({
  currentStep,
  steps,
  chapters,
  onProcessStep,
  onAdvanceStep,
  onFeedback,
  onCancel,
  isProcessing,
  streamingContent,
  isStreaming,
  showFeedback,
  onToggleFeedback
}) => {
  const getStepStatus = (stepIndex: number) => {
    const step = steps[stepIndex];
    if (!step) return 'pending';

    if (step.completed) return 'completed';
    if (step.isProcessing || isProcessing) return 'processing';
    return 'pending';
  };

  const canAdvance = (stepIndex: number) => {
    const step = steps[stepIndex];
    return step?.completed && stepIndex < steps.length - 1;
  };

  const getStepContent = (stepIndex: number) => {
    const step = steps[stepIndex];
    if (!step) return null;

    // Special handling for chapter writing step
    if (step.id === 6) {
      return (
        <Box>
          <Typography variant="body2" paragraph>
            Write the individual chapters of your story. Each chapter should be at least 3,000 words of narrative prose.
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
            {chapters.map((chapter) => (
              <Paper key={chapter.id} sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Typography variant="h6" sx={{ flexGrow: 1 }}>
                    Chapter {chapter.id}
                  </Typography>
                  {chapter.completed && (
                    <Chip
                      label={`${chapter.wordCount.toLocaleString()} words`}
                      color="success"
                      size="small"
                    />
                  )}
                </Box>
                {chapter.isProcessing && (
                  <LinearProgress sx={{ mb: 1 }} />
                )}
                {chapter.content && (
                  <Typography
                    variant="body2"
                    sx={{
                      maxHeight: '100px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'pre-wrap'
                    }}
                  >
                    {chapter.content.substring(0, 200)}...
                  </Typography>
                )}
                <Button
                  size="small"
                  variant={chapter.completed ? "outlined" : "contained"}
                  onClick={() => onProcessStep(chapter.id)}
                  disabled={chapter.isProcessing || isProcessing}
                  sx={{ mt: 1 }}
                >
                  {chapter.isProcessing ? 'Writing...' : chapter.completed ? 'Rewrite' : 'Write Chapter'}
                </Button>
                {chapter.isProcessing && onCancel && (
                  <Button
                    size="small"
                    variant="outlined"
                    color="error"
                    onClick={onCancel}
                    sx={{ mt: 1 }}
                  >
                    Stop
                  </Button>
                )}
              </Paper>
            ))}
          </Box>
        </Box>
      );
    }

    return (
      <WorkflowStepComponent
        step={step}
        onProcessStep={onProcessStep}
        onAdvanceStep={canAdvance(stepIndex) ? onAdvanceStep : undefined}
        onFeedback={onFeedback}
        onCancel={onCancel}
        isProcessing={isProcessing}
        canAdvance={canAdvance(stepIndex)}
        streamingContent={streamingContent}
        isStreaming={isStreaming}
        showFeedback={showFeedback}
        onToggleFeedback={onToggleFeedback}
      />
    );
  };

  return (
    <Box>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          AI Story Author
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Follow the structured workflow to create your story with AI assistance.
          Each step builds upon the previous ones to ensure a cohesive narrative.
          Current chapters target 3000+ words each.
        </Typography>

        {isStreaming && (
          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body2">
              <strong>Streaming:</strong> The AI is generating content. You can see the response as it's being created.
            </Typography>
          </Alert>
        )}
      </Paper>

      <Stepper activeStep={currentStep} orientation="vertical">
        {WORKFLOW_STEPS.map((stepInfo, index) => {
          const step = steps[index];
          const status = getStepStatus(index);

          return (
            <Step key={stepInfo.id} completed={status === 'completed'}>
              <StepLabel
                icon={
                  status === 'completed' ? '✓' :
                  status === 'processing' ? '⟳' :
                  index + 1
                }
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="h6">
                    {stepInfo.name}
                  </Typography>
                  {step?.completed && (
                    <Chip
                      label="Complete"
                      color="success"
                      size="small"
                    />
                  )}
                </Box>
              </StepLabel>
              <StepContent>
                {getStepContent(index)}
              </StepContent>
            </Step>
          );
        })}
      </Stepper>

      {steps.length > 0 && steps[steps.length - 1]?.completed && (
        <Paper sx={{ p: 3, mt: 3, bgcolor: 'success.light' }}>
          <Typography variant="h5" color="success.dark" gutterBottom>
            🎉 Congratulations!
          </Typography>
          <Typography variant="body1">
            Your story is now complete! All chapters have been written and the workflow is finished.
            You can review your work or start a new story.
          </Typography>
        </Paper>
      )}
    </Box>
  );
};

export default StepNavigation;