/// <reference types="vitest" />
/// <reference types="@vue/test-utils" />
/// <reference types="happy-dom" />

import { afterEach, vi } from 'vitest';
import { config } from '@vue/test-utils';

// Este archivo proporciona soporte de tipos para las importaciones de vitest y Vue Test Utils

// Configuración global para Vue Test Utils
config.global.stubs = {
    'transition': false,
    'v-icon': true,
    'v-card': true,
};

// Objetos globales que no existen en entorno de prueba
if (typeof window !== 'undefined') {
    // Crear mocks para objetos de navegador
    // ResizeObserver es usado por Vuetify y necesita ser simulado
    window.ResizeObserver = vi.fn().mockImplementation(() => ({
        observe: vi.fn(),
        unobserve: vi.fn(),
        disconnect: vi.fn(),
    }));

    // Evitar warning de URL.createObjectURL
    window.URL.createObjectURL = vi.fn(() => 'mock-url');

    // Mock para matchMedia (usado por algunos componentes)
    window.matchMedia = vi.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
    }));
}

// Limpiar mocks después de cada test
afterEach(() => {
    vi.clearAllMocks();
});
