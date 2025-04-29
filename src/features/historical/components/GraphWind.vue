<template>
  <v-card>
    <v-card-title class="text-h6 d-flex justify-space-between align-center">
      <span>Viento</span>
      <div class="d-flex align-center">
        <!-- Selector de fecha específica para vista por horas -->
        <v-text-field
          v-if="viewMode === 'days'"
          v-model="selectedSpecificDay"
          type="date"
          label="Fecha para datos horarios"
          density="compact"
          hide-details
          class="me-2"
          style="max-width: 180px;"
          :min="minDate"
          :max="maxDate"
          :disabled="!dates.length"
          @update:model-value="handleSpecificDayChange"
        />
        
        <!-- Botones de vista temporal -->
        <v-btn-group density="comfortable">
          <v-btn 
            :color="viewMode === 'days' ? 'primary' : undefined"
            size="small"
            @click="setViewMode('days')"
          >
            Días
          </v-btn>
          <v-btn 
            :color="viewMode === 'weeks' ? 'primary' : undefined"
            size="small"
            @click="setViewMode('weeks')"
          >
            Semanas
          </v-btn>
          <v-btn 
            :color="viewMode === 'months' ? 'primary' : undefined"
            size="small"
            @click="setViewMode('months')"
          >
            Meses
          </v-btn>
        </v-btn-group>
        
        <!-- Botón para alternar entre velocidad y dirección -->
        <v-btn-group 
          density="comfortable" 
          class="ms-2"
        >
          <v-btn 
            :color="showVelocity ? 'primary' : undefined"
            size="small"
            @click="toggleView('velocity')"
          >
            Velocidad
          </v-btn>
          <v-btn 
            :color="showDirection ? 'primary' : undefined"
            size="small"
            @click="toggleView('direction')"
          >
            Dirección
          </v-btn>
          <v-btn 
            :color="showBoth ? 'primary' : undefined"
            size="small"
            @click="toggleView('both')"
          >
            Ambos
          </v-btn>
        </v-btn-group>
        
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
      <!-- Panel de estadísticas -->
      <v-row class="mb-4">
        <v-col 
          cols="12" 
          sm="4"
        >
          <v-card 
            variant="outlined" 
            class="pa-2 text-center"
          >
            <div class="text-caption">
              Velocidad Media
            </div>
            <div class="text-h6">
              {{ getAverageWindSpeed() }} km/h
            </div>
          </v-card>
        </v-col>
        <v-col 
          cols="12" 
          sm="4"
        >
          <v-card 
            variant="outlined" 
            class="pa-2 text-center"
          >
            <div class="text-caption">
              Velocidad Máxima
            </div>
            <div class="text-h6">
              {{ getMaxWindSpeed() }} km/h
            </div>
          </v-card>
        </v-col>
        <v-col 
          cols="12" 
          sm="4"
        >
          <v-card 
            variant="outlined" 
            class="pa-2 text-center"
          >
            <div class="text-caption">
              Dirección Predominante
            </div>
            <div class="text-h6">
              {{ getPredominantWindDirection() }}
            </div>
          </v-card>
        </v-col>
      </v-row>
      
      <!-- Gráficos -->
      <div class="wind-charts">
        <!-- Gráfico de velocidad del viento -->
        <div 
          v-show="showVelocity || showBoth" 
          class="mb-4"
        >
          <canvas ref="windSpeedChart" />
        </div>
        
        <!-- Gráfico de dirección del viento (rosa de los vientos) -->
        <div 
          v-if="showDirection || showBoth" 
          class="wind-direction-container mb-4"
        >
          <canvas ref="windDirectionChart" />
        </div>
      </div>
      
      <!-- Tabla de datos -->
      <v-expand-transition>
        <div v-show="showTable">
          <v-data-table
            :headers="getTableHeaders()"
            :items="getTableData()"
            density="compact"
            class="mt-4"
            :items-per-page="5"
            :items-per-page-options="[5, 10, 20, -1]"
          />
        </div>
      </v-expand-transition>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, nextTick, computed } from 'vue'
import { Chart, CategoryScale, LinearScale, PointElement, LineElement, 
         BarElement, RadialLinearScale, Title, Tooltip, Legend, 
         LineController, BarController, PolarAreaController, Filler,
         ArcElement } from 'chart.js'  // Añadir ArcElement a las importaciones

// Registrar solo los componentes necesarios para este gráfico
Chart.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  LineController,
  BarController,
  PolarAreaController,
  ArcElement,  // Registrar ArcElement
  Filler
)

interface WeatherData {
  date: string
  wind_speed: number
  wind_direction: number
  locationId: string
  [key: string]: string | number | undefined
}

