// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract WebAuthnDebug {
    
    // Test function to debug WebAuthn signature parsing
    function testSignatureParsing(bytes calldata signature) external pure returns (
        bytes32 r,
        bytes32 s,
        uint16 authDataLength,
        bytes memory authenticatorData,
        bytes memory clientDataJSON,
        bytes32 clientDataHash,
        bytes32 messageHash
    ) {
        // Extract r and s
        r = bytes32(signature[0:32]);
        s = bytes32(signature[32:64]);
        
        // Extract authDataLength
        authDataLength = uint16(uint8(signature[64])) << 8 | uint16(uint8(signature[65]));
        
        // Extract authenticatorData and clientDataJSON
        authenticatorData = signature[66:66 + authDataLength];
        clientDataJSON = signature[66 + authDataLength:];
        
        // Compute hashes
        clientDataHash = sha256(clientDataJSON);
        bytes memory signedMessage = bytes.concat(authenticatorData, clientDataHash);
        messageHash = sha256(signedMessage);
    }
    
    // Test P-256 verification directly
    function testP256Verify(
        bytes32 messageHash,
        bytes32 r,
        bytes32 s,
        uint256 qx,
        uint256 qy
    ) external view returns (bool) {
        address P256_VERIFIER = address(0x0000000000000000000000000000000000000100);
        
        bytes memory input = abi.encodePacked(messageHash, r, s, qx, qy);
        (bool success, bytes memory result) = P256_VERIFIER.staticcall(input);
        
        if (success && result.length > 0) {
            uint256 output = abi.decode(result, (uint256));
            return output == 1;
        }
        
        return false;
    }
}
