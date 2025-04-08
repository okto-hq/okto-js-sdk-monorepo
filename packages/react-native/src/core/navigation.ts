// src/navigation/NavigationService.ts
import { createNavigationContainerRef } from '@react-navigation/native';

// Define your root navigation param types
type RootStackParamList = {
  WebViewScreen: { url: string };
  // Add other screens here as needed
  // ExampleScreen: { id: string };
};

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

export function navigate<RouteName extends keyof RootStackParamList>(
  name: RouteName,
  params?: RootStackParamList[RouteName]
) {
  if (navigationRef.isReady()) {
    navigationRef.navigate(name, params);
  }
}