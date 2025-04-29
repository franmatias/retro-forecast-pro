import { defineComponent, h, onMounted, watch } from 'vue';
import { Chart } from 'chart.js';

// Mock para el componente WeatherChart
export default defineComponent({
  name: 'WeatherChart',
  props: {
    hourlyData: {
      type: Object,
      required: true
    },
    currentHourIndex: {
      type: Number,
      required: true
    }
  },
  setup(props) {
    let chart: Chart | null = null;

    // Función que simula la creación del gráfico
    const createChart = () => {
      // Simulamos la creación de un gráfico
      if (chart) {
        chart.destroy();
      }
      
      // En un mock no necesitamos realmente crear el gráfico, solo simular que lo hacemos
      chart = new Chart(document.createElement('canvas'), {
        type: 'line',
        data: {
          labels: [],
          datasets: []
        },
        options: {}
      });
    };

    onMounted(() => {
      createChart();
    });

    // Recreamos el gráfico cuando cambian las props
    watch(() => props.hourlyData, createChart, { deep: true });
    watch(() => props.currentHourIndex, createChart);

    return () => h('div', { class: 'chart-container' }, [
      h('canvas')
    ]);
  }
});