class DataService {
    static async fetchStateData(state, year, program) {
        try {
            // Simulated API call
            return {
                state,
                year,
                program,
                data: [
                    { month: 'Enero', value: Math.random() * 1000 },
                    { month: 'Febrero', value: Math.random() * 1000 },
                    { month: 'Marzo', value: Math.random() * 1000 }
                ]
            };
        } catch (error) {
            console.error('Error fetching data:', error);
            throw error;
        }
    }

    static exportToCSV(data) {
        const csvContent = "data:text/csv;charset=utf-8," 
            + "Mes,Valor\n"
            + data.data.map(row => `${row.month},${row.value}`).join("\n");
        
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `fais_${data.state}_${data.year}_${data.program}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}
