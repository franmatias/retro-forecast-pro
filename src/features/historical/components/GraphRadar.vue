<template>
  <v-card>
    <v-card-title class="text-h6 d-flex justify-space-between align-center">
      <span>Comparativa Meteorológica</span>
      <div class="d-flex align-center">
        <!-- Botón para mostrar/ocultar tabla -->
        <v-btn 
          class="ms-2" 
          size="small" 
          :icon="showTable ? 'mdi-table-off' : 'mdi-table'"
          :title="showTable ? 'Ocultar tabla' : 'Mostrar tabla'"
          @click="toggleTable"
        />
      </div>
    </v-card-title>
    
    <v-card-text>
      <!-- Panel de descripción -->
      <v-alert
        v-if="selectedLocations.length > 1"
        type="info"
        variant="tonal"
        density="compact"
        class="mb-4"
      >
        Este gráfico radar compara los principales indicadores meteorológicos entre ubicaciones.
        Los valores se normalizan para permitir una comparación visual efectiva.
      </v-alert>
      
      <v-alert
        v-else
        type="info"
        variant="tonal"
        density="compact"
        class="mb-4"
      >
        Selecciona más ubicaciones para ver una comparación en gráfico radar.
      </v-alert>
      
      <!-- Gráfico radar -->
      <div class="radar-chart-container">
        <canvas ref="radarChart" />
      </div>
      
      <!-- Tabla de datos -->
      <v-expand-transition>
        <div v-show="showTable && tableData.length > 0">
          <v-data-table
            :headers="tableHeaders"
            :items="tableData"
            density="compact"
            class="mt-4"
            :items-per-page="5"
            :items-per-page-options="[5, 10, -1]"
          />
        </div>
      </v-expand-transition>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue';
import { Chart, RadarController, LineElement, PointElement, LinearScale, RadialLinearScale, Tooltip, Legend, Filler } from 'chart.js';

// Registrar los componentes necesarios para gráficos radar
Chart.register(
  RadarController,
  LineElement,
  PointElement,
  LinearScale,
  RadialLinearScale,
  Tooltip,
  Legend,
  Filler
);

interface WeatherData {
  date: string;
  temperature?: number;
  rainfall?: number;
  wind_speed?: number;
  humidity?: number;
  pressure?: number;
  sunshine_hours?: number;
  locationId: string;
  [key: string]: string | number | undefined;
}

// Eliminada la interfaz RadarDataPoint que no se utilizaba

interface NormalizedRange {
  min: number;
  max: number;
}

// Definir interfaz específica para los datasets del gráfico radar
interface RadarDataset {
  label: string;
  data: number[];
  backgroundColor: string;
  borderColor: string;
  borderWidth: number;
  pointBackgroundColor: string;
  pointBorderColor: string;
  pointHoverBackgroundColor: string;
  pointHoverBorderColor: string;
}

const props = defineProps<{
  historicalData: WeatherData[];
  selectedLocations: string[];
  getLocationDisplayName: (id: string) => string;
}>();

// Estado local
const radarChart = ref<HTMLCanvasElement | null>(null);
const showTable = ref(true);
let chart: Chart | null = null;

// Constantes para normalización
const NORMAL_RANGES: Record<string, NormalizedRange> = {
  precipitation: { min: 0, max: 100 },    // mm
  wind: { min: 0, max: 50 },              // km/h
  humidity: { min: 0, max: 100 },         // %
  pressure: { min: 970, max: 1040 },      // hPa
  sunshine: { min: 0, max: 12 }           // horas
};

// Función para normalizar valores
function normalizeValue(value: number, key: string): number {
  // Mapeo de nombres de propiedades a las claves en NORMAL_RANGES
  const keyMapping: Record<string, keyof typeof NORMAL_RANGES> = {
    'rainfall': 'precipitation',
    'wind_speed': 'wind',
    'humidity': 'humidity',
    'pressure': 'pressure',
    'sunshine_hours': 'sunshine'
  };
  
  // Obtener la clave correcta del mapeo
  const normalRangeKey = keyMapping[key];
  
  // Si la clave no existe en el mapeo, devolver el valor sin normalizar
  if (!normalRangeKey) return value;
  
  const range = NORMAL_RANGES[normalRangeKey];
  // Normalizar a un rango de 0-100 para visualización en el radar
  return Math.min(Math.max(((value - range.min) / (range.max - range.min)) * 100, 0), 100);
}

