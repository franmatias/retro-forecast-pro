<template>
  <div>
    <h3 class="text-h5 mb-4">Tablas comparativas</h3>
    
    <!-- Tabla de temperaturas -->
    <v-card class="mb-4">
      <v-card-title class="d-flex align-center">
        <v-icon class="mr-2" color="red-darken-1">mdi-thermometer</v-icon>
        Resumen de Temperaturas
      </v-card-title>
      <v-card-text>
        <v-table>
          <thead>
            <tr>
              <th>Ubicación</th>
              <th>Temperatura máxima (°C)</th>
              <th>Temperatura media (°C)</th>
              <th>Temperatura mínima (°C)</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="locationId in selectedLocations" :key="`temp-${locationId}`">
              <td>{{ getLocationDisplayName(locationId) }}</td>
              <td class="text-right">{{ getMaxValue(getLocationData(locationId), 'temperature').toFixed(1) }}</td>
              <td class="text-right">{{ getAvgValue(getLocationData(locationId), 'temperature').toFixed(1) }}</td>
              <td class="text-right">{{ getMinValue(getLocationData(locationId), 'temperature').toFixed(1) }}</td>
            </tr>
          </tbody>
        </v-table>
      </v-card-text>
    </v-card>
    
    <!-- Tabla de precipitaciones -->
    <v-card class="mb-4">
      <v-card-title class="d-flex align-center">
        <v-icon class="mr-2" color="blue-darken-1">mdi-weather-pouring</v-icon>
        Resumen de Precipitaciones
      </v-card-title>
      <v-card-text>
        <v-table>
          <thead>
            <tr>
              <th>Ubicación</th>
              <th>Precipitación máxima (mm)</th>
              <th>Precipitación media (mm)</th>
              <th>Total acumulado (mm)</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="locationId in selectedLocations" :key="`rain-${locationId}`">
              <td>{{ getLocationDisplayName(locationId) }}</td>
              <td class="text-right">{{ getMaxValue(getLocationData(locationId), 'rainfall').toFixed(1) }}</td>
              <td class="text-right">{{ getAvgValue(getLocationData(locationId), 'rainfall').toFixed(1) }}</td>
              <td class="text-right">{{ getTotalRainfall(getLocationData(locationId)).toFixed(1) }}</td>
            </tr>
          </tbody>
        </v-table>
      </v-card-text>
    </v-card>
    
    <!-- Tabla de viento -->
    <v-card class="mb-4">
      <v-card-title class="d-flex align-center">
        <v-icon class="mr-2" color="blue-grey-darken-1">mdi-weather-windy</v-icon>
        Resumen de Viento
      </v-card-title>
      <v-card-text>
        <v-table>
          <thead>
            <tr>
              <th>Ubicación</th>
              <th>Velocidad máxima (km/h)</th>
              <th>Velocidad media (km/h)</th>
              <th>Dirección predominante</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="locationId in selectedLocations" :key="`wind-${locationId}`">
              <td>{{ getLocationDisplayName(locationId) }}</td>
              <td class="text-right">{{ getMaxValue(getLocationData(locationId), 'wind_speed').toFixed(1) }}</td>
              <td class="text-right">{{ getAvgValue(getLocationData(locationId), 'wind_speed').toFixed(1) }}</td>
              <td class="text-right">{{ getDominantWindDirection(getLocationData(locationId)) }}</td>
            </tr>
          </tbody>
        </v-table>
      </v-card-text>
    </v-card>
    
    <!-- Tabla de humedad -->
    <v-card class="mb-4">
      <v-card-title class="d-flex align-center">
        <v-icon class="mr-2" color="cyan-darken-2">mdi-water-percent</v-icon>
        Resumen de Humedad
      </v-card-title>
      <v-card-text>
        <v-table>
          <thead>
            <tr>
              <th>Ubicación</th>
              <th>Humedad máxima (%)</th>
              <th>Humedad media (%)</th>
              <th>Humedad mínima (%)</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="locationId in selectedLocations" :key="`humidity-${locationId}`">
              <td>{{ getLocationDisplayName(locationId) }}</td>
              <td class="text-right">{{ getMaxValue(getLocationData(locationId), 'humidity').toFixed(1) }}</td>
              <td class="text-right">{{ getAvgValue(getLocationData(locationId), 'humidity').toFixed(1) }}</td>
              <td class="text-right">{{ getMinValue(getLocationData(locationId), 'humidity').toFixed(1) }}</td>
            </tr>
          </tbody>
        </v-table>
      </v-card-text>
    </v-card>
    
    <!-- Tabla de presión atmosférica -->
    <v-card class="mb-4">
      <v-card-title class="d-flex align-center">
        <v-icon class="mr-2" color="indigo-darken-1">mdi-gauge</v-icon>
        Resumen de Presión Atmosférica
      </v-card-title>
      <v-card-text>
        <v-table>
          <thead>
            <tr>
              <th>Ubicación</th>
              <th>Presión máxima (hPa)</th>
              <th>Presión media (hPa)</th>
              <th>Presión mínima (hPa)</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="locationId in selectedLocations" :key="`pressure-${locationId}`">
              <td>{{ getLocationDisplayName(locationId) }}</td>
              <td class="text-right">{{ getMaxValue(getLocationData(locationId), 'pressure').toFixed(0) }}</td>
              <td class="text-right">{{ getAvgValue(getLocationData(locationId), 'pressure').toFixed(0) }}</td>
              <td class="text-right">{{ getMinValue(getLocationData(locationId), 'pressure').toFixed(0) }}</td>
            </tr>
          </tbody>
        </v-table>
      </v-card-text>
    </v-card>
    
    <!-- Tabla de horas de sol -->
    <v-card class="mb-4">
      <v-card-title class="d-flex align-center">
        <v-icon class="mr-2" color="amber-darken-2">mdi-white-balance-sunny</v-icon>
        Resumen de Horas de Sol
      </v-card-title>
      <v-card-text>
        <v-table>
          <thead>
            <tr>
              <th>Ubicación</th>
              <th>Máximo diario (h)</th>
              <th>Media diaria (h)</th>
              <th>Total acumulado (h)</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="locationId in selectedLocations" :key="`sun-${locationId}`">
              <td>{{ getLocationDisplayName(locationId) }}</td>
              <td class="text-right">{{ getMaxValue(getLocationData(locationId), 'sunshine_hours').toFixed(1) }}</td>
              <td class="text-right">{{ getAvgValue(getLocationData(locationId), 'sunshine_hours').toFixed(1) }}</td>
              <td class="text-right">{{ getTotalSunHours(getLocationData(locationId)).toFixed(0) }}</td>
            </tr>
          </tbody>
        </v-table>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { useSummaryStatistics } from '../../composables/useSummaryStatistics';
