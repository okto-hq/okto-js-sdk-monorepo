
export const openWebView = (
  url: string, 
  navigation: any,
): void => {
  navigation.navigate('WebViewScreen', { url });
};