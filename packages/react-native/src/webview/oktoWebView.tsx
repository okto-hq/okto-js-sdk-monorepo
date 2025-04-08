import React, { useRef, useEffect } from 'react';
import { WebView, type  WebViewMessageEvent } from 'react-native-webview';
import { WebViewManager } from './webViewManager.js';

interface OktoWebViewProps {
  url: string;
  initialData?: any;
  onClose?: () => void;
}

export const OktoWebView = ({ url, initialData, onClose }: OktoWebViewProps) => {
  const webViewRef = useRef<WebView>(null);
  const webViewManager = useRef(new WebViewManager()).current;
  console.log("karan is here in OktoWebView");

  const handleMessage = (event: WebViewMessageEvent) => {
    webViewManager.handleWebViewMessage(event);
  };


  // useEffect(() => {
  //   webViewManager.setOnCloseCallback(onClose);
  //   return () => webViewManager.cleanup();
  // }, []);

  const TypedWebView = WebView as unknown as React.ComponentType<any>;

  console.log("checking if TypedWebView is working ");
  return (
    <TypedWebView
      ref={webViewRef}
      source={{ uri: url }}
      onMessage={handleMessage}
      injectedJavaScript={webViewManager.injectWebViewScripts()}
      javaScriptEnabled={true}
      domStorageEnabled={true}
      startInLoadingState={true}
      mixedContentMode="compatibility"
    />
  );
};