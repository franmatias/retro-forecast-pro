<template>
  <v-card>
    <v-card-title class="text-h6 d-flex justify-space-between align-center">
      <span>Temperatura</span>
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
      <v-row class="mb-4">
        <v-col cols="12" sm="4">
          <v-card variant="outlined" class="pa-2 text-center">
            <div class="text-caption">
              Temperatura Media
            </div>
            <div class="text-h6">
              {{ getAverageTemp() }}°C
            </div>
          </v-card>
        </v-col>
        <v-col 
          cols="12" 
          sm="4"
        >
          <v-card variant="outlined" class="pa-2 text-center">
            <div class="text-caption">
              Temperatura Mínima
            </div>
            <div class="text-h6">
              {{ getMinTemp() }}°C
            </div>
          </v-card>
        </v-col>
        <v-col 
          cols="12" 
          sm="4"
        >
          <v-card variant="outlined" class="pa-2 text-center">
            <div class="text-caption">
              Temperatura Máxima
            </div>
            <div class="text-h6">
              {{ getMaxTemp() }}°C
            </div>
          </v-card>
        </v-col>
      </v-row>
      
      <!-- Gráfico -->
      <canvas ref="tempChart" />
      
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
  temperature: number // Temperatura media
  temp_min?: number   // Temperatura mínima (opcional)
  temp_max?: number   // Temperatura máxima (opcional)
  locationId: string
  // Otros campos no son necesarios para este componente específico
  [key: string]: string | number | undefined
}

interface HourlyData {
  time: string
  temperature: number
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
  temps: number[];
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
const tempChart = ref<HTMLCanvasElement | null>(null)
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

// Estadísticas de temperatura
function getAverageTemp(): string {
  if (!props.historicalData.length) return 'N/A'
  
  let sum = 0
  let count = 0
  
  props.historicalData.forEach(data => {
    if (typeof data.temperature === 'number') {
      sum += data.temperature
      count++
    }
  })
  
  return count > 0 ? (sum / count).toFixed(1) : 'N/A'
}

function getMinTemp(): string {
  if (!props.historicalData.length) return 'N/A'
  
  let minTemp = Infinity
  
  props.historicalData.forEach(data => {
    // Usar temp_min si existe, de lo contrario usar temperature
    const temp = typeof data.temp_min === 'number' ? data.temp_min : data.temperature
    if (typeof temp === 'number' && temp < minTemp) {
      minTemp = temp
    }
  })
  
  return minTemp !== Infinity ? minTemp.toFixed(1) : 'N/A'
}

function getMaxTemp(): string {
  if (!props.historicalData.length) return 'N/A'
  
  let maxTemp = -Infinity
  
  props.historicalData.forEach(data => {
    // Usar temp_max si existe, de lo contrario usar temperature
    const temp = typeof data.temp_max === 'number' ? data.temp_max : data.temperature
    if (typeof temp === 'number' && temp > maxTemp) {
      maxTemp = temp
    }
  })
  
  return maxTemp !== -Infinity ? maxTemp.toFixed(1) : 'N/A'
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
        data: data.map(d => d.temperature),
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
      data: filteredData.map(d => d.temperature),
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
            temps: [],
            count: 0
          };
        }
      }
      
      const dataForDate = props.historicalData.find(d => d.date === dateStr && d.locationId === locationId);
      if (dataForDate && typeof dataForDate.temperature === 'number') {
        if (weeklyData.get(weekLabel)?.[locationId]) {
          weeklyData.get(weekLabel)![locationId].temps.push(dataForDate.temperature);
          weeklyData.get(weekLabel)![locationId].count++;
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
        return weekData.temps.reduce((sum: number, temp: number) => sum + temp, 0) / weekData.count;
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
            temps: [],
            count: 0
          };
        }
      }
      
      const dataForDate = props.historicalData.find(d => d.date === dateStr && d.locationId === locationId);
      if (dataForDate && typeof dataForDate.temperature === 'number') {
        if (monthlyData.get(monthLabel)?.[locationId]) {
          monthlyData.get(monthLabel)![locationId].temps.push(dataForDate.temperature);
          monthlyData.get(monthLabel)![locationId].count++;
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
        return monthData.temps.reduce((sum: number, temp: number) => sum + temp, 0) / monthData.count;
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
          rowData[displayName] = `${hourItem.temperature.toFixed(1)}°C`;
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
        rowData[displayName] = typeof data.temperature === 'number' ? 
          `${data.temperature.toFixed(1)}°C (${data.temp_min?.toFixed(1) || 'N/A'}/${data.temp_max?.toFixed(1) || 'N/A'})` : 
          'N/A';
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
            temps: [],
            min: Infinity,
            max: -Infinity,
            count: 0
          };
        }
      }
      
      const dataForDate = props.historicalData.find(d => d.date === dateStr && d.locationId === locationId);
      if (dataForDate && typeof dataForDate.temperature === 'number' && weeklyData.get(weekLabel)) {
        const weekDataLoc = weeklyData.get(weekLabel)![locationId];
        if (weekDataLoc) {
          weekDataLoc.temps.push(dataForDate.temperature);
          weekDataLoc.count++;
          
          // Actualizar min/max
          if (typeof dataForDate.temp_min === 'number' && dataForDate.temp_min < (weekDataLoc.min || Infinity)) {
            weekDataLoc.min = dataForDate.temp_min;
          }
          if (typeof dataForDate.temp_max === 'number' && dataForDate.temp_max > (weekDataLoc.max || -Infinity)) {
            weekDataLoc.max = dataForDate.temp_max;
          }
          if (dataForDate.temperature < (weekDataLoc.min || Infinity)) {
            weekDataLoc.min = dataForDate.temperature;
          }
          if (dataForDate.temperature > (weekDataLoc.max || -Infinity)) {
            weekDataLoc.max = dataForDate.temperature;
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
          const avg = weekData.temps.reduce((sum: number, temp: number) => sum + temp, 0) / weekData.count;
          const min = weekData.min !== Infinity ? weekData.min : null;
          const max = weekData.max !== -Infinity ? weekData.max : null;
          
          row[displayName] = `${avg.toFixed(1)}°C (${min?.toFixed(1) || 'N/A'}/${max?.toFixed(1) || 'N/A'})`;
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
            temps: [],
            min: Infinity,
            max: -Infinity,
            count: 0
          };
        }
      }
      
      const dataForDate = props.historicalData.find(d => d.date === dateStr && d.locationId === locationId);
      if (dataForDate && typeof dataForDate.temperature === 'number' && monthlyData.get(monthLabel)) {
        const monthDataLoc = monthlyData.get(monthLabel)![locationId];
        if (monthDataLoc) {
          monthDataLoc.temps.push(dataForDate.temperature);
          monthDataLoc.count++;
          
          // Actualizar min/max
          if (typeof dataForDate.temp_min === 'number' && dataForDate.temp_min < (monthDataLoc.min || Infinity)) {
            monthDataLoc.min = dataForDate.temp_min;
          }
          if (typeof dataForDate.temp_max === 'number' && dataForDate.temp_max > (monthDataLoc.max || -Infinity)) {
            monthDataLoc.max = dataForDate.temp_max;
          }
          if (dataForDate.temperature < (monthDataLoc.min || Infinity)) {
            monthDataLoc.min = dataForDate.temperature;
          }
          if (dataForDate.temperature > (monthDataLoc.max || -Infinity)) {
            monthDataLoc.max = dataForDate.temperature;
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
          const avg = monthData.temps.reduce((sum: number, temp: number) => sum + temp, 0) / monthData.count;
          const min = monthData.min !== Infinity ? monthData.min : null;
          const max = monthData.max !== -Infinity ? monthData.max : null;
          
          row[displayName] = `${avg.toFixed(1)}°C (${min?.toFixed(1) || 'N/A'}/${max?.toFixed(1) || 'N/A'})`;
        }
      }
    });
  });
  
  return monthRows;
}

