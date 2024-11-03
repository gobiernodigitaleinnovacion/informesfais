class ServicioDatos {
    static async obtenerDatosEstado(estado, año, programa) {
        try {
            // Llamada API simulada
            return {
                estado,
                año,
                programa,
                datos: [
                    { mes: 'Enero', valor: Math.random() * 1000 },
                    { mes: 'Febrero', valor: Math.random() * 1000 },
                    { mes: 'Marzo', valor: Math.random() * 1000 }
                ]
            };
        } catch (error) {
            console.error('Error al obtener datos:', error);
            throw error;
        }
    }

    static exportarACSV(datos) {
        const contenidoCSV = "data:text/csv;charset=utf-8," 
            + "Mes,Valor\n"
            + datos.datos.map(fila => `${fila.mes},${fila.valor}`).join("\n");
        
        const uriCodificada = encodeURI(contenidoCSV);
        const enlace = document.createElement("a");
        enlace.setAttribute("href", uriCodificada);
        enlace.setAttribute("download", `fais_${datos.estado}_${datos.año}_${datos.programa}.csv`);
        document.body.appendChild(enlace);
        enlace.click();
        document.body.removeChild(enlace);
    }
}
