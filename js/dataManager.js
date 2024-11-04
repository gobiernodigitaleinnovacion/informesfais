import { APP_CONFIG, ESTADOS_MAPPING } from './config.js';

class DataManager {
    constructor() {
        this.fullData = [];
        this.filteredData = [];
        this.currentState = null;
    }

    async fetchExcelData(estado) {
        try {
            const fileName = ESTADOS_MAPPING[estado];
            if (!fileName) {
                throw new Error(`Archivo no encontrado para el estado: ${estado}`);
            }

            const fullUrl = `${APP_CONFIG.storage.baseUrl}${fileName}?${APP_CONFIG.storage.sasToken}`;
            console.log('Intentando cargar:', fullUrl);

            const response = await fetch(fullUrl, {
                method: 'GET',
                mode: 'cors',
                headers: {
                    ...APP_CONFIG.http.cors.headers
                }
            });

            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status} - ${response.statusText}`);
            }
            
            const arrayBuffer = await response.arrayBuffer();
            const workbook = XLSX.read(arrayBuffer, { type: 'array' });
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
            const data = XLSX.utils.sheet_to_json(firstSheet);
            
            if (data.length === 0) {
                throw new Error(`No se encontraron datos para el estado: ${estado}`);
            }

            this.fullData = this.normalizeData(data);
            this.currentState = estado;

            return this.fullData;
        } catch (error) {
            console.error('Error al cargar datos:', error);
            throw error;
        }
    }

    normalizeData(data) {
        return data.map(row => ({
            ...row,
            'CICLO DEL RECURSO': Number(row['CICLO DEL RECURSO']) || 0,
            APROBADO: Number(row.APROBADO) || 0,
            EJERCIDO: Number(row.EJERCIDO) || 0,
            PAGADO: Number(row.PAGADO) || 0,
            NOMBRE_ENTIDAD: row.NOMBRE_ENTIDAD || '',
            NOMBRE_MUNICIPIO: row.NOMBRE_MUNICIPIO || row.MUNICIPIO || '',
            PORCENTAJE: Number(row.PORCENTAJE) || 0,
            MUJERES: Number(row.MUJERES) || 0,
            HOMBRES: Number(row.HOMBRES) || 0
        }));
    }

    filterData(filters) {
        const { ciclo, programa, estado, municipio } = filters;
        
        this.filteredData = this.fullData.filter(item => {
            const matchCiclo = !ciclo || item['CICLO DEL RECURSO'] === Number(ciclo);
            const matchPrograma = !programa || item['PROGRAMA PRESUPUESTARIO'] === programa;
            const matchEstado = !estado || item.NOMBRE_ENTIDAD === estado;
            const matchMunicipio = !municipio || 
                                programa === 'I003-FAIS Entidades' || 
                                item.NOMBRE_MUNICIPIO === municipio;
            
            return matchCiclo && matchPrograma && matchEstado && matchMunicipio;
        });
        
        return this.filteredData;
    }

    getAvailableCycles() {
        return [...new Set(this.fullData
            .map(item => item['CICLO DEL RECURSO'])
            .filter(Boolean)
        )].sort((a, b) => b - a);
    }

    getAvailablePrograms() {
        return [...new Set(this.fullData
            .map(item => item['PROGRAMA PRESUPUESTARIO'])
            .filter(Boolean)
        )].sort();
    }

    getMunicipalities(programa) {
        if (!programa || programa === 'I003-FAIS Entidades') {
            return [];
        }
        
        return [...new Set(this.fullData
            .filter(item => item['PROGRAMA PRESUPUESTARIO'] === programa)
            .map(item => item.NOMBRE_MUNICIPIO)
            .filter(Boolean)
        )].sort();
    }

    clearData() {
        this.fullData = [];
        this.filteredData = [];
        this.currentState = null;
    }
}

// Exportar una única instancia
export const dataManager = new DataManager();