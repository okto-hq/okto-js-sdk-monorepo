# @okto_web3/react-sdk

> React wrapper for Okto Web3 SDK - Seamlessly integrate Web3 functionality into your React applications.

[![npm version](https://img.shields.io/npm/v/@okto_web3/react-sdk.svg)](https://www.npmjs.com/package/@okto_web3/react-sdk)

## Features

- **Enhanced Authentication**
  - WebView Integration for seamless in-app flows
  - Social Login support (Google)
  - Automatic session persistence
- **Core SDK Integration**
  - Full access to `@okto_web3/core-js-sdk` features
  - Browser-optimized authentication
  - Local storage session management

## Installation

```bash
npm install @okto_web3/react-sdk
```

## Quick Start

```jsx
import { OktoProvider, useOkto, useOktoWebView } from '@okto_web3/react-sdk';

// Configure the SDK
const config = {
  environment: 'sandbox', // or 'production'
  clientPrivateKey: 'your-private-key',
  clientSWA: 'your-client-swa',
};

// Wrap your app with OktoProvider
function App() {
  return (
    <OktoProvider config={config}>
      <AuthExample />
    </OktoProvider>
  );
}

// Use hooks in your components
function AuthExample() {
  const client = useOkto();
  const { isModalOpen, authenticate } = useOktoWebView();

  const handleLogin = async () => {
    try {
      const result = await authenticate({
        onSuccess: (data) => console.log('Success:', data),
        onError: (error) => console.error('Error:', error),
        onClose: () => console.log('Closed'),
      });
      console.log('Authentication result:', result);
    } catch (error) {
      console.error('Authentication failed:', error);
    }
  };

  return (
    <div>
      <button onClick={handleLogin}>
        {isModalOpen ? 'Authenticating...' : 'Login'}
      </button>
    </div>
  );
}
```

## API Reference

### WebView Authentication

```jsx
const { authenticate, isModalOpen } = useOktoWebView();

// Open authentication modal
await authenticate({
  onSuccess: (data) => {
    console.log('Authentication successful:', data);
  },
  onError: (error) => {
    console.error('Authentication failed:', error);
  },
  onClose: () => {
    console.log('Modal closed');
  },
});
```

### Google Authentication

```jsx
const client = useOkto();

// Login with google
await client.loginUsingSocial('google');
```

### Session Management

```jsx
const client = useOkto();

// Check authentication status
const isLoggedIn = client.isLoggedIn();

// Clear session and storage
client.sessionClear();
```

## Error Handling

```jsx
import { RpcError } from '@okto_web3/core-js-sdk/errors';

try {
  await authenticate();
} catch (error) {
  if (error instanceof RpcError) {
    console.error('RPC Error:', error.message);
  } else {
    console.error('Authentication Error:', error);
  }
}
```

## Security

- Secure session storage
- Origin validation for WebView messages
- Typed error handling

## Documentation

For detailed documentation, visit:

- [React SDK Documentation](https://docs.okto.tech/docs/react-sdk)
- [Core SDK Documentation](https://docs.okto.tech/docs/typescript-sdk)
