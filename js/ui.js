function populateSelect(id, options) {
    try {
        const select = document.getElementById(id);
        if (!select) throw new Error(`No se encontró el elemento select con id: ${id}`);
        
        select.innerHTML = '<option value="">Selecciona ' + id.charAt(0).toUpperCase() + id.slice(1) + '</option>';
        options.forEach(option => {
            if (option) {
                const opt = document.createElement('option');
                opt.value = option;
                opt.textContent = option;
                select.appendChild(opt);
            }
        });
    } catch (error) {
        console.error('Error al poblar el select:', error);
        document.getElementById('errorMessage').textContent = `Error al cargar las opciones: ${error.message}`;
        document.getElementById('errorMessage').style.display = 'block';
    }
}

function checkFiltersAndEnableButtons() {
    try {
        const ciclo = document.getElementById('ciclo').value;
        const programa = document.getElementById('programa').value;
        const estado = document.getElementById('estado').value;
        const municipio = document.getElementById('municipio').value;
        
        console.log('Verificando filtros:', { ciclo, programa, estado, municipio });
        
        const isValid = ciclo && programa && estado && 
                       (programa === 'I003-FAIS Entidades' || 
                        programa === 'I004-FAIS Municipal y de las Demarcaciones Territoriales del Distrito Federal' ||
                        municipio);
        
        document.getElementById('generarAnalisis').disabled = !isValid;
        document.getElementById('exportarExcel').disabled = !isValid;
    } catch (error) {
        console.error('Error al verificar filtros:', error);
    }
}

function updateMunicipios() {
    try {
        const estado = document.getElementById('estado').value;
        const programa = document.getElementById('programa').value;
        const esCDMX = estado === 'Ciudad de México';
        
        if (!fullData || fullData.length === 0) {
            console.log('No hay datos disponibles');
            return;
        }

        const datosFiltrados = fullData.filter(item => item['PROGRAMA PRESUPUESTARIO'] === programa);
        const municipios = [...new Set(datosFiltrados.map(item => {
            return item.NOMBRE_MUNICIPIO || item.MUNICIPIO || item.ALCALDIA || '';
        }).filter(Boolean))].sort();
        
        document.getElementById('errorMessage').style.display = 'none';
        const municipioSelect = document.getElementById('municipio');
        
        const etiquetaSelector = esCDMX ? 'Alcaldía' : 'Municipio';
        municipioSelect.innerHTML = `<option value="">Selecciona ${etiquetaSelector}</option>`;
        
        if (!programa || programa === 'I003-FAIS Entidades') {
            municipioSelect.disabled = true;
            document.getElementById('municipioContainer').style.display = 
                programa === 'I003-FAIS Entidades' ? 'none' : 'block';
            return;
        }

        if (programa.includes('I004') || programa.includes('I005')) {
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
                document.getElementById('errorMessage').textContent = 
                    `No se encontraron ${esCDMX ? 'alcaldías' : 'municipios'} para el programa ${programa}. Por favor, seleccione otro programa.`;
                document.getElementById('errorMessage').style.display = 'block';
                municipioSelect.disabled = true;
            }
        }

        checkFiltersAndEnableButtons();
    } catch (error) {
        console.error('Error al actualizar municipios:', error);
        document.getElementById('errorMessage').textContent = `Error al cargar los municipios: ${error.message}`;
        document.getElementById('errorMessage').style.display = 'block';
    }
}

function limpiarFiltros() {
    try {
        document.getElementById('ciclo').value = '';
        document.getElementById('programa').value = '';
        document.getElementById('estado').value = '';
        document.getElementById('municipio').value = '';
        
        fullData = [];
        filteredData = [];
        
        document.getElementById('municipioContainer').style.display = 'block';
        document.getElementById('municipio').disabled = true;
        document.getElementById('generarAnalisis').disabled = true;
        document.getElementById('exportarExcel').disabled = true;
        document.getElementById('errorMessage').style.display = 'none';
        
        initialize();
    } catch (error) {
        console.error('Error al limpiar filtros:', error);
    }
}

async function initialize() {
    try {
        document.getElementById('loadingMessage').style.display = 'block';
        const estados = Object.keys(estadosMapping).sort();
        populateSelect('estado', estados);
        document.getElementById('loadingMessage').style.display = 'none';
        document.getElementById('filtersContainer').style.display = 'grid';
    } catch (error) {
        document.getElementById('loadingMessage').style.display = 'none';
        console.error('Error en inicialización:', error);
        document.getElementById('errorMessage').textContent = `Error al inicializar: ${error.message}`;
        document.getElementById('errorMessage').style.display = 'block';
    }
}

