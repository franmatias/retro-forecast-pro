import type { 
  ApiPrecipitationResponse, 
  LocationPrecipitationData, 
  PrecipitationDailyData,
  PrecipitationMonthlyData,
  PrecipitationSummary,
  StoredLocationItem
} from '../models'

// URL base de la API de Open-Meteo
const API_BASE_URL = 'https://archive-api.open-meteo.com'

/**
 * Servicio para obtener datos históricos de precipitación desde la API de Open-Meteo
 */
export class PrecipitationService {
  private readonly CACHE_KEY_PREFIX = 'retro-forecast-precipitation-'
  private readonly HISTORICAL_CACHE_KEY_PREFIX = 'retro-forecast-historical-precipitation-'
  
  /**
   * Obtiene datos históricos de precipitación para una ubicación y rango de fechas específico
   */
  async getPrecipitationData(
    location: StoredLocationItem, 
    startDate: string, 
    endDate: string,
    useCache = true
  ): Promise<LocationPrecipitationData> {
    // Intentar obtener desde caché si está habilitado
    const cacheKey = this.getCacheKey(location, startDate, endDate)
    if (useCache) {
      const cachedData = this.getFromCache(cacheKey)
      if (cachedData) {
        console.log('Obteniendo datos de precipitación desde caché:', cacheKey)
        return cachedData
      }
    }

    // Obtener datos de la API
    try {
      const apiData = await this.fetchPrecipitationData(location, startDate, endDate)
      const processedData = this.processApiData(apiData, location)
      
      // Guardar en caché
      this.saveToCache(cacheKey, processedData)
      
      return processedData
    } catch (error) {
      console.error('Error obteniendo datos de precipitación:', error)
      throw new Error(`Error al obtener datos de precipitación para ${location.name}: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  /**
   * Obtiene datos históricos de precipitación para el periodo de referencia climatológico
   */
  async getHistoricalData(
    location: StoredLocationItem,
    startYear = 1991,
    endYear = 2020,
    useCache = true
  ): Promise<LocationPrecipitationData> {
    const cacheKey = this.getHistoricalCacheKey(location, startYear, endYear)
    
    // Intentar obtener desde caché si está habilitado
    if (useCache) {
      const cachedData = this.getFromCache(cacheKey)
      if (cachedData) {
        console.log('Obteniendo datos históricos de precipitación desde caché:', cacheKey)
        return cachedData
      }
    }

    // Si no hay datos en caché, obtenerlos de la API
    try {
      // Construimos las fechas para el periodo de referencia completo
      const startDate = `${startYear}-01-01`
      const endDate = `${endYear}-12-31`

      const apiData = await this.fetchPrecipitationData(location, startDate, endDate)
      const processedData = this.processApiData(apiData, location)
      
      // Guardar en caché
      this.saveToCache(cacheKey, processedData)
      
      return processedData
    } catch (error) {
      console.error('Error obteniendo datos históricos de precipitación:', error)
      throw new Error(`Error al obtener datos históricos de precipitación para ${location.name}: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  /**
   * Calcula la media histórica mensual de precipitación para cada mes del año
   */
  calculateMonthlyHistoricalAverages(historicalData: LocationPrecipitationData): Record<string, number> {
    const monthlyPrecipitation: Record<string, number[]> = {}
    const monthlyDays: Record<string, number> = {}

    // Agrupar precipitación por mes
    for (const item of historicalData.dailyData) {
      const month = item.date.substring(5, 7) // formato MM del ISO date YYYY-MM-DD
      if (!monthlyPrecipitation[month]) {
        monthlyPrecipitation[month] = []
        monthlyDays[month] = 0
      }
      monthlyPrecipitation[month].push(item.precipitation)
      monthlyDays[month]++
    }

    // Calcular media mensual
    const monthlyAverages: Record<string, number> = {}
    for (const [month, values] of Object.entries(monthlyPrecipitation)) {
      const total = values.reduce((sum, val) => sum + val, 0)
      monthlyAverages[month] = total / monthlyDays[month]
    }

    return monthlyAverages
  }

  /**
   * Calcula la anomalía de precipitación comparando con la media histórica
   */
  calculatePrecipitationAnomaly(
    precipitationData: LocationPrecipitationData,
    historicalMonthlyAverages: Record<string, number>
  ): { anomaly: number, anomalyPercent: number, historicalAverage: number } {
    let totalHistoricalAverage = 0
    let daysCount = 0

    // Calcular la media histórica para el período específico
    for (const day of precipitationData.dailyData) {
      const month = day.date.substring(5, 7) // formato MM del ISO date YYYY-MM-DD
      const monthlyAverage = historicalMonthlyAverages[month] || 0
      totalHistoricalAverage += monthlyAverage
      daysCount++
    }

    const historicalAverage = daysCount > 0 ? totalHistoricalAverage / daysCount : 0
    const actualAverage = precipitationData.summary.averagePrecipitation
    const anomaly = actualAverage - historicalAverage
    const anomalyPercent = historicalAverage > 0 ? (anomaly / historicalAverage) * 100 : 0

    return {
      anomaly,
      anomalyPercent,
      historicalAverage
    }
  }

  /**
   * Obtiene datos históricos de precipitación desde la API de Open-Meteo
   */
  private async fetchPrecipitationData(
    location: StoredLocationItem, 
    startDate: string, 
    endDate: string
  ): Promise<ApiPrecipitationResponse> {
    // Construir la URL para la API de Open-Meteo
    const url = new URL(`${API_BASE_URL}/v1/archive`)
    
    url.searchParams.append('latitude', location.lat.toString())
    url.searchParams.append('longitude', location.lon.toString())
    url.searchParams.append('start_date', startDate)
    url.searchParams.append('end_date', endDate)
    url.searchParams.append('daily', 'precipitation_sum')
    url.searchParams.append('timezone', 'Europe/Madrid')
    
    // Realizar la petición
    const response = await fetch(url.toString())
    
    if (!response.ok) {
      throw new Error(`Error API (${response.status}): ${response.statusText}`)
    }
    
    return await response.json()
  }

  /**
   * Procesa los datos obtenidos de la API y los convierte a nuestro formato
   */
  private processApiData(
    apiData: ApiPrecipitationResponse, 
    location: StoredLocationItem
  ): LocationPrecipitationData {
    const dailyData: PrecipitationDailyData[] = []
    const monthlyData: Record<string, PrecipitationMonthlyData> = {}
    
    // Procesar datos diarios
    for (let i = 0; i < apiData.daily.time.length; i++) {
      const date = apiData.daily.time[i]
      const precipitation = apiData.daily.precipitation_sum[i] || 0
      
      dailyData.push({
        date,
        precipitation
      })
      
      // Agrupar por mes para datos mensuales
      const yearMonth = date.substring(0, 7) // YYYY-MM
      const monthNum = date.substring(5, 7) // MM
      const year = date.substring(0, 4) // YYYY
      
      if (!monthlyData[yearMonth]) {
        const date = new Date(parseInt(year), parseInt(monthNum) - 1, 1)
        const monthName = date.toLocaleDateString('es', { month: 'long', year: 'numeric' })
        
        monthlyData[yearMonth] = {
          month: yearMonth,
          monthName,
          precipitation: 0
        }
      }
      
      monthlyData[yearMonth].precipitation += precipitation
    }
    
    // Calcular estadísticas de resumen
    const precipitationValues = dailyData.map(d => d.precipitation)
    const totalPrecipitation = precipitationValues.reduce((sum, val) => sum + val, 0)
    const daysTotal = dailyData.length
    const daysWithRain = precipitationValues.filter(val => val > 0.1).length
    const maxPrecipitation = Math.max(...precipitationValues)
    const averagePrecipitation = daysTotal > 0 ? totalPrecipitation / daysTotal : 0
    
    const summary: PrecipitationSummary = {
      locationId: location.id.toString(),
      locationName: location.name,
      totalPrecipitation,
      averagePrecipitation,
      maxPrecipitation,
      daysWithRain,
      daysTotal
    }
    
    return {
      location,
      dailyData,
      monthlyData: Object.values(monthlyData),
      summary
    }
  }

  /**
   * Genera una clave única para la caché
   */
  private getCacheKey(location: StoredLocationItem, startDate: string, endDate: string): string {
    return `${this.CACHE_KEY_PREFIX}${location.id}-${startDate}-${endDate}`
  }

  /**
   * Genera una clave única para la caché de datos históricos
   */
  private getHistoricalCacheKey(location: StoredLocationItem, startYear: number, endYear: number): string {
    return `${this.HISTORICAL_CACHE_KEY_PREFIX}${location.id}-${startYear}-${endYear}`
  }

  /**
   * Obtiene datos de la caché
   */
  private getFromCache(key: string): LocationPrecipitationData | null {
    try {
      const cachedData = localStorage.getItem(key)
      if (cachedData) {
        return JSON.parse(cachedData)
      }
    } catch (error) {
      console.error('Error al obtener datos de la caché:', error)
    }
    return null
  }

  /**
   * Guarda datos en la caché
   */
  private saveToCache(key: string, data: LocationPrecipitationData): void {
    try {
      localStorage.setItem(key, JSON.stringify(data))
    } catch (error) {
      console.error('Error al guardar datos en la caché:', error)
    }
  }
}

export const precipitationService = new PrecipitationService()