import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'explorer/index': 'src/explorer/index.ts',
    'types/index': 'src/types/index.ts',
    'userop/index': 'src/userop/index.ts',
  },
  format: ['cjs', 'esm'],
  dts: true,
  outDir: 'dist',
  clean: true,
  external: ['react'],
  splitting: false,
  sourcemap: true,
});
