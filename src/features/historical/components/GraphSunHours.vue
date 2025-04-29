<template>
  <v-card>
    <v-card-title class="text-h6 d-flex justify-space-between align-center">
      <span>Horas de Sol</span>
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
          <v-card 
            variant="outlined" 
            class="pa-2 text-center"
          >
            <div class="text-caption">
              Promedio Diario
            </div>
            <div class="text-h6">
              {{ getAverageSunHours() }} h
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
              Día Más Soleado
            </div>
            <div class="text-h6">
              {{ getMaxSunHoursDay() }}
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
              Total de Horas
            </div>
            <div class="text-h6">
              {{ getTotalSunHours() }} h
            </div>
          </v-card>
        </v-col>
      </v-row>
      
      <!-- Gráfico -->
      <canvas ref="sunHoursChart" />
      
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
import { Chart, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, BarController } from 'chart.js'

// Registrar solo los componentes necesarios para este gráfico
Chart.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  BarController
)

interface WeatherData {
  date: string
  sunshine_hours: number
  locationId: string
  [key: string]: string | number | undefined
}

interface HourlyData {
  time: string
  sunshine_hours: number
  locationId: string
  displayName: string
}

// Definir un tipo para los datasets de los gráficos
interface ChartDataset {
  label: string;
  data: (number | null)[];
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  hidden?: boolean;
}

// Definir tipos específicos para arreglos y reducers para evitar errores de tipo implícito
type WeekData = {
  sunHours: number[];
  count: number;
  max?: number;
  totalHours?: number;
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
const sunHoursChart = ref<HTMLCanvasElement | null>(null)
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

// Modificar la función setViewMode para cargar datos por hora cuando se selecciona la vista de días
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
  
  updateChart();
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

// Estadísticas de horas de sol
function getTotalSunHours(): string {
  if (!props.historicalData.length) return 'N/A'
  
  let total = 0
  
  props.historicalData.forEach(data => {
    if (typeof data.sunshine_hours === 'number') {
      total += data.sunshine_hours
    }
  })
  
  return total.toFixed(1)
}

function getMaxSunHoursDay(): string {
  if (!props.historicalData.length) return 'N/A'
  
  let maxSunHours = -Infinity
  let maxDay = ''
  
  props.historicalData.forEach(data => {
    if (typeof data.sunshine_hours === 'number' && data.sunshine_hours > maxSunHours) {
      maxSunHours = data.sunshine_hours
      maxDay = data.date
    }
  })
  
  if (maxSunHours <= 0) return 'Sin sol'
  
  // Formatear la fecha para mostrar día/mes
  const date = new Date(maxDay)
  const formattedDate = date.toLocaleDateString('es', {day: '2-digit', month: '2-digit'})
  
  return `${formattedDate} (${maxSunHours.toFixed(1)}h)`
}

function getAverageSunHours(): string {
  if (!props.historicalData.length) return 'N/A'
  
  let sum = 0
  let count = 0
  
  props.historicalData.forEach(data => {
    if (typeof data.sunshine_hours === 'number') {
      sum += data.sunshine_hours
      count++
    }
  })
  
  return count > 0 ? (sum / count).toFixed(1) : 'N/A'
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
      const color = getRandomColor();
      return {
        label: props.getLocationDisplayName(locationId),
        data: data.map(d => d.sunshine_hours),
        backgroundColor: getRandomColorWithOpacity(0.7),
        borderColor: color,
        borderWidth: 1
      };
    });
    
    return { labels: hourLabels, datasets };
  }
  
  // Si no hay datos horarios, usar los datos diarios como antes
  const labels = props.dates;
  const datasets = props.selectedLocations.map(locationId => {
    const displayName = props.getLocationDisplayName(locationId);
    const filteredData = props.historicalData.filter(d => d.locationId === locationId);
    const color = getRandomColor();
    
    return {
      label: displayName,
      data: filteredData.map(d => d.sunshine_hours),
      backgroundColor: getRandomColorWithOpacity(0.7),
      borderColor: color,
      borderWidth: 1
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
            sunHours: [],
            count: 0,
            totalHours: 0
          };
        }
      }
      
      const dataForDate = props.historicalData.find(d => d.date === dateStr && d.locationId === locationId);
      if (dataForDate && typeof dataForDate.sunshine_hours === 'number') {
        if (weeklyData.get(weekLabel)?.[locationId]) {
          weeklyData.get(weekLabel)![locationId].sunHours.push(dataForDate.sunshine_hours);
          weeklyData.get(weekLabel)![locationId].count++;
          
          // Sumar las horas de sol totales de la semana
          const total = weeklyData.get(weekLabel)![locationId].totalHours || 0;
          weeklyData.get(weekLabel)![locationId].totalHours = total + dataForDate.sunshine_hours;
          
          // Actualizar máxima cantidad de horas de sol
          if (!weeklyData.get(weekLabel)![locationId].max || 
              dataForDate.sunshine_hours > weeklyData.get(weekLabel)![locationId].max!) {
            weeklyData.get(weekLabel)![locationId].max = dataForDate.sunshine_hours;
          }
        }
      }
    });
  });
  
  // Crear datasets para cada ubicación (total semanal de horas de sol)
  const datasets = props.selectedLocations.map(locationId => {
    const displayName = props.getLocationDisplayName(locationId);
    const color = getRandomColor();
    const data = weekLabels.map(week => {
      const weekData = weeklyData.get(week)?.[locationId];
      if (weekData && weekData.count > 0) {
        // Mostrar suma total de horas de sol semanal
        return weekData.totalHours || 0;
      }
      return null;
    });
    
    return {
      label: displayName,
      data,
      backgroundColor: getRandomColorWithOpacity(0.7),
      borderColor: color,
      borderWidth: 1
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
            sunHours: [],
            count: 0,
            totalHours: 0
          };
        }
      }
      
      const dataForDate = props.historicalData.find(d => d.date === dateStr && d.locationId === locationId);
      if (dataForDate && typeof dataForDate.sunshine_hours === 'number') {
        if (monthlyData.get(monthLabel)?.[locationId]) {
          monthlyData.get(monthLabel)![locationId].sunHours.push(dataForDate.sunshine_hours);
          monthlyData.get(monthLabel)![locationId].count++;
          
          // Sumar las horas de sol totales del mes
          const total = monthlyData.get(monthLabel)![locationId].totalHours || 0;
          monthlyData.get(monthLabel)![locationId].totalHours = total + dataForDate.sunshine_hours;
          
          // Actualizar máxima cantidad de horas de sol
          if (!monthlyData.get(monthLabel)![locationId].max || 
              dataForDate.sunshine_hours > monthlyData.get(monthLabel)![locationId].max!) {
            monthlyData.get(monthLabel)![locationId].max = dataForDate.sunshine_hours;
          }
        }
      }
    });
  });
  
  // Crear datasets para cada ubicación (total mensual de horas de sol)
  const datasets = props.selectedLocations.map(locationId => {
    const displayName = props.getLocationDisplayName(locationId);
    const color = getRandomColor();
    const data = monthLabels.map(month => {
      const monthData = monthlyData.get(month)?.[locationId];
      if (monthData && monthData.count > 0) {
        // Mostrar suma total de horas de sol mensual
        return monthData.totalHours || 0;
      }
      return null;
    });
    
    return {
      label: displayName,
      data,
      backgroundColor: getRandomColorWithOpacity(0.7),
      borderColor: color,
      borderWidth: 1
    };
  });
  
  return { labels: monthLabels, datasets };
}

