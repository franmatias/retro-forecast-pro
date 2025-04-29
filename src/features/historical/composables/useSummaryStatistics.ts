import type { WeatherData } from '../models'

export function useSummaryStatistics() {
  /**
   * Calcula el valor máximo para una propiedad específica de los datos meteorológicos
   */
  function calculateMax(data: WeatherData[], property: keyof WeatherData): number {
    if (!data.length) return 0
    
    return Math.max(...data.map(item => Number(item[property]) || 0))
  }

  /**
   * Calcula el valor mínimo para una propiedad específica de los datos meteorológicos
   */
  function calculateMin(data: WeatherData[], property: keyof WeatherData): number {
    if (!data.length) return 0
    
    return Math.min(...data.filter(item => Number(item[property]) > 0).map(item => Number(item[property]) || 0))
  }

  /**
   * Calcula el promedio para una propiedad específica de los datos meteorológicos
   */
  function calculateAverage(data: WeatherData[], property: keyof WeatherData): number {
    if (!data.length) return 0
    
    const sum = data.reduce((total, item) => total + (Number(item[property]) || 0), 0)
    return sum / data.length
  }

  /**
   * Filtra los datos por ubicación
   */
  function filterDataByLocation(data: WeatherData[], locationId: string): WeatherData[] {
    return data.filter(item => item.locationId === locationId)
  }

  /**
   * Obtiene el período de fecha más antiguo y más reciente
   */
  function getDateRange(data: WeatherData[]): { oldestDate: string; newestDate: string } {
    if (!data.length) {
      return { oldestDate: '', newestDate: '' }
    }
    
    const dates = data.map(item => new Date(item.date).getTime())
    const oldestDate = new Date(Math.min(...dates)).toISOString().split('T')[0]
    const newestDate = new Date(Math.max(...dates)).toISOString().split('T')[0]
    
    return { oldestDate, newestDate }
  }

  return {
    calculateMax,
    calculateMin,
    calculateAverage,
    filterDataByLocation,
    getDateRange
  }
}
