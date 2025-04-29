import { defineConfig } from 'vitest/config'
import Vue from '@vitejs/plugin-vue'
import { fileURLToPath } from 'node:url'

// Configuración independiente para Vitest
export default defineConfig({
    plugins: [Vue()],
    test: {
        globals: true,
        environment: 'jsdom',
        include: ['**/*.{test,spec}.{js,ts,jsx,tsx}'],
        exclude: ['node_modules', 'dist', '.idea', '.git', '.cache'],
        root: fileURLToPath(new URL('./', import.meta.url)),
        setupFiles: ['./src/features/locations/__tests__/setup.ts'],
        environmentOptions: {
            jsdom: {
                // Opciones para jsdom si son necesarias
            }
        },
        testTransformMode: {
            web: ['.[jt]sx', '.vue']
        },
        // Usar la nueva configuración recomendada en lugar de deps.inline
        deps: {
            optimizer: {
                web: {
                    include: ['vuetify']
                }
            }
        }
    },
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url)),
        }
    }
})
