<template>
  <!-- Primero el fondo -->
  <weather-background :weather-code="currentWeatherCode" class="weather-background-container" />

  <!-- Luego el contenido -->
  <v-container fluid class="forecast-content-container">
    <!-- Selector de ubicaciones guardadas -->
    <v-row>
      <v-col cols="12" md="8">
        <v-card>
          <v-card-text>
            <v-select
              v-model="selectedLocationId"
              :items="locations"
              item-title="name"
              item-value="id"
              label="Seleccionar ubicación"
              :disabled="!hasStoredLocations"
              :hint="
                !hasStoredLocations
                  ? 'No hay ubicaciones guardadas. Por favor, añade ubicaciones en la página de Localización.'
                  : ''
              "
              persistent-hint
              variant="outlined"
              return-object
              @update:model-value="handleLocationSelect"
            >
              <template #selection="{ item }">
                <div>{{ item.title }}</div>
              </template>
              <template #item="{ item, props }">
                <v-list-item v-bind="props" :title="item.raw.name" :subtitle="item.raw.location" />
              </template>
              <template v-if="hasStoredLocations" #prepend-item>
                <v-list-item :disabled="isLoading || isGeolocating" @click="handleGeoLocationClick">
                  <template #prepend>
                    <v-icon color="primary"> mdi-crosshairs-gps </v-icon>
                  </template>
                  <v-list-item-title>Usar mi ubicación actual</v-list-item-title>
                </v-list-item>
                <v-divider class="mt-2 mb-2" />
              </template>
            </v-select>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" md="4" class="d-flex align-center">
        <v-btn
          color="primary"
          :loading="isLoading"
          :disabled="!selectedLocationObj"
          @click="loadWeatherData"
        >
          <v-icon start> mdi-refresh </v-icon>
          Actualizar datos
        </v-btn>
        <v-spacer />
        <v-btn
          variant="outlined"
          color="secondary"
          :loading="isGeolocating"
          class="ml-2"
          @click="handleGeoLocationClick"
        >
          <v-icon start> mdi-crosshairs-gps </v-icon>
          Mi ubicación
        </v-btn>
      </v-col>
    </v-row>
    
    <!-- Mostrar loader mientras se cargan los datos -->
    <v-row v-if="isLoading && selectedLocation">
      <v-col cols="12" :md="6" class="text-center">
        <v-progress-circular indeterminate color="primary" size="64" />
        <div class="mt-3">Cargando datos meteorológicos...</div>
      </v-col>
    </v-row>

    <!-- Contenido principal cuando hay datos -->
    <template v-else-if="selectedLocation && weatherDataValue">
      <!-- Stats -->
      <v-row>
        <v-col cols="12">
          <v-row>
            <v-col v-for="(stat, index) in stats" :key="index" cols="12" sm="6" :md="3">
              <stat-widget
                :color="stat.color"
                :icon="stat.icon"
                :value="stat.value"
                :unit="stat.unit"
                :label="stat.label"
                :subtitle="stat.subtitle"
                :delay="index * 0.1"
              />
            </v-col>
          </v-row>
        </v-col>
      </v-row>

      <!-- FILA 1: Información Local, Información Adicional, Recomendaciones -->
      <v-row class="mt-4">
        <v-col cols="12" md="4">
          <local-info-widget
            :location="enhancedLocationInfo"
            :sunrise="weatherDataValue?.daily?.sunrise[0] || ''"
            :sunset="weatherDataValue?.daily?.sunset[0] || ''"
          />
        </v-col>
        <v-col cols="12" md="4">
          <additional-info-widget
            :visibility="currentVisibility"
            :dew-point="dewPoint"
            :cloud-cover="cloudCover"
            :moon-phase="moonPhase"
            :is-daytime="isDaytime"
            :timezone-offset="weatherDataValue?.utc_offset_seconds || 0"
            :sunrise="weatherDataValue?.daily?.sunrise[0] || ''"
            :sunset="weatherDataValue?.daily?.sunset[0] || ''"
          />
        </v-col>
        <v-col cols="12" md="4">
          <weather-recommendations
            :recommendation="weatherRecommendation"
            :items="recommendedItems"
          />
        </v-col>
      </v-row>

      <!-- FILA 2: Condiciones Actuales, Viento, Presión -->
      <v-row class="mt-4">
        <v-col cols="12" md="4">
          <current-conditions-widget
            :temperature="currentTemp"
            :feels-like="currentFeelsLike"
            :humidity="currentHumidity"
            :wind-speed="currentWind"
            :wind-direction="windDirection"
            :pressure="currentPressure"
            :weather-icon="currentWeatherIcon"
            :description="currentWeatherDescription"
          />
        </v-col>
        <v-col cols="12" md="4">
          <wind-widget
            :speed="currentWind"
            :degrees="currentWindDegrees"
            :direction="windDirection"
          />
        </v-col>
        <v-col cols="12" md="4">
          <pressure-gauge :pressure="currentPressure" :previous-pressure="previousPressure" />
        </v-col>
      </v-row>

      <!-- FILA 3: DayState, UV y Calidad del Aire -->
      <v-row class="mt-4">
        <v-col cols="12" md="6">
          <day-state-widget
            :sunrise="weatherDataValue?.daily?.sunrise[0] || ''"
            :sunset="weatherDataValue?.daily?.sunset[0] || ''"
            :timezone-offset="weatherDataValue?.utc_offset_seconds || 0"
          />
        </v-col>
        <v-col cols="12" md="6">
          <air-quality-widget
            :uv-index="uvIndex"
            :uv-index-color="uvIndexColor"
            :uv-index-percentage="uvIndexPercentage"
            :uv-description="uvDescription"
            :air-quality-text="airQualityText"
            :air-quality-color="airQualityColor"
            :air-quality-percentage="airQualityPercentage"
            :air-quality-description="airQualityDescription"
          />
        </v-col>
      </v-row>

      <!-- FILA 4: Próximas 24 horas -->
      <v-row class="mt-4">
        <v-col cols="12">
          <weather-hour-widget
            :date="new Date()"
            :max-temp="
              Math.max(
                ...weatherDataValue.hourly.temperature_2m.slice(currentHourIndex, currentHourIndex + 24)
              )
            "
            :min-temp="
              Math.min(
                ...weatherDataValue.hourly.temperature_2m.slice(currentHourIndex, currentHourIndex + 24)
              )
            "
            :hourly-forecast="
              weatherDataValue?.hourly?.time
                .slice(currentHourIndex, currentHourIndex + 24)
                .map((time, index) => ({
                  hour: new Date(time).getHours(),
                  temp: Math.round(
                    weatherDataValue?.hourly?.temperature_2m[currentHourIndex + index] || 0
                  ),
                  weatherCode: weatherDataValue?.hourly?.weather_code[currentHourIndex + index] || 0,
                })) || []
            "
            :sunset-hour="new Date(weatherDataValue.daily.sunset[0]).getHours()"
            :sunrise-hour="new Date(weatherDataValue.daily.sunrise[0]).getHours()"
          />
        </v-col>
      </v-row>

      <!-- FILA 5: Pronóstico -->
      <v-row class="mt-4">
        <v-col cols="12">
          <forecast-widget :forecasts="forecasts" />
        </v-col>
      </v-row>

      <!-- FILA 6: Mapa Meteorológico, Evolución meteorológica -->
      <v-row class="mt-4">
        <v-col cols="12" md="6">
          <weather-map-widget
            v-model:map-type="mapType"
            :location="selectedLocation"
            :weather-data="weatherDataValue"
          />
        </v-col>
        <v-col cols="12" md="6">
          <weather-chart
            v-if="weatherDataValue?.hourly"
            :hourly-data="weatherDataValue.hourly"
            :current-hour-index="currentHourIndex"
          />
        </v-col>
      </v-row>

      <!-- Alertas meteorológicas si existen -->
      <v-row v-if="weatherAlerts && weatherAlerts.length > 0" class="mt-4">
        <v-col cols="12">
          <weather-alerts :alerts="weatherAlerts" />
        </v-col>
      </v-row>
    </template>

    <!-- Mensaje cuando no hay datos seleccionados -->
    <v-row v-else-if="!isLoading">
      <v-col cols="12" class="text-center">
        <v-alert
          type="info"
          text="Por favor, selecciona una localización para ver el pronóstico del tiempo"
          class="mt-4"
        />
        <div class="mt-8">
          <v-img src="/assets/weather-illustration.svg" max-width="300" class="mx-auto mb-4" />
          <v-btn
            :loading="isLoading"
            color="primary"
            prepend-icon="mdi-crosshairs-gps"
            @click="handleGeoLocationClick"
          >
            Usar mi ubicación actual
          </v-btn>
        </div>
        <div class="mt-4 text-caption">
          Datos proporcionados por
          <a href="https://open-meteo.com/" target="_blank" rel="noopener noreferrer">
            Open-Meteo
          </a>
        </div>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { computed, onMounted, watch, toRef } from 'vue'
