import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import LocationMap from '../../components/LocationMap.vue'
import L from 'leaflet'  // Importar Leaflet normalmente - se reemplazará por el mock

// Mockear CSS para evitar errores
vi.mock('leaflet/dist/leaflet.css', () => ({}))

// Mockear Leaflet de forma más completa
vi.mock('leaflet', () => {
    // Crear mocks para los objetos internos
    const mapMock = {
        setView: vi.fn().mockReturnThis(),
        fitBounds: vi.fn().mockReturnThis(),
        remove: vi.fn(),
        on: vi.fn()
    }

    const markerMock = {
        addTo: vi.fn().mockReturnThis(),
        bindPopup: vi.fn().mockReturnThis(),
        openPopup: vi.fn().mockReturnThis(),
        remove: vi.fn(),
        on: vi.fn()
    }

    const latLngBoundsMock = {
        padding: vi.fn().mockReturnThis()
    }

    return {
        default: {
            map: vi.fn().mockReturnValue(mapMock),
            tileLayer: vi.fn().mockReturnValue({ addTo: vi.fn().mockReturnThis() }),
            marker: vi.fn().mockReturnValue(markerMock),
            latLngBounds: vi.fn().mockReturnValue(latLngBoundsMock),
            Map: vi.fn()
        }
    }
})

// Mockear getElementById
global.document.getElementById = vi.fn().mockImplementation(() => {
    const div = document.createElement('div')
    // Agregar propiedades necesarias
    Object.defineProperty(div, 'clientWidth', { value: 500 })
    Object.defineProperty(div, 'clientHeight', { value: 500 })
    return div
})

// Configuración global para los tests
beforeEach(() => {
    vi.clearAllMocks()

    // Restablecer el DOM entre pruebas
    if (document.body.firstChild) {
        document.body.innerHTML = ''
    }
})

describe('LocationMap', () => {
    it('debe renderizarse correctamente', () => {
        const wrapper = mount(LocationMap, {
            shallow: true,  // Uso de shallow rendering para evitar errores de componentes anidados
            global: {
                stubs: {
                    'v-icon': true
                }
            }
        })

        expect(wrapper.find('div').exists()).toBe(true)
        expect(wrapper.attributes('class')).toContain('location-map')
    })

    it('debe inicializar el mapa y añadir marcadores cuando se monta', () => {
        const locations = [
            { name: 'Almería', address: 'Almería, Andalucía', lat: 36.838, lng: -2.457 },
            { name: 'Granada', address: 'Granada, Andalucía', lat: 37.178, lng: -3.600 }
        ]

        mount(LocationMap, {
            props: { locations },
            shallow: true
        })

        // Usar la importación normal en lugar de require()
        const mockedL = vi.mocked(L, true)

        // Verificar llamadas a métodos específicos de Leaflet
        expect(mockedL.map).toHaveBeenCalled()
        expect(mockedL.tileLayer).toHaveBeenCalled()
        expect(mockedL.marker).toHaveBeenCalledTimes(2)
    })
})
