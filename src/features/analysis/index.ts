// Exportar componentes principales
export { default as AnalysisWeather } from './components/AnalysisWeather.vue'

// Exportar composables
export { usePrecipitationAnalysis } from './composables/usePrecipitationAnalysis'
export { useLocations } from './composables/useLocations'

// Exportar servicios
export { precipitationService } from './services/precipitation-service'

// Exportar tipos
export type {
  PrecipitationDailyData,
  PrecipitationMonthlyData,
  PrecipitationSummary,
  LocationPrecipitationData,
  AnalysisOptions,
  ApiPrecipitationResponse,
  AnalysisAggregationType,
  ChartType
} from './models'