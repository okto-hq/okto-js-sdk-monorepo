// src/navigation/NavigationService.ts
import { createNavigationContainerRef } from '@react-navigation/native';

// Define your root navigation param types
export type RootStackParamList = {
  OktoWebView : { url: string };
};

// export const navigationRef = createNavigationContainerRef<RootStackParamList>();

// export function navigate<RouteName extends keyof RootStackParamList>(
//   name: RouteName,
//   params?: RootStackParamList[RouteName]
// ) {
//   if (navigationRef.isReady()) {
//     navigationRef.navigate(name, params);
//   }
// }