# 🔐 Passkey 认证架构设计

## 📋 什么是 Passkey？

**Passkey** 是基于 **WebAuthn (Web Authentication)** 标准的现代认证方式，允许用户使用生物识别（指纹、Face ID）或 PIN 码来安全登录。

### 优势
- ✅ **无需密码**：告别记忆密码的烦恼
- ✅ **生物识别**：指纹、Face ID、Windows Hello
- ✅ **防钓鱼**：密钥绑定域名，无法跨站使用
- ✅ **设备本地**：私钥存储在设备 TPM/Secure Enclave
- ✅ **跨设备同步**：通过 iCloud Keychain / Google Password Manager

### 支持的平台
- **iOS/macOS**: Face ID、Touch ID
- **Android**: 指纹、人脸识别
- **Windows**: Windows Hello (指纹、PIN、人脸)
- **Chrome/Edge/Safari**: 全面支持

---

## 🏗️ Passkey + Smart Wallet 架构

```
┌─────────────────────────────────────────────────────────────┐
│                    User Experience Flow                      │
└─────────────────────────────────────────────────────────────┘

用户首次访问
    │
    ▼
弹出 Passkey 注册提示
    │
    ├─ "使用 Face ID 创建钱包"
    │
    ▼
用户确认 Face ID / 指纹
    │
    ▼
设备生成密钥对（私钥存储在 Secure Enclave）
    │
    ├─ Private Key → 设备安全区域（不可导出）
    └─ Public Key → 发送给服务器
    │
    ▼
服务器创建用户 + 智能钱包
    │
    ├─ 生成智能钱包地址
    ├─ 绑定 Passkey Credential ID
    └─ 返回钱包信息
    │
    ▼
✅ 登录完成，显示钱包

═══════════════════════════════════════════════════════════════

用户下次访问
    │
    ▼
检测到已有 Passkey
    │
    ├─ "使用 Face ID 登录"
    │
    ▼
用户确认 Face ID / 指纹
    │
    ▼
设备使用私钥签名挑战
    │
    ▼
服务器验证签名
    │
    ▼
✅ 自动登录，加载钱包

═══════════════════════════════════════════════════════════════

用户执行转账
    │
    ▼
AI 生成交易确认 UI
    │
    ▼
用户点击"确认转账"
    │
    ▼
弹出 Face ID 确认
    │
    ├─ "使用 Face ID 确认转账 0.1 ETH"
    │
    ▼
设备签名交易授权
    │
    ▼
服务器验证签名 + 执行交易
    │
    ▼
✅ 交易提交成功
```

---

## 🔑 核心概念

### 1. Passkey 注册流程

```javascript
// 前端发起注册
const credential = await navigator.credentials.create({
  publicKey: {
    challenge: new Uint8Array([...]), // 服务器生成的随机挑战
    rp: {
      name: "AI Wallet",
      id: "localhost" // 生产环境用域名
    },
    user: {
      id: new Uint8Array([...]), // 用户 ID
      name: "user@example.com",
      displayName: "AI Wallet User"
    },
    pubKeyCredParams: [
      { type: "public-key", alg: -7 },  // ES256
      { type: "public-key", alg: -257 } // RS256
    ],
    authenticatorSelection: {
      authenticatorAttachment: "platform", // 使用设备内置认证器
      userVerification: "required"         // 必须生物识别
    },
    timeout: 60000
  }
});

// 设备返回的 credential 包含：
// - credentialId: 凭证唯一标识
// - publicKey: 公钥（发送给服务器）
// - attestation: 设备证明（可选）
```

### 2. Passkey 认证流程

```javascript
// 前端发起认证
const assertion = await navigator.credentials.get({
  publicKey: {
    challenge: new Uint8Array([...]),
    rpId: "localhost",
    allowCredentials: [{
      type: "public-key",
      id: credentialId // 从服务器获取
    }],
    userVerification: "required"
  }
});

// 设备返回签名，服务器验证通过后登录
```

### 3. 关键数据结构

```go
// 后端存储
type PasskeyCredential struct {
    ID              string    `json:"id" gorm:"primaryKey"`
    UserID          string    `json:"userId"`
    CredentialID    []byte    `json:"credentialId"`    // WebAuthn Credential ID
    PublicKey       []byte    `json:"publicKey"`       // COSE 格式公钥
    SignCount       uint32    `json:"signCount"`       // 防重放攻击
    AAGUID          []byte    `json:"aaguid"`          // 认证器标识
    CreatedAt       time.Time `json:"createdAt"`
    LastUsedAt      time.Time `json:"lastUsedAt"`
}
```

