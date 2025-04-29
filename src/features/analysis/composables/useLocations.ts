import { computed } from 'vue'
import { useLocationStore } from '../../../stores/locationStore'
import type { StoredLocationItem } from '../models/index'
import type { StoredLocation } from '../../../stores/locationStore'

export function useLocations() {
  const locationStore = useLocationStore()

  // Computar ubicaciones desde el store con IDs únicos
  const uniqueLocations = computed<StoredLocationItem[]>(() => {
    return locationStore.savedLocations.map((loc: StoredLocation, index: number) => {
      const displayName = loc.name
      const fullLocation = `${loc.name}, ${loc.address}`
      
      return {
        uniqueId: `${fullLocation}_${index}`,
        id: fullLocation,
        name: displayName,
        location: fullLocation,
        lat: loc.lat,
        lon: loc.lng
      }
    })
  })

  // Mapa para convertir entre IDs únicos y IDs originales
  const idMap = computed(() => {
    const map = new Map<string, string>()
    uniqueLocations.value.forEach(loc => {
      map.set(loc.uniqueId, loc.id)
      map.set(loc.id, loc.uniqueId)
    })
    return map
  })

  // Verificar si hay ubicaciones disponibles
  const hasStoredLocations = computed(() => uniqueLocations.value.length > 0)
  
  // Obtener solo el nombre de la ubicación para mostrar en gráficos
  const getLocationDisplayName = (fullLocationId: string): string => {
    let locationObj = uniqueLocations.value.find(loc => loc.id === fullLocationId)
    if (!locationObj) {
      const originalId = idMap.value.get(fullLocationId)
      locationObj = uniqueLocations.value.find(loc => loc.id === originalId)
    }
    return locationObj?.name || fullLocationId
  }
  
  // Método para obtener el nombre completo/dirección
  const getLocationFullName = (locationId: string): string => {
    const locationObj = uniqueLocations.value.find(loc => loc.id === locationId)
    return locationObj?.location || ''
  }

  return {
    uniqueLocations,
    idMap,
    hasStoredLocations,
    getLocationDisplayName,
    getLocationFullName
  }
}
