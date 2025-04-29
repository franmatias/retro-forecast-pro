<template>
  <div ref="mapContainer" class="weather-map-container" />
</template>

<script setup lang="ts">
import { ref, onMounted, watch, onUnmounted } from 'vue'
import type { Location, WeatherData } from '@/services/weather'
import 'leaflet/dist/leaflet.css'
// Usamos nuestro archivo de configuración centralizada para Leaflet
import L from '../config/leaflet-setup'

// Props
const props = defineProps<{
  location: Location
  mapType: string
  weatherData: WeatherData
}>()

// Referencias
const mapContainer = ref<HTMLElement | null>(null)
const map = ref<L.Map | null>(null)
const marker = ref<L.Marker | null>(null)

// Configuración del mapa
const initMap = () => {
  if (!mapContainer.value || !props.location) return

  const coords: [number, number] = [props.location.latitude, props.location.longitude]

  // Crear mapa base con capas con zoom aumentado
  const mapInstance = L.map(mapContainer.value, {
    center: coords,
    zoom: 15, // Aumentado de 8 a 12
    maxZoom: 19, // Zoom máximo permitido
    minZoom: 3, // Zoom mínimo permitido
    layers: [],
  })
  map.value = mapInstance

  // Definir capas base
  const baseLayers = {
    OpenStreetMap: L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }),
    Temperatura: L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenTopoMap',
      maxZoom: 17,
    }),
    Precipitación: L.tileLayer(
      'https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png',
      {
        attribution: '© Stadia Maps',
        maxZoom: 20,
      }
    ),
    Viento: L.tileLayer('https://tiles.stadiamaps.com/tiles/osm_bright/{z}/{x}/{y}{r}.png', {
      attribution: '© Stadia Maps',
      maxZoom: 20,
    }),
  }

  // Añadir capa base por defecto y control de capas
  baseLayers['OpenStreetMap'].addTo(mapInstance)
  L.control.layers(baseLayers, {}).addTo(mapInstance)

  // Añadir marcador
  const markerInstance = L.marker(coords)
    .addTo(mapInstance)
    .bindPopup(props.location.name)
    .openPopup()
  marker.value = markerInstance
}

// Función para actualizar la capa meteorológica
const updateWeatherLayer = (type: string) => {
  if (!map.value) return

  const layerNames = {
    temp: 'Temperatura',
    rain: 'Precipitación',
    wind: 'Viento',
  }

  // Encontrar el control de capas
  const layersControl = document.querySelector('.leaflet-control-layers')
  if (layersControl) {
    // Simular clic en la capa correspondiente
    const inputs = layersControl.querySelectorAll('input[type="radio"]')
    inputs.forEach((input: Element) => {
      if (input instanceof HTMLInputElement) {
        const label = input.nextElementSibling
        if (label && label.textContent?.includes(layerNames[type as keyof typeof layerNames])) {
          input.click()
        }
      }
    })
  }
}

// Actualizar mapa cuando cambia la ubicación
watch(
  () => props.location,
  (newLocation) => {
    if (!map.value || !newLocation) return

    map.value.setView([newLocation.latitude, newLocation.longitude], 12) // Cambiado de 10 a 12

    if (marker.value) {
      marker.value
        .setLatLng([newLocation.latitude, newLocation.longitude])
        .bindPopup(newLocation.name)
    }
  },
  { deep: true }
)

// Observar cambios en el tipo de mapa
watch(
  () => props.mapType,
  (newType) => {
    updateWeatherLayer(newType)
  }
)

// Montar y limpiar el mapa
onMounted(() => {
  initMap()
})

onUnmounted(() => {
  if (map.value) {
    map.value.remove()
    map.value = null
  }
})
</script>

<style>
/* Asegurar que los estilos del mapa se apliquen correctamente */
@import 'leaflet/dist/leaflet.css';

.weather-map-container {
  width: 100%;
  height: 100%;
  position: relative;
  z-index: 1;
}

.map-container {
  height: 100%;
  width: 100%;
}

.leaflet-container {
  width: 100%;
  height: 100%;
  z-index: 1;
}

.leaflet-control-container .leaflet-control {
  z-index: 2;
}

.leaflet-popup-content-wrapper {
  background-color: rgba(255, 255, 255, 0.9);
}

.leaflet-tile-container img {
  width: 256px !important;
  height: 256px !important;
}

.leaflet-tile-container {
  opacity: 1 !important;
}

.leaflet-layer {
  opacity: 1 !important;
}
</style>
