// P256 Wallet Service for WebAuthn-based signatures
// This service handles building UserOperations and signing with Passkey

import { base64url } from './passkey';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

export interface UserOperation {
  sender: string;
  nonce: string;
  initCode: string;
  callData: string;
  callGasLimit: string;
  verificationGasLimit: string;
  preVerificationGas: string;
  maxFeePerGas: string;
  maxPriorityFeePerGas: string;
  paymasterAndData: string;
  signature: string;
}

export interface TransferParams {
  recipient: string;
  amount: string; // in wei
}

/**
 * Parse DER-encoded ECDSA signature to extract r and s
 * WebAuthn returns signatures in DER format, but we need raw r,s for the contract
 */
function parseDERSignature(derSig: Uint8Array): { r: Uint8Array; s: Uint8Array } | null {
  try {
    let offset = 0;
    
    // Check SEQUENCE tag
    if (derSig[offset++] !== 0x30) return null;
    
    // Skip sequence length
    offset++;
    
    // Parse r
    if (derSig[offset++] !== 0x02) return null; // INTEGER tag
    const rLen = derSig[offset++];
    let r = derSig.slice(offset, offset + rLen);
    offset += rLen;
    
    // Remove leading zero if present (DER encoding adds it for positive numbers)
    if (r.length === 33 && r[0] === 0x00) {
      r = r.slice(1);
    }
    
    // Pad to 32 bytes if needed
    if (r.length < 32) {
      const padded = new Uint8Array(32);
      padded.set(r, 32 - r.length);
      r = padded;
    }
    
    // Parse s
    if (derSig[offset++] !== 0x02) return null; // INTEGER tag
    const sLen = derSig[offset++];
    let s = derSig.slice(offset, offset + sLen);
    
    // Remove leading zero if present
    if (s.length === 33 && s[0] === 0x00) {
      s = s.slice(1);
    }
    
    // Pad to 32 bytes if needed
    if (s.length < 32) {
      const padded = new Uint8Array(32);
      padded.set(s, 32 - s.length);
      s = padded;
    }
    
    return { r, s };
  } catch (e) {
    console.error('Error parsing DER signature:', e);
    return null;
  }
}

/**
 * Convert Uint8Array to hex string
 */
function uint8ArrayToHex(arr: Uint8Array): string {
  return '0x' + Array.from(arr)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}


/**
 * P256 Wallet Service
 */
export class P256WalletService {
  /**
   * Sign a message using WebAuthn and return raw r,s signature
   * This is the core P-256 signing function that uses the device's Secure Enclave
   */
  static async signMessageWithPasskey(
    message: Uint8Array,
    credentialId: string
  ): Promise<string> {
    try {
      // Create authentication challenge
      // Convert to ArrayBuffer for WebAuthn API
      const challenge = new Uint8Array(message).buffer as ArrayBuffer;
      
      // Request authentication with specific credential
      const credential = await navigator.credentials.get({
        publicKey: {
          challenge: challenge,
          allowCredentials: [{
            id: base64url.decode(credentialId),
            type: 'public-key',
            transports: ['internal', 'hybrid'],
          }],
          timeout: 60000,
          userVerification: 'required',
        },
      }) as PublicKeyCredential | null;

      if (!credential) {
        throw new Error('Failed to get credential');
      }

      // Extract signature and WebAuthn data from authenticator response
      const response = credential.response as AuthenticatorAssertionResponse;
      const signature = new Uint8Array(response.signature);
      const authenticatorData = new Uint8Array(response.authenticatorData);
      const clientDataJSON = new Uint8Array(response.clientDataJSON);
      
      console.log('🔐 WebAuthn Signature Details:');
      console.log('Raw DER signature (hex):', Array.from(signature).map(b => b.toString(16).padStart(2, '0')).join(''));
      console.log('Raw DER signature length:', signature.length, 'bytes');
      console.log('Authenticator Data (hex):', Array.from(authenticatorData).map(b => b.toString(16).padStart(2, '0')).join(''));
      console.log('Authenticator Data length:', authenticatorData.length, 'bytes');
      console.log('Client Data JSON:', new TextDecoder().decode(clientDataJSON));
      
      // Parse DER signature to get r and s
      const parsed = parseDERSignature(signature);
      if (!parsed) {
        throw new Error('Failed to parse signature');
      }
      
      console.log('Parsed r (hex):', Array.from(parsed.r).map(b => b.toString(16).padStart(2, '0')).join(''));
      console.log('Parsed s (hex):', Array.from(parsed.s).map(b => b.toString(16).padStart(2, '0')).join(''));
      console.log('Parsed r length:', parsed.r.length, 'bytes');
      console.log('Parsed s length:', parsed.s.length, 'bytes');
      
      // Format signature for contract:
      // r (32 bytes) || s (32 bytes) || authDataLength (2 bytes) || authenticatorData || clientDataJSON
      
      const authDataLength = authenticatorData.length;
      const authDataLengthBytes = new Uint8Array(2);
      authDataLengthBytes[0] = (authDataLength >> 8) & 0xFF; // High byte
      authDataLengthBytes[1] = authDataLength & 0xFF;        // Low byte
      
      // Combine all parts
      const fullSignature = new Uint8Array(
        64 +                    // r + s
        2 +                      // authDataLength
        authenticatorData.length + 
        clientDataJSON.length
      );
      
      let offset = 0;
      fullSignature.set(parsed.r, offset);
      offset += 32;
      fullSignature.set(parsed.s, offset);
      offset += 32;
      fullSignature.set(authDataLengthBytes, offset);
      offset += 2;
      fullSignature.set(authenticatorData, offset);
      offset += authenticatorData.length;
      fullSignature.set(clientDataJSON, offset);
      
      console.log('Full signature length:', fullSignature.length, 'bytes');
      console.log('Full signature breakdown:');
      console.log('  - r+s: 64 bytes');
      console.log('  - authDataLength: 2 bytes =', authDataLength);
      console.log('  - authenticatorData:', authenticatorData.length, 'bytes');
      console.log('  - clientDataJSON:', clientDataJSON.length, 'bytes');
      
      return uint8ArrayToHex(fullSignature);
    } catch (error: any) {
      console.error('WebAuthn signing error:', error);
      throw new Error(`Failed to sign with Passkey: ${error.message}`);
    }
  }