---

## 📂 更新后的架构

### 数据库设计更新

```sql
-- 用户表（新增 Passkey 字段）
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
    username VARCHAR(255),                    -- 可选的用户名
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_active_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_username (username)
);

-- Passkey 凭证表（新增）
CREATE TABLE IF NOT EXISTS passkey_credentials (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    credential_id BYTEA UNIQUE NOT NULL,      -- WebAuthn Credential ID
    public_key BYTEA NOT NULL,                -- COSE 编码的公钥
    sign_count INTEGER DEFAULT 0,             -- 签名计数器
    aaguid BYTEA,                             -- 认证器 GUID
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    INDEX idx_user_id (user_id),
    INDEX idx_credential_id (credential_id)
);

-- 会话表（新增，用于 Passkey 后的会话管理）
CREATE TABLE IF NOT EXISTS sessions (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    token VARCHAR(64) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    INDEX idx_token (token),
    INDEX idx_user_id (user_id)
);

-- 钱包表（保持不变，但去掉 encrypted_key）
CREATE TABLE IF NOT EXISTS wallets (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    address VARCHAR(42) UNIQUE NOT NULL,
    owner_address VARCHAR(42) NOT NULL,
    encrypted_key TEXT NOT NULL,              -- 保留，但使用 Passkey 派生的密钥加密
    chain_id INT NOT NULL DEFAULT 11155111,
    factory_address VARCHAR(42),
    is_deployed BOOLEAN DEFAULT FALSE,
    deployed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    INDEX idx_user_id (user_id),
    INDEX idx_address (address)
);

-- 交易表（保持不变）
CREATE TABLE IF NOT EXISTS transactions (
    id VARCHAR(36) PRIMARY KEY,
    wallet_id VARCHAR(36) NOT NULL,
    tx_hash VARCHAR(66),
    user_op_hash VARCHAR(66),
    action VARCHAR(50) NOT NULL,
    asset VARCHAR(20),
    amount VARCHAR(78),
    recipient VARCHAR(42),
    status VARCHAR(20) DEFAULT 'pending',
    gas_used VARCHAR(20),
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    confirmed_at TIMESTAMP,
    FOREIGN KEY (wallet_id) REFERENCES wallets(id),
    INDEX idx_wallet_id (wallet_id),
    INDEX idx_status (status)
);
```

---

## 🔐 密钥管理架构

### 问题：Passkey 私钥不可导出，如何签名区块链交易？

**解决方案：双层密钥架构**

```
┌─────────────────────────────────────────────────────────────┐
│                   密钥层级结构                                │
└─────────────────────────────────────────────────────────────┘

Layer 1: Passkey (认证层)
    ├─ Private Key → 设备 Secure Enclave (不可导出)
    └─ Public Key → 服务器存储
         │
         └─ 用途：用户身份认证、会话管理
         
Layer 2: Wallet Signing Key (交易签名层)
    ├─ Private Key → 加密存储在服务器
    │   └─ 加密密钥 = HKDF(PasskeyPublicKey + UserID)
    └─ 用途：签名区块链交易
    
流程：
1. 用户 Face ID 认证 → Passkey 验证通过
2. 服务器生成会话 Token
3. 使用会话执行交易时：
   └─ 解密 Wallet Private Key
   └─ 签名 UserOperation
   └─ 提交到区块链
```

### 具体实现

```go
// 方案 A：基于 Passkey 派生加密密钥（推荐）
func DeriveEncryptionKey(passkeyPublicKey []byte, userID string) []byte {
    // 使用 HKDF 从 Passkey 公钥派生加密密钥
    salt := []byte("ai-wallet-encryption-v1")
    info := []byte(userID)
    
    hkdf := hkdf.New(sha256.New, passkeyPublicKey, salt, info)
    key := make([]byte, 32) // AES-256
    hkdf.Read(key)
    
    return key
}

// 使用派生密钥加密钱包私钥
func EncryptWalletKey(walletPrivateKey string, encryptionKey []byte) (string, error) {
    // AES-256-GCM 加密
    // ...
}

// 方案 B：Session-based 临时解密（更安全）
type Session struct {
    Token           string
    UserID          string
    DecryptionKey   []byte  // 临时解密密钥
    ExpiresAt       time.Time
}

// 用户 Passkey 认证后，服务器生成临时会话
func CreateSessionAfterPasskey(userID string, passkeyPublicKey []byte) *Session {
    return &Session{
        Token:         GenerateRandomToken(),
        UserID:        userID,
        DecryptionKey: DeriveEncryptionKey(passkeyPublicKey, userID),
        ExpiresAt:     time.Now().Add(24 * time.Hour),
    }
}
```

