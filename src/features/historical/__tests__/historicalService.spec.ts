import { describe, it, expect, vi, beforeEach } from 'vitest'
import axios from 'axios'
import historicalService from '../services/historicalService'
import type { StoredLocationItem } from '../models'

// Mock de axios para simular llamadas a la API
vi.mock('axios')
const mockedAxios = axios as jest.Mocked<typeof axios>

describe('historicalService', () => {
  // Datos de prueba
  const mockLocationData: StoredLocationItem = {
    id: 'madrid',
    uniqueId: 'madrid_0',
    name: 'Madrid',
    location: 'Madrid, España',
    lat: 40.416775,
    lon: -3.70379
  }
  
  const mockStartDate = '2023-01-01'
  const mockEndDate = '2023-01-07'
  const mockOriginalUniqueId = 'madrid_0'
  
  // Mock de respuesta de la API
  const mockApiResponse = {
    data: {
      daily: {
        time: ['2023-01-01', '2023-01-02', '2023-01-03'],
        temperature_2m_max: [15, 16, 17],
        temperature_2m_min: [5, 6, 7],
        precipitation_sum: [0, 2.5, 0],
        relative_humidity_2m_mean: [60, 65, 70],
        wind_speed_10m_max: [10, 15, 12],
        wind_direction_10m_dominant: [180, 220, 200],
        pressure_msl_mean: [1015, 1018, 1020],
        sunshine_duration: [7200, 3600, 5400] // Segundos
      }
    }
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('debe obtener correctamente los datos meteorológicos históricos', async () => {
    // Configurar el mock de axios para devolver datos simulados
    mockedAxios.get.mockResolvedValueOnce(mockApiResponse)

    // Llamar al servicio
    const result = await historicalService.fetchHistoricalDataForLocation(
      mockLocationData,
      mockOriginalUniqueId,
      mockStartDate,
      mockEndDate
    )

    // Verificar que axios.get se llamó con los parámetros correctos
    expect(mockedAxios.get).toHaveBeenCalledWith('https://archive-api.open-meteo.com/v1/archive', {
      params: {
        latitude: mockLocationData.lat,
        longitude: mockLocationData.lon,
        start_date: mockStartDate,
        end_date: mockEndDate,
        daily: [
          'temperature_2m_max',
          'temperature_2m_min',
          'precipitation_sum',
          'relative_humidity_2m_mean',
          'wind_speed_10m_max',
          'wind_direction_10m_dominant',
          'pressure_msl_mean',
          'sunshine_duration'
        ],
        timezone: 'auto',
        models: 'best_match'
      }
    })

    // Verificar que el resultado tiene el formato correcto
    expect(result.length).toBe(3)
    expect(result[0]).toEqual({
      date: '2023-01-01',
      locationId: mockOriginalUniqueId,
      displayName: mockLocationData.name,
      location: mockLocationData.location,
      temperature: 10, // (15 + 5) / 2
      rainfall: 0,
      humidity: 60,
      wind_speed: 10,
      wind_direction: 180,
      pressure: 1015,
      sunshine_hours: 2 // 7200 / 3600
    })
  })

  it('debe devolver un array vacío si la respuesta de la API no tiene el formato esperado', async () => {
    // Configurar el mock de axios para devolver datos incorrectos
    mockedAxios.get.mockResolvedValueOnce({ data: { other: 'format' } })

    // Llamar al servicio
    const result = await historicalService.fetchHistoricalDataForLocation(
      mockLocationData,
      mockOriginalUniqueId,
      mockStartDate,
      mockEndDate
    )

    // Verificar que se devuelve un array vacío cuando los datos están mal formateados
    expect(result).toEqual([])
  })

  it('debe manejar errores de la API correctamente', async () => {
    // Configurar el mock de axios para simular un error
    const apiError = new Error('Error de red')
    mockedAxios.get.mockRejectedValueOnce(apiError)
    
    // Verificar que el error es propagado correctamente
    await expect(
      historicalService.fetchHistoricalDataForLocation(
        mockLocationData,
        mockOriginalUniqueId,
        mockStartDate,
        mockEndDate
      )
    ).rejects.toThrow('Error de red')
  })
})