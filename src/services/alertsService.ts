import axios from 'axios';

// NOTA: Para una implementación real, importaríamos:
// import { ApiClient } from '@/core/api/ApiClient';
// const aemetApiClient = new ApiClient('https://opendata.aemet.es/opendata/api');

// Tipo de alerta meteorológica
export interface WeatherAlert {
  id: string;
  title: string;
  description: string;
  severity: 'minor' | 'moderate' | 'severe' | 'extreme';
  type: string; // Tipo de alerta: lluvia, viento, nieve, etc.
  start: string; // ISO date string
  end: string;   // ISO date string
  area: string;  // Área afectada
  source: string; // Fuente de la alerta: 'AEMET', 'MeteoEU', etc.
}

// Mapeo de códigos de severidad a valores más legibles
const severityMapping: Record<string, 'minor' | 'moderate' | 'severe' | 'extreme'> = {
  'amarillo': 'minor',
  'naranja': 'moderate',
  'rojo': 'severe',
  'yellow': 'minor',
  'orange': 'moderate',
  'red': 'severe'
};

// Mapeo de tipos de alertas
const alertTypeMapping: Record<string, string> = {
  'lluvia': 'rain',
  'viento': 'wind',
  'nieve': 'snow',
  'tormenta': 'storm',
  'calor': 'heat',
  'frío': 'cold',
  'costeros': 'coastal',
  'aludes': 'avalanche',
  'niebla': 'fog',
  'polvo': 'dust'
};

/**
 * Obtiene las alertas meteorológicas para una ubicación específica utilizando diferentes fuentes.
 * Esta función intentará obtener alertas de múltiples fuentes y combinarlas.
 */
export async function getWeatherAlerts(
  latitude: number, 
  longitude: number, 
  countryCode: string = 'ES'
): Promise<WeatherAlert[]> {
  // Vector para almacenar todas las alertas
  let alerts: WeatherAlert[] = [];
  
  try {
    // Si estamos en España, intentamos usar AEMET
    if (countryCode === 'ES') {
      const aemetAlerts = await getAemetAlerts(latitude, longitude);
      alerts = [...alerts, ...aemetAlerts];
    }
    
    // Añadimos alertas de MeteoAlarm para toda Europa (incluye España)
    const meteoAlarmAlerts = await getMeteoAlarmAlerts();
    alerts = [...alerts, ...meteoAlarmAlerts];
    
    // Si no tenemos alertas, intentamos un "fallback" con alertas de Open-Meteo
    if (alerts.length === 0) {
      const openMeteoAlerts = await getOpenMeteoAlerts(latitude, longitude);
      alerts = [...alerts, ...openMeteoAlerts];
    }
    
    // Eliminar duplicados basándonos en descripción y tipo similar
    return removeDuplicateAlerts(alerts);
  } catch (error) {
    console.error('Error obteniendo alertas meteorológicas:', error);
    return [];
  }
}

/**
 * Obtiene alertas de la API de AEMET
 */
async function getAemetAlerts(latitude: number, longitude: number): Promise<WeatherAlert[]> {
  try {
    // NOTA: Para usar la API de AEMET necesitas registrarte y obtener una API key
    // Por el momento usamos datos de demostración
    
    // Determinamos la provincia/municipio basándonos en las coordenadas
    // (Esto es una simplificación, en producción deberíamos hacer una consulta inversa)
    const provinceCode = await getProvinceCodeFromCoordinates(latitude, longitude);
    
    // Data de demostración para efectos ilustrativos
    const demoData = getDemoAlerts(provinceCode);
    
    return demoData.map(alert => ({
      id: `aemet-${alert.id}`,
      title: alert.title,
      description: alert.description,
      severity: severityMapping[alert.level.toLowerCase()] || 'minor',
      type: alertTypeMapping[Object.keys(alertTypeMapping).find(key => 
        alert.title.toLowerCase().includes(key)
      ) || ''] || 'other',
      start: alert.start,
      end: alert.end,
      area: alert.area,
      source: 'AEMET'
    }));
  } catch (error) {
    console.error('Error obteniendo alertas de AEMET:', error);
    return [];
  }
}

/**
 * Obtiene alertas de MeteoAlarm para Europa
 * En esta versión de demostración, generamos datos aleatorios.
 * En una implementación real, estos parámetros se usarían para consultar la API.
 */
async function getMeteoAlarmAlerts(): Promise<WeatherAlert[]> {
  try {
    // MeteoAlarm no tiene una API pública, así que esto es una simulación
    // En un entorno real, podríamos hacer web scraping o usar una API proxy
    
    // Devolvemos una alerta de demostración para mostrar funcionalidad
    if (Math.random() > 0.7) { // Solo mostrar a veces para demostración
      return [{
        id: `meteoalarm-${Date.now()}`,
        title: 'Aviso por temperaturas altas',
        description: 'Se esperan temperaturas máximas superiores a los 36°C.',
        severity: 'moderate',
        type: 'heat',
        start: new Date().toISOString(),
        end: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(), // 48 horas después
        area: 'Región sur',
        source: 'MeteoAlarm'
      }];
    }
    
    return [];
  } catch (error) {
    console.error('Error obteniendo alertas de MeteoAlarm:', error);
    return [];
  }
}

/**
 * Obtiene alertas básicas de Open-Meteo (como fallback)
 */
