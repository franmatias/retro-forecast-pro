/**
 * Constantes para el módulo de ubicaciones
 */

export const API_ENDPOINTS = {
    NOMINATIM_SEARCH: 'https://nominatim.openstreetmap.org/search',
    NOMINATIM_REVERSE: 'https://nominatim.openstreetmap.org/reverse',
};

export const MAP_CONFIG = {
    DEFAULT_CENTER: [37.3886303, -2.3384884] as [number, number],
    DEFAULT_ZOOM: 13,
    TILE_LAYER: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    ATTRIBUTION: '© OpenStreetMap contributors',
};

export const API_HEADERS = {
    'Accept-Language': 'es',
    'User-Agent': 'RetroForecastApp/1.0',
};
