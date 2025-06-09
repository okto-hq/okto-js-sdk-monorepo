# @okto_web3/core-js-sdk

> Core JavaScript SDK for Web3 operations and blockchain interactions - Build powerful Web3 applications with ease.

[![npm version](https://img.shields.io/npm/v/@okto_web3/core-js-sdk.svg)](https://www.npmjs.com/package/@okto_web3/core-js-sdk)
[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg)](https://www.typescriptlang.org/)

## Features

- **Authentication & Security**

  - Multi-channel authentication (OAuth, Email, WhatsApp)
  - Social login integration
  - JWT-based secure sessions
  - Advanced error handling

- **Blockchain Operations**
  - NFT transfers and minting
  - Token operations
  - Collection management
  - EIP-4337 compliant UserOps
- **Explorer Functions**
  - Account management
  - Multi-chain support
  - Transaction history
  - Portfolio tracking
  - Token & NFT management

## Installation

```bash
# Using npm
npm install @okto_web3/core-js-sdk

# Using yarn
yarn add @okto_web3/core-js-sdk

# Using pnpm
pnpm install @okto_web3/core-js-sdk
```

## Quick Start

```typescript
import { OktoClient } from '@okto_web3/core-js-sdk';

// Initialize client
const client = new OktoClient({
  environment: 'sandbox', // or 'production'
  clientPrivateKey: 'your-private-key',
  clientSWA: 'your-client-swa',
});
```

### Authentication Methods

```typescript
// Email authentication
await client.sendOTP(email, 'email');
await client.loginUsingEmail(email, otp, token);

// Social login
await client.loginUsingSocial('google', {
  state: 'custom-state',
  windowHandler: customWindow,
});

// WhatsApp authentication
await client.sendOTP(phoneNumber, 'whatsapp');
await client.loginUsingWhatsApp(phoneNumber, otp);
```

### Blockchain Operations

```typescript
// Token operations
const userOp = await client.tokenTransfer(transferData);
const signedOp = await client.signUserOp(userOp);
await client.executeUserOp(signedOp);

// NFT operations
await client.nftTransfer(nftData);
await client.nftMint(mintData);

// Message signing
await client.signMessage(message);
await client.signTypedData(typedData);
```

### Explorer Functions

```typescript
// Account & portfolio
const account = await client.getAccount();
const portfolio = await client.getPortfolio();
const tokens = await client.getTokens();
const nfts = await client.getNftCollections();

// Transaction history
const history = await client.getOrdersHistory();
const chains = await client.getChains();
```

## Error Handling

```typescript
import { RpcError, AuthError } from '@okto_web3/core-js-sdk/errors';

try {
  await client.executeUserOp(userOp);
} catch (error) {
  if (error instanceof RpcError) {
    console.error('RPC Error:', error.message);
  } else if (error instanceof AuthError) {
    console.error('Authentication Error:', error.message);
  }
}
```

## Environment Configuration

```typescript
const config = {
  // Development environment
  environment: 'sandbox',
  clientPrivateKey: process.env.SANDBOX_PRIVATE_KEY,
  clientSWA: process.env.SANDBOX_SWA,
};

// Production environment
const prodConfig = {
  environment: 'production',
  clientPrivateKey: process.env.PROD_PRIVATE_KEY,
  clientSWA: process.env.PROD_SWA,
};
```

## Documentation

For detailed documentation and guides, visit:

- [API Reference](https://docs.okto.tech/docs/typescript-sdk)
