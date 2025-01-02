/* eslint-disable @typescript-eslint/no-explicit-any */

const toCamelCase = (str: string): string => {
  return str.replace(/_([a-z])/g, (g) => g[1]!.toUpperCase());
};

const convertKeysToCamelCase = (input: any): any => {
  if (input === null || typeof input !== 'object') return input;

  if (Array.isArray(input)) {
    return input.map(convertKeysToCamelCase);
  }

  const newObj: any = {};
  Object.keys(input).forEach((key) => {
    const camelKey = toCamelCase(key);
    newObj[camelKey] = convertKeysToCamelCase(input[key]);
  });
  return newObj;
};

export { convertKeysToCamelCase };