// Obtener los encabezados de la tabla según el modo de vista
function getTableHeaders(): Array<{ title: string, key: string, align: 'start' | 'end', sortable: boolean }> {
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
          rowData[displayName] = `${hourItem.sunshine_hours.toFixed(2)} h`;
        } else {
          rowData[displayName] = '0.0 h';
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
        rowData[displayName] = typeof data.sunshine_hours === 'number' ? 
          `${data.sunshine_hours.toFixed(1)} h` : 
          '0.0 h';
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
            sunHours: [],
            count: 0,
            max: 0,
            totalHours: 0
          };
        }
      }
      
      const dataForDate = props.historicalData.find(d => d.date === dateStr && d.locationId === locationId);
      if (dataForDate && typeof dataForDate.sunshine_hours === 'number' && weeklyData.get(weekLabel)) {
        const weekDataLoc = weeklyData.get(weekLabel)![locationId];
        if (weekDataLoc) {
          weekDataLoc.sunHours.push(dataForDate.sunshine_hours);
          weekDataLoc.count++;
          
          // Actualizar total y máximo
          weekDataLoc.totalHours = (weekDataLoc.totalHours || 0) + dataForDate.sunshine_hours;
          if (dataForDate.sunshine_hours > (weekDataLoc.max || 0)) {
            weekDataLoc.max = dataForDate.sunshine_hours;
          }
        }
      }
    });
  });
  
  // Formatear los datos para la tabla
  weekRows.forEach(row => {
    props.selectedLocations.forEach(locationId => {
      if (weeklyData.get(row.date)) {
        const weekData = weeklyData.get(row.date)![locationId];
        const displayName = props.getLocationDisplayName(locationId);
        
        if (weekData && weekData.count > 0) {
          const total = weekData.totalHours || 0;
          const avg = total / weekData.count;
          const max = weekData.max || 0;
          
          row[displayName] = `${total.toFixed(1)} h (Media: ${avg.toFixed(1)}, Máx: ${max.toFixed(1)})`;
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
            sunHours: [],
            count: 0,
            max: 0,
            totalHours: 0
          };
        }
      }
      
      const dataForDate = props.historicalData.find(d => d.date === dateStr && d.locationId === locationId);
      if (dataForDate && typeof dataForDate.sunshine_hours === 'number' && monthlyData.get(monthLabel)) {
        const monthDataLoc = monthlyData.get(monthLabel)![locationId];
        if (monthDataLoc) {
          monthDataLoc.sunHours.push(dataForDate.sunshine_hours);
          monthDataLoc.count++;
          
          // Actualizar total y máximo
          monthDataLoc.totalHours = (monthDataLoc.totalHours || 0) + dataForDate.sunshine_hours;
          if (dataForDate.sunshine_hours > (monthDataLoc.max || 0)) {
            monthDataLoc.max = dataForDate.sunshine_hours;
          }
        }
      }
    });
  });
  
  // Formatear los datos para la tabla
  monthRows.forEach(row => {
    props.selectedLocations.forEach(locationId => {
      if (monthlyData.get(row.date)) {
        const monthData = monthlyData.get(row.date)![locationId];
        const displayName = props.getLocationDisplayName(locationId);
        
        if (monthData && monthData.count > 0) {
          const total = monthData.totalHours || 0;
          const avg = total / monthData.count;
          const max = monthData.max || 0;
          
          row[displayName] = `${total.toFixed(1)} h (Media: ${avg.toFixed(1)}, Máx: ${max.toFixed(1)})`;
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
      // Aquí vamos a simular datos horarios basados en las horas de sol diarias
      const dailyData = props.historicalData.find(d => d.date === date && d.locationId === locationId);
      
      if (!dailyData) return [];
      
      // Simular datos horarios basados en las horas de sol del día
      // Las horas de sol se distribuyen principalmente durante el día (6:00 - 20:00)
      const totalSunHours = dailyData.sunshine_hours || 0;
      const hourlyData: HourlyData[] = [];
      
      // Si no hay sol, devolver datos con sol en 0
      if (totalSunHours <= 0) {
        for (let hour = 0; hour < 24; hour++) {
          const timeString = `${startDate}T${hour.toString().padStart(2, '0')}:00`;
          
          hourlyData.push({
            time: timeString,
            sunshine_hours: 0,
            locationId,
            displayName: locationDisplayName
          });
        }
        return hourlyData;
      }
      
      // Calcular la distribución de luz solar con un pico en el mediodía
      const sunriseHour = 6; // Aproximadamente amanecer a las 6 AM
      const sunsetHour = 20; // Aproximadamente atardecer a las 8 PM
      const dayLightHours = sunsetHour - sunriseHour; // 14 horas de luz posibles
      
      // Distribuir las horas de sol totales durante las horas diurnas
      // Con una concentración mayor en las horas centrales del día
      for (let hour = 0; hour < 24; hour++) {
        const timeString = `${startDate}T${hour.toString().padStart(2, '0')}:00`;
        
        let hourlyValue = 0;
        
        // Solo hay sol durante las horas de luz
        if (hour >= sunriseHour && hour < sunsetHour) {
          // Crear una curva de distribución centrada en el mediodía
          // Mayor proporción de sol en las horas centrales del día
          const distanceFromNoon = Math.abs(hour - 13);
          // Factor entre 0 y 1, con máximo (1) al mediodía
          const sunFactor = 1 - (distanceFromNoon / (dayLightHours / 2));
          
          // Distribuir el total de horas de sol según el factor
          // y añadir algo de aleatoriedad para variación natural
          const randomFactor = 0.7 + (Math.random() * 0.6); // Entre 0.7 y 1.3
          hourlyValue = (totalSunHours / dayLightHours) * sunFactor * 2 * randomFactor;
          hourlyValue = Math.min(1, hourlyValue); // Máximo 1 hora de sol por hora
        }
        
        hourlyData.push({
          time: timeString,
          sunshine_hours: hourlyValue,
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

// Función para crear/actualizar el gráfico
function updateChart(): void {
  if (!sunHoursChart.value) return;
  
  // Destruir gráfico existente si hay uno
  if (chart) {
    chart.destroy();
  }
  
  // Obtener datos procesados según la vista
  const { labels, datasets } = processDataByView();
  
  // Título del gráfico según la vista
  const chartTitles = {
    days: 'Horas de Sol Diarias (h)',
    weeks: 'Horas de Sol Semanales (h)',
    months: 'Horas de Sol Mensuales (h)'
  };
  
  // Crear nuevo gráfico
  chart = new Chart(sunHoursChart.value, {
    type: 'bar',
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
            text: 'Horas de Sol (h)'
          }
        }
      }
    }
  });
}

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