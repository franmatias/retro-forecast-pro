/**
 * Tipos relacionados con APIs externas de geolocalización
 */

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

// Resultado detallado de geocodificación
export interface GeocodingResult {
    id: number;
    name: string;
    latitude: number;
    longitude: number;
    elevation: number;
    feature_code?: string;
    country_code?: string;
    admin1_id?: number;
    admin2_id?: number;
    admin3_id?: number;
    timezone?: string;
    population?: number;
    country_id?: number;
    country: string;
    admin1: string;
    admin2?: string;
    admin3?: string;
}
