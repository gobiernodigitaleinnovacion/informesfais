document.addEventListener('DOMContentLoaded', () => {
    const selectorEstado = document.getElementById('stateSelect');
    const selectorAño = document.getElementById('yearSelect');
    const selectorPrograma = document.getElementById('programSelect');
    const botonAnalizar = document.getElementById('analyzeBtn');
    const botonExportar = document.getElementById('exportBtn');
    const elementoGrafica = document.getElementById('chart');
    const elementoTabla = document.getElementById('table');

    let datosActuales = null;

    // Poblar selectores
    CONFIG.ESTADOS.forEach(estado => {
        const opcion = document.createElement('option');
        opcion.value = estado;
        opcion.textContent = estado;
        selectorEstado.appendChild(opcion);
    });

    CONFIG.AÑOS.forEach(año => {
        const opcion = document.createElement('option');
        opcion.value = año;
        opcion.textContent = año;
        selectorAño.appendChild(opcion);
    });

    CONFIG.PROGRAMAS.forEach(programa => {
        const opcion = document.createElement('option');
        opcion.value = programa;
        opcion.textContent = programa;
        selectorPrograma.appendChild(opcion);
    });

    // Event listeners
    botonAnalizar.addEventListener('click', async () => {
        const estado = selectorEstado.value;
        const año = selectorAño.value;
        const programa = selectorPrograma.value;

        if (!estado || !año || !programa) {
            alert('Por favor seleccione todos los campos');
            return;
        }

        try {
            datosActuales = await ServicioDatos.obtenerDatosEstado(estado, año, programa);
            const analisis = await ServicioAnalisis.generarAnalisis(datosActuales);
            ServicioAnalisis.mostrarResultados(analisis, elementoGrafica, elementoTabla);
        } catch (error) {
            console.error('Error:', error);
            alert('Error al generar el análisis');
        }
    });

    botonExportar.addEventListener('click', () => {
        if (!datosActuales) {
            alert('Primero debe generar un análisis');
            return;
        }
        ServicioDatos.exportarACSV(datosActuales);
    });
});
