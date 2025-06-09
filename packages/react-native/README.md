# @okto_web3/react-native-sdk

> React Native wrapper for Okto Web3 SDK - Native authentication and blockchain integration for mobile apps.

[![npm version](https://img.shields.io/npm/v/@okto_web3/react-native-sdk.svg)](https://www.npmjs.com/package/@okto_web3/react-native-sdk)

## 🚀 Features

- **🔐 Native Authentication**
  - Expo WebBrowser integration for secure auth flows
  - Deep linking support with custom URL schemes
  - Automatic platform-specific handling (iOS/Android)
- **🔄 Core SDK Integration**
  - Full access to `@okto_web3/core-js-sdk` features
  - Native session storage with AsyncStorage
  - React Navigation support
  - WebView support for in-app flows

## 📦 Installation

```bash
# Install core package
npm install @okto_web3/react-native-sdk

# Install required peer dependency
expo install expo-web-browser
```

## ⚡ Quick Start

```jsx
import { OktoProvider, useOkto } from '@okto_web3/react-native-sdk';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

// Configure the SDK
const config = {
  environment: 'sandbox', // or 'production'
  clientPrivateKey: 'your-private-key',
  clientSWA: 'your-client-swa',
};

const Stack = createStackNavigator();

// Wrap your app with OktoProvider
function App() {
  return (
    <NavigationContainer>
      <OktoProvider config={config}>
        <Stack.Navigator>
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="WebViewScreen" component={WebViewScreen} />
        </Stack.Navigator>
      </OktoProvider>
    </NavigationContainer>
  );
}

// Use hooks in your components
function HomeScreen() {
  const client = useOkto();
  const navigation = useNavigation();

  const handleSocialLogin = async () => {
    try {
      const result = await client.loginUsingSocial('google', {
        redirectUrl: 'your-app://auth',
      });
      console.log('Login successful:', result);
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  const handleWebViewAuth = () => {
    client.openWebView(navigation, 'your-app://auth');
  };

  return (
    <View>
      <Button title="Login with Google" onPress={handleSocialLogin} />
      <Button title="Open WebView" onPress={handleWebViewAuth} />
    </View>
  );
}
```

## 🛠️ Setup Requirements

### 1. Configure Deep Links

```json
// app.json
{
  "expo": {
    "scheme": "your-app",
    "web": {
      "bundler": "metro"
    }
  }
}
```

### 2. WebView Screen Component

```jsx
import React from 'react';
import { WebView } from 'react-native-webview';

export default function WebViewScreen({ route, navigation }) {
  const { url, redirectUrl, onWebViewClose } = route.params;

  return (
    <WebView
      source={{ uri: url }}
      onNavigationStateChange={(navState) => {
        if (navState.url.startsWith(redirectUrl)) {
          navigation.goBack();
          onWebViewClose();
        }
      }}
    />
  );
}
```

## 📚 API Reference

### Social Authentication

```jsx
const client = useOkto();

// Login with supported providers
await client.loginUsingSocial('google', {
  redirectUrl: 'your-app://auth',
});
```

### WebView Authentication

```jsx
const client = useOkto();

// Open authentication WebView
client.openWebView(navigation, 'your-app://auth');
```

### Session Management

```jsx
const client = useOkto();

// Check authentication status
const isLoggedIn = client.isLoggedIn();

// Clear session and storage
client.sessionClear();
```

## 🔒 Security Features

- Deep link validation
- Platform-specific security handling
- Typed error handling

## 💻 Platform Support

- ✅ iOS
- ✅ Android
- ✅ Expo managed workflow
- ✅ Expo bare workflow

## 📖 Documentation

For detailed documentation, visit:

- [React Native SDK Documentation](https://docs.okto.tech/docs/react-native-sdk)
- [Core SDK Documentation](https://docs.okto.tech/docs/typescript-sdk)