import {
  Chart,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  LineController,
} from 'chart.js'

// Importar composables específicos de la característica usando el barrel
import { useWeatherData, useLocationSelect } from '../composables'
import { useDashboardStore } from '../../../stores/dashboardStore'

// Importar componentes
import WindWidget from './WindWidget.vue'
import PressureGauge from './PressureGauge.vue'
import StatWidget from './WeatherStatWidget.vue'
import AirQualityWidget from './AirQualityWidget.vue'
import CurrentConditionsWidget from './CurrentConditionsWidget.vue'
import ForecastWidget from './ForecastWidget.vue'
import WeatherChart from './WeatherChart.vue'
import AdditionalInfoWidget from './AdditionalInfoWidget.vue'
import WeatherMapWidget from './WeatherMapWidget.vue'
import WeatherRecommendations from './WeatherRecommendations.vue'
import WeatherHourWidget from './WeatherHourWidget.vue'
import LocalInfoWidget from './LocalInfoWidget.vue'
import DayStateWidget from './DayStateWidget.vue'
import WeatherBackground from './WeatherBackground.vue'

// Registrar componentes de Chart.js
Chart.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  LineController
)

// Inicializar composables
const weatherDataComposable = useWeatherData()
const locationDataComposable = useLocationSelect()
const dashboardStore = useDashboardStore()

