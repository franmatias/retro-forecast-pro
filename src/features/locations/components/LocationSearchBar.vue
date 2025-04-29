<template>
  <v-card>
    <v-card-title>Gestión de ubicaciones</v-card-title>
    <v-card-text>
      <v-row align="center">
        <v-col cols="12" sm="8">
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
        <v-col cols="12" sm="4" class="d-flex">
          <v-btn
            color="primary"
            :loading="searching"
            class="mr-2"
            :disabled="!selectedSearchLocation"
            @click="handleAddLocation"
          >
            <v-icon start> mdi-plus </v-icon>
            Añadir
          </v-btn>
          <v-btn color="secondary" :loading="geolocating" @click="handleGetCurrentLocation">
            <v-icon start> mdi-crosshairs-gps </v-icon>
            Mi ubicación
          </v-btn>
        </v-col>
      </v-row>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { useLocationSearch } from '../composables/useLocationSearch'
import { useGeolocation } from '../composables/useGeolocation'
import type { StoredLocation } from '../models/domain-types'

const emit = defineEmits<{
  (e: 'add-location', location: StoredLocation): void
}>()

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

const handleAddLocation = () => {
  if (!selectedSearchLocation.value) return

  const location = convertToStoredLocation(selectedSearchLocation.value)
  emit('add-location', location)
  clearSearch()
}

const handleManualSearch = async () => {
  if (selectedSearchLocation.value) {
    handleAddLocation()
  } else if (searchQuery.value?.trim()) {
    searching.value = true
    try {
      await searchLocations(searchQuery.value)
      if (locationSuggestions.value.length > 0) {
        const result = locationSuggestions.value[0]
        const location = convertToStoredLocation(result)

        emit('add-location', location)
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

const handleGetCurrentLocation = async () => {
  const location = await getCurrentLocation()
  if (location) {
    emit('add-location', location)
  }
}
</script>

<style scoped>
.v-autocomplete :deep(.v-field__input) {
  padding-top: 8px !important;
}
</style>