  /**
   * Simplified transfer that sends parameters to backend
   * Backend builds UserOp, frontend signs it, backend submits
   */
  static async executeTransfer(
    params: TransferParams,
    sessionToken: string
  ): Promise<{ txHash: string; explorerUrl: string }> {
    try {
      // Step 1: Request backend to prepare UserOp
      console.log('Step 1: Preparing UserOp...');
      const prepareResponse = await fetch(`${API_BASE_URL}/transfer/prepare`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-Token': sessionToken,
        },
        body: JSON.stringify(params),
      });

      if (!prepareResponse.ok) {
        const error = await prepareResponse.json();
        throw new Error(error.error || 'Failed to prepare transaction');
      }

      const prepareData = await prepareResponse.json();
      console.log('Prepare response:', prepareData);
      
      const { userOpHash, credentialId } = prepareData;
      
      if (!userOpHash || !credentialId) {
        throw new Error(`Missing data from prepare response: userOpHash=${userOpHash}, credentialId=${credentialId}`);
      }
      
      // Step 2: Sign the userOpHash with Passkey
      // WebAuthn will wrap this in clientDataJSON and add authenticatorData
      console.log('Step 2: Signing with Passkey...');
      console.log('UserOpHash (challenge):', userOpHash);
      
      // Convert userOpHash to Uint8Array
      // Note: We're not using hashToSign with Ethereum prefix anymore
      // WebAuthn will provide its own wrapping via clientDataJSON
      const hashBytes = new Uint8Array(
        userOpHash.slice(2).match(/.{1,2}/g)!.map((byte: string) => parseInt(byte, 16))
      );
      
      const signature = await this.signMessageWithPasskey(hashBytes, credentialId);
      
      console.log('✅ Signature created successfully');
      console.log('Signature includes r, s, authenticatorData, and clientDataJSON');
      
      // Step 3: Submit signed UserOp to backend
      console.log('Step 3: Submitting transaction...');
      const submitResponse = await fetch(`${API_BASE_URL}/transfer/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-Token': sessionToken,
        },
        body: JSON.stringify({
          signature,
          userOpHash, // Include hash so backend can match it
        }),
      });

      if (!submitResponse.ok) {
        const error = await submitResponse.json();
        throw new Error(error.error || 'Failed to submit transaction');
      }

      return await submitResponse.json();
    } catch (error: any) {
      console.error('Transfer error:', error);
      throw new Error(`Transfer failed: ${error.message}`);
    }
  }
}
