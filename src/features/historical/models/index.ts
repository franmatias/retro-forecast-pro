/**
 * Modelos e interfaces para la característica histórica
 */

export interface StoredLocationItem {
  uniqueId: string
  id: string
  name: string
  location: string
  lat: number
  lon: number
}

export interface WeatherData {
  date: string
  temperature: number
  rainfall: number
  humidity: number
  wind_speed: number
  wind_direction: number
  pressure: number
  sunshine_hours: number
  locationId: string
  displayName: string
  location: string
}

export interface HistoricalParams {
  latitude: number
  longitude: number
  start_date: string
  end_date: string
  daily: string[]
  timezone: string
  models: string
}
