import React from 'react';
import {
  Paper,
  Typography,
  Box,
  Button,
  Card,
  CardContent,
  CardActions,
  LinearProgress,
  Chip,
  Alert
} from '@mui/material';
import {
  AutoStories as BookIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import { Chapter } from '../types';
import { CHAPTER_WORD_TARGET } from '../workflowUtils';

interface ChapterContentProps {
  chapters: Chapter[];
  onGenerateChapter: (chapterId: number) => void;
}

const ChapterContent: React.FC<ChapterContentProps> = ({
  chapters,
  onGenerateChapter
}) => {
  const completedChapters = chapters.filter(ch => ch.completed).length;
  const totalChapters = chapters.length;

  return (
    <Box>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <BookIcon sx={{ mr: 2 }} />
          <Typography variant="h5">
            Chapter Writing
          </Typography>
          <Chip
            label={`${completedChapters}/${totalChapters} Complete`}
            color={completedChapters === totalChapters ? "success" : "primary"}
            sx={{ ml: 2 }}
          />
        </Box>

        <Typography variant="body1" paragraph>
          Now that we have a solid plan, let's write the actual chapters. Each chapter should be at least {CHAPTER_WORD_TARGET.toLocaleString()} words of narrative prose.
        </Typography>

        {completedChapters === 0 && (
          <Alert severity="info">
            Click "Generate Chapter" to start writing the first chapter.
          </Alert>
        )}
      </Paper>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
        {chapters.map((chapter) => (
          <Box key={chapter.id}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Chapter {chapter.id}
                </Typography>

                {chapter.completed ? (
                  <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Word count: {chapter.wordCount.toLocaleString()}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        maxHeight: '200px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'pre-wrap'
                      }}
                    >
                      {chapter.content.substring(0, 300)}...
                    </Typography>
                  </Box>
                ) : (
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Not yet generated
                    </Typography>
                    <LinearProgress sx={{ mt: 1 }} />
                  </Box>
                )}
              </CardContent>

              <CardActions>
                <Button
                  variant={chapter.completed ? "outlined" : "contained"}
                  startIcon={chapter.completed ? <CheckCircleIcon /> : <BookIcon />}
                  onClick={() => onGenerateChapter(chapter.id)}
                  disabled={chapter.completed}
                  fullWidth
                >
                  {chapter.completed ? 'Chapter Complete' : 'Generate Chapter'}
                </Button>
              </CardActions>
            </Card>
          </Box>
        ))}
      </Box>

      {completedChapters > 0 && completedChapters < totalChapters && (
        <Paper sx={{ p: 2, mt: 3, bgcolor: 'background.paper' }}>
          <Typography variant="body2" color="text.secondary">
            💡 Tip: Generate chapters sequentially for better continuity, or generate them in any order if you prefer to work non-linearly.
          </Typography>
        </Paper>
      )}

      {completedChapters === totalChapters && (
        <Paper sx={{ p: 3, mt: 3, bgcolor: 'success.light' }}>
          <Typography variant="h6" color="success.dark">
            🎉 Congratulations! All chapters have been generated.
          </Typography>
          <Typography variant="body1">
            Your story is now complete. You can export it using the download button in the top toolbar.
          </Typography>
        </Paper>
      )}
    </Box>
  );
};

export default ChapterContent;