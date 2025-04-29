import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useWeatherData } from '../composables/useWeatherData';
import * as weatherService from '../../../services/weather';
import * as geocodingService from '../../../services/geocoding';

// Mock de los servicios
vi.mock('../../../services/weather', () => ({
  getWeather: vi.fn(),
  getWeatherIcon: vi.fn().mockReturnValue('mdi-weather-sunny'),
  getWeatherDescription: vi.fn().mockReturnValue('Cielo despejado'),
  getWindDirection: vi.fn().mockReturnValue('N'),
  getUvIndexDetails: vi.fn().mockReturnValue({ color: 'success', description: 'Bajo' }),
  getAirQualityDetails: vi.fn().mockReturnValue({ label: 'Buena', color: 'success', description: 'Óptima' }),
  getMoonPhase: vi.fn().mockReturnValue('Luna llena'),
  getWeatherRecommendation: vi.fn().mockReturnValue({ title: 'Agradable', description: 'Disfruta del buen tiempo' })
}));

vi.mock('../../../services/geocoding', () => ({
  getLocationDetails: vi.fn().mockResolvedValue({
    name: 'Madrid',
    country: 'España',
    admin1: 'Comunidad de Madrid',
    elevation: 650,
    population: 3000000,
    timezone: 'Europe/Madrid'
  })
}));