async function getOpenMeteoAlerts(latitude: number, longitude: number): Promise<WeatherAlert[]> {
  try {
    // Open-Meteo no proporciona alertas directamente, pero podemos inferir algunas
    // basándonos en datos meteorológicos extremos
    const response = await axios.get('https://api.open-meteo.com/v1/forecast', {
      params: {
        latitude,
        longitude,
        daily: ['temperature_2m_max', 'temperature_2m_min', 'precipitation_sum', 'windspeed_10m_max'],
        timezone: 'auto',
        forecast_days: 3
      }
    });
    
    const alerts: WeatherAlert[] = [];
    const data = response.data;
    
    // Comprobar temperatura máxima alta (> 37°C)
    if (data.daily?.temperature_2m_max?.[0] > 37) {
      alerts.push({
        id: `openmeteo-heat-${Date.now()}`,
        title: 'Alerta por calor extremo',
        description: `Se esperan temperaturas hasta ${Math.round(data.daily.temperature_2m_max[0])}°C.`,
        severity: 'moderate',
        type: 'heat',
        start: new Date().toISOString(),
        end: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        area: 'Área local',
        source: 'Open-Meteo'
      });
    }
    
    // Comprobar precipitación alta (> 30mm)
    if (data.daily?.precipitation_sum?.[0] > 30) {
      alerts.push({
        id: `openmeteo-rain-${Date.now()}`,
        title: 'Alerta por lluvias intensas',
        description: `Se esperan precipitaciones de hasta ${Math.round(data.daily.precipitation_sum[0])}mm.`,
        severity: 'moderate',
        type: 'rain',
        start: new Date().toISOString(),
        end: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        area: 'Área local',
        source: 'Open-Meteo'
      });
    }
    
    // Comprobar viento fuerte (> 50km/h)
    if (data.daily?.windspeed_10m_max?.[0] > 50) {
      alerts.push({
        id: `openmeteo-wind-${Date.now()}`,
        title: 'Alerta por vientos fuertes',
        description: `Se esperan vientos de hasta ${Math.round(data.daily.windspeed_10m_max[0])}km/h.`,
        severity: 'moderate',
        type: 'wind',
        start: new Date().toISOString(),
        end: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        area: 'Área local',
        source: 'Open-Meteo'
      });
    }
    
    return alerts;
  } catch (error) {
    console.error('Error generando alertas desde Open-Meteo:', error);
    return [];
  }
}

/**
 * Helper para obtener el código de provincia desde coordenadas
 * En una implementación real, esto consultaría una API geográfica
 */
async function getProvinceCodeFromCoordinates(lat: number, lon: number): Promise<string> {
  // Simplificación para demostración - en realidad esto haría una consulta geográfica
  if (lat > 40 && lat < 41 && lon > -4 && lon < -3) {
    return 'madrid';
  } else if (lat > 41 && lat < 42 && lon > 2 && lon < 3) {
    return 'barcelona';
  } else if (lat > 37 && lat < 38 && lon > -6 && lon < -5) {
    return 'sevilla';
  } else if (lat > 39 && lat < 40 && lon > -1 && lon < 0) {
    return 'valencia';
  }
  
  return 'unknown';
}

/**
 * Elimina alertas duplicadas basándose en similitud de contenido
 */
function removeDuplicateAlerts(alerts: WeatherAlert[]): WeatherAlert[] {
  const uniqueAlerts: WeatherAlert[] = [];
  const seenDescriptions = new Set<string>();
  
  for (const alert of alerts) {
    // Simplificar la descripción para comparación
    const simplifiedDesc = alert.description
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .trim();
      
    // Si ya tenemos una alerta similar, ignorarla
    if (seenDescriptions.has(simplifiedDesc)) continue;
    
    // Si no, añadir esta alerta y marcarla como vista
    seenDescriptions.add(simplifiedDesc);
    uniqueAlerts.push(alert);
  }
  
  return uniqueAlerts;
}

// Interfaz para la estructura de datos de las alertas de demostración
interface DemoAlert {
  id: string;
  title: string;
  description: string;
  level: string;
  start: string;
  end: string;
  area: string;
}

/**
 * Datos de demostración para simular respuestas de AEMET
 */
function getDemoAlerts(provinceCode: string): DemoAlert[] {
  const baseAlerts: DemoAlert[] = [
    {
      id: '1',
      title: 'Aviso amarillo por lluvias',
      description: 'Precipitaciones acumuladas en una hora: 15 mm.',
      level: 'amarillo',
      start: new Date().toISOString(),
      end: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
      area: 'Región costera'
    },
    {
      id: '2',
      title: 'Aviso naranja por calor',
      description: 'Temperaturas máximas: 39ºC.',
      level: 'naranja',
      start: new Date().toISOString(),
      end: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      area: 'Interior'
    }
  ];
  
  // Añadir alertas específicas según la provincia
  if (provinceCode === 'madrid') {
    baseAlerts.push({
      id: '3',
      title: 'Aviso amarillo por tormentas',
      description: 'Tormentas con granizo y rachas fuertes.',
      level: 'amarillo',
      start: new Date().toISOString(),
      end: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
      area: 'Comunidad de Madrid'
    });
  } else if (provinceCode === 'barcelona') {
    baseAlerts.push({
      id: '4',
      title: 'Aviso amarillo por fenómenos costeros',
      description: 'Altura de las olas: 2 a 3 metros.',
      level: 'amarillo',
      start: new Date().toISOString(),
      end: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
      area: 'Costa de Barcelona'
    });
  }
  
  // Solo devolver algunas alertas aleatoriamente para simular variedad
  return baseAlerts.filter(() => Math.random() > 0.4);
}
