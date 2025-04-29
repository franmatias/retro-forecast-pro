import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import WeatherChart from '../components/WeatherChart.vue';

// Mock de Chart.js con una implementación más completa
vi.mock('chart.js', () => {
  const mockChart = vi.fn(() => ({
    destroy: vi.fn()
  }));
  
  return {
    Chart: mockChart,
    register: vi.fn(),
    CategoryScale: vi.fn(),
    LinearScale: vi.fn(),
    PointElement: vi.fn(),
    LineElement: vi.fn(),
    Title: vi.fn(),
    Tooltip: vi.fn(),
    Legend: vi.fn(),
    Filler: vi.fn()
  };
});

// Importamos Chart para poder espiar su constructor en los tests
import { Chart } from 'chart.js';

// Mock completo de BaseWidget
vi.mock('../components/base/BaseWidget.vue', () => ({
  default: {
    name: 'BaseWidget',
    template: '<div class="mock-base-widget"><slot /></div>',
    props: ['title', 'icon']
  }
}));

// Interfaz para los datos horarios
interface HourlyData {
  time: string[];
  temperature_2m: number[];
  apparent_temperature: number[];
  precipitation_probability: number[];
  relative_humidity_2m: number[];
}

describe('WeatherChart.vue', () => {
  let hourlyData: HourlyData;
  
  beforeEach(() => {
    // Reinicia todos los mocks
    vi.clearAllMocks();
    
    // Datos de prueba para el componente
    hourlyData = {
      time: [
        '2025-04-29T12:00:00',
        '2025-04-29T13:00:00',
        '2025-04-29T14:00:00',
        '2025-04-29T15:00:00'
      ],
      temperature_2m: [22, 23, 24, 25],
      apparent_temperature: [21, 22, 23, 24],
      precipitation_probability: [10, 20, 30, 40],
      relative_humidity_2m: [50, 55, 60, 65]
    };
  });

  it('renderiza correctamente con las props proporcionadas', async () => {
    const wrapper = mount(WeatherChart, {
      props: {
        hourlyData,
        currentHourIndex: 0
      },
      global: {
        stubs: {
          canvas: true
        }
      }
    });
    
    await nextTick();
    
    expect(wrapper.find('.chart-container').exists()).toBe(true);
    expect(wrapper.find('canvas').exists()).toBe(true);
  });

  it('inicializa el gráfico cuando el componente se monta', async () => {
    mount(WeatherChart, {
      props: {
        hourlyData,
        currentHourIndex: 0
      }
    });
    
    await nextTick();
    await nextTick(); // Añadimos un segundo nextTick para asegurar que el DOM se actualiza
    
    // Verificar que Chart.js fue llamado para crear el gráfico
    expect(Chart).toHaveBeenCalled();
  });

  it('actualiza el gráfico cuando cambian los datos', async () => {
    const wrapper = mount(WeatherChart, {
      props: {
        hourlyData,
        currentHourIndex: 0
      }
    });
    
    await nextTick();
    await nextTick(); // Añadimos un segundo nextTick
    
    // Verificar inicialización inicial
    expect(Chart).toHaveBeenCalledTimes(1);
    
    // Actualizar las props
    await wrapper.setProps({
      hourlyData: {
        ...hourlyData,
        temperature_2m: [25, 26, 27, 28]
      }
    });
    
    await nextTick();
    await nextTick(); // Añadimos un segundo nextTick
    
    // Verificar que el gráfico se vuelve a inicializar
    expect(Chart).toHaveBeenCalledTimes(2);
  });

  it('actualiza el gráfico cuando cambia el índice de hora actual', async () => {
    const wrapper = mount(WeatherChart, {
      props: {
        hourlyData,
        currentHourIndex: 0
      }
    });
    
    await nextTick();
    await nextTick(); // Añadimos un segundo nextTick
    
    // Verificar inicialización inicial
    expect(Chart).toHaveBeenCalledTimes(1);
    
    // Actualizar el índice de hora
    await wrapper.setProps({
      currentHourIndex: 1
    });
    
    await nextTick();
    await nextTick(); // Añadimos un segundo nextTick
    
    // Verificar que el gráfico se vuelve a inicializar
    expect(Chart).toHaveBeenCalledTimes(2);
  });
});