// Extraer valores de los composables para facilitar su uso en la plantilla
const weatherDataValue = toRef(weatherDataComposable, 'weatherData')
const weatherAlerts = toRef(weatherDataComposable, 'weatherAlerts')
const isLoading = toRef(weatherDataComposable, 'isLoading')
const forecasts = toRef(weatherDataComposable, 'forecasts')
const currentHourIndex = toRef(weatherDataComposable, 'currentHourIndex')
const currentTemp = toRef(weatherDataComposable, 'currentTemp')
const currentFeelsLike = toRef(weatherDataComposable, 'currentFeelsLike')
const currentHumidity = toRef(weatherDataComposable, 'currentHumidity')
const currentWind = toRef(weatherDataComposable, 'currentWind')
const windDirection = toRef(weatherDataComposable, 'windDirection')
const currentPressure = toRef(weatherDataComposable, 'currentPressure')
const currentWeatherIcon = toRef(weatherDataComposable, 'currentWeatherIcon')
const currentWeatherDescription = toRef(weatherDataComposable, 'currentWeatherDescription')
const currentVisibility = toRef(weatherDataComposable, 'currentVisibility')
const uvIndex = toRef(weatherDataComposable, 'uvIndex')
const uvIndexColor = toRef(weatherDataComposable, 'uvIndexColor')
const uvIndexPercentage = toRef(weatherDataComposable, 'uvIndexPercentage')
const uvDescription = toRef(weatherDataComposable, 'uvDescription')
const airQualityText = toRef(weatherDataComposable, 'airQualityText')
const airQualityColor = toRef(weatherDataComposable, 'airQualityColor')
const airQualityPercentage = toRef(weatherDataComposable, 'airQualityPercentage')
const airQualityDescription = toRef(weatherDataComposable, 'airQualityDescription')
const dewPoint = toRef(weatherDataComposable, 'dewPoint')
const cloudCover = toRef(weatherDataComposable, 'cloudCover')
const moonPhase = toRef(weatherDataComposable, 'moonPhase')
const weatherRecommendation = toRef(weatherDataComposable, 'weatherRecommendation')
const recommendedItems = toRef(weatherDataComposable, 'recommendedItems')
const currentWeatherCode = toRef(weatherDataComposable, 'currentWeatherCode')
const isDaytime = toRef(weatherDataComposable, 'isDaytime')
const currentWindDegrees = toRef(weatherDataComposable, 'currentWindDegrees')
const previousPressure = toRef(weatherDataComposable, 'previousPressure')
const stats = toRef(weatherDataComposable, 'stats')

