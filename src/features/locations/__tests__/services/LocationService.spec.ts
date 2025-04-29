import { describe, it, expect, vi, beforeEach } from 'vitest'
import axios from 'axios'
import { searchLocations, reverseGeocode } from '../../services/LocationService'
import { API_ENDPOINTS } from '../../config/constants'

// Mock axios para evitar llamadas reales
vi.mock('axios')

describe('LocationService', () => {
    beforeEach(() => {
        vi.resetAllMocks()
    })

    describe('searchLocations', () => {
        it('debe devolver resultados de búsqueda formateados', async () => {
            // Configurar mock para axios.get
            const mockData = [
                {
                    place_id: 123,
                    display_name: 'Almería, Andalucía, España',
                    lat: '36.838',
                    lon: '-2.457',
                    importance: 0.8
                }
            ]

            vi.mocked(axios.get).mockResolvedValue({ data: mockData })

            // Ejecutar la función a probar
            const results = await searchLocations('Almería')

            // Verificar resultado
            expect(results).toEqual(mockData)
            expect(axios.get).toHaveBeenCalledWith(
                API_ENDPOINTS.NOMINATIM_SEARCH,
                expect.objectContaining({
                    params: expect.objectContaining({
                        q: 'Almería'
                    })
                })
            )
        })

        it('debe devolver un array vacío en caso de error', async () => {
            // Configurar mock para simular un error
            vi.mocked(axios.get).mockRejectedValue(new Error('Error de red'))

            // Ejecutar la función
            const results = await searchLocations('InvalidQuery')

            // Verificar resultado
            expect(results).toEqual([])
        })
    })

    describe('reverseGeocode', () => {
        it('debe convertir coordenadas a dirección', async () => {
            // Configurar mock
            const mockData = {
                display_name: 'Almería, Andalucía, España',
                lat: '36.838',
                lon: '-2.457',
                address: {
                    city: 'Almería',
                    state: 'Andalucía',
                    country: 'España'
                }
            }

            vi.mocked(axios.get).mockResolvedValue({ data: mockData })

            // Ejecutar la función
            const result = await reverseGeocode(36.838, -2.457)

            // Verificar resultado
            expect(result).toEqual(mockData)
            expect(axios.get).toHaveBeenCalledWith(
                API_ENDPOINTS.NOMINATIM_REVERSE,
                expect.objectContaining({
                    params: expect.objectContaining({
                        lat: 36.838,
                        lon: -2.457
                    })
                })
            )
        })
    })
})
