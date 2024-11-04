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

        const response = await fetch(fullUrl, {
            method: 'GET',
            mode: 'cors',
            headers: {
                'Origin': 'https://gobiernodigitaleinnovacion.github.io',
                'Accept': 'application/json',
                'Content-Type': 'application/json'
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

        const dataNormalizada = data.map(row => ({
            ...row,
            'CICLO DEL RECURSO': Number(row['CICLO DEL RECURSO']) || 0,
            APROBADO: Number(row.APROBADO) || 0,
            EJERCIDO: Number(row.EJERCIDO) || 0,
            PAGADO: Number(row.PAGADO) || 0,
            NOMBRE_ENTIDAD: row.NOMBRE_ENTIDAD || '',
            NOMBRE_MUNICIPIO: row.NOMBRE_MUNICIPIO || row.MUNICIPIO || ''
        }));

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
        
        return matchCiclo && matchPrograma && matchEstado && matchMunicipio;
    });
    
    console.log('Datos filtrados:', filteredData.length);
    checkFiltersAndEnableButtons();
}

async function obtenerAnalisisOpenAI(data, analisis) {
    try {
        const estado = document.getElementById('estado').value;
        const esCDMX = estado === 'Ciudad de México';
        const terminoGeografico = esCDMX ? 'alcaldías' : 'municipios';
        
        const prompt = `Analiza los siguientes datos del FAIS...`; // Tu prompt actual

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