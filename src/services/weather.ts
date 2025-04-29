const BASE_URL = 'https://geocoding-api.open-meteo.com/v1'
const WEATHER_URL = 'https://api.open-meteo.com/v1/forecast'

export interface Location {
  name: string
  latitude: number
  longitude: number
  country: string
}

export interface WeatherData {
  hourly: {
    time: string[]
    temperature_2m: number[]
    relative_humidity_2m: number[]
    wind_speed_10m: number[]
    wind_direction_10m: number[]
    precipitation_probability: number[]
    apparent_temperature: number[]
    surface_pressure: number[]
    weather_code: number[]
    visibility: number[]
    dew_point_2m: number[]
    uv_index: number[]
    air_quality_index: number[]
    cloud_cover: number[]
  }
  daily: {
    time: string[]
    temperature_2m_max: number[]
    temperature_2m_min: number[]
    weather_code: number[]
    precipitation_sum: number[]
    wind_speed_10m_max: number[]
    sunrise: string[]
    sunset: string[]
    moon_phase: number[]
  }
  utc_offset_seconds: number
  alerts?: WeatherAlert[]
}

export interface WeatherAlert {
  title: string
  description: string
  type: string
}

export async function searchLocations(query: string): Promise<Location[]> {
  const response = await fetch(
    `${BASE_URL}/search?name=${encodeURIComponent(query)}&count=5&language=es`
  )
  const data = await response.json()
  return data.results || []
}

