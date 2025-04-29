import axios from 'axios';

// Interfaces para tipar los datos extraídos
export interface WeatherAlert {
  title: string;
  description: string;
  type: string;
  region: string;
  level: string;
  startDate?: string;
  endDate?: string;
}

class AemetScraper {
  // Ya no intentamos usar CORS-Anywhere por defecto
  private proxyUrl: string = '';
  private targetUrl: string = 'https://www.aemet.es/es/eltiempo/prediccion/avisos';
  private useSimulatedData: boolean = true; // Por defecto, siempre usamos datos simulados

  /**
   * Obtiene los avisos meteorológicos de AEMET
   * @param region Filtrar por región específica (opcional)
   * @returns Lista de avisos meteorológicos
   */
  async getAlerts(region?: string): Promise<WeatherAlert[]> {
    // Si estamos configurados para usar datos simulados, no intentamos hacer la petición
    if (this.useSimulatedData) {
      console.log('Usando alertas simuladas por defecto');
      return this.generateSimulatedAlerts(region);
    }

    try {
      // Esta parte solo se ejecutaría si tuviéramos un backend propio o CORS-Anywhere activado
      console.log('Obteniendo avisos meteorológicos de AEMET...');
      const response = await axios.get(`${this.proxyUrl}${this.targetUrl}`, {
        headers: {
          'Origin': window.location.origin
        }
      });
      
      const alerts = this.parseAemetHtml(response.data, region);
      console.log(`Avisos obtenidos: ${alerts.length}`);
      return alerts;
    } catch (error) {
      console.error('Error al obtener los avisos meteorológicos:', error);
      
      // En caso de error, devolvemos alertas simuladas
      return this.generateSimulatedAlerts(region);
    }
  }
  
  /**
   * Parsea el HTML de la página de avisos de AEMET
   * @param html HTML de la página de avisos
   * @param filterRegion Región para filtrar alertas
   * @returns Lista de alertas extraídas
   */
  private parseAemetHtml(html: string, filterRegion?: string): WeatherAlert[] {
    const alerts: WeatherAlert[] = [];
    
    try {
      // Usamos un enfoque de análisis simple con regex
      // En un caso real, sería mejor usar una biblioteca como cheerio
      
      // Buscar la tabla de avisos
      const tableRegex = /<table class="table_avisos">(.*?)<\/table>/s;
      const tableMatch = html.match(tableRegex);
      
      if (!tableMatch) {
        console.warn('No se encontró la tabla de avisos');
        return alerts;
      }
      
      // Extraer filas de la tabla
      const rowRegex = /<tr>(.*?)<\/tr>/gs;
      const rows = Array.from(tableMatch[1].matchAll(rowRegex));
      
      rows.forEach((row, index) => {
        // Saltamos la primera fila (cabecera)
        if (index === 0) return;
        
        const cellRegex = /<td.*?>(.*?)<\/td>/gs;
        const cells = Array.from(row[1].matchAll(cellRegex));
        
        if (cells.length >= 4) {
          const region = this.cleanHtml(cells[0][1]);
          
          // Filtrar por región si se especifica
          if (filterRegion && !region.toLowerCase().includes(filterRegion.toLowerCase())) {
            return;
          }
          
          // Extraer el tipo de alerta y el nivel
          let type = 'extreme';  // Valor por defecto
          let level = 'warning';
          
          const alertInfo = this.cleanHtml(cells[1][1]);
          
          if (alertInfo.toLowerCase().includes('lluvia')) type = 'rain';
          else if (alertInfo.toLowerCase().includes('nieve')) type = 'snow';
          else if (alertInfo.toLowerCase().includes('viento')) type = 'wind';
          else if (alertInfo.toLowerCase().includes('tormenta')) type = 'storm';
          
          // Determinar el nivel por el color
          if (cells[1][0].toLowerCase().includes('nivel_aviso_rojo')) {
            level = 'severe';
          } else if (cells[1][0].toLowerCase().includes('nivel_aviso_naranja')) {
            level = 'warning';
          } else {
            level = 'caution';
          }
          
          const description = this.cleanHtml(cells[2][1]);
          const dateInfo = this.cleanHtml(cells[3][1]);
          
          alerts.push({
            title: alertInfo,
            description: `${description} - ${dateInfo}`,
            type,
            region,
            level
          });
        }
      });
      
      return alerts;
    } catch (e) {
      console.error('Error al parsear HTML de AEMET:', e);
      return alerts;
    }
  }
  