describe('useWeatherData', () => {
  // Usemos un mock más completo para incluir 24 horas
  const mockWeatherData = {
    hourly: {
      time: [
        '2025-04-29T00:00:00', '2025-04-29T01:00:00', '2025-04-29T02:00:00', '2025-04-29T03:00:00',
        '2025-04-29T04:00:00', '2025-04-29T05:00:00', '2025-04-29T06:00:00', '2025-04-29T07:00:00',
        '2025-04-29T08:00:00', '2025-04-29T09:00:00', '2025-04-29T10:00:00', '2025-04-29T11:00:00',
        '2025-04-29T12:00:00', '2025-04-29T13:00:00', '2025-04-29T14:00:00', '2025-04-29T15:00:00',
        '2025-04-29T16:00:00', '2025-04-29T17:00:00', '2025-04-29T18:00:00', '2025-04-29T19:00:00',
        '2025-04-29T20:00:00', '2025-04-29T21:00:00', '2025-04-29T22:00:00', '2025-04-29T23:00:00'
      ],
      temperature_2m: [
        15, 14, 13, 12, 11, 10, 11, 12, 14, 16, 18, 19, 20, 21, 22, 21, 20, 19, 18, 17, 16, 15, 14, 13
      ],
      apparent_temperature: [
        14, 13, 12, 11, 10, 9, 10, 11, 13, 15, 17, 18, 19, 20, 21, 20, 19, 18, 17, 16, 15, 14, 13, 12
      ],
      relative_humidity_2m: [
        70, 75, 80, 85, 85, 90, 85, 80, 75, 70, 65, 60, 60, 55, 50, 55, 60, 65, 70, 75, 80, 80, 85, 85
      ],
      wind_speed_10m: [
        5, 5, 4, 4, 3, 3, 4, 5, 6, 7, 8, 9, 10, 10, 11, 10, 9, 8, 7, 6, 5, 5, 4, 4
      ],
      wind_direction_10m: [
        170, 175, 180, 185, 190, 195, 190, 185, 180, 175, 170, 175, 180, 185, 190, 185, 180, 175, 170, 175, 180, 185, 190, 185
      ],
      precipitation_probability: [
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
      ],
      surface_pressure: [
        1020, 1019, 1018, 1017, 1016, 1015, 1016, 1017, 1018, 1019, 1020, 1018, 1015, 1014, 1013, 1014, 1015, 1016, 1017, 1018, 1019, 1020, 1021, 1022
      ],
      weather_code: [
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
      ],
      visibility: [
        10000, 10000, 10000, 10000, 9000, 9000, 9000, 10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000
      ],
      dew_point_2m: [
        10, 9, 8, 7, 6, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5
      ],
      uv_index: [
        0, 0, 0, 0, 0, 1, 2, 3, 4, 5, 6, 7, 5, 4, 3, 2, 1, 0, 0, 0, 0, 0, 0, 0
      ],
      air_quality_index: [
        20, 20, 21, 22, 23, 24, 25, 25, 24, 23, 22, 21, 20, 20, 21, 22, 23, 24, 25, 25, 24, 23, 22, 21
      ],
      cloud_cover: [
        10, 10, 15, 15, 20, 20, 15, 15, 10, 10, 5, 5, 10, 10, 15, 15, 20, 20, 15, 15, 10, 10, 5, 5
      ]
    },
    daily: {
      time: ['2025-04-29', '2025-04-30', '2025-05-01'],
      temperature_2m_max: [25, 24, 23],
      temperature_2m_min: [15, 14, 13],
      weather_code: [0, 1, 2],
      precipitation_sum: [0, 2, 5],
      wind_speed_10m_max: [15, 18, 20],
      sunrise: ['2025-04-29T06:00:00', '2025-04-30T06:01:00', '2025-05-01T06:02:00'],
      sunset: ['2025-04-29T19:00:00', '2025-04-30T19:01:00', '2025-05-01T19:02:00'],
      moon_phase: [0.5, 0.55, 0.6]
    },
    utc_offset_seconds: 7200
  };

  beforeEach(() => {
    vi.resetAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-04-29T12:00:00Z'));
    
    // Configurar el mock de getWeather para que devuelva los datos simulados
    (weatherService.getWeather as ReturnType<typeof vi.fn>).mockResolvedValue(mockWeatherData);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('inicializa con estados por defecto', () => {
    const { weatherData, isLoading } = useWeatherData();
    
    expect(weatherData.value).toBe(null);
    expect(isLoading.value).toBe(false);
  });

  it('carga datos meteorológicos correctamente', async () => {
    const { loadWeatherData, weatherData, isLoading } = useWeatherData();
    
    expect(isLoading.value).toBe(false);
    
    // Crear una promesa que se resolverá cuando loadWeatherData termine
    const loadPromise = loadWeatherData({ 
      latitude: 40.4168, 
      longitude: -3.7038, 
      name: 'Madrid', 
      country: 'España' 
    });
    
    expect(isLoading.value).toBe(true);
    
    // Esperar a que se complete la carga
    await loadPromise;
    
    expect(isLoading.value).toBe(false);
    expect(weatherData.value).toEqual(mockWeatherData);
    expect(weatherService.getWeather).toHaveBeenCalledWith(40.4168, -3.7038);
    expect(geocodingService.getLocationDetails).toHaveBeenCalledWith('Madrid');
  });

  it('calcula correctamente los valores computados', async () => {
    const { 
      loadWeatherData, 
      currentTemp, 
      currentHumidity, 
      currentWind,
      isDaytime
    } = useWeatherData();
    
    // Cargar datos meteorológicos
    await loadWeatherData({ 
      latitude: 40.4168, 
      longitude: -3.7038, 
      name: 'Madrid', 
      country: 'España' 
    });
    
    // Comprobar que los valores calculados son correctos basados en los datos mock
    // A las 12:00, debería usar los valores del índice 12
    expect(currentTemp.value).toBe(20);
    expect(currentHumidity.value).toBe(60);
    expect(currentWind.value).toBe(10);
    
    // Verificar que isDaytime devuelve true (porque nuestra hora simulada es 12:00)
    expect(isDaytime.value).toBe(true);
  });

  it('genera pronósticos diarios correctamente', async () => {
    const { loadWeatherData, forecasts } = useWeatherData();
    
    await loadWeatherData({ 
      latitude: 40.4168, 
      longitude: -3.7038, 
      name: 'Madrid', 
      country: 'España' 
    });
    
    expect(forecasts.value.length).toBe(3);
    expect(forecasts.value[0].day).toBe('2025-04-29');
    expect(forecasts.value[0].temp).toBe(25);
    expect(forecasts.value[0].tempMin).toBe(15);
    expect(forecasts.value[0].rain).toBe(0);
    expect(forecasts.value[0].wind).toBe(15);
  });

  it('gestiona errores durante la carga de datos', async () => {
    const errorMock = new Error('Error de API');
    (weatherService.getWeather as ReturnType<typeof vi.fn>).mockRejectedValue(errorMock);
    
    const { loadWeatherData, isLoading } = useWeatherData();
    
    // Intentar cargar los datos, debería manejar el error internamente
    await loadWeatherData({ 
      latitude: 40.4168, 
      longitude: -3.7038, 
      name: 'Madrid', 
      country: 'España' 
    });
    
    // Verificar que isLoading vuelve a false aunque haya un error
    expect(isLoading.value).toBe(false);
  });
});