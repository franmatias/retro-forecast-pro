/**
 * Tipos del dominio para la funcionalidad de pronóstico
 */

// Información básica de ubicación
export interface Location {
    name: string;
    latitude: number;
    longitude: number;
    country: string;
    countryCode?: string;
}

// Información detallada del clima
export interface WeatherData {
    hourly: {
        time: string[];
        temperature_2m: number[];
        apparent_temperature: number[];
        precipitation_probability: number[];
        relative_humidity_2m: number[];
        surface_pressure: number[];
        wind_speed_10m: number[];
        wind_direction_10m: number[];
        weather_code: number[];
        visibility: number[];
        uv_index: number[];
        dew_point_2m: number[];
        cloud_cover: number[];
        air_quality_index: number[];
    };
    daily: {
        time: string[];
        temperature_2m_max: number[];
        temperature_2m_min: number[];
        weather_code: number[];
        sunrise: string[];
        sunset: string[];
        precipitation_sum: number[];
        wind_speed_10m_max: number[];
        moon_phase: number[];
    };
    utc_offset_seconds: number;
}

// Alerta meteorológica
export interface WeatherAlert {
    title: string;
    description: string;
    type: string;
    severity?: 'low' | 'moderate' | 'high' | 'extreme';
    start_time?: string;
    end_time?: string;
}

// Pronóstico diario simplificado
export interface Forecast {
    day: string;
    temp: number;
    tempMin: number;
    icon: string;
    color: string;
    wind: number;
    rain: number;
}

// Elemento de estadística meteorológica
export interface WeatherStat {
    color: string;
    icon: string;
    value: number;
    unit: string;
    label: string;
    subtitle?: string;
}

// Ítem recomendado basado en clima
export interface RecommendedItem {
    icon: string;
    label: string;
    color: string;
}

// Recomendación meteorológica
export interface WeatherRecommendation {
    title: string;
    description: string;
}

// Pronóstico por hora
export interface HourlyForecast {
    hour: number;
    temp: number;
    weatherCode: number;
}
