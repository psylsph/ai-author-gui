import React, { useState } from 'react';
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
  Alert,
  TextField,
  Collapse
} from '@mui/material';
import {
  Feedback as FeedbackIcon
} from '@mui/icons-material';
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
  chapterWordTarget?: number;
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
  onToggleFeedback,
  chapterWordTarget
}) => {
  const [chapterFeedbackStates, setChapterFeedbackStates] = useState<Record<number, boolean>>({});
  const [chapterFeedbackValues, setChapterFeedbackValues] = useState<Record<number, string>>({});

  const toggleChapterFeedback = (chapterId: number) => {
    setChapterFeedbackStates(prev => ({
      ...prev,
      [chapterId]: !prev[chapterId]
    }));
  };

  const handleChapterFeedbackChange = (chapterId: number, feedback: string) => {
    setChapterFeedbackValues(prev => ({
      ...prev,
      [chapterId]: feedback
    }));
  };

  const handleChapterFeedbackSubmit = (chapterId: number) => {
    const feedback = chapterFeedbackValues[chapterId] || '';
    if (feedback.trim()) {
      // Update the chapter with feedback
      onFeedback(chapterId, feedback);
      // Close feedback section
      setChapterFeedbackStates(prev => ({
        ...prev,
        [chapterId]: false
      }));
    }
  };
  const getStepStatus = (stepIndex: number) => {
    const step = steps[stepIndex];
    if (!step) return 'pending';

    if (step.completed) return 'completed';
    if (step.isProcessing || isProcessing) return 'processing';
    return 'pending';
  };

  const canAdvance = (stepIndex: number) => {
    const step = steps[stepIndex];
    const canAdvanceResult = step?.completed && stepIndex < steps.length;
    console.log(`canAdvance(${stepIndex}):`, {
      stepCompleted: step?.completed,
      stepIndex,
      stepsLength: steps.length,
      result: canAdvanceResult
    });
    // Allow advancing from any completed step, including the last regular step
    return canAdvanceResult;
  };

  const getStepContent = (stepIndex: number) => {
    const step = steps[stepIndex];
    if (!step) return null;

    // Special handling for chapter writing step
    if (step.id === 6) {
      return (
        <Box>
          <Typography variant="body2" paragraph>
            Write the individual chapters of your story. Each chapter should be at least {chapterWordTarget || 3000} words of narrative prose.
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {chapters.map((chapter) => (
              <Paper key={chapter.id} sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
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
                  <Box sx={{ mb: 2 }}>
                    <LinearProgress />
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      Writing chapter...
                    </Typography>
                  </Box>
                )}
                {/* Show streaming content if chapter is being processed */}
                {chapter.isProcessing && isStreaming && streamingContent && (
                  <Box
                    sx={{
                      maxHeight: '300px',
                      overflow: 'auto',
                      border: '1px solid',
                      borderColor: 'primary.main',
                      borderRadius: 1,
                      p: 2,
                      mb: 2,
                      backgroundColor: 'action.hover'
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{
                        whiteSpace: 'pre-wrap',
                        fontFamily: 'monospace',
                        fontSize: '0.875rem',
                        lineHeight: 1.5
                      }}
                    >
                      {streamingContent}
                    </Typography>
                  </Box>
                )}

                {/* Show completed chapter content */}
                {chapter.content && !chapter.isProcessing && (
                  <Box
                    sx={{
                      maxHeight: '300px',
                      overflow: 'auto',
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 1,
                      p: 2,
                      mb: 2,
                      backgroundColor: 'background.paper'
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{
                        whiteSpace: 'pre-wrap',
                        fontFamily: 'monospace',
                        fontSize: '0.875rem',
                        lineHeight: 1.5
                      }}
                    >
                      {chapter.content}
                    </Typography>
                  </Box>
                )}
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Button
                    size="small"
                    variant={chapter.completed ? "outlined" : "contained"}
                    onClick={() => onProcessStep(chapter.id)}
                    disabled={chapter.isProcessing || isProcessing}
                  >
                    {chapter.isProcessing ? 'Writing...' : chapter.completed ? 'Rewrite' : 'Write Chapter'}
                  </Button>
                  {chapter.isProcessing && onCancel && (
                    <Button
                      size="small"
                      variant="outlined"
                      color="error"
                      onClick={onCancel}
                    >
                      Stop
                    </Button>
                  )}
                  {chapter.completed && (
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<FeedbackIcon />}
                      onClick={() => toggleChapterFeedback(chapter.id)}
                    >
                      Feedback
                    </Button>
                  )}
                </Box>

                {/* Chapter Feedback Section */}
                {chapter.completed && (
                  <Collapse in={chapterFeedbackStates[chapter.id] || false}>
                    <Box sx={{ mt: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
                      <Typography variant="body2" gutterBottom>
                        Provide feedback to improve this chapter:
                      </Typography>
                      <TextField
                        fullWidth
                        multiline
                        rows={3}
                        placeholder="Enter your feedback here..."
                        value={chapterFeedbackValues[chapter.id] || ''}
                        onChange={(e) => handleChapterFeedbackChange(chapter.id, e.target.value)}
                        sx={{ mb: 1 }}
                      />
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                          size="small"
                          variant="contained"
                          onClick={() => handleChapterFeedbackSubmit(chapter.id)}
                          disabled={!chapterFeedbackValues[chapter.id]?.trim()}
                        >
                          Apply Feedback
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => toggleChapterFeedback(chapter.id)}
                        >
                          Cancel
                        </Button>
                      </Box>
                    </Box>
                  </Collapse>
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
          AI Author
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Follow the structured workflow to create your story with AI assistance.
          Each step builds upon the previous ones to ensure a cohesive narrative.
          Current chapters target {chapterWordTarget || 3000}+ words each.
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