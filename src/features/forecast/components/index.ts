/**
 * Re-exportación de todos los componentes para facilitar su importación
 */

// Componente principal
export { default as WeatherForecast } from './WeatherForecast.vue';

// Componentes de secciones principales
export { default as CurrentConditionsWidget } from './sections/CurrentConditionsWidget.vue';
export { default as ForecastWidget } from './sections/ForecastWidget.vue';
export { default as WeatherHourWidget } from './sections/WeatherHourWidget.vue';
export { default as WeatherMapWidget } from './sections/WeatherMapWidget.vue';
export { default as WeatherAlerts } from './sections/WeatherAlerts.vue';

// Componentes de visualización de datos
export { default as WeatherChart } from './charts/WeatherChart.vue';
export { default as PressureGauge } from './charts/PressureGauge.vue';
export { default as WindWidget } from './charts/WindWidget.vue';

// Componentes de información
export { default as AdditionalInfoWidget } from './info/AdditionalInfoWidget.vue';
export { default as LocalInfoWidget } from './info/LocalInfoWidget.vue';
export { default as DayStateWidget } from './info/DayStateWidget.vue';
export { default as ResumeWidget } from './info/ResumeWidget.vue';
export { default as StatWidget } from './common/StatWidget.vue';

// Componentes visuales
export { default as WeatherBackground } from './visuals/WeatherBackground.vue';
export { default as WeatherRecommendations } from './info/WeatherRecommendations.vue';

// Componentes base
export { default as BaseWidget } from './base/BaseWidget.vue';
