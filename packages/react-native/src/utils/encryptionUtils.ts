import CryptoJS from 'crypto-js';

const SECRET_KEY =
  'c9ff51b70e544e6442c661596ee2ad2659befe58a30eb6400c0ddf408ea7bf1d'; /// TODO : add it in .env file

export const encryptData = (data: any): string => {
  try {
    const encrypted = CryptoJS.AES.encrypt(
      JSON.stringify(data),
      SECRET_KEY,
    ).toString();
    return encrypted;
  } catch (error) {
    console.error('Encryption error:', error);
    return '';
  }
};

export const decryptData = <T>(encryptedData: string): T | undefined => {
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedData, SECRET_KEY);
    const decryptedString = bytes.toString(CryptoJS.enc.Utf8);
    return decryptedString ? JSON.parse(decryptedString) : undefined;
  } catch (error) {
    console.error('Decryption error:', error);
    return undefined;
  }
};
