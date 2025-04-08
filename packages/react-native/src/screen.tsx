// src/components/WebViewScreen/WebViewScreen.tsx
import React from 'react';
import { WebView } from 'react-native-webview';
import { SafeAreaView } from 'react-native-safe-area-context';


const CustomWebView = WebView as unknown as React.ComponentType<any>;

interface WebViewScreenProps {
  url: string;
}

export const WebViewScreen = ({ url }: WebViewScreenProps) => {
  return (
    // <SafeAreaView style={{ flex: 1 }}>
      <CustomWebView 
        source={{ uri: url }}
        startInLoadingState={true}
        javaScriptEnabled={true}
      />
    // {/* </SafeAreaView> */}
  );
};
