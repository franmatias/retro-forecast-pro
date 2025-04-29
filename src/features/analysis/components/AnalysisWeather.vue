<template>
  <div class="analysis-container">
    <h1>Análisis Comparativo de Precipitaciones</h1>

    <v-card class="selection-panel">
      <div class="location-selector">
        <h3>Selecciona localizaciones:</h3>
        <v-select
          v-model="selectedLocations"
          :items="uniqueLocations"
          item-title="name"
          item-value="id"
          multiple
          chips
          closable-chips
          label="Selecciona ubicaciones"
          class="mb-3 location-select"
          return-object
        />
      </div>

      <div class="date-range-selector">
        <h3>Selecciona periodo:</h3>
        <div class="date-inputs">
          <div>
            <label for="startDate">Fecha inicio:</label>
            <v-text-field
              v-model="startDate"
              type="date"
              class="w-full"
              :max="endDate || undefined"
              :error-messages="error && error.includes('fecha') ? error : ''"
              hide-details="auto"
            />
          </div>
          <div>
            <label for="endDate">Fecha fin:</label>
            <v-text-field
              v-model="endDate"
              type="date"
              class="w-full"
              :min="startDate || undefined"
              :error-messages="error && error.includes('fecha') ? error : ''"
              hide-details="auto"
            />
          </div>
        </div>
      </div>

      <div class="historical-comparison mb-4">
        <v-checkbox
          v-model="compareWithHistorical"
          label="Comparar con media climatológica histórica (1991-2020)"
          hide-details
        />
      </div>

      <v-btn
        :disabled="isLoading || !isFormValid"
        color="primary"
        class="mt-3"
        :loading="isLoading"
        @click="fetchPrecipitationData"
      >
        Analizar precipitaciones
      </v-btn>
    </v-card>

    <div
      v-if="isLoading"
      class="loading-indicator"
    >
      <v-progress-circular 
        indeterminate 
        color="primary" 
      />
      <p>Obteniendo datos de precipitaciones...</p>
      <p 
        v-if="compareWithHistorical" 
        class="text-caption"
      >
        La obtención de datos históricos puede tardar unos momentos
      </p>
    </div>

    <div
      v-if="error && !error.includes('fecha')"
      class="error-message"
    >
      <v-alert 
        type="error" 
        title="Error" 
        :text="error"
      />
    </div>

    <div
      v-if="showResults"
      class="results-container"
    >
      <!-- Tabla de resumen -->
      <v-card class="summary-table">
        <h2>Resumen de precipitaciones</h2>
        <v-data-table
          :items="precipitationSummary"
          :headers="summaryHeaders"
          class="elevation-1"
        >
          <template #[`item.totalPrecipitation`]="{ item }">
            {{ formatNumber(item.totalPrecipitation) }} mm
          </template>
          <template #[`item.averagePrecipitation`]="{ item }">
            {{ formatNumber(item.averagePrecipitation) }} mm
          </template>
          <template #[`item.maxPrecipitation`]="{ item }">
            {{ formatNumber(item.maxPrecipitation) }} mm
          </template>
          <template #[`item.daysWithRain`]="{ item }">
            {{ item.daysWithRain }} de {{ item.daysTotal }} días
          </template>
          <template #[`item.historicalAverage`]="{ item }">
            <span v-if="item.historicalAverage !== undefined">{{ formatNumber(item.historicalAverage) }} mm</span>
            <span v-else>-</span>
          </template>
          <template #[`item.historicalAnomaly`]="{ item }">
            <span 
              v-if="item.historicalAnomaly !== undefined" 
              :class="getAnomalyClass(item.historicalAnomaly)"
            >
              {{ formatNumber(item.historicalAnomaly) }} mm
              ({{ formatNumber(item.historicalAnomalyPercent) }}%)
            </span>
            <span v-else>-</span>
          </template>
        </v-data-table>
      </v-card>

      <!-- Gráfico principal adaptado según el periodo seleccionado -->
      <v-card class="chart-container">
        <h2>
          {{ chartTitle }}
          <v-chip 
            v-if="aggregationType" 
            size="small" 
            color="primary" 
            class="ml-2"
          >
            {{ aggregationTypeLabel }}
          </v-chip>
        </h2>
        <canvas ref="precipitationChart" />
      </v-card>

      <!-- Gráfico mensual si aplica -->
      <v-card
        v-if="showResults && aggregationType === 'daily'"
        class="monthly-chart-container"
      >
        <h2>Precipitación mensual acumulada</h2>
        <canvas ref="monthlyPrecipitationChart" />
      </v-card>

      <!-- Tabla comparativa detallada -->
      <v-card 
        v-if="showComparativeTable" 
        class="comparative-table"
      >
        <h2>Tabla comparativa detallada</h2>
        <v-data-table
          :items="tableData"
          :headers="comparativeHeaders"
          class="elevation-1"
          :sort-by="[{ key: 'period', order: 'asc' }]"
        >
          <template #[`item.precipitation`]="{ item }">
            <template 
              v-for="(value, key) in item.precipitation" 
              :key="key"
            >
              <div>{{ key }}: {{ formatNumber(value) }} mm</div>
            </template>
          </template>
        </v-data-table>
      </v-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import Chart from 'chart.js/auto'