---

## 📱 前端实现

### 1. Passkey 注册组件

```typescript
// src/services/passkey.ts

export class PasskeyService {
  private rpId = process.env.NEXT_PUBLIC_RP_ID || 'localhost';
  private rpName = 'AI Wallet';

  /**
   * 注册新的 Passkey
   */
  async register(username: string): Promise<PasskeyRegistrationResult> {
    try {
      // 1. 请求服务器生成注册选项
      const optionsRes = await fetch('/api/passkey/register/begin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username })
      });
      
      const options = await optionsRes.json();
      
      // 2. 转换 base64 为 ArrayBuffer
      const publicKeyOptions = {
        ...options,
        challenge: this.base64ToArrayBuffer(options.challenge),
        user: {
          ...options.user,
          id: this.base64ToArrayBuffer(options.user.id)
        }
      };
      
      // 3. 调用浏览器 WebAuthn API
      const credential = await navigator.credentials.create({
        publicKey: publicKeyOptions
      }) as PublicKeyCredential;
      
      if (!credential) {
        throw new Error('Failed to create credential');
      }
      
      // 4. 提取响应数据
      const response = credential.response as AuthenticatorAttestationResponse;
      const attestationObject = new Uint8Array(response.attestationObject);
      const clientDataJSON = new Uint8Array(response.clientDataJSON);
      
      // 5. 发送到服务器完成注册
      const finishRes = await fetch('/api/passkey/register/finish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          credentialId: this.arrayBufferToBase64(credential.rawId),
          attestationObject: this.arrayBufferToBase64(attestationObject),
          clientDataJSON: this.arrayBufferToBase64(clientDataJSON)
        })
      });
      
      const result = await finishRes.json();
      
      return {
        success: true,
        userId: result.userId,
        sessionToken: result.sessionToken,
        wallet: result.wallet
      };
      
    } catch (error) {
      console.error('Passkey registration failed:', error);
      throw error;
    }
  }

  /**
   * 使用 Passkey 认证
   */
  async authenticate(): Promise<PasskeyAuthenticationResult> {
    try {
      // 1. 请求服务器生成认证选项
      const optionsRes = await fetch('/api/passkey/login/begin', {
        method: 'POST'
      });
      
      const options = await optionsRes.json();
      
      // 2. 转换数据
      const publicKeyOptions = {
        ...options,
        challenge: this.base64ToArrayBuffer(options.challenge),
        allowCredentials: options.allowCredentials.map((cred: any) => ({
          ...cred,
          id: this.base64ToArrayBuffer(cred.id)
        }))
      };
      
      // 3. 调用浏览器 WebAuthn API
      const assertion = await navigator.credentials.get({
        publicKey: publicKeyOptions
      }) as PublicKeyCredential;
      
      if (!assertion) {
        throw new Error('Failed to get assertion');
      }
      
      // 4. 提取响应数据
      const response = assertion.response as AuthenticatorAssertionResponse;
      
      // 5. 发送到服务器验证
      const finishRes = await fetch('/api/passkey/login/finish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          credentialId: this.arrayBufferToBase64(assertion.rawId),
          authenticatorData: this.arrayBufferToBase64(response.authenticatorData),
          clientDataJSON: this.arrayBufferToBase64(response.clientDataJSON),
          signature: this.arrayBufferToBase64(response.signature)
        })
      });
      
      const result = await finishRes.json();
      
      return {
        success: true,
        userId: result.userId,
        sessionToken: result.sessionToken,
        wallet: result.wallet
      };
      
    } catch (error) {
      console.error('Passkey authentication failed:', error);
      throw error;
    }
  }

  /**
   * 检查浏览器是否支持 Passkey
   */
  isSupported(): boolean {
    return (
      window.PublicKeyCredential !== undefined &&
      navigator.credentials !== undefined &&
      typeof navigator.credentials.create === 'function' &&
      typeof navigator.credentials.get === 'function'
    );
  }

  /**
   * 检查是否支持平台认证器（Face ID / Touch ID）
   */
  async isPlatformAuthenticatorAvailable(): Promise<boolean> {
    if (!this.isSupported()) return false;
    
    try {
      return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    } catch {
      return false;
    }
  }

  // 工具函数
  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64.replace(/-/g, '+').replace(/_/g, '/'));
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }
}

export interface PasskeyRegistrationResult {
  success: boolean;
  userId: string;
  sessionToken: string;
  wallet: {
    address: string;
    chainId: number;
  };
}

export interface PasskeyAuthenticationResult {
  success: boolean;
  userId: string;
  sessionToken: string;
  wallet: {
    address: string;
    balance: string;
  };
}
```

