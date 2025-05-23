import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'explorer/index': 'src/explorer/index.ts',
    'types/index': 'src/types/index.ts',
    'userop/index': 'src/userop/index.ts',
    'abstract/index': 'src/abstract/index.ts',
  },
  format: ['cjs', 'esm'],
  dts: true,
  outDir: 'dist',
  clean: true,
  external: ['react', 'react-native'],
  splitting: false,
  sourcemap: true,
  platform: 'neutral',
  target: 'node16',
});
