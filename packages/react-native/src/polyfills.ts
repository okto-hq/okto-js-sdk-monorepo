import { decode, encode } from 'base-64';
import 'react-native-get-random-values';

// Only polyfill btoa/atob if they're not available
if (typeof btoa === 'undefined') {
  global.btoa = encode;
}
if (typeof atob === 'undefined') {
  global.atob = decode;
}
