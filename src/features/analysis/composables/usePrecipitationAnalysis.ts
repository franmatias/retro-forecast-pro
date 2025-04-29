import { ref, computed, watch } from 'vue'
import { precipitationService } from '../services/precipitation-service'
import type { 
  AnalysisOptions, 
  LocationPrecipitationData, 
  PrecipitationSummary,
  AnalysisAggregationType,
  StoredLocationItem
} from '../models'

export function usePrecipitationAnalysis() {
  // Estado
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const selectedLocations = ref<StoredLocationItem[]>([])
  const startDate = ref<string>('')
  const endDate = ref<string>('')
  const analysisOptions = ref<AnalysisOptions>({
    compareWithHistorical: false,
    historicalStartYear: 1991,
    historicalEndYear: 2020
  })
  const precipitationData = ref<Record<string, LocationPrecipitationData>>({})
  const historicalData = ref<Record<string, LocationPrecipitationData>>({})
  const monthlyHistoricalAverages = ref<Record<string, Record<string, number>>>({})

  // Estado derivado
  const showResults = computed(() => Object.keys(precipitationData.value).length > 0)
  
  const isFormValid = computed(() => {
    if (selectedLocations.value.length === 0) return false
    if (!startDate.value || !endDate.value) return false
    
    // Validar que la fecha de fin sea posterior o igual a la fecha de inicio
    return new Date(endDate.value) >= new Date(startDate.value)
  })

  const aggregationType = computed((): AnalysisAggregationType => {
    if (!startDate.value || !endDate.value) return 'daily'
    
    const start = new Date(startDate.value)
    const end = new Date(endDate.value)
    const daysDiff = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
    
    if (daysDiff <= 90) return 'daily'
    if (daysDiff <= 730) return 'monthly'
    return 'yearly'
  })
  
  const precipitationSummary = computed((): PrecipitationSummary[] => {
    return Object.values(precipitationData.value).map(data => data.summary)
  })

  // Métodos
  const resetState = () => {
    error.value = null
    precipitationData.value = {}
  }

  const initializeDates = () => {
    const today = new Date()
    
    // Por defecto, establecer un rango de 3 meses
    const threeMonthsAgo = new Date()
    threeMonthsAgo.setMonth(today.getMonth() - 3)
    
    startDate.value = formatDateForInput(threeMonthsAgo)
    endDate.value = formatDateForInput(today)
  }

  const fetchPrecipitationData = async () => {
    if (!isFormValid.value) return
    
    isLoading.value = true
    resetState()
    
    try {
      // Obtener datos para cada ubicación seleccionada
      for (const location of selectedLocations.value) {
        const data = await precipitationService.getPrecipitationData(
          location,
          startDate.value,
          endDate.value
        )
        
        precipitationData.value[location.id.toString()] = data

        // Si se solicita comparación con datos históricos
        if (analysisOptions.value.compareWithHistorical) {
          await fetchHistoricalDataForLocation(location)
        }
      }
    } catch (err) {
      console.error('Error al obtener datos de precipitación:', err)
      error.value = err instanceof Error 
        ? err.message 
        : 'Error al obtener datos de precipitación'
    } finally {
      isLoading.value = false
    }
  }

  const fetchHistoricalDataForLocation = async (location: StoredLocationItem) => {
    try {
      // Verificar si ya tenemos datos históricos para esta ubicación
      if (historicalData.value[location.id.toString()]) {
        return
      }
      
      // Obtener datos históricos
      const startYear = analysisOptions.value.historicalStartYear || 1991
      const endYear = analysisOptions.value.historicalEndYear || 2020
      
      const data = await precipitationService.getHistoricalData(
        location,
        startYear,
        endYear
      )
      
      historicalData.value[location.id.toString()] = data
      
      // Calcular medias mensuales históricas
      const averages = precipitationService.calculateMonthlyHistoricalAverages(data)
      monthlyHistoricalAverages.value[location.id.toString()] = averages
      
      // Calcular la anomalía para los datos actuales
      if (precipitationData.value[location.id.toString()]) {
        const { anomaly, anomalyPercent, historicalAverage } = precipitationService.calculatePrecipitationAnomaly(
          precipitationData.value[location.id.toString()],
          averages
        )
        
        // Actualizar el resumen con la información de anomalía
        precipitationData.value[location.id.toString()].summary = {
          ...precipitationData.value[location.id.toString()].summary,
          historicalAverage,
          historicalAnomaly: anomaly,
          historicalAnomalyPercent: anomalyPercent
        }
      }
    } catch (err) {
      console.error(`Error al obtener datos históricos para ${location.name}:`, err)
      // No establecemos error general para no interrumpir la visualización principal
    }
  }

  // Funciones de utilidad
  const formatDateForInput = (date: Date): string => {
    return date.toISOString().split('T')[0]
  }

  const getDailyChartData = () => {
    const locationIds = Object.keys(precipitationData.value)
    if (locationIds.length === 0) return null
    
    // Usar el primer conjunto de datos para las etiquetas
    const firstLocationData = precipitationData.value[locationIds[0]]
    const labels = firstLocationData.dailyData.map(item => 
      new Date(item.date).toLocaleDateString('es', { day: 'numeric', month: 'short' })
    )
    
    // Crear un dataset para cada ubicación
    const datasets = locationIds.map((locationId, index) => {
      const data = precipitationData.value[locationId]
      return {
        label: data.location.name,
        data: data.dailyData.map(item => item.precipitation),
        fill: false,
        borderColor: getChartColor(index),
        backgroundColor: getChartColor(index, 0.2),
        tension: 0.1
      }
    })
    
    return { labels, datasets }
  }
  
  const getMonthlyChartData = () => {
    const locationIds = Object.keys(precipitationData.value)
    if (locationIds.length === 0) return null
    
    // Recopilar todos los meses únicos de todos los conjuntos de datos
    const allMonths = new Set<string>()
    locationIds.forEach(locationId => {
      precipitationData.value[locationId].monthlyData.forEach(item => {
        allMonths.add(item.month)
      })
    })
    
    // Ordenar los meses
    const sortedMonths = Array.from(allMonths).sort()
    const labels = sortedMonths.map(month => {
      const [year, monthNum] = month.split('-')
      return new Date(parseInt(year), parseInt(monthNum) - 1, 1)
        .toLocaleDateString('es', { month: 'long', year: 'numeric' })
    })
    
    // Crear un dataset para cada ubicación
    const datasets = locationIds.map((locationId, index) => {
      const data = precipitationData.value[locationId]
      const monthlyMap = new Map(
        data.monthlyData.map(item => [item.month, item.precipitation])
      )
      
      return {
        label: data.location.name,
        data: sortedMonths.map(month => monthlyMap.get(month) || 0),
        backgroundColor: getChartColor(index, 0.7),
        borderColor: getChartColor(index),
        borderWidth: 1
      }
    })
    
    return { labels, datasets }
  }

  const getChartColor = (index: number, alpha = 1) => {
    const colors = [
      `rgba(75, 192, 192, ${alpha})`,
      `rgba(255, 99, 132, ${alpha})`,
      `rgba(54, 162, 235, ${alpha})`,
      `rgba(255, 206, 86, ${alpha})`,
      `rgba(153, 102, 255, ${alpha})`,
      `rgba(255, 159, 64, ${alpha})`,
      `rgba(199, 199, 199, ${alpha})`
    ]
    return colors[index % colors.length]
  }

  // Observadores
  watch([startDate, endDate], () => {
    // Validar las fechas cuando cambien
    if (startDate.value && endDate.value) {
      const start = new Date(startDate.value)
      const end = new Date(endDate.value)
      
      if (end < start) {
        error.value = 'La fecha de fin debe ser posterior o igual a la fecha de inicio'
      } else {
        error.value = null
      }
    }
  })

  // Inicializar fechas por defecto
  initializeDates()

  return {
    // Estado
    isLoading,
    error,
    selectedLocations,
    startDate,
    endDate,
    analysisOptions,
    precipitationData,
    historicalData,
    
    // Computadas
    showResults,
    isFormValid,
    aggregationType,
    precipitationSummary,
    
    // Métodos
    fetchPrecipitationData,
    resetState,
    getDailyChartData,
    getMonthlyChartData
  }
}