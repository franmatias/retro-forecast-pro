/**
 * Punto de entrada para la característica de datos históricos
 * Facilita la importación agrupada de componentes relacionados
 */

// Exportar componentes principales
export { default as HistoricalWeather } from './components/HistoricalWeather.vue'
export { default as HistoricalSearchForm } from './components/HistoricalSearchForm.vue'
export { default as HistoricalStatusInfo } from './components/HistoricalStatusInfo.vue'
export { default as HistoricalSummary } from './components/HistoricalSummary.vue'

// Exportar componentes de gráficos
export { default as GraphRadar } from './components/GraphRadar.vue'
export { default as GraphTemp } from './components/GraphTemp.vue'
export { default as GraphRain } from './components/GraphRain.vue'
export { default as GraphWind } from './components/GraphWind.vue'
export { default as GraphHumidity } from './components/GraphHumidity.vue'
export { default as GraphPressure } from './components/GraphPressure.vue'
export { default as GraphSunHours } from './components/GraphSunHours.vue'

// Exportar componentes de resumen
export { default as SummaryCard } from './components/summary/SummaryCard.vue'
export { default as TemperatureSummary } from './components/summary/TemperatureSummary.vue'
export { default as RainfallSummary } from './components/summary/RainfallSummary.vue'
export { default as WindSummary } from './components/summary/WindSummary.vue'
export { default as HumiditySummary } from './components/summary/HumiditySummary.vue'
export { default as PressureSummary } from './components/summary/PressureSummary.vue'
export { default as SunHoursSummary } from './components/summary/SunHoursSummary.vue'

// Exportar componentes de tablas
export { default as TabularSummary } from './components/tables/TabularSummary.vue'

// Exportar composables
export { useLocations } from './composables/useLocations'
export { useHistoricalSelection } from './composables/useHistoricalSelection'
export { useHistoricalData } from './composables/useHistoricalData'
export { useSummaryStatistics } from './composables/useSummaryStatistics'

// Exportar modelos
export * from './models'

// Exportar servicios
export { default as historicalService } from './services/historicalService'

// Exportar tienda
export { useHistoricalStore } from './stores/historicalStore'
