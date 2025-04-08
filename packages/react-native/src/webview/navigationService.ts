export class NavigationHandler {
    static navigation: any;
  
    static setNavigation(navigationRef: any) {
      NavigationHandler.navigation = navigationRef;
    }
  
    static navigateToOktoWebView(url: string, initialData?: any) {
      if (!NavigationHandler.navigation) {
        console.warn("Navigation is not set yet.");
        return;
      }
      NavigationHandler.navigation.push('OktoWebView', {
        screen: 'OktoWebView',
        params: { url, initialData },
      });
    }
  }
  