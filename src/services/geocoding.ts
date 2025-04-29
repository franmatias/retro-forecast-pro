import axios from 'axios'

export interface GeocodingResult {
  id: number
  name: string
  latitude: number
  longitude: number
  elevation: number
  country: string
  admin1: string // región
  admin2: string // provincia
  population: number
}

export async function getLocationDetails(placeName: string): Promise<GeocodingResult | null> {
  try {
    const response = await axios.get(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(placeName)}&count=1&language=es&format=json`
    )
    
    if (response.data.results && response.data.results.length > 0) {
      const result = response.data.results[0]
      return {
        id: result.id,
        name: result.name,
        latitude: result.latitude,
        longitude: result.longitude,
        elevation: result.elevation || 0,
        country: result.country,
        admin1: result.admin1 || 'N/A',
        admin2: result.admin2 || 'N/A',
        population: result.population || 0
      }
    }
    return null
  } catch (error) {
    console.error('Error getting location details:', error)
    return null
  }
}
