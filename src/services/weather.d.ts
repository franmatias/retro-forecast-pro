export interface Location {
    name: string;
    latitude: number;
    longitude: number;
    country: string;
}
export interface WeatherData {
    hourly: {
        time: string[];
        temperature_2m: number[];
        relative_humidity_2m: number[];
        wind_speed_10m: number[];
        wind_direction_10m: number[];
        precipitation_probability: number[];
        apparent_temperature: number[];
        surface_pressure: number[];
        weather_code: number[];
        visibility: number[];
        dew_point_2m: number[];
        uv_index: number[];
        air_quality_index: number[];
        cloud_cover: number[];
    };
    daily: {
        time: string[];
        temperature_2m_max: number[];
        temperature_2m_min: number[];
        weather_code: number[];
        precipitation_sum: number[];
        wind_speed_10m_max: number[];
        sunrise: string[];
        sunset: string[];
        moon_phase: number[];
    };
    utc_offset_seconds: number;
    alerts?: WeatherAlert[];
}
export interface WeatherAlert {
    title: string;
    description: string;
    type: string;
}
export declare function searchLocations(query: string): Promise<Location[]>;
export declare const reverseGeocode: (lat: number, lon: number) => Promise<Location[]>;
export declare function getWeather(lat: number, lon: number): Promise<WeatherData>;
export declare function getWeatherIcon(code: number): string;
export declare function getWeatherDescription(code: number): string;
export declare function getWindDirection(degrees: number): string;
export declare function getUvIndexDetails(index: number): {
    color: string;
    description: string;
};
export declare function getAirQualityDetails(aqi: number): {
    color: string;
    label: string;
    description: string;
};
export declare function getMoonPhase(phase: number): string;
export declare function getWeatherRecommendation(code: number, temp: number, rain: number, uv: number): {
    title: string;
    description: string;
};
