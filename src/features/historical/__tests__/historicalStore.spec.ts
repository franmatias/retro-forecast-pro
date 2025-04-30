import { describe, it, expect, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useHistoricalStore } from '../stores/historicalStore'

describe('useHistoricalStore', () => {
  beforeEach(() => {
    // Configurar pinia antes de cada prueba
    setActivePinia(createPinia())
  })

  it('debe inicializarse con valores por defecto', () => {
    const store = useHistoricalStore()
    
    // Comprobar que los valores iniciales están vacíos
    expect(store.selectedLocationIds).toEqual([])
    expect(store.startDate).toBe('')
    expect(store.endDate).toBe('')
  })

  it('debe establecer las ubicaciones seleccionadas correctamente', () => {
    const store = useHistoricalStore()
    const locations = ['madrid_0', 'barcelona_0']
    
    // Establecer las ubicaciones seleccionadas
    store.setSelectedLocations(locations)
    
    // Comprobar que se han establecido correctamente
    expect(store.selectedLocationIds).toEqual(locations)
  })

  it('debe establecer el rango de fechas correctamente', () => {
    const store = useHistoricalStore()
    const startDate = '2023-01-01'
    const endDate = '2023-01-31'
    
    // Establecer el rango de fechas
    store.setDateRange(startDate, endDate)
    
    // Comprobar que se ha establecido correctamente
    expect(store.startDate).toBe(startDate)
    expect(store.endDate).toBe(endDate)
  })

  it('debe detectar correctamente si hay ubicaciones seleccionadas', () => {
    const store = useHistoricalStore()
    
    // Sin ubicaciones seleccionadas
    expect(store.hasSelectedLocations()).toBe(false)
    
    // Establecer ubicaciones seleccionadas
    store.setSelectedLocations(['madrid_0'])
    
    // Con ubicaciones seleccionadas
    expect(store.hasSelectedLocations()).toBe(true)
  })

  it('debe funcionar con múltiples ubicaciones', () => {
    const store = useHistoricalStore()
    const locations = ['madrid_0', 'barcelona_0', 'valencia_0', 'sevilla_0']
    
    // Establecer múltiples ubicaciones
    store.setSelectedLocations(locations)
    
    // Comprobar que todas se han establecido correctamente
    expect(store.selectedLocationIds).toEqual(locations)
    expect(store.selectedLocationIds.length).toBe(4)
  })
})