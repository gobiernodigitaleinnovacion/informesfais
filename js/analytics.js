function formatNumber(number) {
    return new Intl.NumberFormat('es-MX', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(number);
}

function analizarFinanciero(data) {
    const totalAprobado = data.reduce((sum, item) => sum + (parseFloat(item.APROBADO) || 0), 0);
    const totalEjercido = data.reduce((sum, item) => sum + (parseFloat(item.EJERCIDO) || 0), 0);
    const totalPagado = data.reduce((sum, item) => sum + (parseFloat(item.PAGADO) || 0), 0);
    
    return {
        totalAprobado,
        totalEjercido,
        totalPagado,
        porcentajeEjercido: totalAprobado > 0 ? ((totalEjercido / totalAprobado) * 100).toFixed(2) : "0.00",
        porcentajePagado: totalAprobado > 0 ? ((totalPagado / totalAprobado) * 100).toFixed(2) : "0.00"
    };
}

function analizarFisico(data) {
    const resumen = {
        totalProyectos: data.length,
        promedioAvance: data.length > 0 ? 
            (data.reduce((sum, item) => sum + (parseFloat(item.PORCENTAJE) || 0), 0) / data.length).toFixed(2) : 
            "0.00",
        proyectosPorEstatus: data.reduce((acc, item) => {
            const estatus = item.ESTATUS || 'NO ESPECIFICADO';
            acc[estatus] = (acc[estatus] || 0) + 1;
            return acc;
        }, {})
    };
    
    resumen.proyectosTerminados = resumen.proyectosPorEstatus['TERMINADO'] || 0;
    resumen.porcentajeTerminados = resumen.totalProyectos > 0 ? 
        ((resumen.proyectosTerminados / resumen.totalProyectos) * 100).toFixed(2) : 
        "0.00";
    
    return resumen;
}

function analizarInversion(data) {
    const analisis = {
        porCategoria: {},
        porTipoPrograma: {},
        porClasificacion: {}
    };

    data.forEach(item => {
        const monto = parseFloat(item.APROBADO) || 0;
        const categoria = item.CATEGORIA || 'NO ESPECIFICADA';
        const tipoPrograma = item.TIPO_PROGRAMA_PROYECTO || 'NO ESPECIFICADO';
        const clasificacion = item.CLASIFICACION || 'NO ESPECIFICADA';
        
        analisis.porCategoria[categoria] = (analisis.porCategoria[categoria] || 0) + monto;
        analisis.porTipoPrograma[tipoPrograma] = (analisis.porTipoPrograma[tipoPrograma] || 0) + monto;
        analisis.porClasificacion[clasificacion] = (analisis.porClasificacion[clasificacion] || 0) + monto;
    });

    return analisis;
}

function analizarEjecucion(data) {
    return {
        totalEjecutoras: new Set(data.map(item => item.INSTITUCION_EJECUTORA)).size,
        totalContratistas: new Set(data.map(item => item.CONTRATISTA)).size,
        totalConvocantes: new Set(data.map(item => item.CONVOCANTE)).size
    };
}

function analizarCobertura(data, esEstatal) {
    const estado = document.getElementById('estado').value;
    const esCDMX = estado === 'Ciudad de México';
    const terminoGeografico = esCDMX ? 'alcaldías' : 'municipios';
    
    const resultado = {
        totalLocalidades: new Set(data.map(item => item.LOCALIDAD)).size,
        distribucionGeografica: esEstatal ? 
            `${new Set(data.map(item => item.NOMBRE_MUNICIPIO)).size} ${terminoGeografico}` :
            `${new Set(data.map(item => item.LOCALIDAD)).size} localidades`,
        concentracionInversion: data.reduce((acc, item) => {
            const key = esEstatal ? item.NOMBRE_MUNICIPIO : item.LOCALIDAD;
            acc[key] = (acc[key] || 0) + (Number(item.APROBADO) || 0);
            return acc;
        }, {})
    };
    
    const totalInversion = Object.values(resultado.concentracionInversion).reduce((a, b) => a + b, 0);
    const maxInversion = Math.max(...Object.values(resultado.concentracionInversion), 0);
    resultado.porcentajeConcentracion = totalInversion > 0 ? 
        ((maxInversion / totalInversion) * 100).toFixed(2) : "0.00";
    
    return resultado;
}

function analizarBeneficiarios(data) {
    const totalMujeres = data.reduce((sum, item) => sum + (parseFloat(item.MUJERES) || 0), 0);
    const totalHombres = data.reduce((sum, item) => sum + (parseFloat(item.HOMBRES) || 0), 0);
    const total = totalMujeres + totalHombres;

    return {
        totalMujeres,
        totalHombres,
        ratioMujeres: total > 0 ? ((totalMujeres / total) * 100).toFixed(2) : "0.00"
    };
}

function analizarTemporal(data) {
    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                   'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    
    const iniciosPorMes = Array(12).fill(0);
    const terminosPorMes = Array(12).fill(0);
    let tiempoTotal = 0;
    let proyectosValidos = 0;

    data.forEach(item => {
        if (item.FECHA_INICIO && item.FECHA_TERMINO) {
            const inicio = new Date(item.FECHA_INICIO);
            const termino = new Date(item.FECHA_TERMINO);
            
            if (!isNaN(inicio.getTime()) && !isNaN(termino.getTime())) {
                const mesInicio = inicio.getMonth();
                const mesTermino = termino.getMonth();
                
                iniciosPorMes[mesInicio]++;
                terminosPorMes[mesTermino]++;
                
                const diferenciaMeses = 
                    (termino.getFullYear() - inicio.getFullYear()) * 12 + 
                    (termino.getMonth() - inicio.getMonth());
                
                if (diferenciaMeses >= 0) {
                    tiempoTotal += diferenciaMeses;
                    proyectosValidos++;
                }
            }
        }
    });

    const mesMaxInicios = iniciosPorMes.indexOf(Math.max(...iniciosPorMes));
    const mesMaxTerminos = terminosPorMes.indexOf(Math.max(...terminosPorMes));

    return {
        promedioTiempoEjecucion: proyectosValidos > 0 ? (tiempoTotal / proyectosValidos).toFixed(1) : "0",
        mesMasInicios: meses[mesMaxInicios],
        mesMasTerminos: meses[mesMaxTerminos]
    };
}