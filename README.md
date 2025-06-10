# Okto SDK JS Monorepo

This is an official monorepo for the Okto SDK JS.

A comprehensive Web3 SDK for seamless blockchain integration with **React** and **React Native** applications.

## Packages

| Package                                                          | Version                                                                                                                           | Description                                   |
| ---------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------- |
| [@okto_web3/core-js-sdk](./packages/core-js/README.md)           | [![npm](https://img.shields.io/npm/v/@okto_web3/core-js-sdk.svg)](https://www.npmjs.com/package/@okto_web3/core-js-sdk)           | Core JavaScript SDK with Web3 utilities       |
| [@okto_web3/react-sdk](./packages/react/README.md)               | [![npm](https://img.shields.io/npm/v/@okto_web3/react-sdk.svg)](https://www.npmjs.com/package/@okto_web3/react-sdk)               | React wrapper with hooks and components       |
| [@okto_web3/react-native-sdk](./packages/react-native/README.md) | [![npm](https://img.shields.io/npm/v/@okto_web3/react-native-sdk.svg)](https://www.npmjs.com/package/@okto_web3/react-native-sdk) | React Native wrapper with native integrations |

## Development

```bash

# Clone the repository
git clone https://github.com/okto-hq/okto-js-sdk-monorepo.git
cd packages

# Install dependencies
pnpm install

# Build all packages
pnpm run build

```

## Quick Start

```bash
# Install the package you need
npm install @okto_web3/core-js-sdk
npm install @okto_web3/react-sdk
npm install @okto_web3/react-native-sdk
```

---

## Architecture

```
├── packages/
│   ├── core-js/          # Core SDK
│   ├── react/            # React wrapper
│   └── react-native/     # React Native wrapper
```

---

## Features

### Authentication

- Multi-channel authentication (OAuth, Email, WhatsApp)
- Social login integration (Google, Facebook, Twitter)
- JWT-based secure sessions

### Blockchain Operations

- NFT transfers and minting
- Token operations
- Smart contract interactions
- EIP-4337 account abstraction

### Portfolio Management

- Multi-chain account management
- Transaction history
- NFT collections
- Token balances

### Cross-Platform Support

- Web applications (React)
- Mobile apps (React Native)
- Consistent API across platforms

---

---

## Documentation

- [Core SDK Documentation](https://docs.okto.tech/docs/typescript-sdk)
- [React SDK Documentation](https://docs.okto.tech/docs/react-sdk)
- [React Native SDK Documentation](https://docs.okto.tech/docs/react-native-sdk)

---