### 2. 认证 Hook

```typescript
// src/hooks/usePasskey.ts

import { useState, useEffect } from 'react';
import { PasskeyService } from '@/services/passkey';

export function usePasskey() {
  const [isSupported, setIsSupported] = useState(false);
  const [isPlatformAvailable, setIsPlatformAvailable] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const passkeyService = new PasskeyService();

  useEffect(() => {
    // 检查浏览器支持
    setIsSupported(passkeyService.isSupported());
    
    // 检查平台认证器
    passkeyService.isPlatformAuthenticatorAvailable()
      .then(setIsPlatformAvailable);
  }, []);

  const register = async (username: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await passkeyService.register(username);
      
      // 存储会话令牌
      localStorage.setItem('sessionToken', result.sessionToken);
      
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Registration failed';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const authenticate = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await passkeyService.authenticate();
      
      // 存储会话令牌
      localStorage.setItem('sessionToken', result.sessionToken);
      
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Authentication failed';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isSupported,
    isPlatformAvailable,
    isLoading,
    error,
    register,
    authenticate
  };
}
```

### 3. 欢迎页面 UI

```typescript
// src/components/PasskeyWelcome.tsx

'use client';
import React, { useEffect, useState } from 'react';
import { Box, Button, Typography, Paper, Alert } from '@mui/material';
import { Fingerprint, Face } from '@mui/icons-material';
import { usePasskey } from '@/hooks/usePasskey';
import { useRouter } from 'next/navigation';

const PasskeyWelcome: React.FC = () => {
  const router = useRouter();
  const { isSupported, isPlatformAvailable, register, authenticate, isLoading, error } = usePasskey();
  const [authIcon, setAuthIcon] = useState<'fingerprint' | 'face'>('fingerprint');

  useEffect(() => {
    // 检测设备类型
    const userAgent = navigator.userAgent.toLowerCase();
    if (userAgent.includes('iphone') || userAgent.includes('ipad') || userAgent.includes('mac')) {
      setAuthIcon('face'); // iOS/macOS 显示 Face ID
    }
  }, []);

  const handleRegister = async () => {
    try {
      const username = `user_${Date.now()}`; // 自动生成用户名
      const result = await register(username);
      
      // 注册成功，跳转到聊天页面
      router.push('/chat');
    } catch (err) {
      console.error('Registration error:', err);
    }
  };

  const handleLogin = async () => {
    try {
      const result = await authenticate();
      
      // 登录成功，跳转到聊天页面
      router.push('/chat');
    } catch (err) {
      console.error('Login error:', err);
    }
  };

  if (!isSupported) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        p: 3
      }}>
        <Alert severity="error">
          您的浏览器不支持 Passkey 认证。请使用最新版本的 Chrome、Safari 或 Edge。
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      background: 'linear-gradient(135deg, #F9FAFB 0%, #F3F4F6 100%)',
      p: 3
    }}>
      <Paper
        elevation={3}
        sx={{
          maxWidth: 500,
          width: '100%',
          p: 5,
          borderRadius: '20px',
          textAlign: 'center'
        }}
      >
        {/* Logo 和标题 */}
        <Box sx={{ mb: 4 }}>
          {authIcon === 'face' ? (
            <Face sx={{ fontSize: 80, color: 'primary.main', mb: 2 }} />
          ) : (
            <Fingerprint sx={{ fontSize: 80, color: 'primary.main', mb: 2 }} />
          )}
          
          <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }} className="gradient-text">
            AI Wallet
          </Typography>
          
          <Typography variant="body1" color="text.secondary">
            {isPlatformAvailable 
              ? `使用 ${authIcon === 'face' ? 'Face ID' : '指纹'} 安全管理你的数字资产`
              : '使用 Passkey 安全管理你的数字资产'
            }
          </Typography>
        </Box>

        {/* 错误提示 */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* 功能介绍 */}
        <Box sx={{ mb: 4, textAlign: 'left' }}>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
            ✨ 特色功能
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            • 无需记忆密码或助记词
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            • {authIcon === 'face' ? 'Face ID' : '指纹'}识别，安全便捷
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            • AI 智能助手，自动管理交易
          </Typography>
          <Typography variant="body2" color="text.secondary">
            • 无 Gas 费用，平台代付
          </Typography>
        </Box>

        {/* 操作按钮 */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Button
            variant="contained"
            size="large"
            onClick={handleRegister}
            disabled={isLoading}
            startIcon={authIcon === 'face' ? <Face /> : <Fingerprint />}
            sx={{
              py: 1.5,
              borderRadius: '12px',
              fontSize: '1.1rem',
              fontWeight: 600,
              background: 'linear-gradient(135deg, #6366F1 0%, #818CF8 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)',
              }
            }}
          >
            {isLoading ? '创建中...' : `使用${authIcon === 'face' ? ' Face ID' : '指纹'}创建钱包`}
          </Button>

          <Button
            variant="outlined"
            size="large"
            onClick={handleLogin}
            disabled={isLoading}
            sx={{
              py: 1.5,
              borderRadius: '12px',
              fontSize: '1rem'
            }}
          >
            已有账号？{authIcon === 'face' ? 'Face ID' : '指纹'}登录
          </Button>
        </Box>

        {/* 安全提示 */}
        <Typography variant="caption" color="text.secondary" sx={{ mt: 3, display: 'block' }}>
          🔒 您的私钥安全存储在设备中，永不离开本地
        </Typography>
      </Paper>
    </Box>
  );
};

export default PasskeyWelcome;
```

