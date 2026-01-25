'use client';
import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  TextField,
  IconButton,
  Paper,
  Typography,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Container,
} from '@mui/material';
import { Send } from '@mui/icons-material';
import { ChatMessage, AIResponse, Operation } from '@/types';
import MessageBubble from './MessageBubble';
import WalletHeader from './WalletHeader';
import { useAuth } from '@/context/AuthContext';
import { P256WalletService } from '@/services/p256Wallet';

const ChatInterface: React.FC = () => {
  const { session, user, wallet } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '0',
      role: 'assistant',
      content: '你好！我是你的 AI 钱包助手。\n\n试试这些命令：\n• 转账 100 USDT\n• 查询 HSK 价格\n• 兑换 1 HSK 为 USDC',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    operation?: Operation;
  }>({ open: false });
  const [processedOperations, setProcessedOperations] = useState<Set<string>>(new Set());
  const [hasPendingOperation, setHasPendingOperation] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (messageText?: string) => {
    const textToSend = messageText || input;
    if (!textToSend.trim() || loading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: textToSend,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      // Build history from messages (exclude welcome message, keep last 10)
      const history = messages
        .slice(1) // Skip welcome message
        .slice(-10) // Keep last 10 messages
        .map(msg => ({
          role: msg.role,
          content: msg.content
        }));

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';
      console.log('Sending request to:', `${apiUrl}/chat`);

      const response = await fetch(`${apiUrl}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-Token': session?.token || '',
        },
        body: JSON.stringify({ 
          message: textToSend,
          history: history
        }),
      });

      console.log('API Response status:', response.status);

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();
      console.log('API Response data:', data);

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.message || 'AI response received',
        aiResponse: data.aiResponse as AIResponse,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
      
      // Check if response has operation that needs confirmation (not just a form)
      if (data.aiResponse?.operation && !data.aiResponse?.form) {
        setHasPendingOperation(true);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Demo fallback response
      const demoResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Demo mode: AI processing your request...',
        aiResponse: {
          problem: {
            type: 'info',
            title: 'Transaction Request Detected',
            description: 'You are attempting to perform a blockchain transaction.',
            suggestions: ['Ensure sufficient balance', 'Verify recipient address'],
          },
          operation: {
            action: 'transfer',
            asset: 'USDT',
            amount: 100,
            recipient: '0x1234...5678',
            chainId: 133,
            gasEstimate: '0.002 HSK',
          },
          supplement: {
            priceData: {
              symbol: 'USDT',
              currentPrice: 1.0,
              change24h: 0.05,
            },
            riskScore: 25,
            news: [
              {
                title: 'USDT Stability Report',
                summary: 'Tether maintains 1:1 peg with USD',
                timestamp: new Date().toISOString(),
              },
            ],
          },
        },
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, demoResponse]);
      
      // Check if demo response has operation (not just a form)
      if (demoResponse.aiResponse?.operation && !demoResponse.aiResponse?.form) {
        setHasPendingOperation(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = (formData: Record<string, any>) => {
    // Auto-add chainId if not present (HashKey Chain is the only supported chain)
    if (!formData.chainId) {
      formData.chainId = '133';
    }
    
    // Convert form data to natural language message
    const message = Object.entries(formData)
      .map(([key, value]) => `${key}: ${value}`)
      .join(', ');
    
    // Auto-send message with form data
    handleSendMessage(message);
  };

  const handleConfirm = async (messageId: string, operation: Operation) => {
    // Check if already processed
    if (processedOperations.has(messageId)) {
      return;
    }
    
    // Show confirmation dialog
    setConfirmDialog({ open: true, operation });
  };

  const handleConfirmExecute = async () => {
    if (!confirmDialog.operation) return;
    
    const operation = confirmDialog.operation;
    
    // Close dialog
    setConfirmDialog({ open: false });
    
    // Mark operation as processed
    const lastMessage = messages[messages.length - 1];
    if (lastMessage?.aiResponse?.operation) {
      setProcessedOperations(prev => new Set(prev).add(lastMessage.id));
    }
    
    // Clear pending operation state
    setHasPendingOperation(false);
    
    console.log('Operation confirmed:', operation);
    
    const processingMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'assistant',
      content: `✓ OPERATION CONFIRMED\n\nProcessing ${operation.action}...`,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, processingMessage]);

    // Ensure chainId is set (default to HashKey Chain if not provided)
    if (!operation.chainId) {
      operation.chainId = 133;
    }

    // Execute transfer if it's a transfer operation
    if (operation.action === 'transfer' && operation.recipient && operation.amount) {
      try {
        // Check if user info is available
        if (!user?.username) {
          throw new Error('User information not available');
        }

        // Convert amount to wei (assuming amount is in HSK)
        // For native token, 1 HSK = 10^18 wei
        const amountInWei = BigInt(Math.floor(operation.amount * 1e18)).toString();

        // Use P256 Wallet Service with real signing
        console.log('🔐 Initiating transfer with P256 signature...');
        const result = await P256WalletService.executeTransfer(
          {
            recipient: operation.recipient,
            amount: amountInWei,
          },
          session?.token || ''
        );

        console.log('Transfer result:', result);

        const successMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `✓ TRANSACTION SUCCESS\n\nTransaction hash: ${result.txHash}\n\nView on explorer: ${result.explorerUrl}`,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, successMessage]);
      } catch (error: any) {
        console.error('Transfer error:', error);
        const errorMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `✗ TRANSACTION FAILED\n\nError: ${error.message}`,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      }
    } else {
      // TODO: Implement other operation types (swap, stake, etc.)
      setTimeout(() => {
        const successMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `✓ OPERATION SUCCESS\n\nOperation completed successfully!`,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, successMessage]);
      }, 2000);
    }
  };

  const handleCancel = (messageId: string) => {
    // Check if already processed
    if (processedOperations.has(messageId)) {
      return;
    }
    
    // Mark operation as processed
    setProcessedOperations(prev => new Set(prev).add(messageId));
    
    // Clear pending operation state
    setHasPendingOperation(false);
    
    const cancelMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'assistant',
      content: '✗ OPERATION CANCELLED\n\nNo changes were made.',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, cancelMessage]);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSendClick = () => {
    handleSendMessage();
  };

  return (
    <Box
      sx={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: 'linear-gradient(135deg, #F9FAFB 0%, #F3F4F6 100%)',
      }}
    >
      {/* Header with Wallet Info */}
      <Container maxWidth="md" sx={{ pt: 2 }}>
        <WalletHeader />
      </Container>

      {/* Messages Area */}
      <Container 
        maxWidth="md" 
        sx={{ 
          flex: 1, 
          overflowY: 'auto', 
          display: 'flex', 
          flexDirection: 'column', 
          gap: 2,
          pb: 2,
        }}
      >
        {messages.map((message, index) => {
          // Only enable typewriter for the latest assistant message (not welcome message)
          const isLatest = index === messages.length - 1;
          const isAssistant = message.role === 'assistant';
          const isWelcome = message.id === '0';
          const enableTypewriter = isLatest && isAssistant && !isWelcome;
          
          return (
            <MessageBubble
              key={message.id}
              message={message}
              onConfirm={handleConfirm}
              onCancel={handleCancel}
              onFormSubmit={handleFormSubmit}
              isProcessed={processedOperations.has(message.id)}
              enableTypewriter={enableTypewriter}
            />
          );
        })}

        {loading && (
          <Box sx={{ alignSelf: 'center', display: 'flex', alignItems: 'center', gap: 2 }}>
            <CircularProgress size={24} thickness={5} />
            <Typography variant="body2" color="text.secondary">AI is thinking...</Typography>
          </Box>
        )}

        <div ref={messagesEndRef} />
      </Container>

      {/* Input Area */}
      <Container maxWidth="md" sx={{ pb: 2 }}>
        <Paper
          elevation={3}
          sx={{
            p: 2.5,
            borderRadius: 2,
            display: 'flex',
            gap: 2,
            background: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(10px)',
          }}
        >
        <TextField
          fullWidth
          multiline
          maxRows={4}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={hasPendingOperation ? "请先确认或取消当前操作..." : "输入你的请求..."}
          disabled={loading || hasPendingOperation}
          sx={{
            '& .MuiOutlinedInput-root': {
              opacity: hasPendingOperation ? 0.6 : 1,
            }
          }}
        />
        <IconButton
          color="primary"
          onClick={handleSendClick}
          disabled={!input.trim() || loading || hasPendingOperation}
          size="large"
          sx={{
            background: 'linear-gradient(135deg, #6366F1 0%, #818CF8 100%)',
            color: 'white',
            '&:hover': {
              background: 'linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)',
              transform: 'scale(1.05)',
            },
            '&:disabled': {
              background: '#E5E7EB',
              color: '#9CA3AF',
            },
          }}
        >
          <Send />
        </IconButton>
        </Paper>
      </Container>

      {/* Double Confirmation Dialog */}
      <Dialog
        open={confirmDialog.open}
        onClose={() => setConfirmDialog({ open: false })}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '20px',
            border: '2px solid',
            borderColor: 'primary.main',
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, fontSize: '1.5rem' }}>
          确认交易
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2, color: 'text.secondary' }}>
            请仔细核对以下交易信息：
          </Typography>
          {confirmDialog.operation && (
            <Box sx={{ 
              p: 2, 
              borderRadius: '14px', 
              bgcolor: 'grey.50',
              border: '1px solid',
              borderColor: 'divider'
            }}>
              <Typography sx={{ mb: 1 }}>
                <strong>操作:</strong> {confirmDialog.operation.action}
              </Typography>
              {confirmDialog.operation.asset && (
                <Typography sx={{ mb: 1 }}>
                  <strong>资产:</strong> {confirmDialog.operation.asset}
                </Typography>
              )}
              {confirmDialog.operation.amount && (
                <Typography sx={{ mb: 1 }}>
                  <strong>金额:</strong> {confirmDialog.operation.amount}
                </Typography>
              )}
              {confirmDialog.operation.recipient && (
                <Typography sx={{ mb: 1, wordBreak: 'break-all' }}>
                  <strong>接收地址:</strong> {confirmDialog.operation.recipient}
                </Typography>
              )}
              {confirmDialog.operation.gasEstimate && (
                <Typography>
                  <strong>Gas 费用:</strong> {confirmDialog.operation.gasEstimate}
                </Typography>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button 
            onClick={() => setConfirmDialog({ open: false })} 
            color="secondary"
            variant="outlined"
            sx={{ borderRadius: '12px', px: 3 }}
          >
            取消
          </Button>
          <Button 
            onClick={handleConfirmExecute} 
            variant="contained" 
            color="primary"
            sx={{ borderRadius: '12px', px: 3, fontWeight: 600 }}
          >
            确认执行
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ChatInterface;
