class ServicioAnalisis {
    static async generarAnalisis(datos) {
        // Simulación de cálculos de análisis
        const total = datos.datos.reduce((acc, curr) => acc + curr.valor, 0);
        const promedio = total / datos.datos.length;
        
        return {
            total: total.toFixed(2),
            promedio: promedio.toFixed(2),
            tendencia: promedio > 500 ? 'Positiva' : 'Negativa'
        };
    }

    static mostrarResultados(datosAnalisis, elementoGrafica, elementoTabla) {
        // Limpiar resultados anteriores
        elementoGrafica.innerHTML = '';
        elementoTabla.innerHTML = '';

        // Mostrar resultados del análisis en tabla
        elementoTabla.innerHTML = `
            <table border="1">
                <tr>
                    <th>Métrica</th>
                    <th>Valor</th>
                </tr>
                <tr>
                    <td>Total</td>
                    <td>${datosAnalisis.total}</td>
                </tr>
                <tr>
                    <td>Promedio</td>
                    <td>${datosAnalisis.promedio}</td>
                </tr>
                <tr>
                    <td>Tendencia</td>
                    <td>${datosAnalisis.tendencia}</td>
                </tr>
            </table>
        `;
    }
}
