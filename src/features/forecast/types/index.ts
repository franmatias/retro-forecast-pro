import type { WeatherData } from '../../../services/weather'

// Re-exportamos el tipo para uso en otros módulos
export type { WeatherData }

export interface ForecastLocation {
  id: string
  name: string
  location: string
  latitude: number
  longitude: number
  country: string
}

export interface LocationInfo {
  name: string
  country: string
  region: string
  latitude: number
  longitude: number
  elevation: number
  population: number
}

export interface ForecastData {
  day: string
  temp: number
  tempMin: number
  icon: string
  color: string
  wind: number
  rain: number
}

export interface WeatherRecommendation {
  title: string
  description: string
}
