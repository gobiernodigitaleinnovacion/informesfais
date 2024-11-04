import { dataManager } from './dataManager.js';
import { AnalyticsManager } from './analytics.js';
import { APP_CONFIG, PROGRAMAS } from './config.js';

export class UIManager {
    constructor() {
        this.initializeEventListeners();
        this.initialize();
    }

    // Inicialización
    async initialize() {
        try {
            this.showLoading(true);
            const estados = Object.keys(APP_CONFIG.estadosMapping).sort();
            this.populateSelect('estado', estados);
            this.showLoading(false);
            this.showFiltersContainer(true);
        } catch (error) {
            this.showLoading(false);
            console.error('Error en inicialización:', error);
            this.showError('Error al inicializar la aplicación');
        }
    }

    // Gestión de la interfaz
    populateSelect(id, options) {
        try {
            const select = document.getElementById(id);
            if (!select) throw new Error(`Elemento select no encontrado: ${id}`);
            
            const displayName = this.getDisplayName(id);
            select.innerHTML = `<option value="">Selecciona ${displayName}</option>`;
            
            options.forEach(option => {
                if (option) {
                    const opt = document.createElement('option');
                    opt.value = option;
                    opt.textContent = option;
                    select.appendChild(opt);
                }
            });
        } catch (error) {
            console.error('Error al poblar select:', error);
            this.showError(`Error al cargar opciones de ${id}`);
        }
    }

    updateMunicipios() {
        try {
            const estado = this.getSelectValue('estado');
            const programa = this.getSelectValue('programa');
            const esCDMX = estado === 'Ciudad de México';
            
            if (!dataManager.fullData.length) {
                console.log('No hay datos disponibles');
                return;
            }

            const municipios = dataManager.getMunicipalities(programa);
            this.hideError();
            
            const municipioSelect = document.getElementById('municipio');
            const etiquetaSelector = esCDMX ? 'Alcaldía' : 'Municipio';
            municipioSelect.innerHTML = `<option value="">Selecciona ${etiquetaSelector}</option>`;
            
            if (this.isProgramaEstatal(programa)) {
                this.handleProgramaEstatal(municipioSelect);
                return;
            }

            this.handleProgramaMunicipal(municipioSelect, municipios, esCDMX, programa, etiquetaSelector);
            this.checkFiltersAndEnableButtons();

        } catch (error) {
            console.error('Error al actualizar municipios:', error);
            this.showError('Error al cargar municipios');
        }
    }

    // Manejadores de eventos
    async handleEstadoChange(event) {
        try {
            const estadoSeleccionado = event.target.value;
            if (!estadoSeleccionado) return;

            this.showLoading(true);
            await dataManager.fetchExcelData(estadoSeleccionado);
            
            const ciclos = dataManager.getAvailableCycles();
            const programas = dataManager.getAvailablePrograms();
            
            this.populateSelect('ciclo', ciclos);
            this.populateSelect('programa', programas);
            
            this.resetMunicipio();
            this.updateMunicipios();
            this.filterData();
            
        } catch (error) {
            console.error('Error al cambiar estado:', error);
            this.showError('Error al cargar datos del estado');
        } finally {
            this.showLoading(false);
        }
    }

    handleProgramaChange(event) {
        try {
            const programa = event.target.value;
            this.resetMunicipio();
            
            if (this.isProgramaEstatal(programa)) {
                this.hideMunicipioContainer();
                document.getElementById('municipio').disabled = true;
            } else {
                this.showMunicipioContainer();
                this.updateMunicipios();
            }
            
            this.filterData();
        } catch (error) {
            console.error('Error al cambiar programa:', error);
            this.showError('Error al actualizar selección de programa');
        }
    }

    async handleGenerarAnalisis() {
        const boton = document.getElementById('generarAnalisis');
        const textoOriginal = boton.textContent;
        
        try {
            this.setBotonEstado(boton, true, 'Generando análisis...');
            
            const programa = this.getSelectValue('programa');
            if (!programa) throw new Error('Programa no seleccionado');
            
            const filtros = this.obtenerFiltrosActuales();
            await AnalyticsManager.generarInforme(dataManager.filteredData, filtros);
            
        } catch (error) {
            console.error('Error al generar análisis:', error);
            this.mostrarAlerta('Error al generar el informe');
        } finally {
            this.setBotonEstado(boton, false, textoOriginal);
        }
    }

    async handleExportarExcel() {
        const boton = document.getElementById('exportarExcel');
        const textoOriginal = boton.textContent;
        
        try {
            this.setBotonEstado(boton, true, 'Exportando datos...');
            
            if (!dataManager.filteredData.length) {
                throw new Error('No hay datos para exportar');
            }

            const filtros = this.obtenerFiltrosActuales();
            await this.exportarAExcel(dataManager.filteredData, filtros);
            
        } catch (error) {
            console.error('Error al exportar:', error);
            this.mostrarAlerta('Error al exportar datos');
        } finally {
            this.setBotonEstado(boton, false, textoOriginal);
        }
    }

    // Métodos auxiliares
    getDisplayName(id) {
        const names = {
            estado: 'Estado',
            ciclo: 'Ciclo',
            programa: 'Programa',
            municipio: 'Municipio'
        };
        return names[id] || id.charAt(0).toUpperCase() + id.slice(1);
    }

    getSelectValue(id) {
        return document.getElementById(id)?.value || '';
    }

    isProgramaEstatal(programa) {
        return programa === PROGRAMAS.ESTATAL;
    }

    obtenerFiltrosActuales() {
        return {
            ciclo: this.getSelectValue('ciclo'),
            programa: this.getSelectValue('programa'),
            estado: this.getSelectValue('estado'),
            municipio: this.getSelectValue('municipio')
        };
    }

    // Métodos de UI
    showLoading(show) {
        document.getElementById('loadingMessage').style.display = show ? 'block' : 'none';
    }

    showError(message) {
        const errorElement = document.getElementById('errorMessage');
        errorElement.textContent = message;
        errorElement.style.display = 'block';
    }

    hideError() {
        document.getElementById('errorMessage').style.display = 'none';
    }

    showFiltersContainer(show) {
        document.getElementById('filtersContainer').style.display = show ? 'grid' : 'none';
    }

    setBotonEstado(boton, disabled, texto) {
        boton.disabled = disabled;
        boton.textContent = texto;
        boton.classList.toggle('button-loading', disabled);
    }

    mostrarAlerta(mensaje) {
        alert(mensaje);
    }

    // Eventos
    initializeEventListeners() {
        document.getElementById('estado')?.addEventListener('change', this.handleEstadoChange.bind(this));
        document.getElementById('programa')?.addEventListener('change', this.handleProgramaChange.bind(this));
        document.getElementById('ciclo')?.addEventListener('change', this.handleCicloChange.bind(this));
        document.getElementById('municipio')?.addEventListener('change', this.handleMunicipioChange.bind(this));
        document.getElementById('generarAnalisis')?.addEventListener('click', this.handleGenerarAnalisis.bind(this));
        document.getElementById('exportarExcel')?.addEventListener('click', this.handleExportarExcel.bind(this));
        document.getElementById('limpiarFiltros')?.addEventListener('click', this.handleLimpiarFiltros.bind(this));
    }
}

// Exportar una instancia única
export const uiManager = new UIManager();