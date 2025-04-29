import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useForecastStore } from '../stores/forecastStore';
import type { WeatherData } from '../models/domain-types';
import type { EnhancedLocation } from '../../locations/models';

describe('forecastStore', () => {
  beforeEach(() => {
    // Crear una nueva instancia de Pinia para cada test
    setActivePinia(createPinia());
  });

  it('inicializa con estados por defecto', () => {
    const store = useForecastStore();
    
    expect(store.selectedLocationId).toBe(null);
    expect(store.weatherData).toBe(null);
    expect(store.lastUpdated).toBe(null);
    expect(store.mapType).toBe('temperature_2m');
    expect(store.hasWeatherData()).toBe(false);
  });

  it('establece correctamente la ubicación seleccionada', () => {
    const store = useForecastStore();
    const mockLocation: EnhancedLocation = {
      id: 'loc-123',
      name: 'Madrid',
      location: 'Madrid, España',
      latitude: 40.4168,
      longitude: -3.7038,
      country: 'ES'
    };
    
    store.setSelectedLocation(mockLocation);
    
    expect(store.selectedLocationId).toBe('loc-123');
  });

  it('maneja la ubicación seleccionada nula', () => {
    const store = useForecastStore();
    const mockLocation: EnhancedLocation = {
      id: 'loc-123',
      name: 'Madrid',
      location: 'Madrid, España',
      latitude: 40.4168,
      longitude: -3.7038,
      country: 'ES'
    };
    
    // Establecer una ubicación
    store.setSelectedLocation(mockLocation);
    expect(store.selectedLocationId).toBe('loc-123');
    
    // Anular la ubicación
    store.setSelectedLocation(null);
    expect(store.selectedLocationId).toBe(null);
  });

  it('establece correctamente los datos meteorológicos', () => {
    const store = useForecastStore();
    const mockWeatherData: Partial<WeatherData> = {
      hourly: {
        time: ['2025-04-29T00:00:00'],
        temperature_2m: [20],
        apparent_temperature: [21],
        precipitation_probability: [10],
        relative_humidity_2m: [60],
        surface_pressure: [1015],
        wind_speed_10m: [10],
        wind_direction_10m: [180],
        weather_code: [0],
        visibility: [10000],
        dew_point_2m: [15],
        uv_index: [5],
        air_quality_index: [25],
        cloud_cover: [10]
      },
      daily: {
        time: ['2025-04-29'],
        temperature_2m_max: [25],
        temperature_2m_min: [15],
        weather_code: [0],
        precipitation_sum: [0],
        wind_speed_10m_max: [15],
        sunrise: ['2025-04-29T06:00:00'],
        sunset: ['2025-04-29T19:00:00'],
        moon_phase: [0.5]
      },
      utc_offset_seconds: 7200
    };
    
    store.setWeatherData(mockWeatherData as WeatherData);
    
    expect(store.weatherData).toEqual(mockWeatherData);
    expect(store.lastUpdated).not.toBe(null);
    expect(store.hasWeatherData()).toBe(true);
  });

  it('cambia correctamente el tipo de mapa', () => {
    const store = useForecastStore();
    
    expect(store.mapType).toBe('temperature_2m');
    
    store.setMapType('precipitation');
    expect(store.mapType).toBe('precipitation');
    
    store.setMapType('wind_speed_10m');
    expect(store.mapType).toBe('wind_speed_10m');
  });

  it('limpia correctamente los datos', () => {
    const store = useForecastStore();
    const mockWeatherData: Partial<WeatherData> = {
      hourly: { 
        time: ['2025-04-29T00:00:00'], 
        temperature_2m: [20],
        apparent_temperature: [21],
        precipitation_probability: [10],
        relative_humidity_2m: [60],
        surface_pressure: [1015],
        wind_speed_10m: [10],
        wind_direction_10m: [180],
        weather_code: [0],
        visibility: [10000],
        dew_point_2m: [15],
        uv_index: [5],
        air_quality_index: [25],
        cloud_cover: [10]
      },
      daily: { 
        time: ['2025-04-29'], 
        temperature_2m_max: [25],
        temperature_2m_min: [15],
        weather_code: [0],
        precipitation_sum: [0],
        wind_speed_10m_max: [15],
        sunrise: ['2025-04-29T06:00:00'],
        sunset: ['2025-04-29T19:00:00'],
        moon_phase: [0.5]
      },
      utc_offset_seconds: 7200
    };
    
    // Establecer datos
    store.setWeatherData(mockWeatherData as WeatherData);
    expect(store.weatherData).not.toBe(null);
    expect(store.lastUpdated).not.toBe(null);
    
    // Limpiar datos
    store.clearData();
    expect(store.weatherData).toBe(null);
    expect(store.lastUpdated).toBe(null);
    expect(store.hasWeatherData()).toBe(false);
  });
});