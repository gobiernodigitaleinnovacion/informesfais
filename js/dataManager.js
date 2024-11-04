import { APP_CONFIG, ESTADOS_MAPPING, configHelpers, ERROR_MESSAGES } from './config.js';
import { showError, showLoading, updateUI } from './ui.js';
import { generateAnalysisPrompt } from './analytics.js';

class DataManager {
    constructor() {
        this._fullData = [];
        this._filteredData = [];
        this._currentState = null;
        this._currentAnalysis = null;
    }

    // Getters
    get fullData() { return this._fullData; }
    get filteredData() { return this._filteredData; }
    get currentState() { return this._currentState; }
    get currentAnalysis() { return this._currentAnalysis; }

    // Métodos principales
    async fetchExcelData(estado) {
        try {
            showLoading(true);
            this._currentState = estado;

            const fullUrl = configHelpers.getStateFileUrl(estado);
            console.log('Cargando datos desde:', fullUrl);

            const response = await fetch(fullUrl, {
                method: 'GET',
                mode: 'cors',
                headers: {
                    ...APP_CONFIG.http.cors.headers,
                    'Accept': 'application/octet-stream'
                }
            });

            if (!response.ok) {
                throw new Error(`${ERROR_MESSAGES.FETCH_ERROR}: ${response.status}`);
            }

            const arrayBuffer = await response.arrayBuffer();
            const data = this._processExcelData(arrayBuffer);
            
            this._fullData = this._normalizeData(data);
            console.log(`Datos cargados para ${estado}:`, this._fullData.length);
            
            return this._fullData;
        } catch (error) {
            console.error('Error en fetchExcelData:', error);
            showError(`${ERROR_MESSAGES.FETCH_ERROR} para ${estado}: ${error.message}`);
            throw error;
        } finally {
            showLoading(false);
        }
    }

    filterData(filters) {
        console.log('Aplicando filtros:', filters);
        
        this._filteredData = this._fullData.filter(item => {
            const matchCiclo = !filters.ciclo || 
                             item['CICLO DEL RECURSO'] === Number(filters.ciclo);
            
            const matchPrograma = !filters.programa || 
                                item['PROGRAMA PRESUPUESTARIO'] === filters.programa;
            
            const matchEstado = !filters.estado || 
                               item.NOMBRE_ENTIDAD === filters.estado;
            
            const matchMunicipio = !filters.municipio || 
                                 filters.programa === 'I003-FAIS Entidades' || 
                                 item.NOMBRE_MUNICIPIO === filters.municipio;
            
            return matchCiclo && matchPrograma && matchEstado && matchMunicipio;
        });

        console.log('Resultados filtrados:', this._filteredData.length);
        return this._filteredData;
    }

    async obtenerAnalisisOpenAI(analisis) {
        try {
            showLoading(true);
            const prompt = generateAnalysisPrompt(this._filteredData, analisis);

            const response = await fetch(configHelpers.getOpenAIUrl(), {
                method: 'POST',
                headers: APP_CONFIG.http.openaiHeaders(),
                body: JSON.stringify({
                    messages: [
                        { 
                            role: "system", 
                            content: "Eres un analista experto en fondos públicos y desarrollo social, especializado en el análisis del FAIS."
                        },
                        { role: "user", content: prompt }
                    ],
                    temperature: 0.7,
                    max_tokens: 2000,
                    top_p: 0.95,
                    frequency_penalty: 0,
                    presence_penalty: 0
                })
            });

            if (!response.ok) {
                throw new Error(`${ERROR_MESSAGES.OPENAI_ERROR}: ${response.status}`);
            }

            const result = await response.json();
            this._currentAnalysis = result.choices[0].message.content;
            return this._currentAnalysis;

        } catch (error) {
            console.error('Error en análisis OpenAI:', error);
            showError(ERROR_MESSAGES.ANALYSIS_ERROR);
            return "No se pudo generar el análisis automático. Por favor, intente nuevamente.";
        } finally {
            showLoading(false);
        }
    }

    // Métodos privados de procesamiento
    _processExcelData(arrayBuffer) {
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(firstSheet);

        if (data.length === 0) {
            throw new Error(`${ERROR_MESSAGES.STATE_NOT_FOUND}: ${this._currentState}`);
        }

        return data;
    }

    _normalizeData(data) {
        return data.map(row => ({
            ...row,
            'CICLO DEL RECURSO': Number(row['CICLO DEL RECURSO']) || 0,
            APROBADO: Number(row.APROBADO) || 0,
            EJERCIDO: Number(row.EJERCIDO) || 0,
            PAGADO: Number(row.PAGADO) || 0,
            PORCENTAJE: Number(row.PORCENTAJE) || 0,
            MUJERES: Number(row.MUJERES) || 0,
            HOMBRES: Number(row.HOMBRES) || 0,
            NOMBRE_ENTIDAD: row.NOMBRE_ENTIDAD || '',
            NOMBRE_MUNICIPIO: row.NOMBRE_MUNICIPIO || row.MUNICIPIO || '',
            LOCALIDAD: row.LOCALIDAD || '',
            FECHA_INICIO: row.FECHA_INICIO || '',
            FECHA_TERMINO: row.FECHA_TERMINO || ''
        }));
    }

    // Métodos auxiliares
    getAvailableCycles() {
        return [...new Set(this._fullData
            .map(item => item['CICLO DEL RECURSO'])
            .filter(Boolean)
        )].sort((a, b) => b - a);
    }

    getAvailablePrograms() {
        return [...new Set(this._fullData
            .map(item => item['PROGRAMA PRESUPUESTARIO'])
            .filter(Boolean)
        )].sort();
    }

    getMunicipalities(programa) {
        return [...new Set(this._fullData
            .filter(item => item['PROGRAMA PRESUPUESTARIO'] === programa)
            .map(item => item.NOMBRE_MUNICIPIO)
            .filter(Boolean)
        )].sort();
    }
}

// Exportar una única instancia
export const dataManager = new DataManager();