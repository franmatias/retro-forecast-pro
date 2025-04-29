<template>
  <div :id="mapId" class="location-map" :style="{ height: height, width: width }" />
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue'
// Importar Leaflet desde nuestro archivo de configuración centralizada
import L from '../config/leaflet-setup'
import 'leaflet/dist/leaflet.css'
import { MAP_CONFIG } from '../config/constants'
import type { StoredLocation } from '../models'

const props = withDefaults(
  defineProps<{
    locations?: StoredLocation[]
    center?: [number, number]
    zoom?: number
    height?: string
    width?: string
    mapId?: string
    selectedLocation?: StoredLocation | null
  }>(),
  {
    locations: () => [],
    center: () => MAP_CONFIG.DEFAULT_CENTER,
    zoom: MAP_CONFIG.DEFAULT_ZOOM,
    height: '400px',
    width: '100%',
    mapId: 'location-map',
    selectedLocation: null,
  }
)

const emit = defineEmits<{
  (e: 'location-click', location: StoredLocation): void
  (e: 'map-click', latLng: { lat: number; lng: number }): void
}>()

const map = ref<L.Map | null>(null)
const markers = ref<L.Marker[]>([])

onMounted(() => {
  initMap()
})

onUnmounted(() => {
  if (map.value) {
    map.value.remove()
    map.value = null
  }
})

const initMap = () => {
  if (typeof window === 'undefined' || !L) return

  try {
    const mapContainer = document.getElementById(props.mapId)
    if (!mapContainer) {
      console.error(`No se encontró el contenedor del mapa con ID: ${props.mapId}`)
      return
    }

    const mapInstance = L.map(props.mapId, {
      center: props.center,
      zoom: props.zoom,
    })

    L.tileLayer(MAP_CONFIG.TILE_LAYER, {
      attribution: MAP_CONFIG.ATTRIBUTION,
    }).addTo(mapInstance)

    // Manejar clics en el mapa
    mapInstance.on('click', (e) => {
      emit('map-click', e.latlng)
    })

    map.value = mapInstance
    loadMarkers()
  } catch (error) {
    console.error('Error inicializando el mapa:', error)
  }
}

const loadMarkers = () => {
  if (!map.value) return

  // Limpiar marcadores existentes
  markers.value.forEach((marker) => marker.remove())
  markers.value = []

  // Añadir marcadores
  props.locations.forEach((location) => {
    if (map.value) {
      const marker = L.marker([location.lat, location.lng])

      // Corregido: Usar una asignación tipo explícita para evitar el error de TypeScript
      const mapInstance = map.value as L.Map
      marker.addTo(mapInstance)
      marker.bindPopup(`<strong>${location.name}</strong><br>${location.address}`)

      // Manejar clics en los marcadores
      marker.on('click', () => {
        emit('location-click', location)
      })

      markers.value.push(marker)
    }
  })

  // Ajustar vista si hay marcadores
  if (markers.value.length > 0) {
    if (markers.value.length === 1) {
      map.value.setView([props.locations[0].lat, props.locations[0].lng], props.zoom)
    } else {
      const bounds = L.latLngBounds(props.locations.map((loc) => [loc.lat, loc.lng]))
      map.value.fitBounds(bounds, { padding: [50, 50] })
    }
  }

  // Si hay una ubicación seleccionada, centrar en ella
  if (props.selectedLocation) {
    centerOnLocation(props.selectedLocation)
  }
}

const centerOnLocation = (location: StoredLocation) => {
  if (!map.value) return

  map.value.setView([location.lat, location.lng], 15)

  // Buscar y activar el popup del marcador correspondiente
  const markerIndex = props.locations.findIndex(
    (loc) => loc.lat === location.lat && loc.lng === location.lng
  )

  if (markerIndex >= 0 && markers.value[markerIndex]) {
    markers.value[markerIndex].openPopup()
  }
}

// Observar cambios en las ubicaciones
watch(
  () => props.locations,
  () => {
    loadMarkers()
  },
  { deep: true }
)

// Observar cambios en la ubicación seleccionada
watch(
  () => props.selectedLocation,
  (newLocation) => {
    if (newLocation && map.value) {
      centerOnLocation(newLocation)
    }
  }
)

// Exponer API para usar externamente
defineExpose({
  centerOnLocation,
})
</script>

<style scoped>
.location-map {
  border-radius: 4px;
  border: 1px solid #ccc;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}
</style>
