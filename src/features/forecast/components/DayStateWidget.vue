<template>
  <base-widget
    :title="title"
    :icon="currentIcon"
  >
    <div class="day-state-widget">
      <!-- Hora actual -->
      <div class="text-h3 text-center font-weight-light mb-6">
        {{ currentTime }}
      </div>

      <!-- Curva del sol -->
      <div class="sun-curve-container">
        <!-- SVG para la curva solar -->
        <svg
          viewBox="-20 0 140 70"
          preserveAspectRatio="xMidYMid meet"
          class="sun-curve"
        >
          <defs>
            <linearGradient 
              id="sunPathGradient" 
              x1="0%" 
              y1="0%" 
              x2="100%" 
              y2="0%"
            >
              <stop 
                offset="0%" 
                style="stop-color: rgba(255,193,7,0.3)" 
              />
              <stop 
                offset="50%" 
                style="stop-color: rgba(255,193,7,0.5)" 
              />
              <stop 
                offset="100%" 
                style="stop-color: rgba(255,193,7,0.3)" 
              />
            </linearGradient>
            <!-- Filtro para el resplandor -->
            <filter 
              id="glow" 
              x="-30%" 
              y="-30%" 
              width="160%" 
              height="160%"
            >
              <feGaussianBlur 
                stdDeviation="2" 
                result="blur" 
              />
              <feComposite 
                in="SourceGraphic" 
                in2="blur" 
                operator="over" 
              />
            </filter>
          </defs>
          
          <!-- Horizonte extendido -->
          <line
            x1="-40"
            y1="65"
            x2="150"
            y2="65"
            stroke="rgba(255,255,255,0.15)"
            stroke-width="1"
          />
          
          <!-- Arco solar extendido -->
          <path
            d="M-20,65 Q50,-10 120,65"
            fill="none"
            stroke="url(#sunPathGradient)"
            stroke-width="2.5"
          />
          
          <!-- Icono del sol o la luna en lugar del círculo -->
          <g 
            :transform="`translate(${calculateSunPosition()}, ${calculateSunHeight()})`"
            filter="url(#glow)"
          >
            <!-- Sol durante el día -->
            <svg 
              v-if="isDaytime" 
              x="-6" 
              y="-6" 
              width="12" 
              height="12" 
              viewBox="0 0 24 24"
              fill="#FFC107"
            >
              <path d="M12,7A5,5 0 0,1 17,12A5,5 0 0,1 12,17A5,5 0 0,1 7,12A5,5 0 0,1 12,7M12,9A3,3 0 0,0 9,12A3,3 0 0,0 12,15A3,3 0 0,0 15,12A3,3 0 0,0 12,9M12,2L14.39,5.42C13.65,5.15 12.84,5 12,5C11.16,5 10.35,5.15 9.61,5.42L12,2M3.34,7L7.5,6.65C6.9,7.16 6.36,7.78 5.94,8.5C5.5,9.24 5.25,10 5.11,10.79L3.34,7M3.36,17L5.12,13.23C5.26,14 5.53,14.78 5.95,15.5C6.37,16.24 6.91,16.86 7.5,17.37L3.36,17M20.65,7L18.88,10.79C18.74,10 18.47,9.23 18.05,8.5C17.63,7.78 17.1,7.15 16.5,6.64L20.65,7M20.64,17L16.5,17.36C17.09,16.85 17.62,16.22 18.04,15.5C18.46,14.77 18.73,14 18.87,13.21L20.64,17M12,22L9.59,18.56C10.33,18.83 11.14,19 12,19C12.82,19 13.63,18.83 14.37,18.56L12,22Z" />
            </svg>
            
            <!-- Luna durante la noche -->
            <svg 
              v-else 
              x="-6" 
              y="-6" 
              width="12" 
              height="12" 
              viewBox="0 0 24 24"
              fill="#90A4AE"
            >
              <path :d="getMoonPhaseIcon()" />
            </svg>
          </g>
        </svg>

        <!-- Marcadores de tiempo -->
        <div class="time-markers">
          <div class="marker-sunrise">
            <v-icon 
              color="amber-lighten-1" 
              size="small"
            >
              mdi-weather-sunset-up
            </v-icon>
            <span>{{ formatTime(sunrise) }}</span>
          </div>
          <div class="marker-sunset">
            <v-icon 
              color="deep-orange-lighten-1" 
              size="small"
            >
              mdi-weather-sunset-down
            </v-icon>
            <span>{{ formatTime(sunset) }}</span>
          </div>
        </div>
      </div>

      <!-- Información de amanecer y atardecer -->
      <div class="d-flex justify-space-between align-center mt-4">
        <div class="text-center">
          <v-icon
            color="amber-lighten-1"
            class="mb-1"
          >
            mdi-weather-sunset-up
          </v-icon>
          <div 
            class="text-caption text-white"
          >
            Amanecer
          </div>
          <div class="text-body-2 text-white">
            {{ formatTime(sunrise) }}
          </div>
        </div>
        
        <v-divider vertical class="mx-4" />
        
        <div class="text-center">
          <div class="text-h6 text-white">
            {{ remainingTime }}
          </div>
          <div 
            class="text-caption text-white"
          >
            {{ remainingTimeLabel }}
          </div>
        </div>
        
        <v-divider vertical class="mx-4" />
        
        <div class="text-center">
          <v-icon
            color="deep-orange-lighten-1"
            class="mb-1"
          >
            mdi-weather-sunset-down
          </v-icon>
          <div 
            class="text-caption text-white"
          >
            Atardecer
          </div>
          <div 
            class="text-body-2 text-white"
          >
            {{ formatTime(sunset) }}
          </div>
        </div>
      </div>
    </div>
  </base-widget>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import BaseWidget from './base/BaseWidget.vue'
