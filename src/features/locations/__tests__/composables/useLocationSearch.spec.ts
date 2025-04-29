import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useLocationSearch } from '../../composables/useLocationSearch'
import axios from 'axios'

// Mock axios
vi.mock('axios')

describe('useLocationSearch composable', () => {
    beforeEach(() => {
        vi.resetAllMocks()
        vi.useFakeTimers()
    })

    afterEach(() => {
        vi.useRealTimers()
    })

    it('debe inicializarse con valores por defecto', () => {
        const {
            searchQuery,
            searching,
            locationSuggestions,
            selectedSearchLocation
        } = useLocationSearch()

        expect(searchQuery.value).toBe('')
        expect(searching.value).toBe(false)
        expect(locationSuggestions.value).toEqual([])
        expect(selectedSearchLocation.value).toBeNull()
    })

    it('debe convertir correctamente un resultado a StoredLocation', () => {
        const { convertToStoredLocation } = useLocationSearch()

        const testResult = {
            place_id: 123,
            display_name: 'Almería, Andalucía, España',
            lat: '36.838',
            lon: '-2.457',
            osm_type: 'node',
            osm_id: 456,
            class: 'place',
            type: 'city',
            importance: 0.8
        }

        const storedLocation = convertToStoredLocation(testResult)

        expect(storedLocation).toEqual({
            name: 'Almería',
            address: 'Almería, Andalucía, España',
            lat: 36.838,
            lng: -2.457
        })
    })

    it('debe buscar ubicaciones después del debounce', async () => {
        const mockData = [
            {
                place_id: 123,
                display_name: 'Almería, Andalucía, España',
                lat: '36.838',
                lon: '-2.457',
                osm_type: 'node',
                osm_id: 456,
                class: 'place',
                type: 'city',
                importance: 0.8
            }
        ]

        vi.mocked(axios.get).mockResolvedValue({ data: mockData })

        const {
            searchQuery,
            debouncedSearchLocations,
            locationSuggestions
        } = useLocationSearch()

        // Simular escritura del usuario
        searchQuery.value = 'Almería'
        debouncedSearchLocations('Almería')

        // Avanzar el tiempo para que se ejecute la búsqueda
        await vi.runAllTimersAsync()

        expect(axios.get).toHaveBeenCalled()
        expect(locationSuggestions.value).toEqual(mockData)
    })
})
