import { defineComponent, h } from 'vue';

// Creamos un componente stub que simula WeatherBackground
export default defineComponent({
  name: 'WeatherBackground',
  props: {
    weatherCode: {
      type: Number,
      required: true
    }
  },
  setup(props) {
    // Determinamos qué clase debe tener basada en el weatherCode
    const getBackgroundClass = (code: number) => {
      if (code === 0 || code === 1) return 'background-sunny weather-sunny';
      if ([61, 63, 65, 51, 53, 55].includes(code)) return 'background-rainy weather-rainy';
      if ([2, 3, 45, 48].includes(code)) return 'background-cloudy weather-cloudy';
      if ([71, 73, 75].includes(code)) return 'background-snowy weather-snowy';
      if ([95, 96, 99].includes(code)) return 'background-stormy weather-stormy';
      return 'background-default';
    };

    return () => h('div', {
      class: `weather-background debug-background ${getBackgroundClass(props.weatherCode)}`,
    }, [
      // Elementos internos según el tipo de clima
      props.weatherCode === 0 || props.weatherCode === 1 
        ? [h('div', { class: 'sun' }), h('div', { class: 'sun-ray' })]
        : null,
      
      [61, 63, 65, 51, 53, 55].includes(props.weatherCode)
        ? [h('div', { class: 'raindrop' })]
        : null,
      
      [2, 3, 45, 48].includes(props.weatherCode)
        ? [h('div', { class: 'cloud' })]
        : null,
      
      [71, 73, 75].includes(props.weatherCode)
        ? [h('div', { class: 'snowflake' })]
        : null,
      
      [95, 96, 99].includes(props.weatherCode)
        ? [h('div', { class: 'lightning' }), h('div', { class: 'raindrop storm' })]
        : null
    ]);
  }
});