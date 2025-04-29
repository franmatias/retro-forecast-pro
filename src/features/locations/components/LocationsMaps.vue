<template>
  <v-container 
    fluid
    class="locations-maps-container"
  >
    <v-row>
      <v-col cols="12">
        <v-card>
          <v-card-title>Gestión de ubicaciones</v-card-title>
          <v-card-text>
            <v-row align="center">
              <v-col 
                cols="12" 
                sm="8"
              >
                <v-autocomplete
                  v-model="selectedSearchLocation"
                  v-model:search-input="searchQuery"
                  :items="locationSuggestions"
                  :loading="searching"
                  label="Buscar ubicación"
                  placeholder="Escribe para buscar ubicaciones..."
                  item-title="display_name"
                  return-object
                  hide-no-data
                  clearable
                  variant="outlined"
                  @update:search="debouncedSearchLocations"
                  @keyup.enter="handleManualSearch"
                >
                  <!-- Template personalizado para los items -->
                  <template #item="{ item, props }">
                    <v-list-item
                      v-bind="props"
                      :title="item.raw.display_name"
                      :subtitle="`${item.raw.lat}°N, ${item.raw.lon}°E`"
                    />
                  </template>
                </v-autocomplete>
              </v-col>
              <v-col 
                cols="12" 
                sm="4" 
                class="d-flex"
              >
                <v-btn
                  color="primary"
                  :loading="searching"
                  class="mr-2"
                  :disabled="!selectedSearchLocation"
                  @click="addSelectedLocation"
                >
                  <v-icon start>
                    mdi-plus
                  </v-icon>
                  Añadir
                </v-btn>
                <v-btn 
                  color="secondary" 
                  :loading="geolocating" 
                  @click="handleCurrentLocation"
                >
                  <v-icon start>
                    mdi-crosshairs-gps
                  </v-icon>
                  Mi ubicación
                </v-btn>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Map container -->
    <v-row>
      <v-col cols="12">
        <div 
          id="map" 
          style="height: 500px; width: 100%" 
          class="map-container" 
        />
      </v-col>
    </v-row>

    <!-- Locations table -->
    <v-row>
      <v-col cols="12">
        <v-card>
          <v-card-title class="d-flex align-center">
            <span>Ubicaciones guardadas</span>
            <v-spacer />
            <v-chip 
              color="primary" 
              size="small" 
              class="ml-2"
            >
              {{ locationStore.savedLocations.length }}
            </v-chip>
          </v-card-title>
          <v-card-text>
            <v-data-table
              :headers="headers"
              :items="locationStore.savedLocations"
              :items-per-page="5"
              class="elevation-1"
            >
              <template #[`item.name`]="{ item }">
                <a 
                  href="#" 
                  @click.prevent="centerOnLocation(item)"
                >
                  {{ item.name }}
                </a>
              </template>
              <template #[`item.actions`]="{ item }">
                <div class="d-flex">
                  <v-tooltip text="Centrar en el mapa">
                    <template #activator="{ props }">
                      <v-btn
                        icon="mdi-crosshairs"
                        density="comfortable"
                        size="small"
                        variant="text"
                        color="primary"
                        class="mr-1"
                        v-bind="props"
                        @click="centerOnLocation(item)"
                      />
                    </template>
                  </v-tooltip>
                  <v-tooltip text="Eliminar ubicación">
                    <template #activator="{ props }">
                      <v-btn
                        icon="mdi-delete"
                        density="comfortable"
                        size="small"
                        variant="text"
                        color="error"
                        v-bind="props"
                        @click="handleDeleteLocation(item)"
                      />
                    </template>
                  </v-tooltip>
                </div>
              </template>
            </v-data-table>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { watch, onMounted } from 'vue'
import { useLocationStore } from '../stores/locationStore'
import { useLeafletMap } from '../composables/useLeafletMap'
import { useLocationSearch } from '../composables/useLocationSearch'
import { useGeolocation } from '../composables/useGeolocation'
import type { StoredLocation } from '../models/Types'

// Usar composables
const locationStore = useLocationStore()
const { map, markers, initMap, loadSavedMarkers, centerOnLocation, addMarkerAndSaveLocation } =
  useLeafletMap()

const {
  searchQuery,
  searching,
  locationSuggestions,
  selectedSearchLocation,
  debouncedSearchLocations,
  searchLocations,
  convertToStoredLocation,
  clearSearch,
} = useLocationSearch()

