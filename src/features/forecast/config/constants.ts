/**
 * Constantes para el módulo de pronóstico
 */

export const WEATHER_ICONS: Record<number, string> = {
    0: 'mdi-weather-sunny',            // Cielo despejado
    1: 'mdi-weather-sunny',            // Principalmente despejado
    2: 'mdi-weather-partly-cloudy',    // Parcialmente nublado
    3: 'mdi-weather-cloudy',           // Nublado
    45: 'mdi-weather-fog',             // Niebla
    48: 'mdi-weather-fog',             // Niebla con escarcha
    51: 'mdi-weather-rainy',           // Llovizna ligera
    53: 'mdi-weather-rainy',           // Llovizna moderada
    55: 'mdi-weather-pouring',         // Llovizna intensa
    61: 'mdi-weather-rainy',           // Lluvia ligera
    63: 'mdi-weather-rainy',           // Lluvia moderada
    65: 'mdi-weather-pouring',         // Lluvia intensa
    71: 'mdi-weather-snowy',           // Nevada ligera
    73: 'mdi-weather-snowy',           // Nevada moderada
    75: 'mdi-weather-snowy-heavy',     // Nevada intensa
    95: 'mdi-weather-lightning',       // Tormenta
    96: 'mdi-weather-lightning-rainy', // Tormenta con granizo ligero
    99: 'mdi-weather-lightning-rainy', // Tormenta con granizo fuerte
};

export const WEATHER_DESCRIPTIONS: Record<number, string> = {
    0: 'Cielo despejado',
    1: 'Mayormente despejado',
    2: 'Parcialmente nublado',
    3: 'Nublado',
    45: 'Niebla',
    48: 'Niebla con escarcha',
    51: 'Llovizna ligera',
    53: 'Llovizna moderada',
    55: 'Llovizna intensa',
    61: 'Lluvia ligera',
    63: 'Lluvia moderada',
    65: 'Lluvia intensa',
    71: 'Nevada ligera',
    73: 'Nevada moderada',
    75: 'Nevada intensa',
    95: 'Tormenta',
    96: 'Tormenta con granizo ligero',
    99: 'Tormenta con granizo fuerte',
};

export const API_ENDPOINTS = {
    WEATHER_FORECAST: 'https://api.open-meteo.com/v1/forecast',
    WEATHER_HISTORIC: 'https://archive-api.open-meteo.com/v1/archive',
};