interface HourlyData {
  time: string
  wind_speed: number
  wind_direction: number
  locationId: string
  displayName: string
}

// Definir un tipo para los datasets de los gráficos
interface ChartDataset {
  label: string;
  data: (number | null)[];
  backgroundColor?: string | string[];
  borderColor?: string;
  borderWidth?: number;
  hidden?: boolean;
}

// Definir tipos específicos para arreglos y reducers para evitar errores de tipo implícito
type WeekData = {
  wind_speeds: number[];
  wind_directions: number[];
  count: number;
  max_speed?: number;
  avg_direction?: number;
}

type MonthData = WeekData;

type WeekRow = {
  date: string;
  [key: string]: string | number;
}

type MonthRow = WeekRow;

const props = defineProps<{
  dates: string[]
  historicalData: WeatherData[]
  selectedLocations: string[]
  getLocationDisplayName: (id: string) => string
}>()

// Estados para el control de la visualización
const windSpeedChart = ref<HTMLCanvasElement | null>(null)
const windDirectionChart = ref<HTMLCanvasElement | null>(null)
const showTable = ref(true)
const viewMode = ref<'days' | 'weeks' | 'months'>('days')
let speedChart: Chart | null = null
let directionChart: Chart | null = null

// Control de lo que se muestra (velocidad, dirección o ambos)
const showVelocity = ref(true)
const showDirection = ref(false)
const showBoth = ref(false)

// Añadir un nuevo estado para almacenar datos por hora del primer día
const hourlyData = ref<HourlyData[]>([]);
const isLoadingHourly = ref(false);

// Añadir estado para la fecha específica seleccionada
const selectedSpecificDay = ref('');

// Calcular la fecha mínima y máxima disponibles para el selector
const minDate = computed(() => {
  return props.dates.length > 0 ? props.dates[0] : '';
});

const maxDate = computed(() => {
  return props.dates.length > 0 ? props.dates[props.dates.length - 1] : '';
});

// Función para manejar el cambio en la fecha específica
async function handleSpecificDayChange(date: string) {
  if (!date || !props.dates.includes(date)) {
    // Si la fecha no es válida o no está en nuestro conjunto de datos, usar la primera fecha
    selectedSpecificDay.value = props.dates[0] || '';
  }
  
  if (selectedSpecificDay.value && viewMode.value === 'days') {
    // Cargar datos horarios para la fecha seleccionada
    await fetchHourlyData(selectedSpecificDay.value);
    updateCharts();
  }
}

// Función para alternar la visibilidad de la tabla
function toggleTable(): void {
  showTable.value = !showTable.value
}

// Función para alternar entre visualizaciones
function toggleView(mode: 'velocity' | 'direction' | 'both'): void {
  showVelocity.value = mode === 'velocity' || mode === 'both';
  showDirection.value = mode === 'direction' || mode === 'both';
  showBoth.value = mode === 'both';
  
  // Actualizar los gráficos
  nextTick(() => {
    updateCharts();
  });
}

// Modificar la función setViewMode para inicializar selectedSpecificDay si no está establecido
async function setViewMode(mode: 'days' | 'weeks' | 'months'): Promise<void> {
  viewMode.value = mode;
  
  // Si cambiamos a vista días y tenemos ubicaciones seleccionadas
  if (mode === 'days' && props.selectedLocations.length > 0 && props.dates.length > 0) {
    // Si no hay una fecha específica seleccionada, usar la primera fecha disponible
    if (!selectedSpecificDay.value) {
      selectedSpecificDay.value = props.dates[0];
    }
    
    // Cargar datos para la fecha seleccionada
    await fetchHourlyData(selectedSpecificDay.value);
  }
  
  updateCharts();
}

// Función para crear colores aleatorios
function getRandomColor(): string {
  const letters = '0123456789ABCDEF'
  let color = '#'
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)]
  }
  return color
}