// Valores del composable de localización
const locations = toRef(locationDataComposable, 'locations')
const hasStoredLocations = toRef(locationDataComposable, 'hasStoredLocations')
const selectedLocationId = toRef(locationDataComposable, 'selectedLocationId')
const selectedLocationObj = toRef(locationDataComposable, 'selectedLocationObj')
const selectedLocation = toRef(locationDataComposable, 'selectedLocation')
const locationInfo = toRef(locationDataComposable, 'locationInfo')
const isGeolocating = toRef(locationDataComposable, 'isGeolocating')

// Configuración del mapa
const mapType = computed({
  get: () => dashboardStore.mapType,
  set: (value) => dashboardStore.setMapType(value),
})

// Agregar un computed para incluir los detalles de la ubicación
const enhancedLocationInfo = computed(() => {
  if (!weatherDataComposable.locationDetails.value) {
    return locationInfo.value;
  }
  
  const details = weatherDataComposable.locationDetails.value;
  
  return {
    ...locationInfo.value,
    country: details.country || locationInfo.value.country,
    region: details.admin1 || locationInfo.value.region,
    elevation: details.elevation || locationInfo.value.elevation,
    population: details.population || locationInfo.value.population,
  };
});

// Función para manejar la selección de ubicación
const handleLocationSelect = () => {
  if (selectedLocationObj.value) {
    loadWeatherData()
  }
}

// Función para actualizar datos meteorológicos
const loadWeatherData = async () => {
  await weatherDataComposable.loadWeatherData(selectedLocation.value)
}

// Wrapper function para getCurrentLocation
const handleGeoLocationClick = async () => {
  const location = await locationDataComposable.getCurrentLocation()
  if (location) {
    await loadWeatherData()
  }
}

// Añadir watch para actualizar información de ubicación
watch(() => weatherDataComposable.locationDetails.value, (newDetails) => {
  if (newDetails) {
    locationDataComposable.updateGeocodingDetails(newDetails);
  }
}, { immediate: true });

// Monitoreo de cambios en weatherCode para debug
watch(currentWeatherCode, (newCode) => {
  console.log('WeatherForecast - Current Weather Code:', newCode)
})

// Inicializar datos cuando el componente se monta
onMounted(async () => {
  // Si ya tenemos una ubicación seleccionada, cargamos los datos
  if (selectedLocationId.value) {
    await loadWeatherData()
  }
})
</script>

<style scoped>
.forecast-content-container {
  padding-top: 32px !important;  /* Padding superior más generoso */
  margin-top: 24px !important;
}

.forecast-container {
  display: flex;
  flex-wrap: wrap;
  margin: 0 -8px;
}

.forecast-item {
  flex: 1 1 calc(100% / 7);
  min-width: 120px; /* Mínimo ancho para legibilidad */
  padding: 0 8px;
  margin-bottom: 16px;
}

/* Responsive breakpoints */
@media (max-width: 600px) {
  .forecast-item {
    flex: 1 1 100%;
  }
}

@media (min-width: 601px) and (max-width: 960px) {
  .forecast-item {
    flex: 1 1 50%;
  }
}

@media (min-width: 961px) and (max-width: 1264px) {
  .forecast-item {
    flex: 1 1 calc(100% / 4);
  }
}

@media (min-width: 1265px) {
  .forecast-item {
    flex: 1 1 calc(100% / 7);
  }
}

.weather-background-container {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: -1;
  width: 100vw;
  height: 100vh;
  pointer-events: none; /* Asegurarse de que no interfiera con los clicks */
}
</style>
