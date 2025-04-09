import { createNavigationContainerRef } from '@react-navigation/native';

type RootStackParamList = {
  WebViewScreen: { url: string };
};

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

export function navigate<RouteName extends keyof RootStackParamList>(
  name: RouteName,
  params?: RootStackParamList[RouteName]
) {
  console.log("karan is here in navigation1");
  if (navigationRef.isReady()) {
    console.log("karan is here in navigation2");
    navigationRef.navigate(name,params);
  }
}