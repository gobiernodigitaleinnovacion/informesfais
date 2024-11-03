class AnalysisService {
    static async generateAnalysis(data) {
        // Simulate analysis calculations
        const total = data.data.reduce((acc, curr) => acc + curr.value, 0);
        const average = total / data.data.length;
        
        return {
            total: total.toFixed(2),
            average: average.toFixed(2),
            trend: average > 500 ? 'Positivo' : 'Negativo'
        };
    }

    static displayResults(analysisData, chartElement, tableElement) {
        // Clear previous results
        chartElement.innerHTML = '';
        tableElement.innerHTML = '';

        // Display analysis results in table
        tableElement.innerHTML = `
            <table border="1">
                <tr>
                    <th>Métrica</th>
                    <th>Valor</th>
                </tr>
                <tr>
                    <td>Total</td>
                    <td>${analysisData.total}</td>
                </tr>
                <tr>
                    <td>Promedio</td>
                    <td>${analysisData.average}</td>
                </tr>
                <tr>
                    <td>Tendencia</td>
                    <td>${analysisData.trend}</td>
                </tr>
            </table>
        `;
    }
}
