export interface CityData {
    name: string;
    region: string;
    province: string;
    population: number;
    elevation: number;
}
export declare function getCityData(cityName: string): Promise<CityData | null>;
export declare function getRegionFromCoordinates(lat: number, lon: number): string;
export declare function normalizeString(str: string): string;
export declare function getCityElevation(cityName: string): Promise<number>;
export declare function getCityPopulation(cityName: string): Promise<number>;