// Colores con transparencia para barras
function getRandomColorWithOpacity(opacity = 0.7): string {
  const color = getRandomColor();
  // Convertir de HEX a RGBA
  const r = parseInt(color.slice(1, 3), 16);
  const g = parseInt(color.slice(3, 5), 16);
  const b = parseInt(color.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

// Estadísticas de viento
function getAverageWindSpeed(): string {
  if (!props.historicalData.length) return 'N/A'
  
  let sum = 0
  let count = 0
  
  props.historicalData.forEach(data => {
    if (typeof data.wind_speed === 'number') {
      sum += data.wind_speed
      count++
    }
  })
  
  return count > 0 ? (sum / count).toFixed(1) : 'N/A'
}

function getMaxWindSpeed(): string {
  if (!props.historicalData.length) return 'N/A'
  
  let maxSpeed = -Infinity
  
  props.historicalData.forEach(data => {
    if (typeof data.wind_speed === 'number' && data.wind_speed > maxSpeed) {
      maxSpeed = data.wind_speed
    }
  })
  
  return maxSpeed !== -Infinity ? maxSpeed.toFixed(1) : 'N/A'
}

function getPredominantWindDirection(): string {
  if (!props.historicalData.length) return 'N/A'
  
  // Crear un histograma de direcciones por sectores (N, NE, E, SE, S, SW, W, NW)
  const sectors = {
    'N': 0, 'NE': 0, 'E': 0, 'SE': 0, 'S': 0, 'SW': 0, 'W': 0, 'NW': 0
  };
  
  props.historicalData.forEach(data => {
    if (typeof data.wind_direction === 'number') {
      const dir = data.wind_direction;
      
      // Convertir ángulo a sector
      if (dir > 337.5 || dir <= 22.5) sectors['N']++;
      else if (dir > 22.5 && dir <= 67.5) sectors['NE']++;
      else if (dir > 67.5 && dir <= 112.5) sectors['E']++;
      else if (dir > 112.5 && dir <= 157.5) sectors['SE']++;
      else if (dir > 157.5 && dir <= 202.5) sectors['S']++;
      else if (dir > 202.5 && dir <= 247.5) sectors['SW']++;
      else if (dir > 247.5 && dir <= 292.5) sectors['W']++;
      else if (dir > 292.5 && dir <= 337.5) sectors['NW']++;
    }
  });
  
  // Determinar el sector predominante
  let predominantSector = 'N';
  let maxCount = 0;
  
  Object.entries(sectors).forEach(([sector, count]) => {
    if (count > maxCount) {
      maxCount = count;
      predominantSector = sector;
    }
  });
  
  return predominantSector;
}

// Procesar datos según la vista seleccionada
function processSpeedDataByView(): { labels: string[], datasets: ChartDataset[] } {
  if (!props.historicalData.length) return { labels: [], datasets: [] }
  
  if (viewMode.value === 'days') {
    return processDailySpeedView()
  } else if (viewMode.value === 'weeks') {
    return processWeeklySpeedView()
  } else {
    return processMonthlySpeedView()
  }
}

// Procesar datos de dirección del viento
function processDirectionData(): { labels: string[], datasets: ChartDataset[] } {
  // Definir etiquetas para los 8 puntos cardinales
  const directionLabels = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  
  // Inicializar conteo por dirección para cada ubicación
  const directionCounts: Record<string, number[]> = {};
  
  props.selectedLocations.forEach(locId => {
    directionCounts[locId] = Array(8).fill(0);
  });
  
  // Calcular la frecuencia de cada dirección
  props.historicalData.forEach(data => {
    if (props.selectedLocations.includes(data.locationId) && typeof data.wind_direction === 'number') {
      const dirIndex = Math.floor(((data.wind_direction + 22.5) % 360) / 45);
      directionCounts[data.locationId][dirIndex]++;  // Corregido: usamos data.locationId en lugar de locId
    }
  });
  
  // Crear datasets para el gráfico polar
  const datasets = props.selectedLocations.map(locId => {
    return {
      label: props.getLocationDisplayName(locId),
      data: directionCounts[locId],
      backgroundColor: Array(8).fill(0).map(() => getRandomColorWithOpacity(0.6)),
      borderWidth: 1
    };
  });
  
  return { labels: directionLabels, datasets };
}

// Procesamiento de datos de velocidad para vista diaria
function processDailySpeedView(): { labels: string[], datasets: ChartDataset[] } {
  // Si tenemos datos horarios, los usamos
  if (hourlyData.value.length > 0) {
    // Agrupar datos por ubicación
    const locationGroups = new Map<string, HourlyData[]>();
    hourlyData.value.forEach(item => {
      if (!locationGroups.has(item.locationId)) {
        locationGroups.set(item.locationId, []);
      }
      locationGroups.get(item.locationId)?.push(item);
    });
    
    // Crear conjuntos de datos para el gráfico
    const hourLabels = hourlyData.value
      .filter(d => d.locationId === props.selectedLocations[0])
      .map(d => new Date(d.time).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' }));
    
    const datasets = Array.from(locationGroups.entries()).map(([locationId, data]) => {
      return {
        label: props.getLocationDisplayName(locationId),
        data: data.map(d => d.wind_speed),
        borderColor: getRandomColor(),
        backgroundColor: getRandomColorWithOpacity(0.2),
        tension: 0.4,
        fill: true
      };
    });
    
    return { labels: hourLabels, datasets };
  }
  
  // Si no hay datos horarios, usar los datos diarios
  const labels = props.dates;
  const datasets = props.selectedLocations.map(locationId => {
    const displayName = props.getLocationDisplayName(locationId);
    const filteredData = props.historicalData.filter(d => d.locationId === locationId);
    
    return {
      label: displayName,
      data: filteredData.map(d => d.wind_speed),
      borderColor: getRandomColor(),
      backgroundColor: getRandomColorWithOpacity(0.2),
      tension: 0.4,
      fill: true
    };
  });
  
  return { labels, datasets };
}

// Procesamiento de datos para vista semanal
function processWeeklySpeedView(): { labels: string[], datasets: ChartDataset[] } {
  // Agrupar datos por semana
  const weeklyData = new Map<string, Record<string, WeekData>>();
  const weekLabels: string[] = [];
  
  // Procesar todas las fechas
  props.dates.forEach(dateStr => {
    const date = new Date(dateStr);
    // Obtener el inicio de la semana (primer día de la semana)
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - date.getDay()); // Domingo como primer día de la semana
    
    // Formato para la etiqueta de semana
    const weekLabel = `${startOfWeek.toLocaleDateString('es', { day: '2-digit', month: '2-digit' })} - ${new Date(startOfWeek.getTime() + 6 * 24 * 60 * 60 * 1000).toLocaleDateString('es', { day: '2-digit', month: '2-digit' })}`;
    
    if (!weeklyData.has(weekLabel)) {
      weeklyData.set(weekLabel, {});
      weekLabels.push(weekLabel);
    }
    
    // Agrupar datos por ubicación para cada semana
    props.selectedLocations.forEach(locationId => {
      if (!weeklyData.get(weekLabel)?.[locationId]) {
        if (weeklyData.get(weekLabel)) {
          weeklyData.get(weekLabel)![locationId] = {
            wind_speeds: [],
            wind_directions: [],
            count: 0,
            max_speed: 0
          };
        }
      }
      
      const dataForDate = props.historicalData.find(d => d.date === dateStr && d.locationId === locationId);
      if (dataForDate && typeof dataForDate.wind_speed === 'number') {
        if (weeklyData.get(weekLabel)?.[locationId]) {
          weeklyData.get(weekLabel)![locationId].wind_speeds.push(dataForDate.wind_speed);
          weeklyData.get(weekLabel)![locationId].wind_directions.push(dataForDate.wind_direction);
          weeklyData.get(weekLabel)![locationId].count++;
          
          // Actualizar velocidad máxima
          if ((dataForDate.wind_speed > (weeklyData.get(weekLabel)![locationId].max_speed || 0))) {
            weeklyData.get(weekLabel)![locationId].max_speed = dataForDate.wind_speed;
          }
        }
      }
    });
  });
  
  // Crear datasets para cada ubicación (velocidad media semanal)
  const datasets = props.selectedLocations.map(locationId => {
    const displayName = props.getLocationDisplayName(locationId);
    const data = weekLabels.map(week => {
      const weekData = weeklyData.get(week)?.[locationId];
      if (weekData && weekData.count > 0) {
        // Calcular velocidad media semanal
        return weekData.wind_speeds.reduce((sum: number, speed: number) => sum + speed, 0) / weekData.count;
      }
      return null;
    });
    
    return {
      label: displayName,
      data,
      borderColor: getRandomColor(),
      backgroundColor: getRandomColorWithOpacity(0.2),
      tension: 0.4,
      fill: true
    };
  });
  
  return { labels: weekLabels, datasets };
}

// Procesamiento de datos para vista mensual
function processMonthlySpeedView(): { labels: string[], datasets: ChartDataset[] } {
  // Agrupar datos por mes
  const monthlyData = new Map<string, Record<string, MonthData>>();
  const monthLabels: string[] = [];
  
  // Procesar todas las fechas
  props.dates.forEach(dateStr => {
    const date = new Date(dateStr);
    // Formato para la etiqueta de mes
    const monthLabel = date.toLocaleDateString('es', { month: 'long', year: 'numeric' });
    
    if (!monthlyData.has(monthLabel)) {
      monthlyData.set(monthLabel, {});
      monthLabels.push(monthLabel);
    }
    
    // Agrupar datos por ubicación para cada mes
    props.selectedLocations.forEach(locationId => {
      if (!monthlyData.get(monthLabel)?.[locationId]) {
        if (monthlyData.get(monthLabel)) {
          monthlyData.get(monthLabel)![locationId] = {
            wind_speeds: [],
            wind_directions: [],
            count: 0,
            max_speed: 0
          };
        }
      }
      
      const dataForDate = props.historicalData.find(d => d.date === dateStr && d.locationId === locationId);
      if (dataForDate && typeof dataForDate.wind_speed === 'number') {
        if (monthlyData.get(monthLabel)?.[locationId]) {
          monthlyData.get(monthLabel)![locationId].wind_speeds.push(dataForDate.wind_speed);
          monthlyData.get(monthLabel)![locationId].wind_directions.push(dataForDate.wind_direction);
          monthlyData.get(monthLabel)![locationId].count++;
          
          // Actualizar velocidad máxima
          if ((dataForDate.wind_speed > (monthlyData.get(monthLabel)![locationId].max_speed || 0))) {
            monthlyData.get(monthLabel)![locationId].max_speed = dataForDate.wind_speed;
          }
        }
      }
    });
  });
  
  // Crear datasets para cada ubicación (velocidad media mensual)
  const datasets = props.selectedLocations.map(locationId => {
    const displayName = props.getLocationDisplayName(locationId);
    const data = monthLabels.map(month => {
      const monthData = monthlyData.get(month)?.[locationId];
      if (monthData && monthData.count > 0) {
        // Calcular velocidad media mensual
        return monthData.wind_speeds.reduce((sum: number, speed) => sum + speed, 0) / monthData.count;
      }
      return null;
    });
    
    return {
      label: displayName,
      data,
      borderColor: getRandomColor(),
      backgroundColor: getRandomColorWithOpacity(0.2),
      tension: 0.4,
      fill: true
    };
  });
  
  return { labels: monthLabels, datasets };
}

// Obtener los encabezados de la tabla según el modo de vista
function getTableHeaders(): Array<{ title: string, key: string, align: 'start' | 'end' | 'center', sortable: boolean }> {
  let firstColumnTitle = 'Fecha';
  
  if (viewMode.value === 'days' && hourlyData.value.length > 0) {
    firstColumnTitle = 'Hora';
  } else if (viewMode.value === 'weeks') {
    firstColumnTitle = 'Semana';
  } else if (viewMode.value === 'months') {
    firstColumnTitle = 'Mes';
  }
  
  const headers: Array<{ title: string, key: string, align: 'start' | 'end' | 'center', sortable: boolean }> = [
    { title: firstColumnTitle, key: 'date', align: 'start', sortable: true },
  ];
  
  // Añadir encabezados para cada ubicación (velocidad y dirección)
  props.selectedLocations.forEach((locId) => {
    const displayName = props.getLocationDisplayName(locId);
    headers.push(
      { 
        title: `${displayName} - Vel. (km/h)`, 
        key: `${displayName}_speed`, 
        align: 'end' as const, 
        sortable: true 
      },
      { 
        title: `${displayName} - Dir.`, 
        key: `${displayName}_dir`, 
        align: 'end' as const, 
        sortable: true 
      }
    );
  });
  
  return headers;
}

// Función para convertir grados a dirección cardinal
function degreesToCardinal(degrees: number): string {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(degrees / 22.5) % 16;
  return directions[index];
}

// Obtener los datos de la tabla según el modo de vista
function getTableData(): Array<Record<string, string | number>> {
  if (!props.historicalData.length) return [];
  
  if (viewMode.value === 'days') {
    return getDailyTableData();
  } else if (viewMode.value === 'weeks') {
    return getWeeklyTableData();
  } else {
    return getMonthlyTableData();
  }
}

function getDailyTableData(): Array<Record<string, string | number>> {
  // Si tenemos datos horarios y estamos en vista de días, los mostramos
  if (viewMode.value === 'days' && hourlyData.value.length > 0) {
    // Agrupar datos por hora
    const timeLabels = [...new Set(hourlyData.value.map(d => 
      new Date(d.time).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })
    ))];
    
    return timeLabels.map(time => {
      const rowData: Record<string, string | number> = { date: time };
      props.selectedLocations.forEach(locationId => {
        const hourItem = hourlyData.value.find(d => 
          d.locationId === locationId && 
          new Date(d.time).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' }) === time
        );
        
        const displayName = props.getLocationDisplayName(locationId);
        if (hourItem) {
          rowData[`${displayName}_speed`] = `${hourItem.wind_speed.toFixed(1)} km/h`;
          rowData[`${displayName}_dir`] = `${degreesToCardinal(hourItem.wind_direction)} (${Math.round(hourItem.wind_direction)}°)`;
        } else {
          rowData[`${displayName}_speed`] = 'N/A';
          rowData[`${displayName}_dir`] = 'N/A';
        }
      });
      return rowData;
    });
  }
  
  // Si no hay datos horarios o no estamos en vista de días, mostrar los datos diarios
  return props.dates.map(date => {
    const rowData: Record<string, string | number> = { date };
    props.selectedLocations.forEach(locationId => {
      const data = props.historicalData.find(d => d.date === date && d.locationId === locationId);
      const displayName = props.getLocationDisplayName(locationId);
      
      if (data) {
        rowData[`${displayName}_speed`] = typeof data.wind_speed === 'number' ? 
          `${data.wind_speed.toFixed(1)} km/h` : 'N/A';
          
        rowData[`${displayName}_dir`] = typeof data.wind_direction === 'number' ? 
          `${degreesToCardinal(data.wind_direction)} (${Math.round(data.wind_direction)}°)` : 'N/A';
      } else {
        rowData[`${displayName}_speed`] = 'N/A';
        rowData[`${displayName}_dir`] = 'N/A';
      }
    });
    return rowData;
  });
}

