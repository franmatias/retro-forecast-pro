<template>
  <base-widget
    title="Evolución meteorológica"
    icon="mdi-chart-line"
  >
    <div class="chart-container">
      <canvas ref="chartCanvas" />
    </div>
  </base-widget>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, nextTick } from 'vue'
import { Chart, type ChartData, type ChartOptions } from 'chart.js'
import BaseWidget from './base/BaseWidget.vue'

interface HourlyWeatherData {
  time: string[]
  temperature_2m: number[]
  apparent_temperature: number[]
  precipitation_probability: number[]
  relative_humidity_2m: number[]
}

const props = defineProps<{
  hourlyData: HourlyWeatherData
  currentHourIndex: number
}>()

const chartCanvas = ref<HTMLCanvasElement | null>(null)
let chart: Chart | null = null

async function initChart() {
  if (!chartCanvas.value) return

  // Destruir el gráfico existente si hay uno
  if (chart) {
    chart.destroy()
  }

  // Esperar al siguiente tick para asegurar que el canvas está en el DOM
  await nextTick()

  const ctx = chartCanvas.value.getContext('2d')
  if (!ctx) return

  const data: ChartData = {
    labels: props.hourlyData.time
      .slice(props.currentHourIndex, props.currentHourIndex + 24)
      .map((time: string) => new Date(time).getHours() + 'h'),
    datasets: [
      {
        label: 'Temperatura',
        data: props.hourlyData.temperature_2m.slice(props.currentHourIndex, props.currentHourIndex + 24),
        borderColor: '#FF6B6B',
        backgroundColor: 'rgba(255, 107, 107, 0.1)',
        fill: true,
        tension: 0.4,
        yAxisID: 'y'
      },
      {
        label: 'Sensación térmica',
        data: props.hourlyData.apparent_temperature.slice(props.currentHourIndex, props.currentHourIndex + 24),
        borderColor: '#4ECDC4',
        backgroundColor: 'transparent',
        borderDash: [5, 5],
        tension: 0.4,
        yAxisID: 'y'
      },
      {
        label: 'Probabilidad de lluvia',
        data: props.hourlyData.precipitation_probability.slice(props.currentHourIndex, props.currentHourIndex + 24),
        borderColor: '#45B7D1',
        backgroundColor: 'rgba(69, 183, 209, 0.1)',
        fill: true,
        tension: 0.4,
        yAxisID: 'y1'
      },
      {
        label: 'Humedad',
        data: props.hourlyData.relative_humidity_2m.slice(props.currentHourIndex, props.currentHourIndex + 24),
        borderColor: '#96CEB4',
        backgroundColor: 'transparent',
        borderDash: [3, 3],
        tension: 0.4,
        yAxisID: 'y1'
      }
    ]
  }

  const options: ChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false
    },
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: {
          color: 'rgba(255, 255, 255, 0.7)',
          usePointStyle: true
        }
      },
      tooltip: {
        mode: 'index',
        intersect: false
      }
    },
    scales: {
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        title: {
          display: true,
          text: 'Temperatura (°C)',
          color: 'rgba(255, 255, 255, 0.7)'
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.7)'
        }
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        title: {
          display: true,
          text: 'Probabilidad / Humedad (%)',
          color: 'rgba(255, 255, 255, 0.7)'
        },
        grid: {
          drawOnChartArea: false
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.7)'
        }
      },
      x: {
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.7)'
        }
      }
    }
  }

  chart = new Chart(ctx, {
    type: 'line',
    data,
    options
  })
}

// Inicializar el gráfico cuando el componente se monta
onMounted(async () => {
  await initChart()
})

// Actualizar el gráfico cuando cambian los datos
watch(
  [() => props.hourlyData, () => props.currentHourIndex],
  async () => {
    await initChart()
  },
  { deep: true }
)
</script>

<style scoped>
.chart-container {
  position: relative;
  height: 400px; 
  width: 100%;
}
</style>
