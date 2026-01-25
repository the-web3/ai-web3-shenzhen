'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Alert,
  CircularProgress,
  Stack,
  Tabs,
  Tab,
} from '@mui/material';
import FingerprintIcon from '@mui/icons-material/Fingerprint';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import { usePasskey } from '@/hooks/usePasskey';
import { useAuth } from '@/context/AuthContext';

export default function WelcomePage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading, login } = useAuth();
  const {
    isSupported,
    isPlatformAuthenticatorAvailable,
    isLoading,
    error,
    register,
    login: passkeyLogin,
    clearError,
  } = usePasskey();

  const [tabValue, setTabValue] = useState(0);
  const [username, setUsername] = useState('');

  // Redirect if already authenticated
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.push('/chat');
    }
  }, [isAuthenticated, authLoading, router]);

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    clearError();
    setUsername('');
  };

  const handleRegister = async () => {
    if (!username.trim()) return;

    const response = await register(username);
    if (response) {
      // Save auth state
      login(
        { id: response.user.id, username: response.user.username },
        { address: response.wallet.address, balance: response.wallet.balance },
        { token: response.session.token, expiresAt: response.session.expiresAt }
      );

      // Redirect to chat
      router.push('/chat');
    }
  };

  const handleLogin = async () => {
    if (!username.trim()) return;

    const response = await passkeyLogin(username);
    if (response) {
      // Save auth state
      login(
        { id: response.user.id, username: response.user.username },
        { address: response.wallet.address, balance: response.wallet.balance },
        { token: response.session.token, expiresAt: response.session.expiresAt }
      );

      // Redirect to chat
      router.push('/chat');
    }
  };

  if (authLoading) {
    return (
      <Container maxWidth="sm">
        <Box
          sx={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          py: 4,
        }}
      >
        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <AccountBalanceWalletIcon sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
          <Typography variant="h3" component="h1" gutterBottom fontWeight="bold">
            AI Wallet
          </Typography>
          <Typography variant="h6" color="text.secondary">
            Your Smart Crypto Wallet with Biometric Security
          </Typography>
        </Box>

        {/* Warning if not supported */}
        {!isSupported && (
          <Alert severity="error" sx={{ mb: 3 }}>
            Your browser does not support WebAuthn. Please use a modern browser like Chrome,
            Safari, or Edge.
          </Alert>
        )}

        {!isPlatformAuthenticatorAvailable && isSupported && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            Platform authenticator (Face ID/Touch ID/Windows Hello) is not available on this
            device. You may use security keys instead.
          </Alert>
        )}

        {/* Auth Form */}
        <Paper elevation={3} sx={{ p: 4 }}>
          <Tabs value={tabValue} onChange={handleTabChange} centered sx={{ mb: 3 }}>
            <Tab label="Register" />
            <Tab label="Login" />
          </Tabs>

          {error && (
            <Alert severity="error" onClose={clearError} sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Stack spacing={3}>
            <TextField
              label="Username"
              variant="outlined"
              fullWidth
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={isLoading || !isSupported}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  tabValue === 0 ? handleRegister() : handleLogin();
                }
              }}
              placeholder="Enter your username"
            />

            {tabValue === 0 ? (
              <Button
                variant="contained"
                size="large"
                fullWidth
                startIcon={isLoading ? <CircularProgress size={20} /> : <FingerprintIcon />}
                onClick={handleRegister}
                disabled={isLoading || !username.trim() || !isSupported}
                sx={{ py: 1.5 }}
              >
                {isLoading ? 'Registering...' : 'Register with Passkey'}
              </Button>
            ) : (
              <Button
                variant="contained"
                size="large"
                fullWidth
                startIcon={isLoading ? <CircularProgress size={20} /> : <FingerprintIcon />}
                onClick={handleLogin}
                disabled={isLoading || !username.trim() || !isSupported}
                sx={{ py: 1.5 }}
              >
                {isLoading ? 'Logging in...' : 'Login with Passkey'}
              </Button>
            )}
          </Stack>

          {/* Info */}
          <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
            <Typography variant="body2" color="text.secondary" align="center">
              {tabValue === 0 ? (
                <>
                  Registration will create a smart wallet and secure it with your Face ID,
                  Touch ID, or fingerprint. No passwords needed!
                </>
              ) : (
                <>
                  Login with your biometric authentication. Your private key never leaves your
                  device.
                </>
              )}
            </Typography>
          </Box>
        </Paper>

        {/* Features */}
        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            ✓ Biometric Security • ✓ No Seed Phrases • ✓ AI-Powered • ✓ Account Abstraction
          </Typography>
        </Box>
      </Box>
    </Container>
  );
}