function getWeeklyTableData(): WeekRow[] {
  // Similar a processWeeklyView pero formateado para la tabla
  const weeklyData = new Map<string, Record<string, WeekData>>();
  const weekRows: WeekRow[] = [];
  
  // Procesar todas las fechas
  props.dates.forEach(dateStr => {
    const date = new Date(dateStr);
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - date.getDay());
    const weekLabel = `${startOfWeek.toLocaleDateString('es', { day: '2-digit', month: '2-digit' })} - ${new Date(startOfWeek.getTime() + 6 * 24 * 60 * 60 * 1000).toLocaleDateString('es', { day: '2-digit', month: '2-digit' })}`;
    
    if (!weeklyData.has(weekLabel)) {
      weeklyData.set(weekLabel, {});
      weekRows.push({
        date: weekLabel,
        ...Object.fromEntries(props.selectedLocations.flatMap(loc => {
          const displayName = props.getLocationDisplayName(loc);
          return [
            [`${displayName}_speed`, 'N/A'],
            [`${displayName}_dir`, 'N/A']
          ];
        }))
      });
    }
    
    // Agrupar datos por ubicación para cada semana
    props.selectedLocations.forEach(locationId => {
      if (!weeklyData.get(weekLabel)?.[locationId]) {
        if (weeklyData.get(weekLabel)) {
          weeklyData.get(weekLabel)![locationId] = {
            wind_speeds: [],
            wind_directions: [],
            count: 0,
            max_speed: 0
          };
        }
      }
      
      const dataForDate = props.historicalData.find(d => d.date === dateStr && d.locationId === locationId);
      if (dataForDate && typeof dataForDate.wind_speed === 'number' && weeklyData.get(weekLabel)) {
        const weekDataLoc = weeklyData.get(weekLabel)![locationId];
        if (weekDataLoc) {
          weekDataLoc.wind_speeds.push(dataForDate.wind_speed);
          weekDataLoc.wind_directions.push(dataForDate.wind_direction);
          weekDataLoc.count++;
          
          // Actualizar velocidad máxima
          if (dataForDate.wind_speed > (weekDataLoc.max_speed || 0)) {
            weekDataLoc.max_speed = dataForDate.wind_speed;
          }
          
          // Calcular dirección promedio (aproximada)
          const avgIndex = Math.floor(dataForDate.wind_direction / 45) % 8;
          weekDataLoc.avg_direction = avgIndex * 45;
        }
      }
    });
  });
  
  // Formatear los datos para la tabla
  weekRows.forEach(row => {
    props.selectedLocations.forEach(locationId => {
      if (weeklyData.get(row.date as string)) {
        const weekData = weeklyData.get(row.date as string)![locationId];
        const displayName = props.getLocationDisplayName(locationId);
        
        if (weekData && weekData.count > 0) {
          // Calcular velocidad media semanal
          const avgSpeed = weekData.wind_speeds.reduce((sum, speed) => sum + speed, 0) / weekData.count;
          row[`${displayName}_speed`] = `${avgSpeed.toFixed(1)} km/h (Máx: ${weekData.max_speed?.toFixed(1) || 'N/A'})`;
          
          // Mostrar dirección predominante (aproximada)
          const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
          // Contar frecuencia de cada dirección
          const dirCounts = [0, 0, 0, 0, 0, 0, 0, 0];
          weekData.wind_directions.forEach(dir => {
            const index = Math.floor(((dir + 22.5) % 360) / 45);
            dirCounts[index]++;
          });
          // Encontrar la dirección más frecuente
          let maxCount = 0;
          let maxDir = 0;
          dirCounts.forEach((count, i) => {
            if (count > maxCount) {
              maxCount = count;
              maxDir = i;
            }
          });
          row[`${displayName}_dir`] = directions[maxDir];
        }
      }
    });
  });
  
  return weekRows;
}

