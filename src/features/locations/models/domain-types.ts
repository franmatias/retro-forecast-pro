/**
 * Tipos del dominio de la aplicación para ubicaciones
 */

// Ubicación almacenada en el store
export interface StoredLocation {
    name: string;
    address: string;
    lat: number;
    lng: number;
}

// Ubicación mejorada para interfaces de usuario
export interface EnhancedLocation {
    id: string;
    name: string;
    location: string;
    latitude: number;
    longitude: number;
    country: string;
}

// Ubicación básica (resultado de búsqueda)
export interface Location {
    name: string;
    latitude: number;
    longitude: number;
    country: string;
    countryCode?: string;
    admin1?: string;
}

// Información de ubicación para mostrar
export interface LocationInfo {
    name: string;
    country: string;
    region: string;
    latitude: number;
    longitude: number;
    elevation: number;
    population: number;
}

// Re-exportación para compatibilidad con código existente
export * from './api-types';