import { getCurrentLocationTime, formatTimeHHMM } from '@/services/timeUtils'

// Cambiar el nombre del prop para evitar conflictos
const props = defineProps<{
  sunrise: string
  sunset: string
  timezoneOffset: number // Ya no es opcional
}>()

// Reloj para actualizar la hora cada cierto tiempo
const currentTick = ref(Date.now())
let timer: number

// Crear un ID único para debugging
const instanceId = Math.random().toString(36).substring(2, 7)

// Registrar la creación del widget con su offset
console.log(`DayStateWidget ${instanceId} creado con offset:`, {
  offsetSegundos: props.timezoneOffset,
  offsetHoras: props.timezoneOffset/3600,
  amanecer: props.sunrise,
  atardecer: props.sunset
})

// Función para obtener la hora local actual en la ubicación del widget
function getWidgetLocalTime(): Date {
  return getCurrentLocationTime(props.timezoneOffset)
}

// Actualizar la hora cada 15 segundos
onMounted(() => {
  timer = window.setInterval(() => {
    currentTick.value = Date.now()
    
    // Log de diagnóstico cada minuto
    if (currentTick.value % (60 * 1000) < 15000) {
      console.log(`DayStateWidget ${instanceId} - Hora actual:`, {
        offsetZona: `${props.timezoneOffset}s (${props.timezoneOffset/3600}h)`,
        horaCalculada: formatTimeHHMM(getWidgetLocalTime())
      })
    }
  }, 15000)
})

onUnmounted(() => {
  clearInterval(timer)
})

const currentTime = computed(() => {
  // Esta dependencia asegura que se recalcule cuando cambie currentTick
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _tickDependency = currentTick.value
  
  // Usar la función para obtener la hora local
  const localTime = getWidgetLocalTime()
  return formatTimeHHMM(localTime)
})

// Determinar si es de día basado en la hora actual y las horas de amanecer/atardecer
const isDaytime = computed(() => {
  const now = getWidgetLocalTime().getTime()
  const sunriseTime = new Date(props.sunrise).getTime()
  const sunsetTime = new Date(props.sunset).getTime()
  
  return now >= sunriseTime && now <= sunsetTime
})

const title = computed(() => isDaytime.value ? 'Durante el día' : 'Durante la noche')
const currentIcon = computed(() => isDaytime.value ? 'mdi-white-balance-sunny' : 'mdi-moon-waning-crescent')

