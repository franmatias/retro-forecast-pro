<template>
  <base-widget
    title="Promedios"
    icon="mdi-chart-line-variant"
  >
    <!-- Temperatura Actual -->
    <div class="d-flex flex-column align-center">
      <div 
        class="text-h2 font-weight-bold text-white mb-1"
        aria-label="Temperatura actual"
      >
        {{ formattedTemperature }}
      </div>
      
      <!-- Descripción -->
      <div 
        class="text-body-1 text-white-darken-1 text-center mb-4 description-text"
        aria-live="polite"
      >
        {{ computedDescription }}
      </div>

      <!-- Información Adicional -->
      <div class="info-container">
        <div class="d-flex justify-space-between mb-2">
          <span class="text-subtitle-2 text-white-darken-2">Hoy Máx.</span>
          <span class="text-h6 font-weight-medium text-white">
            {{ todayMax }}°
          </span>
        </div>
        <v-divider class="my-2 bg-white-darken-2" />
        <div class="d-flex justify-space-between">
          <span class="text-subtitle-2 text-white-darken-2">Promedio Máx.</span>
          <span class="text-h6 font-weight-medium text-white">
            {{ averageMax }}°
          </span>
        </div>
      </div>
    </div>

    <!-- Indicador de tendencia -->
    <div 
      class="trend-indicator"
      :class="trendClass"
      :aria-label="trendLabel"
    >
      <v-icon
        :color="trendColor"
        size="small"
      >
        {{ trendIcon }}
      </v-icon>
    </div>
  </base-widget>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import BaseWidget from './base/BaseWidget.vue'

interface Props {
  temperature: number
  averageMax: number
  todayMax: number
  description?: string
  title?: string
}

const props = withDefaults(defineProps<Props>(), {
  description: '',
  title: 'PROMEDIOS'
})

// Formatear temperatura actual con signo + y símbolo de grados
const formattedTemperature = computed(() => {
  const sign = props.temperature > 0 ? '+' : ''
  return `${sign}${props.temperature}°`
})

// Calcular descripción basada en la comparación con el promedio
const computedDescription = computed(() => {
  if (props.description) return props.description

  const diff = props.temperature - props.averageMax
  if (diff > 0) {
    return 'por encima del máximo promedio diario'
  } else if (diff < 0) {
    return 'por debajo del máximo promedio diario'
  }
  return 'igual al máximo promedio diario'
})

// Calcular tendencia
const trendClass = computed(() => {
  const diff = props.temperature - props.averageMax
  return {
    'trend-up': diff > 0,
    'trend-down': diff < 0,
    'trend-neutral': diff === 0
  }
})

const trendColor = computed(() => {
  const diff = props.temperature - props.averageMax
  if (diff > 0) return 'error'
  if (diff < 0) return 'success'
  return 'grey'
})

const trendIcon = computed(() => {
  const diff = props.temperature - props.averageMax
  if (diff > 0) return 'mdi-arrow-up'
  if (diff < 0) return 'mdi-arrow-down'
  return 'mdi-minus'
})

const trendLabel = computed(() => {
  const diff = props.temperature - props.averageMax
  if (diff > 0) return 'Temperatura por encima del promedio'
  if (diff < 0) return 'Temperatura por debajo del promedio'
  return 'Temperatura igual al promedio'
})
</script>

<style scoped>
.resume-widget {
  border-radius: 16px;
  overflow: hidden;
  position: relative;
  height: 100%;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.info-container {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 16px;
  width: 100%;
  backdrop-filter: blur(4px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.trend-indicator {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(4px);
}

.trend-up {
  animation: float 2s ease-in-out infinite;
}

.trend-down {
  animation: sink 2s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-3px); }
}

@keyframes sink {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(3px); }
}

/* Mejoras de accesibilidad para el modo de alto contraste */
@media (forced-colors: active) {
  .resume-widget {
    border: 2px solid CanvasText;
  }
  
  .info-container {
    border: 1px solid CanvasText;
  }
}

.description-text {
  font-size: 1.1rem;
  letter-spacing: 0.5px;
  font-weight: 500;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}
</style>