// Función para obtener datos horarios del primer día
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
      // Aquí vamos a simular datos horarios basados en la temperatura diaria
      const dailyData = props.historicalData.find(d => d.date === date && d.locationId === locationId);
      
      if (!dailyData) return [];
      
      // Simular datos horarios basados en la temperatura media del día
      const baseTemp = dailyData.temperature;
      const hourlyTemps: HourlyData[] = [];
      
      // Crear datos para cada hora del día
      for (let hour = 0; hour < 24; hour++) {
        // Variación de temperatura basada en la hora del día
        // Más frío en la madrugada, más cálido en la tarde
        let hourFactor: number;
        if (hour < 6) {
          // Madrugada (más frío)
          hourFactor = -2 + (hour * 0.3);
        } else if (hour < 14) {
          // Mañana hasta primera tarde (calentamiento)
          hourFactor = -0.2 + ((hour - 6) * 0.5);
        } else if (hour < 19) {
          // Tarde (más cálido)
          hourFactor = 3.8 - ((hour - 14) * 0.4);
        } else {
          // Noche (enfriamiento)
          hourFactor = 2.0 - ((hour - 19) * 0.5);
        }
        
        const tempVariation = hourFactor;
        const hourlyTemp = baseTemp + tempVariation;
        
        const timeString = `${startDate}T${hour.toString().padStart(2, '0')}:00`;
        
        hourlyTemps.push({
          time: timeString,
          temperature: hourlyTemp,
          locationId,
          displayName: locationDisplayName
        });
      }
      
      return hourlyTemps;
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
  if (!tempChart.value) return;
  
  // Destruir gráfico existente si hay uno
  if (chart) {
    chart.destroy();
  }
  
  try {
    // Obtener datos procesados según la vista
    const { labels, datasets } = processDataByView();
    
    // Título del gráfico según la vista
    const chartTitles = {
      days: 'Temperatura Diaria (°C)',
      weeks: 'Temperatura Semanal (°C)',
      months: 'Temperatura Mensual (°C)'
    };
    
    // Crear nuevo gráfico
    chart = new Chart(tempChart.value, {
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
            title: {
              display: true,
              text: 'Temperatura (°C)'
            }
          }
        }
      }
    });
  } catch (error) {
    console.error('Error al crear el gráfico de temperatura:', error);
  }
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
