import { SafeAreaView } from 'react-native';
import { WebView } from 'react-native-webview';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from './core/navigation.js'; // adjust path

type Props = NativeStackScreenProps<RootStackParamList, 'OktoWebView'>;

export const WebViewScreen = ({ route }: Props) => {
  const { url } = route.params;

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <WebView
        source={{ uri: url }}
        // startInLoadingState={true}
        javaScriptEnabled={true}
      />
    </SafeAreaView>
  );
};