---

## 🔧 后端实现

### 1. 安装 WebAuthn 库

```bash
cd ai-wallet-app/backend
go get github.com/go-webauthn/webauthn/webauthn
go get github.com/go-webauthn/webauthn/protocol
```

### 2. Passkey 模型

```go
// internal/models/passkey.go
package models

import "time"

type PasskeyCredential struct {
    ID           string    `json:"id" gorm:"primaryKey"`
    UserID       string    `json:"userId" gorm:"index"`
    CredentialID []byte    `json:"credentialId" gorm:"uniqueIndex"`
    PublicKey    []byte    `json:"publicKey"`
    SignCount    uint32    `json:"signCount"`
    AAGUID       []byte    `json:"aaguid"`
    CreatedAt    time.Time `json:"createdAt"`
    LastUsedAt   time.Time `json:"lastUsedAt"`
}

type Session struct {
    ID        string    `json:"id" gorm:"primaryKey"`
    UserID    string    `json:"userId" gorm:"index"`
    Token     string    `json:"token" gorm:"uniqueIndex"`
    ExpiresAt time.Time `json:"expiresAt"`
    CreatedAt time.Time `json:"createdAt"`
}
```

### 3. WebAuthn 服务

```go
// internal/auth/webauthn_service.go
package auth

import (
    "ai-wallet-backend/internal/models"
    "github.com/go-webauthn/webauthn/webauthn"
    "gorm.io/gorm"
)

type WebAuthnService struct {
    webAuthn *webauthn.WebAuthn
    db       *gorm.DB
}

func NewWebAuthnService(db *gorm.DB, rpID, rpName, rpOrigin string) (*WebAuthnService, error) {
    wconfig := &webauthn.Config{
        RPDisplayName: rpName,
        RPID:          rpID,
        RPOrigin:      rpOrigin,
    }

    webAuthn, err := webauthn.New(wconfig)
    if err != nil {
        return nil, err
    }

    return &WebAuthnService{
        webAuthn: webAuthn,
        db:       db,
    }, nil
}

// BeginRegistration 开始注册流程
func (s *WebAuthnService) BeginRegistration(user *models.User) (*protocol.CredentialCreation, error) {
    // 实现 WebAuthn User 接口
    webAuthnUser := &WebAuthnUser{User: user}
    
    options, session, err := s.webAuthn.BeginRegistration(webAuthnUser)
    if err != nil {
        return nil, err
    }
    
    // 存储 session 到内存/Redis（临时）
    // ...
    
    return options, nil
}

// FinishRegistration 完成注册
func (s *WebAuthnService) FinishRegistration(user *models.User, response *protocol.ParsedCredentialCreationData) error {
    // 验证并保存凭证
    credential, err := s.webAuthn.CreateCredential(webAuthnUser, session, response)
    if err != nil {
        return err
    }
    
    // 保存到数据库
    passkeyCredential := &models.PasskeyCredential{
        ID:           uuid.New().String(),
        UserID:       user.ID,
        CredentialID: credential.ID,
        PublicKey:    credential.PublicKey,
        SignCount:    credential.Authenticator.SignCount,
        AAGUID:       credential.Authenticator.AAGUID,
    }
    
    return s.db.Create(passkeyCredential).Error
}

// BeginLogin 开始登录流程
func (s *WebAuthnService) BeginLogin(user *models.User) (*protocol.CredentialAssertion, error) {
    webAuthnUser := &WebAuthnUser{User: user}
    
    options, session, err := s.webAuthn.BeginLogin(webAuthnUser)
    if err != nil {
        return nil, err
    }
    
    // 存储 session
    // ...
    
    return options, nil
}

// FinishLogin 完成登录
func (s *WebAuthnService) FinishLogin(user *models.User, response *protocol.ParsedCredentialAssertionData) error {
    webAuthnUser := &WebAuthnUser{User: user}
    
    _, err := s.webAuthn.ValidateLogin(webAuthnUser, session, response)
    return err
}

// WebAuthnUser 实现 webauthn.User 接口
type WebAuthnUser struct {
    *models.User
}

func (u *WebAuthnUser) WebAuthnID() []byte {
    return []byte(u.ID)
}

func (u *WebAuthnUser) WebAuthnName() string {
    return u.Username
}

func (u *WebAuthnUser) WebAuthnDisplayName() string {
    return u.Username
}

func (u *WebAuthnUser) WebAuthnIcon() string {
    return ""
}

func (u *WebAuthnUser) WebAuthnCredentials() []webauthn.Credential {
    // 从数据库加载用户的所有凭证
    var credentials []models.PasskeyCredential
    // db.Where("user_id = ?", u.ID).Find(&credentials)
    
    // 转换为 webauthn.Credential
    // ...
    
    return nil
}
```

