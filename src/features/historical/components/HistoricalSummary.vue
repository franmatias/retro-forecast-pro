<template>
  <div class="d-flex flex-column">
    <div class="d-flex align-center mb-2">
      <h3 class="text-h6 mr-2">
        Resumen por localización
      </h3>
      <v-chip
        v-if="reordered"
        color="info"
        size="small"
        class="ml-2"
      >
        Orden personalizado
      </v-chip>
      <v-spacer />
      <v-btn
        v-if="reordered"
        title="Restablecer orden original"
        icon="mdi-refresh"
        variant="text"
        size="small"
        @click="resetOrder"
      />
    </div>

    <div 
      ref="container"
      class="summary-container"
    >
      <v-col 
        v-for="(item, index) in orderedItems" 
        :key="item.id" 
        cols="12" 
        md="6"
        lg="4"
        xl="3"
        class="summary-column"
      >
        <v-expansion-panels 
          v-model="openPanels[index]"
          class="summary-panel elevation-2"
        >
          <v-expansion-panel>
            <v-expansion-panel-title>
              <v-row 
                no-gutters 
                align="center"
              >
                <v-col 
                  cols="auto" 
                  class="mr-2"
                >
                  <v-icon 
                    color="primary" 
                    class="drag-handle"
                  >
                    mdi-drag
                  </v-icon>
                </v-col>
                <v-col>
                  <span class="location-title text-subtitle-1 font-weight-bold">
                    {{ getLocationDisplayName(item.location) }}
                  </span>
                </v-col>
              </v-row>
            </v-expansion-panel-title>
            <v-expansion-panel-text>
              <!-- Usar v-if para asegurar que los datos están disponibles -->
              <template v-if="locationData[item.location]">
                <temperature-summary 
                  :location-data="locationData[item.location]"
                  :location-name="getLocationDisplayName(item.location)"
                />
                <rainfall-summary 
                  :location-data="locationData[item.location]"
                  :location-name="getLocationDisplayName(item.location)"
                />
                <wind-summary 
                  :location-data="locationData[item.location]"
                  :location-name="getLocationDisplayName(item.location)"
                />
                <humidity-summary 
                  :location-data="locationData[item.location]"
                  :location-name="getLocationDisplayName(item.location)"
                />
                <pressure-summary 
                  :location-data="locationData[item.location]"
                  :location-name="getLocationDisplayName(item.location)"
                />
                <sun-hours-summary 
                  :location-data="locationData[item.location]"
                  :location-name="getLocationDisplayName(item.location)"
                />
              </template>
              <div 
                v-else
                class="pa-4 text-center"
              >
                <v-progress-circular indeterminate />
                <p class="mt-2">
                  Cargando datos...
                </p>
              </div>
            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>
      </v-col>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { PropType } from 'vue'

import Sortable from 'sortablejs'
import TemperatureSummary from './summary/TemperatureSummary.vue'
import RainfallSummary from './summary/RainfallSummary.vue'
import WindSummary from './summary/WindSummary.vue'
import HumiditySummary from './summary/HumiditySummary.vue'
import PressureSummary from './summary/PressureSummary.vue'
import SunHoursSummary from './summary/SunHoursSummary.vue'
import type { WeatherData } from '../models'

// Tipo para funciones de obtención de nombres de ubicación
type LocationNameGetter = (locationId: string) => string;

// Interfaz para el elemento ordenable
interface OrderedItem {
  id: string;
  location: string;
}

const props = defineProps({
  historicalData: {
    type: Array as PropType<WeatherData[]>,
    required: true
  },
  selectedLocations: {
    type: Array as PropType<string[]>,
    required: true
  },
  getLocationDisplayName: {
    type: Function as PropType<LocationNameGetter>,
    required: true
  },
  getLocationFullName: {
    type: Function as PropType<LocationNameGetter>,
    required: true
  }
})

// Estado para los paneles de expansión
const openPanels = ref<Record<number, number[]>>({})

// Array para mantener el orden personalizado
const orderedItems = ref<OrderedItem[]>([])

// Bandera para saber si el usuario ha reordenado los paneles
const reordered = ref(false)