  /**
   * Elimina etiquetas HTML y limpia el texto
   */
  private cleanHtml(html: string): string {
    return html
      .replace(/<\/?[^>]+(>|$)/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }
  
  /**
   * Proporciona alertas simuladas en caso de fallo o cuando se configura para usar siempre datos simulados
   */
  private generateSimulatedAlerts(filterRegion?: string): WeatherAlert[] {
    console.log('Generando alertas meteorológicas simuladas');
    
    // Generar alertas más relevantes y realistas basadas en la ubicación y la fecha actual
    const now = new Date();
    const month = now.getMonth() + 1; // Los meses empiezan en 0
    
    // Crear un conjunto de alertas basadas en la temporada del año
    const allAlerts: WeatherAlert[] = [];
    
    // Determinar alertas según la estación del año
    if (month >= 12 || month <= 2) {
      // Invierno - Más alertas de frío, nieve y viento
      allAlerts.push({
        title: 'Bajas temperaturas',
        description: 'Temperaturas por debajo de -2°C durante varias horas',
        type: 'extreme',
        region: 'Asturias',
        level: 'warning'
      });
      
      allAlerts.push({
        title: 'Nevada intensa',
        description: 'Acumulación de hasta 20cm de nieve en 24h',
        type: 'snow', 
        region: 'Castilla y León',
        level: 'warning'
      });
      
      allAlerts.push({
        title: 'Viento fuerte',
        description: 'Ráfagas de hasta 90 km/h en zonas costeras',
        type: 'wind',
        region: 'Galicia',
        level: 'severe'
      });
    } else if (month >= 3 && month <= 5) {
      // Primavera - Alertas de lluvia y tormentas
      allAlerts.push({
        title: 'Lluvias intensas',
        description: 'Precipitaciones acumuladas de 30mm en 1 hora',
        type: 'rain',
        region: 'Andalucía',
        level: 'warning'
      });
      
      allAlerts.push({
        title: 'Tormentas eléctricas',
        description: 'Posibilidad de tormentas con aparato eléctrico',
        type: 'storm',
        region: 'Murcia',
        level: 'caution'
      });
    } else if (month >= 6 && month <= 8) {
      // Verano - Alertas de calor e incendios
      allAlerts.push({
        title: 'Calor extremo',
        description: 'Temperaturas máximas por encima de 40°C',
        type: 'extreme',
        region: 'Andalucía',
        level: 'severe'
      });
      
      allAlerts.push({
        title: 'Riesgo de incendios',
        description: 'Alto riesgo de incendios forestales debido a sequedad',
        type: 'extreme',
        region: 'Extremadura',
        level: 'warning'
      });
    } else {
      // Otoño - Alertas de lluvia y viento
      allAlerts.push({
        title: 'Lluvias torrenciales',
        description: 'Precipitaciones acumuladas de hasta 100mm en 12h',
        type: 'rain',
        region: 'Valencia',
        level: 'severe'
      });
      
      allAlerts.push({
        title: 'Viento fuerte',
        description: 'Ráfagas de hasta 80 km/h',
        type: 'wind',
        region: 'Cataluña',
        level: 'warning'
      });
    }
    
    // Alertas genéricas que pueden aparecer en cualquier época
    allAlerts.push({
      title: 'Nieblas persistentes',
      description: 'Visibilidad reducida a menos de 200m',
      type: 'extreme',
      region: 'Madrid',
      level: 'caution'
    });
    
    // Si estamos filtrando por región
    if (filterRegion) {
      return allAlerts.filter(alert => 
        alert.region.toLowerCase().includes(filterRegion.toLowerCase())
      );
    }
    
    return allAlerts;
  }
  
  /**
   * Configurar el uso de datos simulados (para propósitos de desarrollo o demostración)
   */
  setUseSimulatedData(value: boolean): void {
    this.useSimulatedData = value;
  }
  
  /**
   * Configurar la URL del proxy (si se dispone de uno propio)
   */
  setProxyUrl(url: string): void {
    this.proxyUrl = url;
  }
}

export default new AemetScraper();