const { geolocating, getCurrentLocation } = useGeolocation()

const headers = [
  { title: 'Nombre', key: 'name' },
  { title: 'Dirección', key: 'address' },
  { title: 'Latitud', key: 'lat' },
  { title: 'Longitud', key: 'lng' },
  { title: 'Acciones', key: 'actions', sortable: false },
]

// Función para añadir la ubicación seleccionada
const addSelectedLocation = () => {
  if (!selectedSearchLocation.value) return

  const location = convertToStoredLocation(selectedSearchLocation.value)
  const added = addMarkerAndSaveLocation(location)

  if (added) {
    clearSearch()
  } else {
    alert('Esta ubicación ya ha sido añadida')
  }
}

// Manejar la selección de la ubicación actual
const handleCurrentLocation = async () => {
  const location = await getCurrentLocation()
  if (location) {
    const added = addMarkerAndSaveLocation(location)
    if (!added) {
      alert('Esta ubicación ya ha sido añadida')
    }
  }
}

// Manejar borrado de ubicación
const handleDeleteLocation = (item: unknown) => {
  try {
    // Extraer información de ubicación
    let location: StoredLocation | null = null

    if (typeof item === 'object' && item !== null) {
      // Para Vuetify 3+
      if ('raw' in item && item.raw) {
        location = item.raw as StoredLocation
      }
      // Para versiones anteriores o datos directos
      else if ('lat' in item && 'lng' in item) {
        location = item as StoredLocation
      }

      if (!location) {
        console.error('Formato de item no reconocido:', item)
        return
      }

      // Buscar índice en el array de marcadores
      const index = locationStore.savedLocations.findIndex(
        (loc: StoredLocation) => loc.lat === location!.lat && loc.lng === location!.lng
      )

      if (index > -1) {
        // Eliminar del mapa
        if (index < markers.value.length && markers.value[index]) {
          markers.value[index].remove()
          markers.value.splice(index, 1)
        }

        // Eliminar del store
        locationStore.deleteLocation(location)
      }
    }
  } catch (error) {
    console.error('Error deleting location:', error)
  }
}

// Función para realizar búsqueda manual si el usuario presiona Enter sin seleccionar
const handleManualSearch = async () => {
  if (selectedSearchLocation.value) {
    addSelectedLocation()
  } else if (searchQuery.value?.trim()) {
    // Si no hay selección pero hay texto, buscamos y seleccionamos el primer resultado
    searching.value = true
    try {
      await searchLocations(searchQuery.value)
      if (locationSuggestions.value.length > 0) {
        const result = locationSuggestions.value[0]
        const location = convertToStoredLocation(result)

        addMarkerAndSaveLocation(location)
        clearSearch()
      } else {
        alert('No se encontró la ubicación')
      }
    } catch (error) {
      console.error('Error searching location:', error)
      alert('Error al buscar la ubicación')
    } finally {
      searching.value = false
    }
  }
}

// Actualizar marcadores cuando cambie el store
watch(
  () => locationStore.savedLocations,
  () => {
    if (map.value) {
      loadSavedMarkers()
    }
  },
  { deep: true }
)

// Observar cambios en la ubicación seleccionada
watch(selectedSearchLocation, (newLocation) => {
  if (newLocation && map.value) {
    // Centrar el mapa en la ubicación seleccionada sin añadirla todavía
    map.value.setView([parseFloat(newLocation.lat), parseFloat(newLocation.lon)], 13)
  }
})

onMounted(() => {
  // Inicializar el mapa
  setTimeout(() => {
    initMap('map')

    // Centrar en la ubicación seleccionada si existe
    const selectedLocation = locationStore.getSelectedLocation()
    if (selectedLocation && map.value) {
      centerOnLocation(selectedLocation)
    }
  }, 100)
})
</script>

<style scoped>
@import 'leaflet/dist/leaflet.css';

.locations-maps-container {
  width: 100%;
  max-width: 100%;
  padding: 8px;
}

.map-container {
  border-radius: 4px;
  border: 1px solid #ccc;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 16px;
}

.v-data-table {
  margin-top: 8px;
}

a {
  color: var(--v-primary-base);
  text-decoration: none;
}

a:hover {
  text-decoration: underline;
}

.v-autocomplete :deep(.v-field__input) {
  padding-top: 8px !important;
}
</style>