// Función modificada para generar colores más brillantes con mejor contraste en modo oscuro
function getRandomColor(alpha = 1): string {
  // Paleta de colores brillantes predefinidos con buen contraste en modo oscuro
  const brightColors = [
    'rgba(255, 99, 132, ' + alpha + ')',    // Rosa
    'rgba(54, 162, 235, ' + alpha + ')',    // Azul
    'rgba(255, 206, 86, ' + alpha + ')',    // Amarillo
    'rgba(75, 192, 192, ' + alpha + ')',    // Verde azulado
    'rgba(153, 102, 255, ' + alpha + ')',   // Púrpura
    'rgba(255, 159, 64, ' + alpha + ')',    // Naranja
    'rgba(0, 204, 153, ' + alpha + ')',     // Verde menta
    'rgba(255, 102, 255, ' + alpha + ')',   // Magenta
    'rgba(102, 255, 255, ' + alpha + ')',   // Cian
    'rgba(255, 255, 102, ' + alpha + ')'    // Amarillo claro
  ];
  
  // Seleccionar un color aleatorio de la paleta
  const colorIndex = Math.floor(Math.random() * brightColors.length);
  return brightColors[colorIndex];
}

// Función para alternar la visibilidad de la tabla
function toggleTable(): void {
  showTable.value = !showTable.value;
}

// Procesar datos meteorológicos para el gráfico radar - Corregido el tipo de retorno
function processDataForRadar(): { labels: string[], datasets: RadarDataset[] } {
  const datasets = props.selectedLocations.map(locationId => {
    // Filtrar datos para esta ubicación
    const locationData = props.historicalData.filter(d => d.locationId === locationId);
    const color = getRandomColor();
    
    if (!locationData.length) {
      return {
        label: props.getLocationDisplayName(locationId),
        data: [0, 0, 0, 0, 0],
        backgroundColor: color + '20',
        borderColor: color,
        borderWidth: 1,
        pointBackgroundColor: color,
        pointBorderColor: "#fff",
        pointHoverBackgroundColor: "#fff",
        pointHoverBorderColor: color
      };
    }
    
    // Calcular promedios para cada categoría
    const avgRainfall = locationData.reduce((sum, item) => 
      sum + (typeof item.rainfall === 'number' ? item.rainfall : 0), 0) / locationData.length;
      
    const avgWindSpeed = locationData.reduce((sum, item) => 
      sum + (typeof item.wind_speed === 'number' ? item.wind_speed : 0), 0) / locationData.length;
      
    const avgHumidity = locationData.reduce((sum, item) => 
      sum + (typeof item.humidity === 'number' ? item.humidity : 0), 0) / locationData.length;
      
    const avgPressure = locationData.reduce((sum, item) => 
      sum + (typeof item.pressure === 'number' ? item.pressure : 0), 0) / locationData.length;
      
    const avgSunshine = locationData.reduce((sum, item) => 
      sum + (typeof item.sunshine_hours === 'number' ? item.sunshine_hours : 0), 0) / locationData.length;
    
    // Normalizar valores para el gráfico radar
    const normalizedData = [
      normalizeValue(avgRainfall, 'rainfall'),
      normalizeValue(avgWindSpeed, 'wind_speed'),
      normalizeValue(avgHumidity, 'humidity'),
      normalizeValue(avgPressure, 'pressure'),
      normalizeValue(avgSunshine, 'sunshine_hours')
    ];
    
    return {
      label: props.getLocationDisplayName(locationId),
      data: normalizedData,
      backgroundColor: color + '20',
      borderColor: color,
      borderWidth: 1,
      pointBackgroundColor: color,
      pointBorderColor: "#fff",
      pointHoverBackgroundColor: "#fff",
      pointHoverBorderColor: color
    };
  });
  
  return {
    labels: ['Precipitación', 'Viento', 'Humedad', 'Presión', 'Horas de sol'],
    datasets
  };
}

