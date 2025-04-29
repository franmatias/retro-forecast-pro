import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
// Volver a importar el componente real
import WeatherBackground from '../components/WeatherBackground.vue';

describe('WeatherBackground.vue', () => {
  it('muestra el fondo correcto para clima soleado', async () => {
    const wrapper = mount(WeatherBackground, {
      props: {
        weatherCode: 0 // Soleado
      }
    });

    expect(wrapper.find('.background-sunny').exists()).toBe(true);
    expect(wrapper.find('.weather-sunny').exists()).toBe(true);
    expect(wrapper.find('.sun').exists()).toBe(true);
  });

  it('muestra el fondo correcto para clima lluvioso', async () => {
    const wrapper = mount(WeatherBackground, {
      props: {
        weatherCode: 61 // Lluvia ligera
      }
    });

    expect(wrapper.find('.background-rainy').exists()).toBe(true);
    expect(wrapper.find('.weather-rainy').exists()).toBe(true);
    expect(wrapper.find('.raindrop').exists()).toBe(true);
  });

  it('muestra el fondo correcto para clima nublado', async () => {
    const wrapper = mount(WeatherBackground, {
      props: {
        weatherCode: 3 // Nublado
      }
    });

    expect(wrapper.find('.background-cloudy').exists()).toBe(true);
    expect(wrapper.find('.weather-cloudy').exists()).toBe(true);
    expect(wrapper.find('.cloud').exists()).toBe(true);
  });

  it('muestra el fondo correcto para clima con nieve', async () => {
    const wrapper = mount(WeatherBackground, {
      props: {
        weatherCode: 71 // Nevada ligera
      }
    });

    expect(wrapper.find('.background-snowy').exists()).toBe(true);
    expect(wrapper.find('.weather-snowy').exists()).toBe(true);
    expect(wrapper.find('.snowflake').exists()).toBe(true);
  });

  it('muestra el fondo correcto para clima con tormenta', async () => {
    const wrapper = mount(WeatherBackground, {
      props: {
        weatherCode: 95 // Tormenta
      }
    });

    expect(wrapper.find('.background-stormy').exists()).toBe(true);
    expect(wrapper.find('.weather-stormy').exists()).toBe(true);
    expect(wrapper.find('.lightning').exists()).toBe(true);
  });

  it('actualiza el fondo cuando cambia el código meteorológico', async () => {
    const wrapper = mount(WeatherBackground, {
      props: {
        weatherCode: 0 // Inicialmente soleado
      }
    });

    expect(wrapper.find('.background-sunny').exists()).toBe(true);
    
    // Cambiar a lluvioso
    await wrapper.setProps({ weatherCode: 61 });
    await nextTick();
    
    expect(wrapper.find('.background-sunny').exists()).toBe(false);
    expect(wrapper.find('.background-rainy').exists()).toBe(true);
  });

  it('usa un fondo por defecto para códigos desconocidos', async () => {
    const wrapper = mount(WeatherBackground, {
      props: {
        weatherCode: 9999 // Código inexistente
      }
    });

    expect(wrapper.find('.background-default').exists()).toBe(true);
  });
});