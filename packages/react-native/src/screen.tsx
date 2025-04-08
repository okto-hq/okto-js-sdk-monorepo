import React from 'react';
import { View, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';

const INTERNAL_WEBVIEW_URL = 'https://www.google.com/';
const CustomWebView = WebView as unknown as React.ComponentType<any>;


export const WebviewScreen = () => {
  return (
    <View style={styles.container}>
      <CustomWebView source={{ uri: INTERNAL_WEBVIEW_URL }}/>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
