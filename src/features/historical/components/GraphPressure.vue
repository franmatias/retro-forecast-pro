<template>
  <v-card>
    <v-card-title class="text-h6 d-flex justify-space-between align-center">
      <span>Presión Atmosférica</span>
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
          <v-card variant="outlined" class="pa-2 text-center">
            <div class="text-caption">
              Presión Media
            </div>
            <div class="text-h6">
              {{ getAveragePressure() }} hPa
            </div>
          </v-card>
        </v-col>
        <v-col 
          cols="12" 
          sm="4"
        >
          <v-card variant="outlined" class="pa-2 text-center">
            <div class="text-caption">
              Presión Mínima
            </div>
            <div class="text-h6">
              {{ getMinPressure() }} hPa
            </div>
          </v-card>
        </v-col>
        <v-col 
          cols="12" 
          sm="4"
        >
          <v-card variant="outlined" class="pa-2 text-center">
            <div class="text-caption">
              Presión Máxima
            </div>
            <div class="text-h6">
              {{ getMaxPressure() }} hPa
            </div>
          </v-card>
        </v-col>
      </v-row>
      
      <!-- Gráfico -->
      <canvas ref="pressureChart" />
      
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
import { Chart, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, LineController, Filler } from 'chart.js'

// Registrar solo los componentes necesarios para este gráfico
Chart.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  LineController,
  Filler
)

interface WeatherData {
  date: string
  pressure: number
  locationId: string
  [key: string]: string | number | undefined
}

interface HourlyData {
  time: string
  pressure: number
  locationId: string
  displayName: string
}

// Definir un tipo para los datasets de los gráficos
interface ChartDataset {
  label: string;
  data: (number | null)[];
  borderColor: string;
  backgroundColor?: string;
  tension?: number;
  fill?: boolean;
  hidden?: boolean;
}

// Definir tipos específicos para arreglos y reducers para evitar errores de tipo implícito
type WeekData = {
  pressures: number[];
  count: number;
  min?: number;
  max?: number;
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
const pressureChart = ref<HTMLCanvasElement | null>(null)
const showTable = ref(true)
const viewMode = ref<'days' | 'weeks' | 'months'>('days')
let chart: Chart | null = null

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

// Función para alternar la visibilidad de la tabla
function toggleTable(): void {
  showTable.value = !showTable.value
}

// Función para manejar el cambio en la fecha específica
async function handleSpecificDayChange(date: string) {
  if (!date || !props.dates.includes(date)) {
    // Si la fecha no es válida o no está en nuestro conjunto de datos, usar la primera fecha
    selectedSpecificDay.value = props.dates[0] || '';
  }
  
  if (selectedSpecificDay.value && viewMode.value === 'days') {
    // Cargar datos horarios para la fecha seleccionada
    await fetchHourlyData(selectedSpecificDay.value);
    updateChart();
  }
}

// Modificar la función setViewMode para cargar datos por hora cuando se selecciona la vista de días
async function setViewMode(mode: 'days' | 'weeks' | 'months'): Promise<void> {
  viewMode.value = mode;
  
  // Si cambiamos a vista días y tenemos ubicaciones seleccionadas, cargar datos por hora
  if (mode === 'days' && props.selectedLocations.length > 0 && props.dates.length > 0) {
    // Si no hay una fecha específica seleccionada, usar la primera fecha disponible
    if (!selectedSpecificDay.value) {
      selectedSpecificDay.value = props.dates[0];
    }
    
    // Cargar datos para la fecha seleccionada
    await fetchHourlyData(selectedSpecificDay.value);
  }
  
  updateChart();
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

// Estadísticas de presión
function getAveragePressure(): string {
  if (!props.historicalData.length) return 'N/A'
  
  let sum = 0
  let count = 0
  
  props.historicalData.forEach(data => {
    if (typeof data.pressure === 'number') {
      sum += data.pressure
      count++
    }
  })
  
  return count > 0 ? (sum / count).toFixed(1) : 'N/A'
}

function getMinPressure(): string {
  if (!props.historicalData.length) return 'N/A'
  
  let minPressure = Infinity
  
  props.historicalData.forEach(data => {
    if (typeof data.pressure === 'number' && data.pressure < minPressure) {
      minPressure = data.pressure
    }
  })
  
  return minPressure !== Infinity ? minPressure.toFixed(1) : 'N/A'
}

function getMaxPressure(): string {
  if (!props.historicalData.length) return 'N/A'
  
  let maxPressure = -Infinity
  
  props.historicalData.forEach(data => {
    if (typeof data.pressure === 'number' && data.pressure > maxPressure) {
      maxPressure = data.pressure
    }
  })
  
  return maxPressure !== -Infinity ? maxPressure.toFixed(1) : 'N/A'
}

// Procesar datos según la vista seleccionada
function processDataByView(): { labels: string[], datasets: ChartDataset[] } {
  if (!props.historicalData.length) return { labels: [], datasets: [] }
  
  if (viewMode.value === 'days') {
    return processDailyView()
  } else if (viewMode.value === 'weeks') {
    return processWeeklyView()
  } else {
    return processMonthlyView()
  }
}

// Procesamiento de datos para vista diaria
function processDailyView(): { labels: string[], datasets: ChartDataset[] } {
  // Si tenemos datos por hora, los usamos
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
        data: data.map(d => d.pressure),
        borderColor: getRandomColor(),
        tension: 0.4,
        fill: false
      };
    });
    
    return { labels: hourLabels, datasets };
  }
  
  // Si no hay datos horarios, usar los datos diarios como antes
  const labels = props.dates;
  const datasets = props.selectedLocations.map(locationId => {
    const displayName = props.getLocationDisplayName(locationId);
    const filteredData = props.historicalData.filter(d => d.locationId === locationId);
    
    return {
      label: displayName,
      data: filteredData.map(d => d.pressure),
      borderColor: getRandomColor(),
      tension: 0.4,
      fill: false
    };
  });
  
  return { labels, datasets };
}

