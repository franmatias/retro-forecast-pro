<template>
  <v-container fluid class="pa-0">
    <v-row>
      <v-col cols="12">
        <base-widget 
          title="Datos históricos" 
          icon="mdi-history"
          class="full-width-widget"
        >
          <!-- Formulario de búsqueda -->
          <historical-search-form
            :loading="loading"
            :error="error"
            @search="handleSearch"
            @debug="showDebugInfo"
          />

          <!-- Gráficos de datos meteorológicos -->
          <v-row v-if="historicalData.length">
            <!-- Gráficos individuales -->
            <v-col 
              v-for="graphComponent in graphComponents" 
              :key="graphComponent.name"
              cols="12"
            >
              <component 
                :is="graphComponent" 
                :dates="dates"
                :historical-data="historicalData"
                :selected-locations="selectedLocations"
                :get-location-display-name="getLocationDisplayName"
              />
            </v-col>
            
            <!-- Gráfico de radar (caso especial sin prop 'dates') -->
            <v-col cols="12">
              <graph-radar
                :historical-data="historicalData"
                :selected-locations="selectedLocations"
                :get-location-display-name="getLocationDisplayName"
              />
            </v-col>
          </v-row>
          
          <!-- Resumen de datos históricos -->
          <v-container 
            v-if="historicalData.length" 
            fluid
          >
            <summary-historical 
              :historical-data="historicalData" 
              :selected-locations="selectedLocations"
              :get-location-display-name="getLocationDisplayName"
              :get-location-full-name="getLocationFullName"
            />
          </v-container>

          <!-- Tablas comparativas de datos -->
          <v-container 
            v-if="historicalData.length && selectedLocations.length > 0" 
            fluid
            class="mt-4"
          >
            <tabular-summary
              :historical-data="historicalData"
              :selected-locations="selectedLocations"
              :get-location-display-name="getLocationDisplayName"
            />
          </v-container>

          <!-- Estados de carga, error y sin datos -->
          <historical-status-info
            :loading="loading"
            :has-data="historicalData.length > 0"
            :error="error"
            :has-stored-locations="hasStoredLocations"
          />
        </base-widget>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { Chart, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, LineController, BarController, Filler } from 'chart.js'
import BaseWidget from './base/BaseWidget.vue'
import HistoricalSearchForm from './HistoricalSearchForm.vue'
import HistoricalStatusInfo from './HistoricalStatusInfo.vue'
import GraphRadar from './GraphRadar.vue'
import GraphTemp from './GraphTemp.vue'
import GraphRain from './GraphRain.vue'
import GraphWind from './GraphWind.vue'
import GraphHumidity from './GraphHumidity.vue'
import GraphPressure from './GraphPressure.vue'
import GraphSunHours from './GraphSunHours.vue'
import SummaryHistorical from './HistoricalSummary.vue'
import TabularSummary from './tables/TabularSummary.vue'

// Importar composables
import { useLocations } from '../composables/useLocations'
import { useHistoricalSelection } from '../composables/useHistoricalSelection'
import { useHistoricalData } from '../composables/useHistoricalData'

// Define interfaz para parámetros de búsqueda
interface SearchParams {
  selectedLocations: string[];
  startDate: string;
  endDate: string;
}

// Registrar componentes de Chart.js
Chart.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  LineController,
  BarController,
  Filler
)

// Composables
const { hasStoredLocations, getLocationDisplayName, getLocationFullName } = useLocations()
const { selectedLocations, initializeSelection } = useHistoricalSelection()
const { 
  loading, 
  historicalData, 
  error, 
  dates, 
  fetchHistoricalData, 
  showDebugInfo 
} = useHistoricalData()

// Lista de componentes de gráficos para renderizar dinámicamente
const graphComponents = [
  GraphTemp,
  GraphRain,
  GraphWind,
  GraphHumidity,
  GraphPressure,
  GraphSunHours
]

// Manejar la búsqueda desde el formulario
function handleSearch({ selectedLocations, startDate, endDate }: SearchParams): void {
  fetchHistoricalData(selectedLocations, startDate, endDate)
}

// Inicializar selecciones al montar
onMounted(() => {
  initializeSelection()
})
</script>

<style scoped>
.v-card {
  margin-bottom: 16px;
}

canvas {
  max-height: 300px;
}

.full-width-widget {
  width: 100%;
  max-width: 100%;
}
</style>