import { useLocations } from '../composables/useLocations'
import { usePrecipitationAnalysis } from '../composables/usePrecipitationAnalysis'

// Importar composiciones
const { uniqueLocations } = useLocations()
const {
  isLoading,
  error,
  selectedLocations,
  startDate,
  endDate,
  analysisOptions,
  precipitationData,
  showResults,
  isFormValid,
  aggregationType,
  precipitationSummary,
  fetchPrecipitationData,
  getDailyChartData,
  getMonthlyChartData
} = usePrecipitationAnalysis()

// Manejar la opción de comparación histórica directamente
const compareWithHistorical = computed({
  get: () => analysisOptions.value.compareWithHistorical,
  set: (val: boolean) => {
    analysisOptions.value = {
      ...analysisOptions.value,
      compareWithHistorical: val
    }
  }
})

// Referencias para los gráficos
const precipitationChart = ref<HTMLCanvasElement | null>(null)
const monthlyPrecipitationChart = ref<HTMLCanvasElement | null>(null)
let dailyChart: Chart | null = null
let monthlyChart: Chart | null = null

// Detector simple de modo oscuro basado en media query
const isDarkMode = ref(window.matchMedia('(prefers-color-scheme: dark)').matches)
let darkModeQuery: MediaQueryList

// Headers para la tabla de resumen
const summaryHeaders = ref([
  { title: 'Localización', key: 'locationName', sortable: true },
  { title: 'Precipitación total', key: 'totalPrecipitation', sortable: true },
  { title: 'Precipitación media', key: 'averagePrecipitation', sortable: true },
  { title: 'Máxima precipitación', key: 'maxPrecipitation', sortable: true },
  { title: 'Días con lluvia', key: 'daysWithRain', sortable: true }
])

// Añadir columnas de comparación histórica si se solicita
watch(compareWithHistorical, (compareHistorical) => {
  if (compareHistorical) {
    if (!summaryHeaders.value.find(h => h.key === 'historicalAverage')) {
      summaryHeaders.value.push(
        { title: 'Media histórica', key: 'historicalAverage', sortable: true },
        { title: 'Anomalía', key: 'historicalAnomaly', sortable: true }
      )
    }
  } else {
    const historicalIndex = summaryHeaders.value.findIndex(h => h.key === 'historicalAverage')
    if (historicalIndex !== -1) {
      summaryHeaders.value.splice(historicalIndex, 2)
    }
  }
})

// Calcular encabezados para la tabla comparativa
const comparativeHeaders = computed(() => {
  const headers = [
    { title: 'Periodo', key: 'period', sortable: true }
  ]
  
  // Añadir una columna para cada ubicación
  const locationIds = Object.keys(precipitationData.value)
  if (locationIds.length === 0) return headers
  
  // Crear una columna combinada para las precipitaciones
  headers.push({ title: 'Precipitación por ubicación', key: 'precipitation', sortable: false })
  
  return headers
})