// Calcular tiempo restante hasta el próximo evento (amanecer o atardecer)
const remainingTime = computed(() => {
  const now = getWidgetLocalTime().getTime()
  const target = isDaytime.value 
    ? new Date(props.sunset).getTime() 
    : new Date(props.sunrise).getTime()
  
  const diff = Math.abs(target - now)
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  
  return `${hours}h ${minutes}m`
})

const remainingTimeLabel = computed(() => 
  isDaytime.value ? 'Hasta el atardecer' : 'Hasta el amanecer'
)

// Formatear la hora para mostrar
function formatTime(timeString: string): string {
  try {
    return new Date(timeString).toLocaleTimeString('es', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    })
  } catch (e) {
    console.error('Error formateando hora:', e, timeString)
    return 'N/A'
  }
}

// Cálculo de la posición X del icono en la curva
function calculateSunPosition(): number {
  const now = getWidgetLocalTime().getTime()
  const sunriseTime = new Date(props.sunrise).getTime()
  const sunsetTime = new Date(props.sunset).getTime()
  
  if (now < sunriseTime) return -20
  if (now > sunsetTime) return 120
  
  return ((now - sunriseTime) / (sunsetTime - sunriseTime)) * 140 - 20
}

// Cálculo de la altura Y del icono en la curva Bezier
function calculateSunHeight(): number {
  const now = getWidgetLocalTime().getTime()
  const sunriseTime = new Date(props.sunrise).getTime()
  const sunsetTime = new Date(props.sunset).getTime()
  
  if (now < sunriseTime || now > sunsetTime) return 65 // En el horizonte (ajustado a nueva altura)
  
  const progress = (now - sunriseTime) / (sunsetTime - sunriseTime)
  
  // Calcular punto en curva Bezier ajustada
  const y0 = 65;   // Punto inicial Y (ajustado)
  const y1 = -10;  // Punto de control Y (ajustado)
  const y2 = 65;   // Punto final Y (ajustado)
  
  const t = progress;
  const bezierY = Math.pow(1-t, 2) * y0 + 2 * (1-t) * t * y1 + Math.pow(t, 2) * y2;
  
  return Math.max(bezierY, 5); // No permitir que salga del contenedor
}

// Función para determinar la fase de la luna adecuada para el icono
function getMoonPhaseIcon(): string {
  // Iconos de fase lunar de Material Design (paths SVG)
  const moonPhases = {
    new: "M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z", // Luna nueva
    waxingCrescent: "M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22A10,10 0 0,0 12,2Z", // Luna creciente
    firstQuarter: "M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22A10,10 0 0,1 12,2Z", // Cuarto creciente
    full: "M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22A10,10 0 0,1 2,12A10,10 0 0,1 12,2Z", // Luna llena
    waningGibbous: "M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,1 12,2Z", // Luna gibosa menguante
    lastQuarter: "M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 12,2Z", // Cuarto menguante
  }

  // Para simplificar, usamos la luna llena como valor predeterminado
  // En una implementación real, calcularíamos la fase lunar basada en la fecha
  return moonPhases.full
}
</script>

<style scoped>
.sun-curve-container {
  position: relative;
  width: 100%;
  height: 150px; /* Reducido desde 200px para un diseño más compacto */
  margin: 20px 0;
  background: rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  padding: 16px;
}

.sun-curve {
  display: block;
  width: 100%;
  height: 100%;
}

.time-markers {
  position: absolute;
  bottom: 8px;
  left: 0;
  right: 0;
  display: flex;
  justify-content: space-between;
  padding: 0 16px;
  color: rgba(255, 255, 255, 0.7);
  font-size: 12px;
}

.marker-sunrise,
.marker-sunset {
  display: flex;
  align-items: center;
  gap: 4px;
}

.day-state-widget {
  padding: 16px;
}

.text-h3 {
  font-size: 2rem; /* Reducido para que sea más compacto */
  font-weight: 300;
}
</style>