// Procesar datos por ubicación para evitar múltiples filtrados
const locationData = computed(() => {
  const data: Record<string, WeatherData[]> = {}
  
  props.selectedLocations.forEach(location => {
    data[location] = props.historicalData.filter(item => item.locationId === location)
  })
  
  return data
})

// Referencia al contenedor para Sortable.js
const container = ref<HTMLElement | null>(null)

// Inicializar con todos los paneles abiertos
onMounted(() => {
  initializeOrderedItems()
  
  // Inicializar Sortable en el contenedor después de que se renderice
  nextTick(() => {
    if (container.value) {
      Sortable.create(container.value, {
        animation: 150,
        handle: '.drag-handle',
        onEnd: (evt: { oldIndex?: number; newIndex?: number }) => {
          // Actualizar el orden cuando termina el arrastre
          const { oldIndex, newIndex } = evt
          if (oldIndex !== undefined && newIndex !== undefined) {
            const item = orderedItems.value.splice(oldIndex, 1)[0]
            orderedItems.value.splice(newIndex, 0, item)
            reordered.value = true
            
            // Ajustar el estado de los paneles
            const tempOpenPanels: Record<number, number[]> = {}
            Object.entries(openPanels.value).forEach(([key, value]) => {
              const index = parseInt(key)
              let newPanelIndex = index
              
              if (index === oldIndex) {
                newPanelIndex = newIndex
              } else if (index > oldIndex && index <= newIndex) {
                newPanelIndex = index - 1
              } else if (index < oldIndex && index >= newIndex) {
                newPanelIndex = index + 1
              }
              
              tempOpenPanels[newPanelIndex] = value
            })
            
            openPanels.value = tempOpenPanels
          }
        }
      })
    }
  })
})

// Observar cambios en las ubicaciones seleccionadas para actualizar el orden
watch(() => props.selectedLocations, (newLocations) => {
  if (!reordered.value || orderedItems.value.length === 0) {
    // Si no hay un orden personalizado, simplemente inicializar
    initializeOrderedItems()
  } else {
    // Mantener el orden personalizado existente y añadir/quitar según sea necesario
    updateOrderedItems(newLocations)
  }
}, { deep: true })

// Inicializar el array de elementos ordenados
function initializeOrderedItems() {
  orderedItems.value = props.selectedLocations.map((location, index) => ({
    id: `item-${index}-${location}`,
    location
  }))
  
  // Inicializar paneles abiertos
  orderedItems.value.forEach((_, index) => {
    openPanels.value[index] = [0]
  })
  
  reordered.value = false
}

// Actualizar elementos ordenados cuando cambian las ubicaciones seleccionadas
function updateOrderedItems(newLocations: string[]) {
  const currentLocations = new Set(orderedItems.value.map(item => item.location))
  const newLocationSet = new Set(newLocations)
  
  // Eliminar ubicaciones que ya no están seleccionadas
  orderedItems.value = orderedItems.value.filter(item => newLocationSet.has(item.location))
  
  // Añadir nuevas ubicaciones que no existían antes
  newLocations.forEach((location) => {
    if (!currentLocations.has(location)) {
      orderedItems.value.push({
        id: `item-${Date.now()}-${location}`, // Usar timestamp para asegurar ID único
        location
      })
    }
  })
  
  // Reinicializar paneles abiertos
  Object.keys(openPanels.value).forEach(key => {
    const index = parseInt(key)
    if (index >= orderedItems.value.length) {
      delete openPanels.value[index]
    }
  })
  
  orderedItems.value.forEach((_, index) => {
    if (!openPanels.value[index]) {
      openPanels.value[index] = [0]
    }
  })
}

// Restablecer al orden original
function resetOrder() {
  initializeOrderedItems()
}
</script>

<style scoped>
.summary-container {
  display: flex;
  flex-wrap: wrap;
  width: 100%;
}

.summary-column {
  display: flex;
  transition: all 0.3s;
}

.summary-panel {
  width: 100%;
  height: 100%;
  transition: all 0.2s;
}

.drag-handle {
  cursor: grab;
}

.location-title {
  display: inline-block;
  color: var(--v-primary-base);
  overflow: hidden;
  text-overflow: ellipsis;
}

.summary-panel:hover {
  transform: translateY(-2px);
}

/* Estilos responsivos adicionales */
@media (min-width: 960px) {
  .summary-column {
    padding: 8px;
  }
}
</style>
