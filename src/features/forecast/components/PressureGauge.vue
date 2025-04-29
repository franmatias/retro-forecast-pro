<template>
  <base-widget
    title="Presión"
    icon="mdi-gauge"
  >
    <div class="gauge-wrapper">
      <div class="gauge-container">
        <div class="pressure-value text-h4 text-white font-weight-bold mb-4">
          {{ pressure }}
          <span class="text-h6">hPa</span>
          <v-icon
            :color="trendColor"
            :class="{'trend-up': isIncreasing}"
          >
            {{ trendIcon }}
          </v-icon>
        </div>

        <!-- Medidor semicircular SVG -->
        <div class="gauge-svg-container">
          <svg
            class="gauge"
            viewBox="0 0 200 120"
            preserveAspectRatio="xMidYMid meet"
          >
            <!-- Marcas de graduación -->
            <g class="gauge-ticks">
              <path
                v-for="tick in ticks"
                :key="tick.angle"
                :d="getTickPath(tick.angle)"
                stroke="rgba(255,255,255,0.2)"
                stroke-width="1"
              />
            </g>

            <!-- Fondo del medidor -->
            <path
              d="M20 100 A80 80 0 0 1 180 100"
              class="gauge-bg"
              fill="none"
              stroke="rgba(255,255,255,0.1)"
              stroke-width="8"
              stroke-linecap="round"
            />

            <!-- Arco de progreso -->
            <path
              :d="gaugeArc"
              class="gauge-fill"
              fill="none"
              :stroke="gaugeColor"
              stroke-width="8"
              stroke-linecap="round"
            />

            <!-- Aguja -->
            <g :style="needleTransform">
              <line
                x1="100"
                y1="100"
                x2="100"
                y2="30"
                stroke="#fff"
                stroke-width="2"
                class="needle"
              />
              <circle
                cx="100"
                cy="100"
                r="6"
                :fill="gaugeColor"
                class="needle-base"
              />
            </g>

            <!-- Etiquetas -->
            <text
              x="30"
              y="115"
              class="gauge-label"
            >
              Low
            </text>
            <text
              x="170"
              y="115"
              class="gauge-label"
              text-anchor="end"
            >
              High
            </text>
          </svg>
        </div>

        <!-- Rangos de presión -->
        <div class="pressure-range d-flex justify-space-between text-caption text-grey mt-4">
          <span>{{ minPressure }}hPa</span>
          <span>{{ maxPressure }}hPa</span>
        </div>
      </div>
    </div>
  </base-widget>
</template>

<script setup lang="ts">
import BaseWidget from './base/BaseWidget.vue'
import { computed } from 'vue'

interface Props {
  pressure: number
  previousPressure?: number
  minPressure?: number
  maxPressure?: number
}

const props = withDefaults(defineProps<Props>(), {
  previousPressure: 1013,
  minPressure: 950,
  maxPressure: 1050
})

// Calcular el porcentaje para el arco del medidor
const pressurePercentage = computed(() => {
  const range = props.maxPressure - props.minPressure
  return ((props.pressure - props.minPressure) / range) * 100
})

// Calcular el color del medidor basado en la presión
const gaugeColor = computed(() => {
  if (props.pressure < 980) return '#ff5252' // Rojo para presión baja
  if (props.pressure > 1020) return '#4caf50' // Verde para presión alta
  return '#2196f3' // Azul para presión normal
})

// Calcular el arco del medidor
const gaugeArc = computed(() => {
  const percentage = pressurePercentage.value
  const angle = (percentage * 1.8 - 180) * Math.PI / 180
  const x = 100 + 80 * Math.cos(angle)
  const y = 100 + 80 * Math.sin(angle)
  return `M20 100 A80 80 0 0 1 ${x} ${y}`
})

// Determinar la tendencia de la presión
const isIncreasing = computed(() => props.pressure > (props.previousPressure || 0))
const trendIcon = computed(() => isIncreasing.value ? 'mdi-arrow-up' : 'mdi-arrow-down')
const trendColor = computed(() => isIncreasing.value ? 'success' : 'error')

// Generar marcas de graduación
const ticks = computed(() => {
  const tickCount = 20
  const ticks = []
  for (let i = 0; i <= tickCount; i++) {
    const angle = -180 + (i * (180 / tickCount))
    ticks.push({ angle })
  }
  return ticks
})

// Función para generar el path de las marcas de graduación
function getTickPath(angle: number): string {
  const rad = (angle * Math.PI) / 180
  const outerRadius = 85
  const innerRadius = 80
  const x1 = 100 + outerRadius * Math.cos(rad)
  const y1 = 100 + outerRadius * Math.sin(rad)
  const x2 = 100 + innerRadius * Math.cos(rad)
  const y2 = 100 + innerRadius * Math.sin(rad)
  return `M${x1},${y1} L${x2},${y2}`
}

// Calcular transformación de la aguja
const needleTransform = computed(() => {
  const rotation = (pressurePercentage.value * 1.8) - 180
  return {
    transform: `rotate(${rotation}deg)`,
    'transform-origin': '100px 100px',
    transition: 'transform 1s cubic-bezier(0.4, 0, 0.2, 1)'
  }
})
</script>

<style scoped>
.gauge-wrapper {
  height: calc(100% - 76px); /* Altura total menos el título */
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
}

.pressure-gauge {
  border-radius: 16px;
  overflow: hidden;
  height: 100%;
}

.gauge-container {
  width: 100%;
  max-width: 300px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.pressure-value {
  position: relative;
  text-align: center;
  margin-bottom: 1rem;
}

.gauge-svg-container {
  width: 100%;
  position: relative;
  padding-bottom: 60%; /* Relación de aspecto */
}

.gauge {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.gauge-label {
  fill: rgba(255, 255, 255, 0.7);
  font-size: 14px;
  font-weight: 500;
}

.needle {
  transform-origin: 100px 100px;
  transition: transform 1s cubic-bezier(0.4, 0, 0.2, 1);
}

.needle-base {
  filter: drop-shadow(0 0 2px rgba(0, 0, 0, 0.3));
}

.trend-up {
  animation: float 2s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-3px); }
}

.gauge-fill {
  transition: all 1s cubic-bezier(0.4, 0, 0.2, 1);
}

.gauge-ticks path {
  transition: opacity 0.3s ease;
}

.pressure-range {
  width: 100%;
  padding: 0 2rem;
}
</style>
