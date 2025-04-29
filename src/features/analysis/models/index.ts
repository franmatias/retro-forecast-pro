export interface LocationData {
  id: string | number
  name: string
  lat: number
  lon: number
}

export interface StoredLocationItem {
  uniqueId: string
  id: string
  name: string
  location: string
  lat: number
  lon: number
}

export interface PrecipitationDailyData {
  date: string
  precipitation: number
}

export interface PrecipitationMonthlyData {
  month: string
  monthName: string
  precipitation: number
}

export interface PrecipitationSummary {
  locationId: string
  locationName: string
  totalPrecipitation: number
  averagePrecipitation: number
  maxPrecipitation: number
  daysWithRain: number
  daysTotal: number
  historicalAverage?: number
  historicalAnomaly?: number
  historicalAnomalyPercent?: number
}

export interface LocationPrecipitationData {
  location: StoredLocationItem
  dailyData: PrecipitationDailyData[]
  monthlyData: PrecipitationMonthlyData[]
  summary: PrecipitationSummary
}

export interface AnalysisOptions {
  compareWithHistorical: boolean
  historicalStartYear?: number
  historicalEndYear?: number
}

export interface ApiPrecipitationResponse {
  latitude: number
  longitude: number
  generationtime_ms: number
  utc_offset_seconds: number
  timezone: string
  timezone_abbreviation: string
  elevation: number
  daily_units: {
    time: string
    precipitation_sum: string
  }
  daily: {
    time: string[]
    precipitation_sum: number[]
  }
}

export type AnalysisAggregationType = 'daily' | 'monthly' | 'yearly'

export type ChartType = 'line' | 'bar'