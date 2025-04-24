import { MMKV } from 'react-native-mmkv';

const storage = new MMKV();

export const setStorage = (key: string, value: string) => {
  try {
    storage.set(key, value);
  } catch (e) {
    console.error('Error storing in storage', e);
  }
};

export const getStorage = (key: string) => {
  try {
    return storage.getString(key) || null;
  } catch (e) {
    console.error('Error getting data from storage', e);
  }
  return null;
};

export const clearStorage = (key: string) => {
  try {
    storage.delete(key);
  } catch (e) {
    console.error('Error clearing storage', e);
  }
};
