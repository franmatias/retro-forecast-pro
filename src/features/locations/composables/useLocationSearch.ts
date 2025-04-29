import { ref } from 'vue'
import axios from 'axios'
import type { NominatimSearchResult, StoredLocation } from '../models'
import { API_ENDPOINTS, API_HEADERS } from '../config/constants'

export function useLocationSearch() {
    const searchQuery = ref('')
    const searching = ref(false)
    const locationSuggestions = ref<NominatimSearchResult[]>([])
    const selectedSearchLocation = ref<NominatimSearchResult | null>(null)
    const debounceTimeout = ref<number | null>(null)

    /**
     * Realiza una búsqueda con debounce
     */
    const debouncedSearchLocations = (value: string) => {
        if (!value?.trim()) {
            locationSuggestions.value = []
            return
        }

        // Cancelar búsqueda anterior si existe
        if (debounceTimeout.value) {
            clearTimeout(debounceTimeout.value)
        }

        // Iniciar nueva búsqueda con retraso
        debounceTimeout.value = setTimeout(() => {
            searchLocations(value)
        }, 300) as unknown as number // El setTimeout devuelve un number, pero TypeScript quiere NodeJS.Timeout
    }

    /**
     * Busca ubicaciones según una consulta
     */
    const searchLocations = async (query: string) => {
        if (!query?.trim()) return

        searching.value = true
        try {
            const response = await axios.get<NominatimSearchResult[]>(
                API_ENDPOINTS.NOMINATIM_SEARCH,
                {
                    params: {
                        q: query,
                        format: 'json',
                        limit: 5, // Limitar a 5 sugerencias
                        addressdetails: 1,
                    },
                    headers: API_HEADERS,
                }
            )

            locationSuggestions.value = response.data
        } catch (error) {
            console.error('Error fetching location suggestions:', error)
            locationSuggestions.value = []
        } finally {
            searching.value = false
        }
    }

    /**
     * Convierte un resultado de búsqueda a un objeto de ubicación
     */
    const convertToStoredLocation = (result: NominatimSearchResult): StoredLocation => {
        return {
            name: result.display_name.split(',')[0],
            address: result.display_name,
            lat: parseFloat(result.lat),
            lng: parseFloat(result.lon),
        }
    }

    /**
     * Limpia los datos de búsqueda
     */
    const clearSearch = () => {
        searchQuery.value = ''
        selectedSearchLocation.value = null
        locationSuggestions.value = []
    }

    return {
        searchQuery,
        searching,
        locationSuggestions,
        selectedSearchLocation,
        debouncedSearchLocations,
        searchLocations,
        convertToStoredLocation,
        clearSearch
    }
}
