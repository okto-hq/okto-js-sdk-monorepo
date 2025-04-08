import { createNavigationContainerRef } from '@react-navigation/native';

export const navigationRef = createNavigationContainerRef<{ [key: string]: any }>();

export function navigate(name: string, params?: any) {
    console.log("karan is here in navigate");
    if (navigationRef.isReady()) {
        navigationRef.navigate(name, params);
    }
  }
  