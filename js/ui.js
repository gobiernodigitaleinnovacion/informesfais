import { dataManager } from './dataManager.js';
import { AnalyticsManager } from './analytics.js';
import { APP_CONFIG, PROGRAMAS } from './config.js';

export class UIManager {
    constructor() {
        this.initializeEventListeners();
        this.initialize();
    }

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

    handleLimpiarFiltros() {
        try {
            document.getElementById('ciclo').value = '';
            document.getElementById('programa').value = '';
            document.getElementById('estado').value = '';
            document.getElementById('municipio').value = '';
            
            dataManager.clearData();
            
            document.getElementById('municipioContainer').style.display = 'block';
            document.getElementById('municipio').disabled = true;
            document.getElementById('generarAnalisis').disabled = true;
            document.getElementById('exportarExcel').disabled = true;
            document.getElementById('errorMessage').style.display = 'none';
            
            this.initialize();
        } catch (error) {
            console.error('Error al limpiar filtros:', error);
            this.showError('Error al limpiar filtros');
        }
    }

    handleCicloChange() {
        this.filterData();
        this.checkFiltersAndEnableButtons();
    }

    handleMunicipioChange() {
        this.filterData();
        this.checkFiltersAndEnableButtons();
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

    handleProgramaEstatal(municipioSelect) {
        municipioSelect.disabled = true;
        document.getElementById('municipioContainer').style.display = 'none';
    }

    handleProgramaMunicipal(municipioSelect, municipios, esCDMX, programa, etiquetaSelector) {
        if (municipios.length > 0) {
            municipioSelect.disabled = false;
            document.getElementById('municipioContainer').style.display = 'block';
            municipios.forEach(municipio => {
                const opt = document.createElement('option');
                opt.value = municipio;
                opt.textContent = municipio;
                municipioSelect.appendChild(opt);
            });
        } else {
            this.showError(
                `No se encontraron ${esCDMX ? 'alcaldías' : 'municipios'} para el programa ${programa}`
            );
            municipioSelect.disabled = true;
        }
    }

    checkFiltersAndEnableButtons() {
        const filtros = this.obtenerFiltrosActuales();
        const isValid = filtros.ciclo && filtros.programa && filtros.estado && 
                       (filtros.programa === PROGRAMAS.ESTATAL || filtros.municipio);
        
        document.getElementById('generarAnalisis').disabled = !isValid;
        document.getElementById('exportarExcel').disabled = !isValid;
    }

    filterData() {
        const filtros = this.obtenerFiltrosActuales();
        dataManager.filterData(filtros);
    }

    resetMunicipio() {
        const municipioSelect = document.getElementById('municipio');
        municipioSelect.value = '';
        municipioSelect.disabled = true;
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

    hideMunicipioContainer() {
        document.getElementById('municipioContainer').style.display = 'none';
    }

    showMunicipioContainer() {
        document.getElementById('municipioContainer').style.display = 'block';
    }

    setBotonEstado(boton, disabled, texto) {
        boton.disabled = disabled;
        boton.textContent = texto;
        boton.classList.toggle('button-loading', disabled);
    }

    mostrarAlerta(mensaje) {
        alert(mensaje);
    }

    async exportarAExcel(data, filtros) {
        const wb = XLSX.utils.book_new();
        const dataToExport = data.map(item => ({
            'Folio': item['FOLIO'],
            'Ciclo del Recurso': item['CICLO DEL RECURSO'],
            'Programa Presupuestario': item['PROGRAMA PRESUPUESTARIO'],
            'Estado': item['NOMBRE_ENTIDAD'],
            'Municipio': item['NOMBRE_MUNICIPIO'],
            'Localidad': item['LOCALIDAD'],
            'Monto Aprobado': item['APROBADO'],
            'Monto Ejercido': item['EJERCIDO'],
            'Monto Pagado': item['PAGADO'],
            'Estatus': item['ESTATUS'],
            'Porcentaje Avance': item['PORCENTAJE'],
            'Institución Ejecutora': item['INSTITUCION_EJECUTORA'],
            'Contratista': item['CONTRATISTA'],
            'Convocante': item['CONVOCANTE'],
            'Categoría': item['CATEGORIA'],
            'Tipo de Programa': item['TIPO_PROGRAMA_PROYECTO'],
            'Clasificación': item['CLASIFICACION'],
            'Beneficiarios Mujeres': item['MUJERES'],
            'Beneficiarios Hombres': item['HOMBRES'],
            'Fecha Inicio': item['FECHA_INICIO'],
            'Fecha Término': item['FECHA_TERMINO']
        }));

        const ws = XLSX.utils.json_to_sheet(dataToExport);
        ws['!cols'] = Object.keys(dataToExport[0]).map(() => ({ wch: 20 }));
        
        XLSX.utils.book_append_sheet(wb, ws, "Datos FAIS");
        
        const nombreArchivo = `${filtros.ciclo}_${filtros.programa.split('-')[1]}_${filtros.estado}${
            filtros.municipio ? '_' + filtros.municipio : ''
        }.xlsx`;
        
        XLSX.writeFile(wb, nombreArchivo);
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

export const uiManager = new UIManager();