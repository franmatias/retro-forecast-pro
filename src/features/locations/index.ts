/**
 * Punto de entrada principal para la característica de ubicaciones
 * Facilita la importación agrupada de componentes relacionados
 */

// Re-exportar todo lo necesario para usar esta característica
export * from './components';
export * from './composables';
export * from './services';
export * from './models';
export { useLocationStore } from './stores/locationStore';

// Para importación de vistas
export { default as LocationView } from './views/LocationView.vue';