// Asegurarnos de exportar la función
export const reverseGeocode = async (lat: number, lon: number): Promise<Location[]> => {
  try {
    // Usar la API de nominatim.openstreetmap.org en lugar de geocoding-api.open-meteo.com
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=es`,
      {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Weather App (educational project)'
        }
      }
    )

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    
    // Transformar la respuesta de Nominatim al formato que espera nuestra aplicación
    return [{
      name: data.address.city || data.address.town || data.address.village || data.address.municipality || 'Ubicación desconocida',
      latitude: parseFloat(data.lat),
      longitude: parseFloat(data.lon),
      country: data.address.country_code?.toUpperCase() || 'ES'
    }]
  } catch (error) {
    console.error('Error en reverseGeocode:', error)
    // Devolver una ubicación por defecto en caso de error
    return [{
      name: 'Mi ubicación',
      latitude: lat,
      longitude: lon,
      country: 'ES'
    }]
  }
}

export async function getWeather(lat: number, lon: number): Promise<WeatherData> {
  try {
    const params = {
      latitude: lat.toString(),
      longitude: lon.toString(),
      timezone: 'auto',
      hourly: [
        'temperature_2m',
        'relative_humidity_2m',
        'precipitation_probability',
        'pressure_msl',
        'cloudcover',
        'windspeed_10m',
        'winddirection_10m',
        'apparent_temperature',
        'weathercode',
        'visibility',
        'dewpoint_2m',
        'shortwave_radiation',  // Cambiado de direct_radiation a shortwave_radiation
        'uv_index'             // Añadido uv_index directamente
      ].join(','),
      daily: [
        'weathercode',
        'temperature_2m_max',
        'temperature_2m_min',
        'precipitation_sum',
        'windspeed_10m_max',
        'sunrise',
        'sunset',
        'uv_index_max'         // Añadido uv_index_max para datos diarios
      ].join(','),
      forecast_days: '7'
    }

    const queryString = Object.entries(params)
      .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
      .join('&')

    const url = `${WEATHER_URL}?${queryString}`
    console.log('Requesting URL:', url)

    const response = await fetch(url)
    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.reason || 'Error fetching weather data')
    }

    // Función auxiliar para calcular el AQI basado en varios factores
    interface WeatherApiResponse {
      hourly: {
        temperature_2m: number[];
        relative_humidity_2m: number[];
        cloudcover: number[];
      };
    }

    const calculateAQI = (hour: number, data: WeatherApiResponse): number => {
      const temp = data.hourly.temperature_2m[hour] || 0
      const humidity = data.hourly.relative_humidity_2m[hour] || 0
      const cloudcover = data.hourly.cloudcover[hour] || 0
      
      // Algoritmo simplificado para estimar calidad del aire
      // Mejor calidad con: temperatura moderada, humedad moderada, menor nubosidad
      let aqi = 50 // Valor base
      
      // Ajustes por temperatura (peor en extremos)
      if (temp < 10 || temp > 30) aqi += 20
      if (temp < 0 || temp > 35) aqi += 20
      
      // Ajustes por humedad (peor en extremos)
      if (humidity < 30 || humidity > 70) aqi += 15
      if (humidity < 20 || humidity > 80) aqi += 15
      
      // Ajustes por nubosidad (mejor con menos nubes)
      aqi += Math.round(cloudcover * 0.2)
      
      return Math.min(Math.max(aqi, 0), 150)
    }

    // Mapear los datos recibidos
    return {
      hourly: {
        time: data.hourly.time || [],
        temperature_2m: data.hourly.temperature_2m || [],
        relative_humidity_2m: data.hourly.relative_humidity_2m || [],
        wind_speed_10m: data.hourly.windspeed_10m || [],
        wind_direction_10m: data.hourly.winddirection_10m || [],
        precipitation_probability: data.hourly.precipitation_probability || [],
        apparent_temperature: data.hourly.apparent_temperature || [],
        surface_pressure: data.hourly.pressure_msl || [],
        weather_code: data.hourly.weathercode || [],
        visibility: data.hourly.visibility || [],
        dew_point_2m: data.hourly.dewpoint_2m || [],
        uv_index: data.hourly.uv_index || Array(24).fill(0),
        air_quality_index: Array(24).fill(0).map((_, i) => calculateAQI(i, data)),
        cloud_cover: data.hourly.cloudcover || []
      },
      daily: {
        time: data.daily.time || [],
        temperature_2m_max: data.daily.temperature_2m_max || [],
        temperature_2m_min: data.daily.temperature_2m_min || [],
        weather_code: data.daily.weathercode || [],
        precipitation_sum: data.daily.precipitation_sum || [],
        wind_speed_10m_max: data.daily.windspeed_10m_max || [],
        sunrise: data.daily.sunrise || [],
        sunset: data.daily.sunset || [],
        moon_phase: Array(7).fill(0)
      },
      utc_offset_seconds: data.utc_offset_seconds
    }
  } catch (error) {
    console.error('Error fetching weather data:', error)
    throw error
  }
}

export function getWeatherIcon(code: number): string {
  // Mapeo de códigos WMO a iconos de Material Design
  const iconMap: { [key: number]: string } = {
    0: 'mdi-weather-sunny',
    1: 'mdi-weather-partly-cloudy',
    2: 'mdi-weather-cloudy',
    3: 'mdi-weather-cloudy',
    45: 'mdi-weather-fog',
    48: 'mdi-weather-fog',
    51: 'mdi-weather-rainy',
    53: 'mdi-weather-rainy',
    55: 'mdi-weather-pouring',
    61: 'mdi-weather-rainy',
    63: 'mdi-weather-pouring',
    65: 'mdi-weather-pouring',
    71: 'mdi-weather-snowy',
    73: 'mdi-weather-snowy-heavy',
    75: 'mdi-weather-snowy-heavy',
    95: 'mdi-weather-lightning-rainy',
    96: 'mdi-weather-lightning-rainy',
    99: 'mdi-weather-lightning-rainy'
  }
  return iconMap[code] || 'mdi-weather-cloudy'
}

// Funciones auxiliares
export function getWeatherDescription(code: number): string {
  const descriptions: Record<number, string> = {
    0: 'Despejado',
    1: 'Parcialmente nublado',
    2: 'Nublado',
    // ...add more weather codes
  }
  return descriptions[code] || 'Desconocido'
}

export function getWindDirection(degrees: number): string {
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO']
  const index = Math.round(degrees / 45) % 8
  return directions[index]
}

export function getUvIndexDetails(index: number): { color: string, description: string } {
  if (index <= 2) return { color: 'success', description: 'Bajo - No se necesita protección' }
  if (index <= 5) return { color: 'warning', description: 'Moderado - Se recomienda protección solar' }
  if (index <= 7) return { color: 'orange', description: 'Alto - Necesaria protección solar' }
  if (index <= 10) return { color: 'error', description: 'Muy alto - Protección solar extra necesaria' }
  return { color: 'deep-purple', description: 'Extremo - Evitar exposición al sol' }
}

export function getAirQualityDetails(aqi: number): { color: string, label: string, description: string } {
  if (aqi <= 50) {
    return { 
      color: 'success', 
      label: 'Buena', 
      description: 'Calidad del aire satisfactoria, poco o ningún riesgo' 
    }
  }
  if (aqi <= 100) {
    return { 
      color: 'warning', 
      label: 'Moderada', 
      description: 'Calidad del aire aceptable, pero puede haber riesgos moderados' 
    }
  }
  if (aqi <= 150) {
    return { 
      color: 'orange', 
      label: 'Insalubre para grupos sensibles', 
      description: 'Los grupos sensibles pueden experimentar efectos' 
    }
  }
  if (aqi <= 200) {
    return { 
      color: 'error', 
      label: 'Insalubre', 
      description: 'Todo el mundo puede empezar a experimentar efectos' 
    }
  }
  return { 
    color: 'deep-purple', 
    label: 'Muy insalubre', 
    description: 'Advertencias sanitarias de condiciones de emergencia' 
  }
}

export function getMoonPhase(phase: number): string {
  const phases = ['Luna nueva', 'Cuarto creciente', 'Luna llena', 'Cuarto menguante']
  return phases[Math.floor(phase * 4)]
}

export function getWeatherRecommendation(
  code: number,
  temp: number,
  rain: number,
  uv: number
): { title: string, description: string } {
  const title = 'Recomendación del día'
  let description = ''

  // Recomendaciones basadas en el clima (code)
  if (code >= 95) {
    description = 'Tormenta eléctrica. Mejor quedarse en casa.'
  } else if (code >= 61) {
    description = 'Lluvia prevista. Lleva paraguas.'
  }

  // Recomendaciones basadas en la temperatura
  if (temp < 10) {
    description += ' Abrígate bien, hace frío.'
  } else if (temp > 30) {
    description += ' Calor intenso, mantente hidratado.'
  }

  // Recomendaciones basadas en la probabilidad de lluvia
  if (rain > 60) {
    description += ' Alta probabilidad de lluvia.'
  }

  // Recomendaciones basadas en el índice UV
  if (uv > 8) {
    description += ' Protección solar muy alta requerida.'
  } else if (uv > 5) {
    description += ' Se recomienda usar protector solar.'
  }

  // Si no hay recomendaciones específicas
  if (!description) {
    description = 'Condiciones meteorológicas favorables.'
  }

  return { title, description: description.trim() }
}
