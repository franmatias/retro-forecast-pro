/**
 * Servicio para obtención de datos históricos del clima
 */
import axios from 'axios'
import type { HistoricalParams, WeatherData, StoredLocationItem } from '../models'

export class HistoricalService {
  /**
   * Obtiene datos históricos del clima para una ubicación específica
   */
  async fetchHistoricalDataForLocation(
    locationData: StoredLocationItem,
    originalUniqueId: string,
    startDate: string,
    endDate: string
  ): Promise<WeatherData[]> {
    const params: HistoricalParams = {
      latitude: locationData.lat,
      longitude: locationData.lon,
      start_date: startDate,
      end_date: endDate,
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

    const response = await axios.get('https://archive-api.open-meteo.com/v1/archive', { params })
    const data = response.data

    if (!data.daily?.time) {
      console.error('Formato de respuesta API inválido:', data)
      return []
    }

    return data.daily.time.map((date: string, idx: number) => ({
      date,
      locationId: originalUniqueId,
      displayName: locationData.name,
      location: locationData.location,
      temperature: (data.daily.temperature_2m_max[idx] + data.daily.temperature_2m_min[idx]) / 2,
      rainfall: data.daily.precipitation_sum[idx],
      humidity: data.daily.relative_humidity_2m_mean[idx] || 0,
      wind_speed: data.daily.wind_speed_10m_max[idx] || 0,
      wind_direction: data.daily.wind_direction_10m_dominant[idx] || 0,
      pressure: data.daily.pressure_msl_mean[idx] || 0,
      sunshine_hours: data.daily.sunshine_duration[idx] / 3600 || 0
    }))
  }
}

export default new HistoricalService()
