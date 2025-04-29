export interface CityData {
  name: string;
  region: string;
  province: string;
  population: number;
  elevation: number;
}

export async function getCityData(cityName: string): Promise<CityData | null> {
  const normalizedName = normalizeString(cityName);
  try {
    const response = await fetch(`/api/cities/${encodeURIComponent(normalizedName)}`);
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error('Error fetching city data:', error);
    return null;
  }
}

export function getRegionFromCoordinates(lat: number, lon: number): string {
  if (lat >= 36 && lat <= 38.7 && lon >= -7.5 && lon <= -1.6) {
    return 'Andalucía';
  }
  return 'España';
}

export function normalizeString(str: string): string {
  return str.trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/^(la|el|los|las) /i, '')
    .split(' ').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
}

export async function getCityElevation(cityName: string): Promise<number> {
  const cityData = await getCityData(cityName);
  if (cityData) {
    return cityData.elevation;
  }
  return 0;
}

export async function getCityPopulation(cityName: string): Promise<number> {
  const cityData = await getCityData(cityName);
  if (cityData) {
    return cityData.population;
  }
  return 25000;
}
