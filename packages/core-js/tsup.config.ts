import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'core/index': 'src/core/index.ts',
    'explorer/index': 'src/explorer/index.ts',
    'types/index': 'src/types/index.ts',
    'errors/index': 'src/errors/index.ts',
    'userop/index': 'src/userop/index.ts',
    'abstract/index': 'src/abstract/index.ts',
  },
  format: ['cjs', 'esm'],
  dts: true,
  outDir: 'dist',
  clean: true,
  splitting: false,
  sourcemap: true,
});
