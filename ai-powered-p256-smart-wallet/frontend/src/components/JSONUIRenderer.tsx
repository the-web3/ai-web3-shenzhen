'use client';
import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  Chip,
  Divider,
  Grid,
  Stack,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  Warning,
  Info,
  Error as ErrorIcon,
  TrendingUp,
  TrendingDown,
  CheckCircle,
} from '@mui/icons-material';
import { AIResponse, Operation, JSONUIComponentProps } from '@/types';

const JSONUIRenderer: React.FC<JSONUIComponentProps> = ({
  data,
  onConfirm,
  onCancel,
  onFormSubmit,
  isProcessed = false,
}) => {
  const { problem, operation, supplement, form } = data;
  const [formData, setFormData] = useState<Record<string, any>>({});

  // Initialize form defaults
  useEffect(() => {
    if (form) {
      const initialData: Record<string, any> = {};
      form.fields.forEach(field => {
        if (field.value) {
          initialData[field.name] = field.value;
        }
      });
      setFormData(initialData);
    }
  }, [form]);

  // Filter out chainId/network fields from form (system only supports HashKey Chain)
  const filteredFormFields = form?.fields.filter(field => 
    field.name !== 'chainId' && 
    field.name !== 'network' && 
    field.name !== 'chain'
  ) || [];

  const handleFormFieldChange = (name: string, value: any) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFormSubmitClick = () => {
    if (onFormSubmit) {
      onFormSubmit(formData);
    }
  };

  const getIcon = (type?: string) => {
    switch (type) {
      case 'warning':
        return <Warning />;
      case 'error':
        return <ErrorIcon />;
      case 'info':
      default:
        return <Info />;
    }
  };

  const getSeverity = (type?: string): 'warning' | 'info' | 'error' => {
    switch (type) {
      case 'warning':
        return 'warning';
      case 'error':
        return 'error';
      case 'info':
      default:
        return 'info';
    }
  };

  return (
    <Box sx={{ width: '100%', p: 2 }}>
      {/* 问题分析区域 */}
      {problem && (
        <Alert
          severity={getSeverity(problem.type)}
          icon={getIcon(problem.type)}
          sx={{ mb: 2 }}
        >
          <Typography variant="body1" sx={{ fontWeight: 'bold', mb: 1 }}>
            {problem.title}
          </Typography>
          <Typography variant="body2">{problem.description}</Typography>
          {problem.suggestions && problem.suggestions.length > 0 && (
            <Box sx={{ mt: 1 }}>
              {problem.suggestions.map((suggestion, idx) => (
                <Typography key={idx} variant="body2" sx={{ mt: 0.5 }}>
                  • {suggestion}
                </Typography>
              ))}
            </Box>
          )}
        </Alert>
      )}

      {/* 表单区域 */}
      {form && (
        <Card
          sx={{
            mb: 2,
            border: '2px solid',
            borderColor: 'primary.main',
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.05), rgba(99, 102, 241, 0.02))',
          }}
        >
          <CardContent>
            <Typography variant="h5" sx={{ mb: 2, fontWeight: 700 }}>
              {form.title}
            </Typography>
            {form.description && (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {form.description}
              </Typography>
            )}
            
            {/* 表单字段 - 过滤掉 chainId/network 字段 */}
            <Box component="form" sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {filteredFormFields.map((field) => {
                if (field.type === 'select') {
                  return (
                    <FormControl key={field.name} fullWidth required={field.required}>
                      <InputLabel>{field.label}</InputLabel>
                      <Select
                        value={formData[field.name] || field.value || ''}
                        onChange={(e) => handleFormFieldChange(field.name, e.target.value)}
                        label={field.label}
                        sx={{
                          borderRadius: '14px',
                        }}
                      >
                        {field.options && field.options.map((option: any) => {
                          // Support both string[] and SelectOption[] formats
                          const optionValue = typeof option === 'string' ? option : option.value;
                          const optionLabel = typeof option === 'string' ? option : option.label;
                          return (
                            <MenuItem key={optionValue} value={optionValue}>
                              {optionLabel}
                            </MenuItem>
                          );
                        })}
                      </Select>
                    </FormControl>
                  );
                }
                
                return (
                  <TextField
                    key={field.name}
                    label={field.label}
                    type={field.type === 'number' ? 'number' : 'text'}
                    value={formData[field.name] || ''}
                    onChange={(e) => handleFormFieldChange(field.name, e.target.value)}
                    placeholder={field.placeholder}
                    required={field.required}
                    fullWidth
                    variant="outlined"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '14px',
                      },
                    }}
                  />
                );
              })}
              
              {/* 提交按钮 */}
              <Button
                variant="contained"
                color="primary"
                onClick={handleFormSubmitClick}
                size="large"
                fullWidth
                sx={{
                  mt: 1,
                  borderRadius: '12px',
                  py: 1.5,
                  fontWeight: 600,
                }}
              >
                {form.submitLabel || '提交'}
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* 操作区域 */}
      {operation && (
        <Card
          sx={{
            mb: 2,
            border: '2px solid',
            borderColor: 'primary.main',
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.05), rgba(99, 102, 241, 0.02))',
          }}
        >
          <CardContent>
            <Typography variant="h5" sx={{ mb: 2, display: 'flex', alignItems: 'center', fontWeight: 700 }}>
              <CheckCircle sx={{ mr: 1, color: 'primary.main' }} />
              操作确认
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 600 }}>
                  操作类型
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 600, textTransform: 'uppercase' }}>
                  {operation.action}
                </Typography>
              </Grid>

              {operation.asset && (
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 600 }}>
                    资产
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>{operation.asset}</Typography>
                </Grid>
              )}

              {operation.amount && (
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 600 }}>
                    金额
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>{operation.amount}</Typography>
                </Grid>
              )}

              {operation.recipient && (
                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 600 }}>
                    接收地址
                  </Typography>
                  <Typography variant="body2" sx={{ wordBreak: 'break-all', fontFamily: 'monospace', mt: 0.5 }}>
                    {operation.recipient}
                  </Typography>
                </Grid>
              )}

              {operation.chainId && (
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 600 }}>
                    网络
                  </Typography>
                  <Box sx={{ mt: 0.5 }}>
                    <Chip 
                      label={operation.chainId === 133 ? "HashKey Chain Testnet" : `Chain ${operation.chainId}`} 
                      color="primary" 
                      size="small" 
                    />
                  </Box>
                </Grid>
              )}

              {operation.gasEstimate && (
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 600 }}>
                    预计费用
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600, mt: 0.5 }}>{operation.gasEstimate}</Typography>
                </Grid>
              )}

              {operation.parameters && Object.keys(operation.parameters).length > 0 && (
                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary" sx={{ mb: 1, textTransform: 'uppercase', fontWeight: 600 }}>
                    参数详情
                  </Typography>
                  <Box
                    sx={{
                      p: 2,
                      mt: 1,
                      borderRadius: 2,
                      border: '1px solid',
                      borderColor: 'divider',
                      bgcolor: 'grey.50',
                      fontFamily: 'monospace',
                      fontSize: '0.75rem',
                    }}
                  >
                    {Object.entries(operation.parameters).map(([key, value]) => (
                      <Box key={key} sx={{ mb: 0.5 }}>
                        <strong>{key}:</strong> {JSON.stringify(value)}
                      </Box>
                    ))}
                  </Box>
                </Grid>
              )}
            </Grid>

            <Divider sx={{ my: 3 }} />

            {isProcessed ? (
              <Box sx={{ 
                textAlign: 'center', 
                py: 2,
                px: 3,
                borderRadius: 2,
                bgcolor: 'grey.100',
                border: '1px solid',
                borderColor: 'grey.300'
              }}>
                <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 600 }}>
                  ✓ 此操作已处理
                </Typography>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => onConfirm(operation)}
                  size="large"
                  sx={{ flex: 1 }}
                >
                  确认操作
                </Button>
                <Button
                  variant="outlined"
                  color="secondary"
                  onClick={onCancel}
                  size="large"
                  sx={{ flex: 1 }}
                >
                  取消
                </Button>
              </Box>
            )}
          </CardContent>
        </Card>
      )}

      {/* 补充信息区域 */}
      {supplement && (
        <Card
          sx={{
            border: '2px solid',
            borderColor: 'secondary.main',
            background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.05), rgba(236, 72, 153, 0.02))',
          }}
        >
          <CardContent>
            <Typography variant="h5" sx={{ mb: 2, fontWeight: 700 }}>
              补充信息
            </Typography>

            {supplement.priceData && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 600 }}>
                  市场价格
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    ${supplement.priceData.currentPrice.toFixed(2)}
                  </Typography>
                  <Chip
                    label={`${supplement.priceData.change24h > 0 ? '+' : ''}${supplement.priceData.change24h.toFixed(2)}%`}
                    color={supplement.priceData.change24h > 0 ? 'success' : 'error'}
                    icon={supplement.priceData.change24h > 0 ? <TrendingUp /> : <TrendingDown />}
                    size="medium"
                    sx={{ fontWeight: 600 }}
                  />
                </Box>
              </Box>
            )}

            {supplement.riskScore !== undefined && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 600 }}>
                  风险评分
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1, gap: 2 }}>
                  <Box
                    sx={{
                      flex: 1,
                      height: 12,
                      borderRadius: 2,
                      bgcolor: 'grey.200',
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                  >
                    <Box
                      sx={{
                        width: `${supplement.riskScore}%`,
                        height: '100%',
                        borderRadius: 2,
                        background:
                          supplement.riskScore > 70
                            ? 'linear-gradient(90deg, #EF4444, #DC2626)'
                            : supplement.riskScore > 40
                            ? 'linear-gradient(90deg, #F59E0B, #D97706)'
                            : 'linear-gradient(90deg, #10B981, #059669)',
                        transition: 'width 0.5s ease',
                      }}
                    />
                  </Box>
                  <Typography variant="body1" sx={{ fontWeight: 700, minWidth: 60 }}>
                    {supplement.riskScore}/100
                  </Typography>
                </Box>
              </Box>
            )}

            {supplement.news && supplement.news.length > 0 && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" color="text.secondary" sx={{ mb: 1, textTransform: 'uppercase', fontWeight: 600 }}>
                  相关新闻
                </Typography>
                <Stack spacing={1.5} sx={{ mt: 1 }}>
                  {supplement.news.slice(0, 3).map((news, idx) => (
                    <Box
                      key={idx}
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        border: '1px solid',
                        borderColor: 'divider',
                        bgcolor: 'background.paper',
                        cursor: news.url ? 'pointer' : 'default',
                        transition: 'all 0.2s ease',
                        '&:hover': news.url ? {
                          borderColor: 'secondary.main',
                          transform: 'translateY(-2px)',
                          boxShadow: '0px 4px 12px rgba(236, 72, 153, 0.15)',
                        } : {},
                      }}
                      onClick={() => news.url && window.open(news.url, '_blank')}
                    >
                      <Typography variant="body1" sx={{ fontWeight: 600, mb: 0.5 }}>
                        {news.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {news.summary}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              </Box>
            )}

            {supplement.alternatives && supplement.alternatives.length > 0 && (
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ mb: 1, textTransform: 'uppercase', fontWeight: 600 }}>
                  替代方案
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" gap={1} sx={{ mt: 1 }}>
                  {supplement.alternatives.map((alt, idx) => (
                    <Chip
                      key={idx}
                      label={alt}
                      variant="outlined"
                      color="secondary"
                      size="medium"
                      sx={{ fontWeight: 600 }}
                    />
                  ))}
                </Stack>
              </Box>
            )}
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default JSONUIRenderer;
