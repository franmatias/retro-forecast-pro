import { weatherApiClient } from '../api/weather-api-client';
// Eliminar importaciones no utilizadas y mantener solo las necesarias
import type { WeatherData, WeatherRecommendation } from '../models/domain-types';
import { WEATHER_ICONS, WEATHER_DESCRIPTIONS } from '../config/constants';

/**
 * Obtiene datos meteorológicos para una ubicación
 */
export async function getWeather(
    latitude: number,
    longitude: number
): Promise<WeatherData> {
    try {
        const params = {
            latitude: latitude.toString(),
            longitude: longitude.toString(),
            timezone: 'auto',
            hourly: 'temperature_2m,apparent_temperature,precipitation_probability,relative_humidity_2m,surface_pressure,wind_speed_10m,wind_direction_10m,weather_code,visibility,uv_index,dew_point_2m,cloud_cover,air_quality_index',
            daily: 'temperature_2m_max,temperature_2m_min,weather_code,sunrise,sunset,precipitation_sum,wind_speed_10m_max,moon_phase',
            current_weather: 'true',
            forecast_days: '7'
        };

        return await weatherApiClient.get<WeatherData>('/forecast', params);
    } catch (error) {
        console.error('Error obteniendo datos meteorológicos:', error);
        throw new Error('Error al obtener datos meteorológicos');
    }
}

/**
 * Obtiene el icono correspondiente a un código meteorológico
 */
export function getWeatherIcon(code: number): string {
    return WEATHER_ICONS[code] || 'mdi-weather-cloudy';
}

/**
 * Obtiene la descripción de un código meteorológico
 */
export function getWeatherDescription(code: number): string {
    return WEATHER_DESCRIPTIONS[code] || 'Parcialmente nublado';
}

/**
 * Obtiene la dirección del viento a partir de grados
 */
export function getWindDirection(degrees: number): string {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO'];
    const index = Math.round(degrees / 45) % 8;
    return directions[index];
}

/**
 * Obtiene detalles del índice UV 
 */
export function getUvIndexDetails(index: number): { label: string; color: string; description: string } {
    // Implementar lógica usando el parámetro index
    let label = 'Moderado';
    let color = 'warning';
    let description = 'Protección solar recomendada';

    if (index <= 2) {
        label = 'Bajo';
        color = 'success';
        description = 'Protección solar mínima requerida';
    } else if (index > 5 && index <= 7) {
        label = 'Alto';
        color = 'orange';
        description = 'Protección solar necesaria';
    } else if (index > 7) {
        label = 'Extremo';
        color = 'error';
        description = 'Evite exposición prolongada al sol';
    }

    return { label, color, description };
}

/**
 * Obtiene detalles de calidad del aire
 */
export function getAirQualityDetails(index: number): { label: string; color: string; description: string } {
    // Implementar lógica usando el parámetro index
    let label = 'Buena';
    let color = 'success';
    let description = 'Calidad del aire óptima';

    if (index <= 50) {
        // Valores predeterminados ya establecidos
    } else if (index > 50 && index <= 100) {
        label = 'Moderada';
        color = 'warning';
        description = 'Calidad del aire aceptable';
    } else if (index > 100 && index <= 150) {
        label = 'Insalubre para grupos sensibles';
        color = 'orange';
        description = 'Personas sensibles deben limitar exposición';
    } else if (index > 150) {
        label = 'Insalubre';
        color = 'error';
        description = 'Todo el mundo debe limitar la exposición';
    }

    return { label, color, description };
}

/**
 * Genera recomendaciones basadas en condiciones meteorológicas
 */
export function getWeatherRecommendation(
    weatherCode: number,
    temperature: number,
    rainProbability: number,
    uvIndex: number
): WeatherRecommendation {
    // Usar los parámetros en la lógica
    let title = 'Tiempo agradable';
    let description = 'Disfruta del buen tiempo';

    // Determinar recomendación por código de clima
    if ([95, 96, 99].includes(weatherCode)) {
        title = 'Tormenta';
        description = 'Evita salir si no es necesario';
    } else if ([51, 53, 55, 61, 63, 65].includes(weatherCode)) {
        title = 'Lluvia';
        description = `Probabilidad de lluvia: ${rainProbability}%. Lleva paraguas.`;
    } else if ([71, 73, 75].includes(weatherCode)) {
        title = 'Nieve';
        description = 'Abrígate bien y ten precaución al conducir';
    }

    // Ajustar por temperatura
    if (temperature < 5) {
        title = 'Frío intenso';
        description = 'Abrígate muy bien, temperaturas muy bajas';
    } else if (temperature > 30) {
        title = 'Calor extremo';
        description = `Protección solar recomendada (UV: ${uvIndex}). Hidratarse frecuentemente.`;
    }

    return { title, description };
}

/**
 * Obtiene la fase lunar basada en valor numérico
 */
export function getMoonPhase(phase: number): string {
    const phases = [
        'Luna nueva', 'Luna creciente', 'Cuarto creciente',
        'Luna gibosa creciente', 'Luna llena', 'Luna gibosa menguante',
        'Cuarto menguante', 'Luna menguante'
    ];

    const index = Math.round(phase * 7);
    return phases[index] || 'Luna llena';
}
