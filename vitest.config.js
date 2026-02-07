import path from 'node:path';
import { defineConfig } from 'vitest/config';
export default defineConfig({
    resolve: {
        alias: {
            '@app': path.resolve(__dirname, 'src/app'),
            '@domain': path.resolve(__dirname, 'src/domain'),
            '@features': path.resolve(__dirname, 'src/features'),
            '@shared': path.resolve(__dirname, 'src/shared'),
        },
    },
    test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: './src/test/setup.ts',
        css: true,
        include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
        exclude: ['tests/e2e/**', 'node_modules/**'],
    },
});