import type { WeatherData } from '../../models';

const props = defineProps({
  historicalData: {
    type: Array as () => WeatherData[],
    required: true
  },
  selectedLocations: {
    type: Array as () => string[],
    required: true
  },
  getLocationDisplayName: {
    type: Function as () => (locationId: string) => string,
    required: true
  }
});

const { calculateMax, calculateMin, calculateAverage, filterDataByLocation } = useSummaryStatistics();

// Obtener datos de una ubicación específica
function getLocationData(locationId: string): WeatherData[] {
  return filterDataByLocation(props.historicalData, locationId);
}

// Obtener valores máximos, mínimos y promedio para una propiedad específica
function getMaxValue(data: WeatherData[], property: keyof WeatherData): number {
  return calculateMax(data, property);
}

function getMinValue(data: WeatherData[], property: keyof WeatherData): number {
  return calculateMin(data, property);
}

function getAvgValue(data: WeatherData[], property: keyof WeatherData): number {
  return calculateAverage(data, property);
}

// Calcular el total de precipitaciones
function getTotalRainfall(data: WeatherData[]): number {
  return data.reduce((total, day) => total + (day.rainfall || 0), 0);
}

// Calcular el total de horas de sol
function getTotalSunHours(data: WeatherData[]): number {
  return data.reduce((total, day) => total + (day.sunshine_hours || 0), 0);
}

// Obtener dirección predominante del viento
function getDominantWindDirection(data: WeatherData[]): string {
  const directions = [
    { min: 0, max: 22.5, name: 'N' },
    { min: 22.5, max: 67.5, name: 'NE' },
    { min: 67.5, max: 112.5, name: 'E' },
    { min: 112.5, max: 157.5, name: 'SE' },
    { min: 157.5, max: 202.5, name: 'S' },
    { min: 202.5, max: 247.5, name: 'SW' },
    { min: 247.5, max: 292.5, name: 'W' },
    { min: 292.5, max: 337.5, name: 'NW' },
    { min: 337.5, max: 360, name: 'N' }
  ];
  
  const counts = directions.map(() => 0);
  
  data.forEach(item => {
    const dir = item.wind_direction;
    if (dir !== undefined) {
      const dirIndex = directions.findIndex(d => dir >= d.min && dir < d.max);
      if (dirIndex !== -1) {
        counts[dirIndex]++;
      }
    }
  });
  
  const maxIndex = counts.indexOf(Math.max(...counts));
  return directions[maxIndex]?.name || 'N/A';
}
</script>

<style scoped>
.v-table {
  width: 100%;
}
.text-right {
  text-align: right;
}
</style>
