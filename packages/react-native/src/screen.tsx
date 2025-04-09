import { SafeAreaView } from "react-native";
import {WebView} from "react-native-webview";

interface WebViewScreenProps {
  url: string;
}


export const WebViewScreen = ({ url }: WebViewScreenProps) => {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <WebView  
        source={{ uri: url }}
        startInLoadingState={true}
        javaScriptEnabled={true}
      />
    // </SafeAreaView>
  );
};