// Procesamiento de datos para vista semanal
function processWeeklyView(): { labels: string[], datasets: ChartDataset[] } {
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
            pressures: [],
            count: 0,
            min: undefined,
            max: undefined
          };
        }
      }
      
      const dataForDate = props.historicalData.find(d => d.date === dateStr && d.locationId === locationId);
      if (dataForDate && typeof dataForDate.pressure === 'number') {
        if (weeklyData.get(weekLabel)?.[locationId]) {
          const weekDataLoc = weeklyData.get(weekLabel)![locationId];
          weekDataLoc.pressures.push(dataForDate.pressure);
          weekDataLoc.count++;
          
          // Actualizar mín/max
          if (weekDataLoc.min === undefined || dataForDate.pressure < weekDataLoc.min) {
            weekDataLoc.min = dataForDate.pressure;
          }
          if (weekDataLoc.max === undefined || dataForDate.pressure > weekDataLoc.max) {
            weekDataLoc.max = dataForDate.pressure;
          }
        }
      }
    });
  });
  
  // Crear datasets para cada ubicación
  const datasets = props.selectedLocations.map(locationId => {
    const displayName = props.getLocationDisplayName(locationId);
    const data = weekLabels.map(week => {
      const weekData = weeklyData.get(week)?.[locationId];
      if (weekData && weekData.count > 0) {
        // Calcular promedio semanal
        return weekData.pressures.reduce((sum, pressure) => sum + pressure, 0) / weekData.count;
      }
      return null;
    });
    
    return {
      label: displayName,
      data,
      borderColor: getRandomColor(),
      tension: 0.4,
      fill: false
    };
  });
  
  return { labels: weekLabels, datasets };
}