// Event Listeners
document.getElementById('ciclo').addEventListener('change', function() {
    try {
        document.getElementById('municipio').value = '';
        updateMunicipios();
        filterData();
    } catch (error) {
        console.error('Error en evento ciclo:', error);
    }
});

document.getElementById('programa').addEventListener('change', function() {
    try {
        const programa = this.value;
        document.getElementById('municipio').value = '';
        
        if (programa === 'I003-FAIS Entidades') {
            document.getElementById('municipioContainer').style.display = 'none';
            document.getElementById('municipio').disabled = true;
        } else {
            document.getElementById('municipioContainer').style.display = 'block';
            updateMunicipios();
        }
        
        filterData();
    } catch (error) {
        console.error('Error en evento programa:', error);
    }
});

document.getElementById('estado').addEventListener('change', async function() {
    try {
        const estadoSeleccionado = this.value;
        if (estadoSeleccionado) {
            document.getElementById('loadingMessage').style.display = 'block';
            
            fullData = await fetchExcelData(estadoSeleccionado);
            
            if (!fullData) throw new Error('No se pudieron cargar los datos');
            
            fullData = fullData.map(item => ({
                ...item,
                'CICLO DEL RECURSO': Number(item['CICLO DEL RECURSO']),
                APROBADO: Number(item.APROBADO) || 0,
                EJERCIDO: Number(item.EJERCIDO) || 0,
                PAGADO: Number(item.PAGADO) || 0
            }));
            
            const ciclos = [...new Set(fullData
                .map(item => item['CICLO DEL RECURSO'])
                .filter(Boolean)
            )];
            
            const programas = [...new Set(fullData
                .map(item => item['PROGRAMA PRESUPUESTARIO'])
                .filter(Boolean)
            )];
            
            populateSelect('ciclo', ciclos.sort((a, b) => b - a));
            populateSelect('programa', programas.sort());
            
            document.getElementById('loadingMessage').style.display = 'none';
        }
        
        document.getElementById('municipio').value = '';
        updateMunicipios();
        filterData();
        
    } catch (error) {
        document.getElementById('loadingMessage').style.display = 'none';
        console.error('Error al cargar datos del estado:', error);
        document.getElementById('errorMessage').textContent = `Error al cargar datos: ${error.message}`;
        document.getElementById('errorMessage').style.display = 'block';
    }
});

document.getElementById('limpiarFiltros').addEventListener('click', limpiarFiltros);
document.getElementById('municipio').addEventListener('change', filterData);

document.getElementById('generarAnalisis').addEventListener('click', async function() {
    const boton = this;
    const textoOriginal = boton.textContent;
    
    try {
        boton.classList.add('generating-analysis', 'button-loading');
        boton.textContent = 'Generando análisis';
        boton.disabled = true;
        
        const programa = document.getElementById('programa').value;
        if (!programa) throw new Error('No se ha seleccionado un programa');
        if (!filteredData || filteredData.length === 0) throw new Error('No hay datos para generar el informe');
        
        await generarInforme(filteredData, programa);
        
    } catch (error) {
        console.error('Error:', error);
        alert('Ocurrió un error al generar el informe: ' + error.message);
    } finally {
        boton.classList.remove('generating-analysis', 'button-loading');
        boton.textContent = textoOriginal;
        boton.disabled = false;
    }
});

document.getElementById('exportarExcel').addEventListener('click', function() {
    const boton = this;
    const textoOriginal = boton.textContent;
    
    try {
        boton.classList.add('generating-analysis', 'button-loading');
        boton.textContent = 'Exportando datos';
        boton.disabled = true;

        if (!filteredData || filteredData.length === 0) {
            throw new Error('No hay datos para exportar');
        }

        const wb = XLSX.utils.book_new();
        const dataToExport = filteredData.map(item => ({
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
        const wscols = Object.keys(dataToExport[0]).map(() => ({ wch: 20 }));
        ws['!cols'] = wscols;
        XLSX.utils.book_append_sheet(wb, ws, "Datos FAIS");

        const filtros = {
            ciclo: document.getElementById('ciclo').value,
            programa: document.getElementById('programa').value.split('-')[1],
            estado: document.getElementById('estado').value,
            municipio: document.getElementById('municipio').value
        };
        
        const nombreArchivo = `${filtros.ciclo}_${filtros.programa}_${filtros.estado}${filtros.municipio ? '_' + filtros.municipio : ''}.xlsx`;
        XLSX.writeFile(wb, nombreArchivo);
        
    } catch (error) {
        console.error('Error al exportar a Excel:', error);
        alert('Ocurrió un error al exportar los datos: ' + error.message);
    } finally {
        boton.classList.remove('generating-analysis', 'button-loading');
        boton.textContent = textoOriginal;
        boton.disabled = false;
    }
});

// Inicialización cuando se carga la página
document.addEventListener('DOMContentLoaded', initialize);