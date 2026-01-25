'use client';
import React from 'react';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Chip,
  Tooltip,
} from '@mui/material';
import {
  AccountBalanceWallet,
  Logout,
  ContentCopy,
  Refresh,
} from '@mui/icons-material';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

const WalletHeader: React.FC = () => {
  const { user, wallet, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const handleCopyAddress = () => {
    if (wallet?.address) {
      navigator.clipboard.writeText(wallet.address);
      // Could add a toast notification here
    }
  };

  const formatAddress = (address: string) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  const formatBalance = (balance: string | null) => {
    if (!balance || balance === '0') return '0 HSK';
    const hskValue = parseFloat(balance) / 1e18;
    return `${hskValue.toFixed(4)} HSK`;
  };

  return (
    <Paper
      elevation={2}
      sx={{
        p: 2,
        mb: 2,
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {/* Left side - Wallet info */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <AccountBalanceWallet sx={{ fontSize: 40 }} />
          <Box>
            <Typography variant="body2" sx={{ opacity: 0.9, fontSize: '0.875rem' }}>
              {user?.username}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
              <Typography variant="h6" fontWeight="bold">
                {formatBalance(wallet?.balance || null)}
              </Typography>
              <Chip
                label={formatAddress(wallet?.address || '')}
                size="small"
                sx={{
                  bgcolor: 'rgba(255,255,255,0.2)',
                  color: 'white',
                  fontFamily: 'monospace',
                  fontSize: '0.75rem',
                }}
              />
              <Tooltip title="Copy address">
                <IconButton
                  size="small"
                  onClick={handleCopyAddress}
                  sx={{ color: 'white', p: 0.5 }}
                >
                  <ContentCopy fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        </Box>

        {/* Right side - Actions */}
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Refresh balance">
            <IconButton sx={{ color: 'white' }} size="small">
              <Refresh />
            </IconButton>
          </Tooltip>
          <Tooltip title="Logout">
            <IconButton onClick={handleLogout} sx={{ color: 'white' }} size="small">
              <Logout />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
    </Paper>
  );
};

export default WalletHeader;