function getMonthlyTableData(): MonthRow[] {
  // Similar a processMonthlyView pero formateado para la tabla
  const monthlyData = new Map<string, Record<string, MonthData>>();
  const monthRows: MonthRow[] = [];
  
  // Procesar todas las fechas
  props.dates.forEach(dateStr => {
    const date = new Date(dateStr);
    const monthLabel = date.toLocaleDateString('es', { month: 'long', year: 'numeric' });
    
    if (!monthlyData.has(monthLabel)) {
      monthlyData.set(monthLabel, {});
      monthRows.push({
        date: monthLabel,
        ...Object.fromEntries(props.selectedLocations.flatMap(loc => {
          const displayName = props.getLocationDisplayName(loc);
          return [
            [`${displayName}_speed`, 'N/A'],
            [`${displayName}_dir`, 'N/A']
          ];
        }))
      });
    }
    
    // Agrupar datos por ubicación para cada mes
    props.selectedLocations.forEach(locationId => {
      if (!monthlyData.get(monthLabel)?.[locationId]) {
        if (monthlyData.get(monthLabel)) {
          monthlyData.get(monthLabel)![locationId] = {
            wind_speeds: [],
            wind_directions: [],
            count: 0,
            max_speed: 0
          };
        }
      }
      
      const dataForDate = props.historicalData.find(d => d.date === dateStr && d.locationId === locationId);
      if (dataForDate && typeof dataForDate.wind_speed === 'number' && monthlyData.get(monthLabel)) {
        const monthDataLoc = monthlyData.get(monthLabel)![locationId];
        if (monthDataLoc) {
          monthDataLoc.wind_speeds.push(dataForDate.wind_speed);
          monthDataLoc.wind_directions.push(dataForDate.wind_direction);
          monthDataLoc.count++;
          
          // Actualizar velocidad máxima
          if (dataForDate.wind_speed > (monthDataLoc.max_speed || 0)) {
            monthDataLoc.max_speed = dataForDate.wind_speed;
          }
        }
      }
    });
  });
  
  // Formatear los datos para la tabla
  monthRows.forEach(row => {
    props.selectedLocations.forEach(locationId => {
      if (monthlyData.get(row.date as string)) {
        const monthData = monthlyData.get(row.date as string)![locationId];
        const displayName = props.getLocationDisplayName(locationId);
        
        if (monthData && monthData.count > 0) {
          // Calcular velocidad media mensual
          const avgSpeed = monthData.wind_speeds.reduce((sum, speed) => sum + speed, 0) / monthData.count;
          row[`${displayName}_speed`] = `${avgSpeed.toFixed(1)} km/h (Máx: ${monthData.max_speed?.toFixed(1) || 'N/A'})`;
          
          // Mostrar dirección predominante (aproximada)
          const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
          // Contar frecuencia de cada dirección
          const dirCounts = [0, 0, 0, 0, 0, 0, 0, 0];
          monthData.wind_directions.forEach(dir => {
            const index = Math.floor(((dir + 22.5) % 360) / 45);
            dirCounts[index]++;
          });
          // Encontrar la dirección más frecuente
          let maxCount = 0;
          let maxDir = 0;
          dirCounts.forEach((count, i) => {
            if (count > maxCount) {
              maxCount = count;
              maxDir = i;
            }
          });
          row[`${displayName}_dir`] = directions[maxDir];
        }
      }
    });
  });
  
  return monthRows;
}