// Datos para la tabla comparativa
const tableData = computed(() => {
  const data: { period: string, precipitation: Record<string, number> }[] = []
  const locationIds = Object.keys(precipitationData.value)
  
  if (locationIds.length === 0) return []
  
  // Determinar el tipo de agregación
  if (aggregationType.value === 'daily') {
    // Procesar datos diarios
    const allDates = new Set<string>()
    
    // Recopilar todas las fechas de todos los conjuntos de datos
    locationIds.forEach(locationId => {
      precipitationData.value[locationId].dailyData.forEach(item => {
        allDates.add(item.date)
      })
    })
    
    // Ordenar las fechas
    const sortedDates = Array.from(allDates).sort()
    
    // Crear filas para la tabla
    sortedDates.forEach(date => {
      const row = {
        period: formatDateLabel(date),
        precipitation: {} as Record<string, number>
      }
      
      // Añadir precipitación para cada ubicación
      locationIds.forEach(locationId => {
        const locationData = precipitationData.value[locationId]
        const dayData = locationData.dailyData.find(item => item.date === date)
        
        if (dayData) {
          row.precipitation[locationData.location.name] = dayData.precipitation
        } else {
          row.precipitation[locationData.location.name] = 0
        }
      })
      
      data.push(row)
    })
  } else if (aggregationType.value === 'monthly') {
    // Procesar datos mensuales
    const allMonths = new Set<string>()
    
    // Recopilar todos los meses de todos los conjuntos de datos
    locationIds.forEach(locationId => {
      precipitationData.value[locationId].monthlyData.forEach(item => {
        allMonths.add(item.month)
      })
    })
    
    // Ordenar los meses
    const sortedMonths = Array.from(allMonths).sort()
    
    // Crear filas para la tabla
    sortedMonths.forEach(month => {
      const row = {
        period: formatMonthLabel(month),
        precipitation: {} as Record<string, number>
      }
      
      // Añadir precipitación para cada ubicación
      locationIds.forEach(locationId => {
        const locationData = precipitationData.value[locationId]
        const monthData = locationData.monthlyData.find(item => item.month === month)
        
        if (monthData) {
          row.precipitation[locationData.location.name] = monthData.precipitation
        } else {
          row.precipitation[locationData.location.name] = 0
        }
      })
      
      data.push(row)
    })
  }
  
  return data
})

// Computados
const showComparativeTable = computed(() => {
  return showResults.value && Object.keys(precipitationData.value).length > 0
})

const chartTitle = computed(() => {
  if (aggregationType.value === 'daily') {
    return 'Precipitación diaria'
  } else if (aggregationType.value === 'monthly') {
    return 'Precipitación mensual'
  } else {
    return 'Precipitación anual'
  }
})

const aggregationTypeLabel = computed(() => {
  if (aggregationType.value === 'daily') {
    return 'Datos diarios'
  } else if (aggregationType.value === 'monthly') {
    return 'Datos mensuales'
  } else {
    return 'Datos anuales'
  }
})

// Observar cambios en el modo oscuro del sistema
onMounted(() => {
  darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)')
  const updateDarkMode = (e: MediaQueryListEvent) => {
    isDarkMode.value = e.matches
  }

  darkModeQuery.addEventListener('change', updateDarkMode)
})

// Limpiar event listeners cuando el componente se desmonta
onBeforeUnmount(() => {
  if (darkModeQuery) {
    darkModeQuery.removeEventListener('change', () => {})
  }
  
  // Destruir gráficos
  if (dailyChart) dailyChart.destroy()
  if (monthlyChart) monthlyChart.destroy()
})

// Obtener color de texto según el tema
const getTextColor = () => {
  return isDarkMode.value ? '#f5f5f5' : '#333'
}

// Obtener color de cuadrícula según el tema
const getGridColor = () => {
  return isDarkMode.value ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
}

// Formateadores
const formatDateLabel = (dateStr: string): string => {
  try {
    const date = new Date(dateStr)
    return date.toLocaleDateString('es', { day: 'numeric', month: 'short' })
  } catch (err) {
    console.error('Error al formatear etiqueta de fecha:', err)
    return dateStr
  }
}

const formatMonthLabel = (monthStr: string): string => {
  try {
    const [year, month] = monthStr.split('-')
    const date = new Date(parseInt(year), parseInt(month) - 1, 1)
    return date.toLocaleDateString('es', { month: 'long', year: 'numeric' })
  } catch (err) {
    console.error('Error al formatear etiqueta de mes:', err)
    return monthStr
  }
}

const formatNumber = (value: number | undefined): string => {
  if (value === undefined) return '-'
  return value.toFixed(1)
}

