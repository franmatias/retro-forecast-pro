import axios from 'axios';
import { geoApiClient } from '../api/geo-api-client';
import type {
    NominatimSearchResult,
    NominatimReverseResponse,
    GeocodingResult,
    Location
} from '../models';
import { API_ENDPOINTS, API_HEADERS } from '../config/constants';
import { normalizeString } from '../utils/string-utils';

/**
 * Servicio para operaciones de geocodificación y búsqueda de ubicaciones
 */

/**
 * Busca ubicaciones por nombre usando la API de OpenStreetMap
 */
export async function searchLocations(query: string): Promise<NominatimSearchResult[]> {
    try {
        const response = await axios.get<NominatimSearchResult[]>(
            API_ENDPOINTS.NOMINATIM_SEARCH,
            {
                params: {
                    q: query,
                    format: 'json',
                    limit: 5,
                    addressdetails: 1,
                },
                headers: API_HEADERS
            }
        );

        return response.data;
    } catch (error) {
        console.error('Error buscando ubicaciones:', error);
        return [];
    }
}

/**
 * Busca ubicaciones usando la API de Open-Meteo (antiguo GeoService)
 */
export async function searchLocationsWithOpenMeteo(query: string): Promise<Location[]> {
    try {
        const params = {
            name: query,
            count: '5',
            language: 'es'
        };

        const response = await geoApiClient.get<{
            results: Array<{
                name: string;
                latitude: number;
                longitude: number;
                country: string;
                country_code: string;
                admin1?: string;
            }>
        }>('/search', params);

        if (!response.results || response.results.length === 0) {
            return [];
        }

        return response.results.map(result => ({
            name: result.name,
            latitude: result.latitude,
            longitude: result.longitude,
            country: result.country,
            countryCode: result.country_code,
            admin1: result.admin1
        }));
    } catch (error) {
        console.error('Error buscando ubicaciones con Open-Meteo:', error);
        return [];
    }
}

/**
 * Realiza geocodificación inversa para obtener detalles de ubicación a partir de coordenadas
 */
export async function reverseGeocode(lat: number, lon: number): Promise<NominatimReverseResponse | null> {
    try {
        const response = await axios.get<NominatimReverseResponse>(
            API_ENDPOINTS.NOMINATIM_REVERSE,
            {
                params: {
                    lat: lat,
                    lon: lon,
                    format: 'json',
                },
                headers: API_HEADERS
            }
        );

        return response.data;
    } catch (error) {
        console.error('Error en geocodificación inversa:', error);
        return null;
    }
}

/**
 * Obtiene detalles extendidos de una ubicación por nombre
 */
export async function getLocationDetails(locationName: string): Promise<GeocodingResult | null> {
    try {
        const params = {
            name: locationName,
            count: '1',
            language: 'es',
            format: 'json'
        };

        const response = await geoApiClient.get<{
            results: GeocodingResult[]
        }>('/search', params);

        if (!response.results || response.results.length === 0) {
            return null;
        }

        return response.results[0];
    } catch (error) {
        console.error('Error obteniendo detalles de ubicación:', error);

        // Devolver un objeto con valores predeterminados en caso de error
        return {
            id: 0,
            name: locationName,
            latitude: 0,
            longitude: 0,
            elevation: 0,
            country: 'España',
            admin1: 'Desconocido'
        };
    }
}

/**
 * Obtiene datos complementarios de una ciudad
 */
export interface CityData {
    name: string;
    region: string;
    province: string;
    population: number;
    elevation: number;
}

export async function getCityData(cityName: string): Promise<CityData | null> {
    const normalizedName = normalizeString(cityName);
    try {
        // En un entorno real, aquí iría una llamada a la API
        // Implementación simulada para demostración
        return {
            name: normalizedName,
            region: 'Región Simulada',
            province: 'Provincia Simulada',
            population: 50000,
            elevation: 500
        };
    } catch (error) {
        console.error('Error obteniendo datos de ciudad:', error);
        return null;
    }
}

/**
 * Determina la región aproximada a partir de coordenadas
 */
export function getRegionFromCoordinates(lat: number, lon: number): string {
    if (lat >= 36 && lat <= 38.7 && lon >= -7.5 && lon <= -1.6) {
        return 'Andalucía';
    }
    return 'España';
}