// Función para obtener datos horarios simulados del primer día
async function fetchHourlyData(date: string): Promise<void> {
  if (!props.selectedLocations.length) return;
  
  isLoadingHourly.value = true;
  hourlyData.value = [];
  
  try {
    const firstDate = new Date(date);
    const startDate = firstDate.toISOString().split('T')[0];
    
    const promises = props.selectedLocations.map(async (locationId) => {
      // Obtener los datos de la ubicación
      const locationDisplayName = props.getLocationDisplayName(locationId);
      
      // En un caso real, buscaríamos los datos de la ubicación original
      // Aquí vamos a simular datos horarios basados en el viento diario
      const dailyData = props.historicalData.find(d => d.date === date && d.locationId === locationId);
      
      if (!dailyData) return [];
      
      // Simular datos horarios basados en la velocidad media del día
      const baseSpeed = dailyData.wind_speed;
      const baseDirection = dailyData.wind_direction;
      const hourlyData: HourlyData[] = [];
      
      // Crear datos para cada hora del día (con ligeras variaciones)
      for (let hour = 0; hour < 24; hour++) {
        // Variación de velocidad basada en la hora del día (más viento durante el día)
        let speedFactor: number;
        if (hour < 8) {
          // Madrugada (menos viento)
          speedFactor = 0.7 + (Math.random() * 0.3);
        } else if (hour < 18) {
          // Día (más viento)
          speedFactor = 0.9 + (Math.random() * 0.4);
        } else {
          // Noche (viento moderado)
          speedFactor = 0.8 + (Math.random() * 0.3);
        }
        
        const hourlySpeed = baseSpeed * speedFactor;
        
        // Pequeña variación en la dirección
        const directionVariation = Math.random() * 30 - 15; // ±15 grados
        let hourlyDirection = baseDirection + directionVariation;
        if (hourlyDirection < 0) hourlyDirection += 360;
        if (hourlyDirection >= 360) hourlyDirection -= 360;
        
        const timeString = `${startDate}T${hour.toString().padStart(2, '0')}:00`;
        
        hourlyData.push({
          time: timeString,
          wind_speed: hourlySpeed,
          wind_direction: hourlyDirection,
          locationId,
          displayName: locationDisplayName
        });
      }
      
      return hourlyData;
    });
    
    const results = await Promise.all(promises);
    hourlyData.value = results.flat();
  } catch (error) {
    console.error('Error fetching hourly data:', error);
  } finally {
    isLoadingHourly.value = false;
  }
}

