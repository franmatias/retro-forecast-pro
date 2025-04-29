import { defineConfig } from 'vitest/config'
import Vue from '@vitejs/plugin-vue'
import { fileURLToPath } from 'node:url'
import { mergeConfig } from 'vite'
import viteConfig from './vite.config'

export default mergeConfig(
    viteConfig,
    defineConfig({
        plugins: [Vue()],
        test: {
            globals: true,
            environment: 'happy-dom',
            include: ['**/*.{test,spec}.{js,ts,jsx,tsx}'],
            exclude: ['node_modules', 'dist', '.idea', '.git', '.cache'],
            root: fileURLToPath(new URL('./', import.meta.url)),
            setupFiles: ['./src/features/locations/__tests__/setup.ts'],
            environmentOptions: {
                happy: {
                    logs: false,
                },
            },
        },
        resolve: {
            alias: {
                '@': fileURLToPath(new URL('./src', import.meta.url)),
            }
        }
    })
)