// Encabezados de la tabla - Corregido el tipo de align para que sea específicamente 'start', 'end' o 'center'
const tableHeaders = computed(() => {
  return [
    { title: 'Ubicación', key: 'location', align: 'start' as const, sortable: true },
    { title: 'Precipitación (mm)', key: 'precipitation', align: 'end' as const, sortable: true },
    { title: 'Viento (km/h)', key: 'wind', align: 'end' as const, sortable: true },
    { title: 'Humedad (%)', key: 'humidity', align: 'end' as const, sortable: true },
    { title: 'Presión (hPa)', key: 'pressure', align: 'end' as const, sortable: true },
    { title: 'Horas de Sol', key: 'sunshine', align: 'end' as const, sortable: true }
  ];
});

// Datos para la tabla
const tableData = computed(() => {
  return props.selectedLocations.map(locationId => {
    const locationName = props.getLocationDisplayName(locationId);
    const locationData = props.historicalData.filter(item => item.locationId === locationId);
    
    if (!locationData.length) {
      return {
        location: locationName,
        precipitation: 'N/A',
        wind: 'N/A',
        humidity: 'N/A',
        pressure: 'N/A',
        sunshine: 'N/A'
      };
    }
    
    // Calcular promedios para cada categoría
    const avgRainfall = locationData.reduce((sum, item) => 
      sum + (typeof item.rainfall === 'number' ? item.rainfall : 0), 0) / locationData.length;
      
    const avgWindSpeed = locationData.reduce((sum, item) => 
      sum + (typeof item.wind_speed === 'number' ? item.wind_speed : 0), 0) / locationData.length;
      
    const avgHumidity = locationData.reduce((sum, item) => 
      sum + (typeof item.humidity === 'number' ? item.humidity : 0), 0) / locationData.length;
      
    const avgPressure = locationData.reduce((sum, item) => 
      sum + (typeof item.pressure === 'number' ? item.pressure : 0), 0) / locationData.length;
      
    const avgSunshine = locationData.reduce((sum, item) => 
      sum + (typeof item.sunshine_hours === 'number' ? item.sunshine_hours : 0), 0) / locationData.length;
    
    return {
      location: locationName,
      precipitation: avgRainfall.toFixed(1),
      wind: avgWindSpeed.toFixed(1),
      humidity: avgHumidity.toFixed(1),
      pressure: avgPressure.toFixed(0),
      sunshine: avgSunshine.toFixed(1)
    };
  });
});

// Crear/actualizar el gráfico radar
function updateChart(): void {
  if (!radarChart.value) return;
  
  // Destruir gráfico existente si hay uno
  if (chart) {
    chart.destroy();
  }
  
  // Procesar datos para el radar
  const { labels, datasets } = processDataForRadar();
  
  // Crear nuevo gráfico radar con opciones mejoradas para modo oscuro
  chart = new Chart(radarChart.value, {
    type: 'radar',
    data: { labels, datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
          labels: {
            color: 'rgba(255, 255, 255, 0.87)' // Mejor legibilidad en modo oscuro
          }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const label = context.dataset.label || '';
              const value = context.raw !== null ? context.raw : 'N/A';
              return `${label}: ${value}%`;
            }
          },
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          titleColor: 'rgba(255, 255, 255, 1)',
          bodyColor: 'rgba(255, 255, 255, 1)',
          borderColor: 'rgba(255, 255, 255, 0.2)',
          borderWidth: 1
        }
      },
      scales: {
        r: {
          beginAtZero: true,
          max: 100,
          ticks: {
            display: false
          },
          angleLines: {
            color: 'rgba(255, 255, 255, 0.2)' // Líneas radiales más visibles
          },
          grid: {
            color: 'rgba(255, 255, 255, 0.15)' // Cuadrícula más visible
          },
          pointLabels: {
            color: 'rgba(255, 255, 255, 0.87)' // Etiquetas más legibles
          }
        }
      }
    }
  });
}

// Observar cambios en los datos para actualizar el gráfico
watch(
  () => [props.historicalData, props.selectedLocations],
  () => {
    if (props.historicalData.length > 0 && props.selectedLocations.length > 0) {
      updateChart();
    }
  },
  { deep: true }
);

// Inicializar el gráfico cuando el componente se monta
onMounted(() => {
  if (props.historicalData.length > 0 && props.selectedLocations.length > 0) {
    updateChart();
  }
});
</script>

<style scoped>
.radar-chart-container {
  position: relative;
  height: 350px;
  margin: 0 auto;
  max-width: 700px;
}

@media (max-width: 600px) {
  .radar-chart-container {
    height: 300px;
  }
}
</style>
