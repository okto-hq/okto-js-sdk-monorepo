declare global {
  class TextEncoder {
    encode(str: string): Uint8Array;
  }
  class TextDecoder {
    decode(arr: Uint8Array): string;
  }
  function btoa(str: string): string;
  function atob(str: string): string;
  const crypto: {
    getRandomValues(arr: Uint8Array): Uint8Array;
  };
  const console: {
    error(...args: any[]): void;
  };
}
