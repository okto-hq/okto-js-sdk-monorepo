import { WebViewManager } from './webViewManager.js';

const webViewManager = new WebViewManager();

export const openOktoWebView = (url: string, config?: any): void => {
  webViewManager.openWebViewScreen(url, config);
};