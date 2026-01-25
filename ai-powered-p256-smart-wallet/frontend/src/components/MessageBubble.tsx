'use client';
import React from 'react';
import { Box, Paper, Typography } from '@mui/material';
import { ChatMessage, Operation } from '@/types';
import { useTypewriter } from '@/hooks/useTypewriter';
import JSONUIRenderer from './JSONUIRenderer';

interface MessageBubbleProps {
  message: ChatMessage;
  onConfirm: (messageId: string, operation: Operation) => void;
  onCancel: (messageId: string) => void;
  onFormSubmit: (formData: Record<string, any>) => void;
  isProcessed: boolean;
  enableTypewriter?: boolean;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  onConfirm,
  onCancel,
  onFormSubmit,
  isProcessed,
  enableTypewriter = false,
}) => {
  // Determine if we should animate this specific message
  const shouldAnimate = enableTypewriter && message.role === 'assistant' && message.id !== '0';
  
  // Only use typewriter hook if we're actually animating
  const typewriterResult = useTypewriter(
    shouldAnimate ? message.content : '',
    20
  );

  // Determine what text to display
  let contentToDisplay = message.content;
  let showCursor = false;
  let showUI = true;

  if (shouldAnimate) {
    contentToDisplay = typewriterResult.displayText;
    showCursor = !typewriterResult.isComplete;
    showUI = typewriterResult.isComplete;
  }

  return (
    <Box
      sx={{
        alignSelf: message.role === 'user' ? 'flex-end' : 'flex-start',
        maxWidth: message.role === 'user' ? '70%' : '90%',
      }}
      className="fade-in"
    >
      <Paper
        elevation={message.role === 'user' ? 1 : 2}
        sx={{
          p: 2.5,
          background:
            message.role === 'user'
              ? 'linear-gradient(135deg, rgba(236, 72, 153, 0.08), rgba(236, 72, 153, 0.04))'
              : 'white',
          border: message.role === 'user' ? '2px solid' : 'none',
          borderColor: message.role === 'user' ? 'secondary.main' : 'transparent',
        }}
      >
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ mb: 1, display: 'block', textTransform: 'uppercase', fontWeight: 600 }}
        >
          {message.role === 'user' ? 'You' : 'AI Assistant'} • {message.timestamp.toLocaleTimeString()}
        </Typography>
        <Typography
          variant="body1"
          sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
        >
          {contentToDisplay}
          {showCursor && (
            <span className="typing-cursor">▋</span>
          )}
        </Typography>

        {/* Only show UI components when appropriate */}
        {message.aiResponse && showUI && (
          <Box sx={{ mt: 2 }}>
            <JSONUIRenderer
              data={message.aiResponse}
              onConfirm={(operation) => onConfirm(message.id, operation)}
              onCancel={() => onCancel(message.id)}
              onFormSubmit={onFormSubmit}
              isProcessed={isProcessed}
            />
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default MessageBubble;
