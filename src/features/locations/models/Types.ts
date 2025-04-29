/**
 * Tipos para información de ubicación y geocodificación
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

// Resultado detallado de geocodificación
export interface GeocodingResult {
    id: number;
    name: string;
    latitude: number;
    longitude: number;
    elevation: number;
    country: string;
    admin1: string; // región
    admin2?: string; // provincia
    population?: number;
}

// Interfaces para la API de Nominatim
export interface NominatimSearchResult {
    place_id: number;
    osm_type: string;
    osm_id: number;
    display_name: string;
    lat: string;
    lon: string;
    class: string;
    type: string;
    importance: number;
    icon?: string;
}

export interface NominatimReverseResponse {
    display_name: string;
    lat: string;
    lon: string;
    address?: {
        road?: string;
        city?: string;
        state?: string;
        country?: string;
    }
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
