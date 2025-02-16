export const setLocalStorage = async (key: string, value: string) => {
  try {
    localStorage.setItem(key, value);
  } catch (e) {
    console.error('Error storing in local storage ', e);
  }
};

export const getLocalStorage = async (key: string) => {
  if (typeof window === 'undefined') {
    return null;
  }
  try {
    const value = localStorage.getItem(key);
    return value;
  } catch (e) {
    console.error('Error getting data from local storage', e);
  }
  return null;
};
