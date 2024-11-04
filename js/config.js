// Configuración principal de la aplicación
export const APP_CONFIG = {
    // Configuración de Azure OpenAI
    openai: {
        API_KEY: "de7bb7a3b62e409e890737a2a4f7d3be",
        ENDPOINT: "https://opeanaihtmlautomatizados.openai.azure.com/",
        API_VERSION: "2024-02-15-preview",
        DEPLOYMENT_NAME: "gpt-4o-minihtmlautomatizado",
    },

    // Configuración de Azure Blob Storage
    storage: {
        baseUrl: 'https://stindicadores.blob.core.windows.net/estados-fais/',
        sasToken: 'sp=r&st=2024-10-30T21:15:16Z&se=2026-10-31T05:15:16Z&spr=https&sv=2022-11-02&sr=c&sig=okiG4MWLVsgE37DUov5YBZcbXqjYOd%2BKcOnNh0TYN2s%3D'
    },

    // Configuración de peticiones HTTP
    http: {
        cors: {
            mode: 'cors',
            headers: {
                'Origin': window.location.origin,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        },
        openaiHeaders: function() {
            return {
                'Content-Type': 'application/json',
                'api-key': this.openai.API_KEY
            };
        }
    }
};

// Mapeo de estados a archivos
export const ESTADOS_MAPPING = {
    'Aguascalientes': 'FAIS_Aguascalientes.xlsx',
    'Baja California': 'FAIS_Baja_California.xlsx',
    'Baja California Sur': 'FAIS_Baja_California_Sur.xlsx',
    'Campeche': 'FAIS_Campeche.xlsx',
    'Chiapas': 'FAIS_Chiapas.xlsx',
    'Chihuahua': 'FAIS_Chihuahua.xlsx',
    'Ciudad de México': 'FAIS_Ciudad_de_México.xlsx',
    'Coahuila de Zaragoza': 'FAIS_Coahuila_de_Zaragoza.xlsx',
    'Colima': 'FAIS_Colima.xlsx',
    'Durango': 'FAIS_Durango.xlsx',
    'Guanajuato': 'FAIS_Guanajuato.xlsx',
    'Guerrero': 'FAIS_Guerrero.xlsx',
    'Hidalgo': 'FAIS_Hidalgo.xlsx',
    'Jalisco': 'FAIS_Jalisco.xlsx',
    'México': 'FAIS_México.xlsx',
    'Michoacán de Ocampo': 'FAIS_Michoacán_de_Ocampo.xlsx',
    'Morelos': 'FAIS_Morelos.xlsx',
    'Nayarit': 'FAIS_Nayarit.xlsx',
    'Nuevo León': 'FAIS_Nuevo_León.xlsx',
    'Oaxaca': 'FAIS_Oaxaca.xlsx',
    'Puebla': 'FAIS_Puebla.xlsx',
    'Querétaro': 'FAIS_Querétaro.xlsx',
    'Quintana Roo': 'FAIS_Quintana_Roo.xlsx',
    'San Luis Potosí': 'FAIS_San_Luis_Potosí.xlsx',
    'Sinaloa': 'FAIS_Sinaloa.xlsx',
    'Sonora': 'FAIS_Sonora.xlsx',
    'Tabasco': 'FAIS_Tabasco.xlsx',
    'Tamaulipas': 'FAIS_Tamaulipas.xlsx',
    'Tlaxcala': 'FAIS_Tlaxcala.xlsx',
    'Veracruz de Ignacio de la Llave': 'FAIS_Veracruz_de_Ignacio_de_la_Llave.xlsx',
    'Yucatán': 'FAIS_Yucatán.xlsx',
    'Zacatecas': 'FAIS_Zacatecas.xlsx'
};

// Normalización de nombres de estados
export const ESTADOS_NORMALIZACION = {
    'Coahuila': 'Coahuila de Zaragoza',
    'Michoacán': 'Michoacán de Ocampo',
    'Veracruz': 'Veracruz de Ignacio de la Llave'
};

// Constantes para programas FAIS
export const PROGRAMAS = {
    ESTATAL: 'I003-FAIS Entidades',
    MUNICIPAL: 'I004-FAIS Municipal y de las Demarcaciones Territoriales del Distrito Federal'
};

// Funciones auxiliares de configuración
export const configHelpers = {
    // Obtener URL completa para un archivo de estado
    getStateFileUrl: (estado) => {
        const fileName = ESTADOS_MAPPING[estado];
        if (!fileName) {
            throw new Error(`Archivo no encontrado para el estado: ${estado}`);
        }
        return `${APP_CONFIG.storage.baseUrl}${fileName}?${APP_CONFIG.storage.sasToken}`;
    },

    // Obtener URL para la API de OpenAI
    getOpenAIUrl: () => {
        return `${APP_CONFIG.openai.ENDPOINT}/openai/deployments/${APP_CONFIG.openai.DEPLOYMENT_NAME}/chat/completions?api-version=${APP_CONFIG.openai.API_VERSION}`;
    },

    // Normalizar nombre de estado
    normalizeStateName: (estado) => {
        return ESTADOS_NORMALIZACION[estado] || estado;
    }
};

// Configuración para el manejo de errores
export const ERROR_MESSAGES = {
    FETCH_ERROR: 'Error al obtener los datos del servidor',
    STATE_NOT_FOUND: 'Estado no encontrado',
    ANALYSIS_ERROR: 'Error al generar el análisis',
    OPENAI_ERROR: 'Error en el servicio de análisis',
    EXPORT_ERROR: 'Error al exportar los datos'
};