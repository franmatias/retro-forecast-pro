/**
 * Utilidades para el manejo de tiempo y zonas horarias
 */

/**
 * Obtiene la hora actual en una ubicación basada en el offset de la zona horaria
 * @param timezoneOffset El offset de la zona horaria en segundos (como lo proporciona la API)
 * @returns Una fecha que representa la hora actual en esa zona horaria
 */
export function getCurrentLocationTime(timezoneOffset: number = 0): Date {
  // Método directo: obtener la hora UTC actual y aplicar sólo el offset de la zona horaria
  // sin pasar por conversiones intermedias que puedan causar problemas
  
  // Obtener el timestamp UTC actual
  const now = new Date();
  const nowUtcMs = now.valueOf(); // Timestamp en milisegundos
  
  // IMPORTANTE: Como Date.valueOf() ya incluye el offset del navegador local,
  // debemos neutralizarlo antes de aplicar el offset de la API
  const browserOffsetMs = now.getTimezoneOffset() * 60 * 1000; // Convertir minutos a ms
  
  // Neutralizar el offset del navegador (agregándolo porque getTimezoneOffset() da valores negativos)
  const utcWithoutBrowserOffset = nowUtcMs + browserOffsetMs;
  
  // Aplicar el offset de la API (en segundos → milisegundos)
  // NOTA: No sumamos sino aplicamos directamente el offset que ya tiene el signo correcto
  const locationTimestamp = utcWithoutBrowserOffset + (timezoneOffset * 1000);
  
  // Crear un objeto Date con el timestamp final
  const localDate = new Date(locationTimestamp);
  
  // Logging para depuración
  console.debug('Cálculo horario corregido (NUEVO):', {
    horaNavegador: now.toLocaleString(),
    timestampMs: nowUtcMs,
    offsetNavegadorMs: browserOffsetMs,
    utcSinOffsetNavegador: new Date(utcWithoutBrowserOffset).toISOString(),
    offsetAPISegundos: timezoneOffset,
    offsetAPIHoras: timezoneOffset / 3600,
    resultadoFinal: localDate.toLocaleString(),
    resultadoISO: localDate.toISOString()
  });
  
  return localDate;
}

/**
 * Formatea una fecha UTC a la hora local de una ubicación usando el offset de zona horaria
 * @param utcDate Fecha en UTC (como las proporcionadas por la API)
 * @param timezoneOffset El offset de la zona horaria en segundos
 * @returns Una fecha ajustada a la zona horaria indicada
 */
export function getLocationTime(utcDate: Date | string, timezoneOffset: number = 0): Date {
  // Convertir la fecha a un timestamp si es un string
  const timestamp = typeof utcDate === 'string' ? new Date(utcDate).getTime() : utcDate.getTime();
  
  // Aplicar el offset de zona horaria
  return new Date(timestamp + timezoneOffset * 1000);
}

/**
 * Formatea una hora para mostrar en formato HH:MM
 * @param date Fecha a formatear
 * @returns Hora formateada en formato HH:MM
 */
export function formatTimeHHMM(date: Date): string {
  return date.toLocaleTimeString('es', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
}
