document.addEventListener('DOMContentLoaded', () => {
    const stateSelect = document.getElementById('stateSelect');
    const yearSelect = document.getElementById('yearSelect');
    const programSelect = document.getElementById('programSelect');
    const analyzeBtn = document.getElementById('analyzeBtn');
    const exportBtn = document.getElementById('exportBtn');
    const chartElement = document.getElementById('chart');
    const tableElement = document.getElementById('table');

    let currentData = null;

    // Populate selects
    CONFIG.STATES.forEach(state => {
        const option = document.createElement('option');
        option.value = state;
        option.textContent = state;
        stateSelect.appendChild(option);
    });

    CONFIG.YEARS.forEach(year => {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        yearSelect.appendChild(option);
    });

    CONFIG.PROGRAMS.forEach(program => {
        const option = document.createElement('option');
        option.value = program;
        option.textContent = program;
        programSelect.appendChild(option);
    });

    // Event listeners
    analyzeBtn.addEventListener('click', async () => {
        const state = stateSelect.value;
        const year = yearSelect.value;
        const program = programSelect.value;

        if (!state || !year || !program) {
            alert('Por favor seleccione todos los campos');
            return;
        }

        try {
            currentData = await DataService.fetchStateData(state, year, program);
            const analysis = await AnalysisService.generateAnalysis(currentData);
            AnalysisService.displayResults(analysis, chartElement, tableElement);
        } catch (error) {
            console.error('Error:', error);
            alert('Error al generar el análisis');
        }
    });

    exportBtn.addEventListener('click', () => {
        if (!currentData) {
            alert('Primero debe generar un análisis');
            return;
        }
        DataService.exportToCSV(currentData);
    });
});