// Función para crear/actualizar los gráficos
function updateCharts(): void {
  updateSpeedChart();
  if (showDirection.value || showBoth.value) {
    updateDirectionChart();
  }
}

// Actualizar el gráfico de velocidad
function updateSpeedChart(): void {
  if (!windSpeedChart.value) return;
  
  // Destruir gráfico existente si hay uno
  if (speedChart) {
    speedChart.destroy();
  }
  
  // Obtener datos procesados según la vista
  const { labels, datasets } = processSpeedDataByView();
  
  // Título del gráfico según la vista
  const chartTitles = {
    days: 'Velocidad del Viento Diaria (km/h)',
    weeks: 'Velocidad del Viento Semanal (km/h)',
    months: 'Velocidad del Viento Mensual (km/h)'
  };
  
  // Crear nuevo gráfico
  speedChart = new Chart(windSpeedChart.value, {
    type: 'line',
    data: {
      labels,
      datasets
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top'
        },
        title: {
          display: true,
          text: chartTitles[viewMode.value]
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Velocidad (km/h)'
          }
        }
      }
    }
  });
}

// Actualizar el gráfico de dirección (rosa de los vientos)
function updateDirectionChart(): void {
  if (!windDirectionChart.value) return;
  
  // Destruir gráfico existente si hay uno
  if (directionChart) {
    directionChart.destroy();
  }
  
  // Obtener datos de dirección
  const { labels, datasets } = processDirectionData();
  
  // Crear nuevo gráfico de tipo radar para la rosa de los vientos
  directionChart = new Chart(windDirectionChart.value, {
    type: 'polarArea',
    data: {
      labels,
      datasets
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right'
        },
        title: {
          display: true,
          text: 'Dirección del Viento (Rosa de los Vientos)'
        }
      },
      scales: {
        r: {
          ticks: {
            display: false
          }
        }
      }
    }
  });
}

// Observar cambios en los datos para inicializar la fecha
watch(
  () => props.dates,
  (newDates) => {
    if (newDates.length > 0 && !selectedSpecificDay.value) {
      selectedSpecificDay.value = newDates[0];
    }
  },
  { immediate: true }
);

// Modificar la función de observación de datos para usar la fecha específica
watch(
  () => [props.historicalData, props.selectedLocations, props.dates],
  () => {
    if (props.historicalData.length > 0 && props.selectedLocations.length > 0) {
      if (viewMode.value === 'days' && props.dates.length > 0) {
        // Usar la fecha específica seleccionada o la primera fecha disponible
        const dayToFetch = selectedSpecificDay.value || props.dates[0];
        fetchHourlyData(dayToFetch).then(() => nextTick(() => updateCharts()));
      } else {
        nextTick(() => updateCharts());
      }
    }
  },
  { deep: true }
);

// Inicializar el gráfico cuando el componente se monta
onMounted(() => {
  if (props.historicalData.length > 0 && props.selectedLocations.length > 0) {
    if (viewMode.value === 'days' && props.dates.length > 0) {
      fetchHourlyData(props.dates[0]).then(() => updateCharts());
    } else {
      updateCharts();
    }
  }
});
</script>