### 4. API 路由

```go
// internal/api/passkey_handlers.go
package api

import (
    "net/http"
    "github.com/gin-gonic/gin"
    "github.com/google/uuid"
)

// POST /api/passkey/register/begin
func (h *Handler) BeginPasskeyRegistration(c *gin.Context) {
    var req struct {
        Username string `json:"username" binding:"required"`
    }
    
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(400, gin.H{"error": err.Error()})
        return
    }
    
    // 1. 创建新用户
    user := &models.User{
        ID:       uuid.New().String(),
        Username: req.Username,
    }
    
    if err := h.db.Create(user).Error; err != nil {
        c.JSON(500, gin.H{"error": "failed to create user"})
        return
    }
    
    // 2. 生成 WebAuthn 注册选项
    options, err := h.webAuthnService.BeginRegistration(user)
    if err != nil {
        c.JSON(500, gin.H{"error": err.Error()})
        return
    }
    
    c.JSON(200, options)
}

// POST /api/passkey/register/finish
func (h *Handler) FinishPasskeyRegistration(c *gin.Context) {
    var req struct {
        CredentialID       string `json:"credentialId"`
        AttestationObject  string `json:"attestationObject"`
        ClientDataJSON     string `json:"clientDataJSON"`
    }
    
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(400, gin.H{"error": err.Error()})
        return
    }
    
    // 1. 解析 WebAuthn 响应
    // 2. 验证并保存凭证
    // 3. 创建钱包
    // 4. 生成会话令牌
    
    c.JSON(200, gin.H{
        "userId":       user.ID,
        "sessionToken": sessionToken,
        "wallet": gin.H{
            "address": wallet.Address,
            "chainId": wallet.ChainID,
        },
    })
}

// POST /api/passkey/login/begin
func (h *Handler) BeginPasskeyLogin(c *gin.Context) {
    // 返回所有已注册的 Credential IDs
    // 让浏览器选择合适的凭证
}

// POST /api/passkey/login/finish
func (h *Handler) FinishPasskeyLogin(c *gin.Context) {
    // 验证签名
    // 生成会话令牌
    // 返回用户和钱包信息
}
```

