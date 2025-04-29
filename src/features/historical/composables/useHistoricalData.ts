import { ref } from 'vue'
import historicalService from '../services/historicalService'
import type { WeatherData } from '../models'
import { useLocations } from './useLocations'

export function useHistoricalData() {
  const loading = ref(false)
  const historicalData = ref<WeatherData[]>([])
  const error = ref('')
  const dates = ref<string[]>([])
  
  const { uniqueLocations, idMap } = useLocations()

  // Validación de parámetros de búsqueda
  function validateSearchParams(selectedLocations: string[], startDate: string, endDate: string): string {
    if (!selectedLocations.length || !startDate || !endDate) {
      return 'Faltan datos requeridos para la búsqueda'
    }
  
    const today = new Date()
    const start = new Date(startDate)
    const end = new Date(endDate)
  
    if (start > today || end > today) {
      return 'No se pueden seleccionar fechas futuras'
    }
  
    if (start > end) {
      return 'La fecha de inicio no puede ser posterior a la fecha final'
    }
    
    return ''
  }

  // Obtención de datos históricos
  async function fetchHistoricalData(selectedLocations: string[], startDate: string, endDate: string) {
    console.log('Iniciando fetchHistoricalData')
  
    const validationError = validateSearchParams(selectedLocations, startDate, endDate)
    if (validationError) {
      error.value = validationError
      return
    }
  
    error.value = ''
    loading.value = true
    try {
      // Procesar IDs de ubicación
      const processedLocationIds = selectedLocations.map(locId => {    
        let originalId = locId
        if (typeof locId === 'string' && locId.includes('_')) {   
          originalId = idMap.value.get(locId) || locId
        }
        return originalId
      })
      
      // Obtener datos para cada ubicación
      const promises = processedLocationIds.map(async (locationId, index) => {
        const originalUniqueId = selectedLocations[index]
        
        const locationData = uniqueLocations.value.find(l => l.id === locationId)
        if (!locationData) {
          console.warn('No se encontró la ubicación con ID:', locationId)
          return []
        }
  
        try {
          return await historicalService.fetchHistoricalDataForLocation(
            locationData, 
            originalUniqueId, 
            startDate, 
            endDate
          )
        } catch (err) {
          console.error(`Error en solicitud API para ubicación ${locationData.name}:`, err)
          throw err
        }
      })
  
      const results = await Promise.all(promises)
      const flatData = results.flat()
      historicalData.value = flatData
      
      // Corregir conversión de Set a Array para compatibilidad con versiones antiguas de TypeScript
      const dateSet = new Set<string>()
      flatData.forEach(item => dateSet.add(item.date))
      dates.value = Array.from(dateSet)
      
    } catch (err) {
      console.error('Error general en fetchHistoricalData:', err)
      historicalData.value = []
      dates.value = []
      error.value = err instanceof Error ? err.message : 'Error al obtener los datos históricos. Por favor, inténtelo de nuevo.'
    } finally {
      loading.value = false
    }
  }

  // Función para depuración
  function showDebugInfo() {
    console.log('--- INFORMACIÓN DE DEPURACIÓN ---')
    console.log('Datos obtenidos:', historicalData.value.length)
    console.log('Fechas disponibles:', dates.value.length)
    console.log('Error:', error.value)
    alert(`Error: ${error.value}\nRevisa la consola para más detalles.`)
  }

  return {
    loading,
    historicalData,
    error,
    dates,
    fetchHistoricalData,
    showDebugInfo
  }
}