const getAnomalyClass = (anomaly: number | undefined): string => {
  if (anomaly === undefined) return ''
  if (anomaly > 0) return 'text-success'
  if (anomaly < 0) return 'text-error'
  return ''
}

// Función para renderizar los gráficos
const renderCharts = () => {
  // Destruir gráficos previos si existen
  if (dailyChart) dailyChart.destroy()
  if (monthlyChart) monthlyChart.destroy()
  
  // Renderizar el gráfico principal según el tipo de agregación
  if (precipitationChart.value) {
    const chartData = getDailyChartData()
    if (chartData) {
      dailyChart = new Chart(precipitationChart.value, {
        type: 'line',
        data: {
          labels: chartData.labels,
          datasets: chartData.datasets
        },
        options: {
          responsive: true,
          plugins: {
            title: {
              display: true,
              text: 'Precipitación (mm)',
              color: getTextColor()
            },
            legend: {
              labels: {
                color: getTextColor()
              }
            }
          },
          scales: {
            x: {
              ticks: {
                color: getTextColor(),
                maxRotation: 45,
                minRotation: 45
              },
              grid: {
                color: getGridColor()
              }
            },
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: 'Precipitación (mm)',
                color: getTextColor()
              },
              ticks: {
                color: getTextColor()
              },
              grid: {
                color: getGridColor()
              }
            }
          }
        }
      })
    }
  }
  
  // Renderizar el gráfico mensual si estamos en vista diaria
  if (monthlyPrecipitationChart.value && aggregationType.value === 'daily') {
    const monthlyData = getMonthlyChartData()
    if (monthlyData) {
      monthlyChart = new Chart(monthlyPrecipitationChart.value, {
        type: 'bar',
        data: {
          labels: monthlyData.labels,
          datasets: monthlyData.datasets
        },
        options: {
          responsive: true,
          plugins: {
            title: {
              display: true,
              text: 'Precipitación Mensual Acumulada (mm)',
              color: getTextColor()
            },
            legend: {
              labels: {
                color: getTextColor()
              }
            }
          },
          scales: {
            x: {
              ticks: {
                color: getTextColor()
              },
              grid: {
                color: getGridColor()
              }
            },
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: 'Precipitación (mm)',
                color: getTextColor()
              },
              ticks: {
                color: getTextColor()
              },
              grid: {
                color: getGridColor()
              }
            }
          }
        }
      })
    }
  }
}

// Observar cambios en los datos o en el tema
watch([() => showResults.value, isDarkMode], () => {
  if (showResults.value) {
    // Esperar a que el DOM se actualice
    setTimeout(() => {
      renderCharts()
    }, 100)
  }
})
</script>

<style scoped>
.analysis-container {
  padding: 20px;
  width: 100%;
  min-height: 100%;
  flex: 1;
  margin: 0;
  color: var(--text-color, #f0f0f0);
  overflow-x: hidden;
}

h1, h2, h3 {
  color: var(--text-color, #f0f0f0);
  margin-bottom: 1rem;
}

.selection-panel {
  padding: 25px;
  margin-bottom: 30px;
  background-color: rgba(30, 30, 30, 0.7) !important;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.location-selector, .date-range-selector {
  margin-bottom: 20px;
}

.location-select {
  width: 100%;
}

.date-inputs {
  display: flex;
  gap: 20px;
  margin-top: 10px;
}

.loading-indicator {
  text-align: center;
  margin: 20px 0;
  font-style: italic;
  color: var(--text-secondary, #e0e0e0);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.error-message {
  margin: 20px 0;
  text-align: center;
}

.results-container {
  margin-top: 30px;
  display: grid;
  grid-template-columns: 1fr;
  gap: 30px;
}

.chart-container, 
.monthly-chart-container, 
.summary-table,
.comparative-table {
  padding: 25px;
  background-color: rgba(30, 30, 30, 0.7) !important;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2) !important;
}

.text-success {
  color: #81c784;
  font-weight: 600;
}

.text-error {
  color: #ff8a80;
  font-weight: 600;
}

/* Responsive layout para pantallas grandes */
@media (min-width: 1200px) {
  .results-container {
    grid-template-columns: repeat(auto-fit, minmax(600px, 1fr));
  }
}

@media (prefers-color-scheme: dark) {
  :root {
    --text-color: #f0f0f0;
    --text-secondary: #e0e0e0;
  }
}
</style>