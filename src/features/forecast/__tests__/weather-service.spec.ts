import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  getWeatherIcon, 
  getWeatherDescription, 
  getWindDirection, 
  getUvIndexDetails,
  getAirQualityDetails,
  getWeatherRecommendation,
  getMoonPhase,
  getWeather
} from '../services/weather-service';
import { weatherApiClient } from '../api/weather-api-client';

// Mock del cliente API
vi.mock('../api/weather-api-client', () => ({
  weatherApiClient: {
    get: vi.fn()
  }
}));

describe('weather-service', () => {
  describe('getWeatherIcon', () => {
    it('devuelve el icono correcto para un código conocido', () => {
      expect(getWeatherIcon(0)).toBe('mdi-weather-sunny');
      expect(getWeatherIcon(3)).toBe('mdi-weather-cloudy');
      expect(getWeatherIcon(95)).toBe('mdi-weather-lightning');
    });

    it('devuelve un icono por defecto para un código desconocido', () => {
      expect(getWeatherIcon(9999)).toBe('mdi-weather-cloudy');
    });
  });

  describe('getWeatherDescription', () => {
    it('devuelve la descripción correcta para un código conocido', () => {
      expect(getWeatherDescription(0)).toBe('Cielo despejado');
      expect(getWeatherDescription(45)).toBe('Niebla');
      expect(getWeatherDescription(65)).toBe('Lluvia intensa');
    });

    it('devuelve una descripción por defecto para un código desconocido', () => {
      expect(getWeatherDescription(9999)).toBe('Parcialmente nublado');
    });
  });

  describe('getWindDirection', () => {
    it('convierte grados a direcciones cardinales correctamente', () => {
      expect(getWindDirection(0)).toBe('N');
      expect(getWindDirection(45)).toBe('NE');
      expect(getWindDirection(90)).toBe('E');
      expect(getWindDirection(135)).toBe('SE');
      expect(getWindDirection(180)).toBe('S');
      expect(getWindDirection(225)).toBe('SO');
      expect(getWindDirection(270)).toBe('O');
      expect(getWindDirection(315)).toBe('NO');
    });

    it('maneja valores extremos correctamente', () => {
      expect(getWindDirection(360)).toBe('N');  // 360 debería ser igual a 0 (Norte)
      expect(getWindDirection(450)).toBe('E'); // 450 = 90 + 360, debería ser E
    });
  });

  describe('getUvIndexDetails', () => {
    it('devuelve detalles correctos para índice UV bajo', () => {
      const result = getUvIndexDetails(2);
      expect(result.label).toBe('Bajo');
      expect(result.color).toBe('success');
      expect(result.description).toContain('mínima');
    });

    it('devuelve detalles correctos para índice UV moderado', () => {
      const result = getUvIndexDetails(4);
      expect(result.label).toBe('Moderado');
      expect(result.color).toBe('warning');
    });

    it('devuelve detalles correctos para índice UV alto', () => {
      const result = getUvIndexDetails(7);
      expect(result.label).toBe('Alto');
      expect(result.color).toBe('orange');
    });

    it('devuelve detalles correctos para índice UV extremo', () => {
      const result = getUvIndexDetails(10);
      expect(result.label).toBe('Extremo');
      expect(result.color).toBe('error');
      expect(result.description).toContain('Evite exposición');
    });
  });

  describe('getAirQualityDetails', () => {
    it('devuelve detalles correctos para calidad del aire buena', () => {
      const result = getAirQualityDetails(30);
      expect(result.label).toBe('Buena');
      expect(result.color).toBe('success');
    });

    it('devuelve detalles correctos para calidad del aire moderada', () => {
      const result = getAirQualityDetails(75);
      expect(result.label).toBe('Moderada');
      expect(result.color).toBe('warning');
    });

    it('devuelve detalles correctos para calidad del aire insalubre para grupos sensibles', () => {
      const result = getAirQualityDetails(120);
      expect(result.label).toBe('Insalubre para grupos sensibles');
      expect(result.color).toBe('orange');
    });

    it('devuelve detalles correctos para calidad del aire insalubre', () => {
      const result = getAirQualityDetails(160);
      expect(result.label).toBe('Insalubre');
      expect(result.color).toBe('error');
    });
  });

  describe('getWeatherRecommendation', () => {
    it('devuelve recomendación apropiada para tormenta', () => {
      const result = getWeatherRecommendation(95, 20, 80, 5);
      expect(result.title).toBe('Tormenta');
      expect(result.description).toContain('Evita salir');
    });

    it('devuelve recomendación apropiada para lluvia', () => {
      const result = getWeatherRecommendation(61, 18, 70, 3);
      expect(result.title).toBe('Lluvia');
      expect(result.description).toContain('paraguas');
      expect(result.description).toContain('70%');
    });

    it('devuelve recomendación apropiada para nieve', () => {
      const result = getWeatherRecommendation(73, 0, 10, 1);
      expect(result.title).toBe('Nieve');
      expect(result.description).toContain('Abrígate');
    });

    it('prioriza temperatura extremadamente fría', () => {
      const result = getWeatherRecommendation(0, 2, 0, 1);
      expect(result.title).toBe('Frío intenso');
    });

    it('prioriza temperatura extremadamente caliente', () => {
      const result = getWeatherRecommendation(0, 35, 0, 9);
      expect(result.title).toBe('Calor extremo');
      expect(result.description).toContain('UV: 9');
    });
  });

  describe('getMoonPhase', () => {
    it('devuelve la fase lunar correcta basada en el valor numérico', () => {
      expect(getMoonPhase(0)).toBe('Luna nueva');
      expect(getMoonPhase(0.25)).toBe('Cuarto creciente');
      expect(getMoonPhase(0.5)).toBe('Luna llena');
      expect(getMoonPhase(0.75)).toBe('Cuarto menguante');
    });

    it('maneja valores aproximados correctamente', () => {
      expect(getMoonPhase(0.48)).toBe('Luna llena');
      expect(getMoonPhase(0.12)).toBe('Luna creciente');
    });

    it('devuelve un valor por defecto para valores fuera de rango', () => {
      expect(getMoonPhase(1.2)).toBe('Luna llena');
      expect(getMoonPhase(-0.1)).toBe('Luna llena');
    });
  });

  describe('getWeather', () => {
    beforeEach(() => {
      vi.resetAllMocks();
    });

    it('llama a la API con los parámetros correctos', async () => {
      // Mock de la respuesta
      const mockResponse = { 
        hourly: {}, 
        daily: {},
        utc_offset_seconds: 0
      };
      (weatherApiClient.get as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

      // Ejecutar la función
      const result = await getWeather(37.4219, -122.0841);
      
      // Verificar que la API fue llamada con los parámetros correctos
      expect(weatherApiClient.get).toHaveBeenCalledWith('/forecast', {
        latitude: '37.4219',
        longitude: '-122.0841',
        timezone: 'auto',
        hourly: expect.any(String),
        daily: expect.any(String),
        current_weather: 'true',
        forecast_days: '7'
      });

      // Verificar el resultado
      expect(result).toEqual(mockResponse);
    });

    it('maneja errores correctamente', async () => {
      // Mock del error
      (weatherApiClient.get as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('API Error'));

      // Verificar que se lanza el error
      await expect(getWeather(37.4219, -122.0841)).rejects.toThrow('Error al obtener datos meteorológicos');
    });
  });
});