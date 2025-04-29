import { computed } from 'vue'
import { useHistoricalStore } from '../stores/historicalStore'
import { useLocationStore } from '../../../stores/locationStore'
import { useLocations } from './useLocations'

export function useHistoricalSelection() {
  const historicalStore = useHistoricalStore()
  const locationStore = useLocationStore()
  const { uniqueLocations, idMap } = useLocations()

  // Gestión de ubicaciones seleccionadas
  const selectedLocations = computed({
    get: () => {
      return historicalStore.selectedLocationIds.map(id => idMap.value.get(id) || id)
    },
    set: (uniqueIds) => {
      const originalIds = uniqueIds.map(uniqueId => idMap.value.get(uniqueId) || uniqueId)
      historicalStore.setSelectedLocations(originalIds)
    }
  })

  // Gestión de rango de fechas
  const startDate = computed({
    get: () => historicalStore.startDate,
    set: (value) => {
      if (value !== historicalStore.startDate) {
        historicalStore.setDateRange(value, endDate.value)
      }
    }
  })

  const endDate = computed({
    get: () => historicalStore.endDate,
    set: (value) => {
      if (value !== historicalStore.endDate) {
        historicalStore.setDateRange(startDate.value, value)
      }
    }
  })

  // Función para manejar el cambio de selección de ubicaciones
  function handleLocationChange(newUniqueLocations: string[]) {
    const originalIds = newUniqueLocations.map(uniqueId => idMap.value.get(uniqueId) || uniqueId)
    
    historicalStore.setSelectedLocations(originalIds)
    
    if (originalIds.length === 1) {
      const selectedLocationId = originalIds[0]
      const selectedLocation = uniqueLocations.value.find(loc => loc.id === selectedLocationId)
      if (selectedLocation) {
        locationStore.setSelectedLocation({
          name: selectedLocation.name,
          address: selectedLocation.location.replace(`${selectedLocation.name}, `, ''),
          lat: selectedLocation.lat,
          lng: selectedLocation.lon
        })
      }
    }
  }

  // Inicializar selección y fechas
  function initializeSelection() {
    // Establecer fechas predeterminadas si no existen
    if (!startDate.value || !endDate.value) {
      const today = new Date()
      const lastMonth = new Date(today)
      lastMonth.setMonth(today.getMonth() - 1)
      const formattedStartDate = lastMonth.toISOString().split('T')[0]
      const formattedEndDate = today.toISOString().split('T')[0]
      historicalStore.setDateRange(formattedStartDate, formattedEndDate)
    }

    // Inicializar ubicaciones seleccionadas
    if (historicalStore.hasSelectedLocations()) {
      const validLocationIds = historicalStore.selectedLocationIds.filter(
        id => uniqueLocations.value.some(loc => loc.id === id)
      )

      if (validLocationIds.length > 0) {
        historicalStore.setSelectedLocations(validLocationIds)
      } else if (uniqueLocations.value.length > 0) {
        historicalStore.setSelectedLocations([uniqueLocations.value[0].id])
      }
    }
    else if (uniqueLocations.value.length > 0) {
      const selectedLoc = locationStore.getSelectedLocation()
      if (selectedLoc) {
        const matchingLocation = uniqueLocations.value.find(loc => 
          loc.lat === selectedLoc.lat && loc.lon === selectedLoc.lng
        )
        
        if (matchingLocation) {
          historicalStore.setSelectedLocations([matchingLocation.id])
        } else {
          historicalStore.setSelectedLocations([uniqueLocations.value[0].id])
        }
      } else {
        historicalStore.setSelectedLocations([uniqueLocations.value[0].id])
      }
    }
  }

  return {
    selectedLocations,
    startDate,
    endDate,
    handleLocationChange,
    initializeSelection
  }
}
