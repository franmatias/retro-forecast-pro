import { ref, computed } from 'vue'
import { useLocationStore } from '../../../stores/locationStore'
import { useDashboardStore } from '../../../stores/dashboardStore'
import { reverseGeocode, type Location } from '../../../services/weather'
import type { EnhancedLocation } from '../../../types/location'

// Definir una interfaz para el objeto de ubicación guardada
interface SavedLocation {
  name: string;
  address: string;
  lat: number;
  lng: number;
}

// Interfaz para los detalles de geocodificación
interface GeocodingDetails {
  elevation?: number;
  population?: number;
  country?: string;
  admin1?: string;
  name?: string;
  timezone?: string;
}

export function useLocationSelect() {
  const locationStore = useLocationStore()
  const dashboardStore = useDashboardStore()
  
  const isGeolocating = ref(false)
  
  // Computar ubicaciones desde el store
  const locations = computed(() => {
    return locationStore.savedLocations.map((loc: SavedLocation) => {
      const displayName = loc.name
      const fullLocation = `${loc.name}, ${loc.address}`

      return {
        id: fullLocation,
        name: displayName,
        location: fullLocation,
        latitude: loc.lat,
        longitude: loc.lng,
        country: 'ES', // Asumir España por defecto si no está disponible
      }
    })
  })

  // Verificar si hay ubicaciones disponibles
  const hasStoredLocations = computed(() => locations.value.length > 0)
  
  // Manejar la selección de ubicación
  const selectedLocationId = computed({
    get() {
      // Primero intentar obtener la ubicación del store de dashboard
      if (dashboardStore.selectedLocationId) {
        return dashboardStore.selectedLocationId
      }

      // Si no existe en el dashboard pero hay una ubicación seleccionada en el store general, usarla
      const selectedLoc = locationStore.getSelectedLocation()
      if (selectedLoc) {
        const enhancedLocation = {
          id: `${selectedLoc.name}, ${selectedLoc.address}`,
          name: selectedLoc.name,
          location: `${selectedLoc.name}, ${selectedLoc.address}`,
          latitude: selectedLoc.lat,
          longitude: selectedLoc.lng,
          country: 'ES',
        }
        // Actualizamos el dashboardStore con esta ubicación
        dashboardStore.setSelectedLocation(enhancedLocation)
        return enhancedLocation
      }

      // Si no hay ubicaciones en ningún store pero hay disponibles, seleccionamos la primera
      else if (hasStoredLocations.value && locations.value.length > 0) {
        return locations.value[0]
      }
      return null
    },
    set(newValue: EnhancedLocation | null) {
      // Guardar la ubicación en el store de dashboard
      dashboardStore.setSelectedLocation(newValue)

      // También actualizar el store general para mantener sincronizado
      if (newValue) {
        locationStore.setSelectedLocation({
          name: newValue.name,
          address: newValue.location.replace(`${newValue.name}, `, ''),
          lat: newValue.latitude,
          lng: newValue.longitude,
        })
      } else {
        locationStore.setSelectedLocation(null)
      }
    },
  })

  const selectedLocationObj = computed(() => {
    if (!selectedLocationId.value) return null
    return typeof selectedLocationId.value === 'object'
      ? selectedLocationId.value
      : locations.value.find((loc: { id: string }) => loc.id === (selectedLocationId.value as EnhancedLocation).id)
  })

  // Mantener compatibilidad con el formato Location
  const selectedLocation = computed<Location | null>(() => {
    if (!selectedLocationObj.value) return null
    return {
      name: selectedLocationObj.value.name,
      latitude: selectedLocationObj.value.latitude,
      longitude: selectedLocationObj.value.longitude,
      country: selectedLocationObj.value.country || 'ES',
    }
  })

  // Referencia para almacenar los datos detallados de geocodificación
  const geocodingDetails = ref<GeocodingDetails>({});
  
  // Información de ubicación para mostrar
  const locationInfo = computed(() => {
    return {
      name: selectedLocation.value?.name || 'N/A',
      country: geocodingDetails.value.country || 'España',
      region: geocodingDetails.value.admin1 || 'N/A',
      latitude: selectedLocation.value?.latitude || 0,
      longitude: selectedLocation.value?.longitude || 0,
      elevation: geocodingDetails.value.elevation || 0,
      population: geocodingDetails.value.population || 0,
    }
  })

  // Método para actualizar los detalles de geocodificación
  function updateGeocodingDetails(details: GeocodingDetails) {
    if (!details) return;
    
    geocodingDetails.value = {
      elevation: details.elevation,
      population: details.population,
      country: details.country,
      admin1: details.admin1,
    };
  }

  // Obtener la ubicación actual usando la API de geolocalización
  async function getCurrentLocation(retryCount = 0) {
    if (!navigator.geolocation) {
      console.error('La geolocalización no es soportada por este navegador.')
      return
    }

    isGeolocating.value = true

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        const geoOptions = {
          enableHighAccuracy: false,
          timeout: 10000,
          maximumAge: 30000,
        }

        const watchId = navigator.geolocation.watchPosition(
          (pos) => {
            navigator.geolocation.clearWatch(watchId)
            resolve(pos)
          },
          (error) => {
            navigator.geolocation.clearWatch(watchId)
            reject(error)
          },
          geoOptions
        )
      })

      const { latitude, longitude } = position.coords
      console.log('Coordenadas obtenidas:', latitude, longitude)

      try {
        const locations = await reverseGeocode(latitude, longitude)
        console.log('Localización obtenida:', locations)

        if (locations && locations.length > 0) {
          const newLocation = {
            id: `${locations[0].name}, ${locations[0].latitude},${locations[0].longitude}`,
            name: locations[0].name,
            location: locations[0].name,
            latitude: locations[0].latitude,
            longitude: locations[0].longitude,
            country: locations[0].country || 'ES',
          }
          selectedLocationId.value = newLocation

          return newLocation
        } else {
          const defaultLocation = {
            id: `Mi ubicación, ${latitude},${longitude}`,
            name: 'Mi ubicación',
            location: 'Mi ubicación',
            latitude,
            longitude,
            country: 'ES',
          }
          selectedLocationId.value = defaultLocation
          return defaultLocation
        }
      } catch (geoError) {
        console.error('Error en la geocodificación:', geoError)
        const defaultLocation = {
          id: `Mi ubicación, ${latitude},${longitude}`,
          name: 'Mi ubicación',
          location: 'Mi ubicación',
          latitude,
          longitude,
          country: 'ES',
        }
        selectedLocationId.value = defaultLocation
        return defaultLocation
      }
    } catch (error) {
      console.error('Error al obtener la ubicación actual:', error)

      // Reintentar hasta 3 veces si es un error de timeout
      if (retryCount < 3 && error instanceof GeolocationPositionError && error.code === 3) {
        console.log(`Reintentando obtener ubicación (intento ${retryCount + 1})...`)
        await new Promise((resolve) => setTimeout(resolve, 1000)) // Esperar 1 segundo
        return getCurrentLocation(retryCount + 1)
      }

      alert(
        'No se pudo obtener tu ubicación. Por favor, intenta de nuevo o busca manualmente tu ciudad.'
      )
      return null
    } finally {
      isGeolocating.value = false
    }
  }

  return {
    locationStore,
    dashboardStore,
    locations,
    hasStoredLocations,
    selectedLocationId,
    selectedLocationObj,
    selectedLocation,
    locationInfo,
    isGeolocating,
    getCurrentLocation,
    updateGeocodingDetails
  }
}