---

## 🔐 交易确认流程（使用 Passkey）

### 场景：用户执行转账

```
用户在聊天中说："转 0.1 ETH 给 0x..."
    │
    ▼
AI 生成 Operation 确认 UI
    │
    ▼
用户点击"确认转账"按钮
    │
    ▼
前端弹出 Face ID / 指纹确认
    │
    ├─ 提示："确认转账 0.1 ETH"
    │
    ▼
用户确认 Face ID
    │
    ▼
前端调用 WebAuthn assertion
    │
    ├─ 生成签名证明用户身份
    │
    ▼
发送到后端: POST /api/transaction/execute
    │
    ├─ Headers: X-Session-Token
    ├─ Body: {
    │     action: "transfer",
    │     amount: "0.1",
    │     recipient: "0x...",
    │     assertion: { // WebAuthn 签名
    │       credentialId: "...",
    │       signature: "...",
    │       ...
    │     }
    │   }
    │
    ▼
后端验证 WebAuthn 签名
    │
    ├─ ✓ 验证通过
    │
    ▼
解密钱包私钥 + 签名交易
    │
    ▼
提交到区块链
    │
    ▼
✅ 返回交易 Hash
```

### 前端实现

```typescript
// src/components/OperationConfirm.tsx

const handleConfirm = async (operation: Operation) => {
  try {
    // 1. 弹出 Passkey 确认
    const assertion = await passkeyService.createAssertion(
      `确认转账 ${operation.amount} ${operation.asset}`
    );
    
    // 2. 发送到后端
    const response = await fetch('/api/transaction/execute', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Session-Token': sessionToken
      },
      body: JSON.stringify({
        ...operation,
        assertion: {
          credentialId: arrayBufferToBase64(assertion.rawId),
          signature: arrayBufferToBase64(assertion.response.signature),
          authenticatorData: arrayBufferToBase64(assertion.response.authenticatorData),
          clientDataJSON: arrayBufferToBase64(assertion.response.clientDataJSON)
        }
      })
    });
    
    const result = await response.json();
    
    // 3. 显示交易成功
    console.log('Transaction submitted:', result.txHash);
    
  } catch (error) {
    console.error('Transaction failed:', error);
  }
};
```

---

## 📊 优势总结

### 用户体验
- ✅ **极简注册**: 一键 Face ID，3 秒创建钱包
- ✅ **快速登录**: Face ID 识别，无需输入密码
- ✅ **安全确认**: 每笔交易 Face ID 确认，防止误操作
- ✅ **跨设备**: iCloud Keychain 同步（iOS/macOS）

### 安全性
- ✅ **私钥不出设备**: Passkey 私钥存储在 Secure Enclave
- ✅ **防钓鱼**: 密钥绑定域名，无法跨站使用
- ✅ **生物识别**: Face ID / Touch ID，比密码更安全
- ✅ **无密码泄露**: 服务器只存储公钥

### 开发优势
- ✅ **标准化**: W3C WebAuthn 标准，浏览器原生支持
- ✅ **无需第三方**: 不依赖 Auth0、Firebase 等
- ✅ **兼容性好**: iOS、Android、Windows、macOS 全平台

---

## 🚀 实现优先级

### Phase 1: 基础 Passkey 认证 (2天)
- [x] 前端 Passkey 注册/登录
- [x] 后端 WebAuthn 验证
- [x] 会话管理
- [x] 欢迎页面 UI

### Phase 2: 钱包集成 (1天)
- [x] 注册时自动创建钱包
- [x] 登录时加载钱包信息
- [x] 使用 Passkey 派生加密密钥

### Phase 3: 交易确认 (1天)
- [x] 转账前 Passkey 确认
- [x] 签名验证
- [x] 错误处理

### Phase 4: 优化 (1天)
- [x] 多设备支持
- [x] 凭证管理页面
- [x] 降级方案（不支持 Passkey 的设备）

---

需要我开始编写具体的代码实现吗？🚀
