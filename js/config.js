// Configuración de Azure OpenAI
const CONFIG = {
    AZURE_OPENAI_API_KEY: "de7bb7a3b62e409e890737a2a4f7d3be",
    AZURE_OPENAI_ENDPOINT: "https://opeanaihtmlautomatizados.openai.azure.com/",
    AZURE_OPENAI_API_VERSION: "2024-02-15-preview",
    AZURE_OPENAI_DEPLOYMENT_NAME: "gpt-4o-minihtmlautomatizado",
};

// Configuración de la URL base y token SAS
const baseUrl = 'https://stindicadores.blob.core.windows.net/estados-fais/';
const sasToken = 'sp=r&st=2024-10-30T21:15:16Z&se=2026-10-31T05:15:16Z&spr=https&sv=2022-11-02&sr=c&sig=okiG4MWLVsgE37DUov5YBZcbXqjYOd%2BKcOnNh0TYN2s%3D';

// Mapeo de estados a archivos
const estadosMapping = {
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

const estadosNormalizacion = {
    'Coahuila': 'Coahuila de Zaragoza',
    'Michoacán': 'Michoacán de Ocampo',
    'Veracruz': 'Veracruz de Ignacio de la Llave'
};