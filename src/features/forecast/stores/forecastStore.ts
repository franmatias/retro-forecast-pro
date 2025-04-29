import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { EnhancedLocation } from '../../locations/models';
import type { WeatherData } from '../models/domain-types';

/**
 * Store para gestionar el estado del pronóstico meteorológico
 */
export const useForecastStore = defineStore('forecast', () => {
    // Estado
    const selectedLocationId = ref<string | null>(null);
    const weatherData = ref<WeatherData | null>(null);
    const lastUpdated = ref<Date | null>(null);
    const mapType = ref<string>('temperature_2m');

    // Getters
    const hasWeatherData = () => weatherData.value !== null;

    // Acciones
    function setSelectedLocation(location: EnhancedLocation | null): void {
        selectedLocationId.value = location ? location.id : null;
    }

    function setWeatherData(data: WeatherData | null): void {
        weatherData.value = data;
        lastUpdated.value = data ? new Date() : null;
    }

    function setMapType(type: string): void {
        mapType.value = type;
    }

    function clearData(): void {
        weatherData.value = null;
        lastUpdated.value = null;
    }

    return {
        // Estado
        selectedLocationId,
        weatherData,
        lastUpdated,
        mapType,

        // Getters
        hasWeatherData,

        // Acciones
        setSelectedLocation,
        setWeatherData,
        setMapType,
        clearData
    };
}, {
    // @ts-expect-error: El plugin pinia-plugin-persistedstate añade esta opción  
    persist: {
        paths: ['selectedLocationId', 'mapType']
    }
});