// Procesamiento de datos para vista mensual
function processMonthlyView(): { labels: string[], datasets: ChartDataset[] } {
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
            pressures: [],
            count: 0,
            min: undefined,
            max: undefined
          };
        }
      }
      
      const dataForDate = props.historicalData.find(d => d.date === dateStr && d.locationId === locationId);
      if (dataForDate && typeof dataForDate.pressure === 'number') {
        if (monthlyData.get(monthLabel)?.[locationId]) {
          const monthDataLoc = monthlyData.get(monthLabel)![locationId];
          monthDataLoc.pressures.push(dataForDate.pressure);
          monthDataLoc.count++;
          
          // Actualizar mín/max
          if (monthDataLoc.min === undefined || dataForDate.pressure < monthDataLoc.min) {
            monthDataLoc.min = dataForDate.pressure;
          }
          if (monthDataLoc.max === undefined || dataForDate.pressure > monthDataLoc.max) {
            monthDataLoc.max = dataForDate.pressure;
          }
        }
      }
    });
  });
  
  // Crear datasets para cada ubicación
  const datasets = props.selectedLocations.map(locationId => {
    const displayName = props.getLocationDisplayName(locationId);
    const data = monthLabels.map(month => {
      const monthData = monthlyData.get(month)?.[locationId];
      if (monthData && monthData.count > 0) {
        // Calcular promedio mensual
        return monthData.pressures.reduce((sum, pressure) => sum + pressure, 0) / monthData.count;
      }
      return null;
    });
    
    return {
      label: displayName,
      data,
      borderColor: getRandomColor(),
      tension: 0.4,
      fill: false
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
  
  return [
    { title: firstColumnTitle, key: 'date', align: 'start', sortable: true },
    ...props.selectedLocations.map((locId: string) => ({
      title: props.getLocationDisplayName(locId),
      key: props.getLocationDisplayName(locId),
      align: 'end' as const,
      sortable: true
    }))
  ];
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
          rowData[displayName] = `${hourItem.pressure.toFixed(1)} hPa`;
        } else {
          rowData[displayName] = 'N/A';
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
      if (data) {
        const displayName = props.getLocationDisplayName(locationId);
        rowData[displayName] = typeof data.pressure === 'number' ? 
          `${data.pressure.toFixed(1)} hPa` : 'N/A';
      } else {
        const displayName = props.getLocationDisplayName(locationId);
        rowData[displayName] = 'N/A';
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
        ...Object.fromEntries(props.selectedLocations.map(loc => [props.getLocationDisplayName(loc), 'N/A']))
      });
    }
    
    // Agrupar datos por ubicación para cada semana
    props.selectedLocations.forEach(locationId => {
      if (!weeklyData.get(weekLabel)?.[locationId]) {
        if (weeklyData.get(weekLabel)) {
          weeklyData.get(weekLabel)![locationId] = {
            pressures: [],
            count: 0,
            min: Infinity,
            max: -Infinity
          };
        }
      }
      
      const dataForDate = props.historicalData.find(d => d.date === dateStr && d.locationId === locationId);
      if (dataForDate && typeof dataForDate.pressure === 'number' && weeklyData.get(weekLabel)) {
        const weekDataLoc = weeklyData.get(weekLabel)![locationId];
        if (weekDataLoc) {
          weekDataLoc.pressures.push(dataForDate.pressure);
          weekDataLoc.count++;
          
          // Actualizar mín/max
          if (dataForDate.pressure < weekDataLoc.min!) {
            weekDataLoc.min = dataForDate.pressure;
          }
          if (dataForDate.pressure > weekDataLoc.max!) {
            weekDataLoc.max = dataForDate.pressure;
          }
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
          const avg = weekData.pressures.reduce((sum, pressure) => sum + pressure, 0) / weekData.count;
          const min = weekData.min !== Infinity ? weekData.min : null;
          const max = weekData.max !== -Infinity ? weekData.max : null;
          
          row[displayName] = `${avg.toFixed(1)} hPa (${min?.toFixed(1) || 'N/A'}/${max?.toFixed(1) || 'N/A'})`;
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
        ...Object.fromEntries(props.selectedLocations.map(loc => [props.getLocationDisplayName(loc), 'N/A']))
      });
    }
    
    // Agrupar datos por ubicación para cada mes
    props.selectedLocations.forEach(locationId => {
      if (!monthlyData.get(monthLabel)?.[locationId]) {
        if (monthlyData.get(monthLabel)) {
          monthlyData.get(monthLabel)![locationId] = {
            pressures: [],
            count: 0,
            min: Infinity,
            max: -Infinity
          };
        }
      }
      
      const dataForDate = props.historicalData.find(d => d.date === dateStr && d.locationId === locationId);
      if (dataForDate && typeof dataForDate.pressure === 'number' && monthlyData.get(monthLabel)) {
        const monthDataLoc = monthlyData.get(monthLabel)![locationId];
        if (monthDataLoc) {
          monthDataLoc.pressures.push(dataForDate.pressure);
          monthDataLoc.count++;
          
          // Actualizar mín/max
          if (dataForDate.pressure < monthDataLoc.min!) {
            monthDataLoc.min = dataForDate.pressure;
          }
          if (dataForDate.pressure > monthDataLoc.max!) {
            monthDataLoc.max = dataForDate.pressure;
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
          const avg = monthData.pressures.reduce((sum, pressure) => sum + pressure, 0) / monthData.count;
          const min = monthData.min !== Infinity ? monthData.min : null;
          const max = monthData.max !== -Infinity ? monthData.max : null;
          
          row[displayName] = `${avg.toFixed(1)} hPa (${min?.toFixed(1) || 'N/A'}/${max?.toFixed(1) || 'N/A'})`;
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
      // Aquí vamos a simular datos horarios basados en la presión diaria
      const dailyData = props.historicalData.find(d => d.date === date && d.locationId === locationId);
      
      if (!dailyData) return [];
      
      // Simular datos horarios basados en la presión media del día
      const basePressure = dailyData.pressure || 1013.25; // Presión estándar a nivel del mar si no hay datos
      const hourlyPressures: HourlyData[] = [];
      
      // Crear datos para cada hora del día
      for (let hour = 0; hour < 24; hour++) {
        // Variación de presión basada en la hora del día
        // La presión atmosférica tiende a tener dos picos diarios
        // Más alta temprano en la mañana y a final de la tarde
        let hourFactor: number;
        if (hour < 4) {
          // Tarde noche a madrugada (presión descendiendo)
          hourFactor = -0.5 - (hour * 0.1);
        } else if (hour < 10) {
          // Mañana (presión subiendo)
          hourFactor = -0.9 + ((hour - 4) * 0.3);
        } else if (hour < 16) {
          // Tarde (presión descendiendo)
          hourFactor = 0.9 - ((hour - 10) * 0.3);
        } else if (hour < 22) {
          // Tarde-noche (presión subiendo)
          hourFactor = -0.9 + ((hour - 16) * 0.3);
        } else {
          // Noche (presión comenzando a descender)
          hourFactor = 0.9 - ((hour - 22) * 0.2);
        }
        
        // Añadir algo de aleatoriedad para simular fluctuaciones naturales
        const randomFactor = (Math.random() - 0.5) * 0.4;
        const hourlyPressureValue = basePressure + hourFactor + randomFactor;
        
        const timeString = `${startDate}T${hour.toString().padStart(2, '0')}:00`;
        
        hourlyPressures.push({
          time: timeString,
          pressure: hourlyPressureValue,
          locationId,
          displayName: locationDisplayName
        });
      }
      
      return hourlyPressures;
    });
    
    const results = await Promise.all(promises);
    hourlyData.value = results.flat();
  } catch (error) {
    console.error('Error fetching hourly data:', error);
  } finally {
    isLoadingHourly.value = false;
  }
}

// Función para crear/actualizar el gráfico
function updateChart(): void {
  if (!pressureChart.value) return;
  
  // Destruir gráfico existente si hay uno
  if (chart) {
    chart.destroy();
  }
  
  // Obtener datos procesados según la vista
  const { labels, datasets } = processDataByView();
  
  // Título del gráfico según la vista
  const chartTitles = {
    days: 'Presión Atmosférica Diaria (hPa)',
    weeks: 'Presión Atmosférica Semanal (hPa)',
    months: 'Presión Atmosférica Mensual (hPa)'
  };
  
  // Crear nuevo gráfico
  chart = new Chart(pressureChart.value, {
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
          // La presión atmosférica al nivel del mar ronda los 1013.25 hPa
          // Ajustar para no comenzar en cero proporciona más detalle visual
          beginAtZero: false,
          title: {
            display: true,
            text: 'Presión (hPa)'
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

// Observar cambios en los datos para actualizar el gráfico
watch(
  () => [props.historicalData, props.selectedLocations, props.dates],
  () => {
    if (props.historicalData.length > 0 && props.selectedLocations.length > 0) {
      if (viewMode.value === 'days' && props.dates.length > 0) {
        // Usar la fecha específica seleccionada o la primera fecha disponible
        const dayToFetch = selectedSpecificDay.value || props.dates[0];
        fetchHourlyData(dayToFetch).then(() => nextTick(() => updateChart()));
      } else {
        nextTick(() => updateChart());
      }
    }
  },
  { deep: true }
);

// Inicializar el gráfico cuando el componente se monta
onMounted(() => {
  if (props.historicalData.length > 0 && props.selectedLocations.length > 0) {
    if (viewMode.value === 'days' && props.dates.length > 0) {
      fetchHourlyData(props.dates[0]).then(() => updateChart());
    } else {
      updateChart();
    }
  }
});
</script>

<style scoped>
canvas {
  max-height: 300px;
}
</style>