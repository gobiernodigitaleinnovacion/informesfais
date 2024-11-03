let fullData = [];
let filteredData = [];

async function fetchExcelData(estado) {
    try {
        const fileName = estadosMapping[estado];
        if (!fileName) {
            throw new Error(`Archivo no encontrado para el estado: ${estado}`);
        }

        const fullUrl = `${baseUrl}${fileName}?${sasToken}`;
        console.log('Intentando cargar:', fullUrl);

        const response = await fetch(fullUrl);
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

        // Normalización de datos
        const dataNormalizada = data.map(row => ({
            ...row,
            'CICLO DEL RECURSO': Number(row['CICLO DEL RECURSO']) || 0,
            APROBADO: Number(row.APROBADO) || 0,
            EJERCIDO: Number(row.EJERCIDO) || 0,
            PAGADO: Number(row.PAGADO) || 0,
            NOMBRE_ENTIDAD: row.NOMBRE_ENTIDAD || '',
            NOMBRE_MUNICIPIO: row.NOMBRE_MUNICIPIO || row.MUNICIPIO || ''
        }));

        console.log('Datos normalizados:', {
            total: dataNormalizada.length,
            muestra: dataNormalizada.slice(0, 3),
            estados: [...new Set(dataNormalizada.map(d => d.NOMBRE_ENTIDAD))],
            programas: [...new Set(dataNormalizada.map(d => d['PROGRAMA PRESUPUESTARIO']))]
        });

        return dataNormalizada;
    } catch (error) {
        console.error('Error al cargar datos:', error);
        document.getElementById('errorMessage').textContent = `Error al cargar los datos de ${estado}: ${error.message}`;
        document.getElementById('errorMessage').style.display = 'block';
        throw error;
    }
}

function filterData() {
    const ciclo = document.getElementById('ciclo').value;
    const programa = document.getElementById('programa').value;
    const estado = document.getElementById('estado').value;
    const municipio = document.getElementById('municipio').value;
    
    console.log('Aplicando filtros:', { ciclo, programa, estado, municipio });
    console.log('Total datos antes de filtrar:', fullData.length);
    
    filteredData = fullData.filter(item => {
        const matchCiclo = !ciclo || item['CICLO DEL RECURSO'] === Number(ciclo);
        const matchPrograma = !programa || item['PROGRAMA PRESUPUESTARIO'] === programa;
        const matchEstado = !estado || item.NOMBRE_ENTIDAD === estado;
        const matchMunicipio = !municipio || 
                              programa === 'I003-FAIS Entidades' || 
                              item.NOMBRE_MUNICIPIO === municipio;
        
        console.log('Match de filtros para item:', {
            ciclo: matchCiclo,
            programa: matchPrograma,
            estado: matchEstado,
            municipio: matchMunicipio,
            item: {
                ciclo: item['CICLO DEL RECURSO'],
                programa: item['PROGRAMA PRESUPUESTARIO'],
                estado: item.NOMBRE_ENTIDAD,
                municipio: item.NOMBRE_MUNICIPIO
            }
        });

        return matchCiclo && matchPrograma && matchEstado && matchMunicipio;
    });
    
    console.log('Datos filtrados:', filteredData.length);
    if (filteredData.length > 0) {
        console.log('Ejemplo de registro filtrado:', filteredData[0]);
        console.log('Muestra de registros filtrados:', filteredData.slice(0, 3));
    }
    
    checkFiltersAndEnableButtons();
}

async function obtenerAnalisisOpenAI(data, analisis) {
    try {
        const estado = document.getElementById('estado').value;
        const esCDMX = estado === 'Ciudad de México';
        const terminoGeografico = esCDMX ? 'alcaldías' : 'municipios';
        
        const prompt = `Analiza los siguientes datos del FAIS (Fondo de Aportaciones para la Infraestructura Social) y proporciona un análisis detallado estructurado en secciones claras. Los datos incluyen información a nivel granular y métricas calculadas.

Datos Principales:

INDICADORES FINANCIEROS
- Total Aprobado: $${formatNumber(analisis.financiero.totalAprobado)}
- Total Ejercido: $${formatNumber(analisis.financiero.totalEjercido)}
- Total Pagado: $${formatNumber(analisis.financiero.totalPagado)}
- % Ejercido vs Aprobado: ${analisis.financiero.porcentajeEjercido}%
- % Pagado vs Aprobado: ${analisis.financiero.porcentajePagado}%

INDICADORES FÍSICOS
- Total Proyectos: ${analisis.fisico.totalProyectos}
- Promedio Avance: ${analisis.fisico.promedioAvance}%
- Estatus de Proyectos: ${JSON.stringify(analisis.fisico.proyectosPorEstatus)}

INDICADORES DE COBERTURA
- Total Localidades: ${analisis.cobertura.totalLocalidades}
- Distribución: ${analisis.cobertura.distribucionGeografica}
- Concentración de Inversión: ${analisis.cobertura.porcentajeConcentracion}%

INDICADORES DE EJECUCIÓN
- Total Instituciones Ejecutoras: ${analisis.ejecucion.totalEjecutoras}
- Total Contratistas: ${analisis.ejecucion.totalContratistas}
- Total Convocantes: ${analisis.ejecucion.totalConvocantes}

BENEFICIARIOS
- Total Mujeres: ${formatNumber(analisis.beneficiarios.totalMujeres)}
- Total Hombres: ${formatNumber(analisis.beneficiarios.totalHombres)}
- Ratio Mujeres: ${analisis.beneficiarios.ratioMujeres}%

TEMPORALIDAD
- Promedio Tiempo Ejecución: ${analisis.temporal.promedioTiempoEjecucion} meses
- Mes con más Inicios: ${analisis.temporal.mesMasInicios}
- Mes con más Términos: ${analisis.temporal.mesMasTerminos}

Nota: Para este análisis, cuando se mencionen unidades territoriales, usar el término "${terminoGeografico}" ya que los datos corresponden a ${estado}.`;

        const response = await fetch(`${CONFIG.AZURE_OPENAI_ENDPOINT}/openai/deployments/${CONFIG.AZURE_OPENAI_DEPLOYMENT_NAME}/chat/completions?api-version=${CONFIG.AZURE_OPENAI_API_VERSION}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'api-key': CONFIG.AZURE_OPENAI_API_KEY
            },
            body: JSON.stringify({
                messages: [
                    { 
                        role: "system", 
                        content: "Eres un analista experto en fondos públicos y desarrollo social, especializado en el análisis del FAIS. Tu objetivo es proporcionar análisis detallados y estructurados que ayuden a la toma de decisiones."
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
            throw new Error(`Error en la API: ${response.status}`);
        }

        const result = await response.json();
        return result.choices[0].message.content;
    } catch (error) {
        console.error('Error al obtener análisis de OpenAI:', error);
        return "No se pudo generar el análisis automático. Por favor, intente nuevamente.";
    }
}