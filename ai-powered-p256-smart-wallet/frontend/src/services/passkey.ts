// Passkey Service for WebAuthn authentication

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

// Debug: Log the API URL
console.log('🔧 Passkey Service - API_BASE_URL:', API_BASE_URL);
console.log('🔧 Environment:', process.env.NEXT_PUBLIC_API_URL);

/**
 * Base64URL encode/decode utilities
 */
export const base64url = {
  encode: (buffer: ArrayBuffer): string => {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  },

  decode: (str: string): ArrayBuffer => {
    str = str.replace(/-/g, '+').replace(/_/g, '/');
    while (str.length % 4) {
      str += '=';
    }
    const binary = atob(str);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  },
};

/**
 * Convert credential creation options from backend to browser format
 */
function convertCredentialCreationOptions(options: any): PublicKeyCredentialCreationOptions {
  return {
    ...options,
    challenge: base64url.decode(options.challenge),
    user: {
      ...options.user,
      id: base64url.decode(options.user.id),
    },
    excludeCredentials: options.excludeCredentials?.map((cred: any) => ({
      ...cred,
      id: base64url.decode(cred.id),
    })),
  };
}

/**
 * Convert credential request options from backend to browser format
 */
function convertCredentialRequestOptions(options: any): PublicKeyCredentialRequestOptions {
  return {
    ...options,
    challenge: base64url.decode(options.challenge),
    allowCredentials: options.allowCredentials?.map((cred: any) => ({
      ...cred,
      id: base64url.decode(cred.id),
    })),
  };
}

/**
 * Convert browser credential to format expected by backend
 */
function convertCredentialToJSON(credential: PublicKeyCredential) {
  const response = credential.response as AuthenticatorAttestationResponse | AuthenticatorAssertionResponse;
  
  const result: any = {
    id: credential.id,
    rawId: base64url.encode(credential.rawId),
    type: credential.type,
    response: {},
  };

  if ('attestationObject' in response) {
    // Registration response
    result.response = {
      clientDataJSON: base64url.encode(response.clientDataJSON),
      attestationObject: base64url.encode(response.attestationObject),
    };
  } else {
    // Authentication response
    result.response = {
      clientDataJSON: base64url.encode(response.clientDataJSON),
      authenticatorData: base64url.encode(response.authenticatorData),
      signature: base64url.encode(response.signature),
      userHandle: response.userHandle ? base64url.encode(response.userHandle) : undefined,
    };
  }

  return result;
}

export interface RegisterResponse {
  success: boolean;
  session: {
    token: string;
    expiresAt: string;
  };
  user: {
    id: number;
    username: string;
  };
  wallet: {
    address: string;
    balance: string | null;
  };
}

export interface LoginResponse {
  success: boolean;
  session: {
    token: string;
    expiresAt: string;
  };
  user: {
    id: number;
    username: string;
  };
  wallet: {
    address: string;
    balance: string | null;
  };
}

/**
 * Passkey Service
 */
export class PasskeyService {
  /**
   * Check if WebAuthn is supported in current browser
   */
  static isSupported(): boolean {
    return (
      typeof window !== 'undefined' &&
      'credentials' in navigator &&
      'create' in navigator.credentials &&
      typeof PublicKeyCredential !== 'undefined'
    );
  }

  /**
   * Check if platform authenticator (Face ID, Touch ID, Windows Hello) is available
   */
  static async isPlatformAuthenticatorAvailable(): Promise<boolean> {
    if (!this.isSupported()) return false;
    
    try {
      return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    } catch (error) {
      console.error('Error checking platform authenticator:', error);
      return false;
    }
  }

  /**
   * Register a new user with Passkey
   */
  static async register(username: string): Promise<RegisterResponse> {
    if (!this.isSupported()) {
      throw new Error('WebAuthn is not supported in this browser');
    }

    // Step 1: Begin registration
    const url = `${API_BASE_URL}/passkey/register/begin`;
    console.log('🔧 Register URL:', url);
    
    const beginResponse = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username }),
    });

    if (!beginResponse.ok) {
      const error = await beginResponse.json();
      throw new Error(error.error || 'Failed to begin registration');
    }

    const { options, sessionID, userID, username: returnedUsername } = await beginResponse.json();

    // Step 2: Create credential with browser
    const credentialCreationOptions = convertCredentialCreationOptions(options.publicKey);
    
    let credential: Credential | null;
    try {
      credential = await navigator.credentials.create({
        publicKey: credentialCreationOptions,
      });
    } catch (error: any) {
      console.error('Credential creation error:', error);
      throw new Error(`Failed to create credential: ${error.message}`);
    }

    if (!credential) {
      throw new Error('Failed to create credential');
    }

    // Step 3: Finish registration
    const credentialJSON = convertCredentialToJSON(credential as PublicKeyCredential);
    
    const finishResponse = await fetch(`${API_BASE_URL}/passkey/register/finish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: userID,
        username: returnedUsername || username, // Use returned username or fallback to input
        sessionId: sessionID,
        response: credentialJSON,
      }),
    });

    if (!finishResponse.ok) {
      const error = await finishResponse.json();
      throw new Error(error.error || 'Failed to finish registration');
    }

    return await finishResponse.json();
  }

  /**
   * Login with existing Passkey
   */
  static async login(username: string): Promise<LoginResponse> {
    if (!this.isSupported()) {
      throw new Error('WebAuthn is not supported in this browser');
    }

    // Step 1: Begin login
    const beginResponse = await fetch(`${API_BASE_URL}/passkey/login/begin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username }),
    });

    if (!beginResponse.ok) {
      const error = await beginResponse.json();
      throw new Error(error.error || 'Failed to begin login');
    }

    const { options, sessionID, userID } = await beginResponse.json();

    // Step 2: Get credential from browser
    const credentialRequestOptions = convertCredentialRequestOptions(options.publicKey);
    
    let credential: Credential | null;
    try {
      credential = await navigator.credentials.get({
        publicKey: credentialRequestOptions,
      });
    } catch (error: any) {
      console.error('Credential get error:', error);
      throw new Error(`Failed to get credential: ${error.message}`);
    }

    if (!credential) {
      throw new Error('Failed to get credential');
    }

    // Step 3: Finish login
    const credentialJSON = convertCredentialToJSON(credential as PublicKeyCredential);
    
    const finishResponse = await fetch(`${API_BASE_URL}/passkey/login/finish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: userID,
        sessionId: sessionID,
        response: credentialJSON,
      }),
    });

    if (!finishResponse.ok) {
      const error = await finishResponse.json();
      throw new Error(error.error || 'Failed to finish login');
    }

    return await finishResponse.json();
  }
}
