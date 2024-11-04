import { APP_CONFIG } from './config.js';
import { showError } from './ui.js';

// Configuración inicial de jsPDF
window.jsPDF = window.jspdf.jsPDF;

export class AnalyticsManager {
    static formatNumber(number) {
        return new Intl.NumberFormat('es-MX', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(number);
    }

    static analizarFinanciero(data) {
        const totales = data.reduce((acc, item) => {
            acc.aprobado += Number(item.APROBADO) || 0;
            acc.ejercido += Number(item.EJERCIDO) || 0;
            acc.pagado += Number(item.PAGADO) || 0;
            return acc;
        }, { aprobado: 0, ejercido: 0, pagado: 0 });

        return {
            totalAprobado: totales.aprobado,
            totalEjercido: totales.ejercido,
            totalPagado: totales.pagado,
            porcentajeEjercido: this.calcularPorcentaje(totales.ejercido, totales.aprobado),
            porcentajePagado: this.calcularPorcentaje(totales.pagado, totales.aprobado)
        };
    }

    static analizarFisico(data) {
        const totalProyectos = data.length;
        const sumaAvances = data.reduce((sum, item) => sum + (Number(item.PORCENTAJE) || 0), 0);
        const estatusCounts = this.contarPorPropiedad(data, 'ESTATUS');

        return {
            totalProyectos,
            promedioAvance: this.calcularPromedio(sumaAvances, totalProyectos),
            proyectosPorEstatus: estatusCounts,
            proyectosTerminados: estatusCounts['TERMINADO'] || 0,
            porcentajeTerminados: this.calcularPorcentaje(estatusCounts['TERMINADO'] || 0, totalProyectos)
        };
    }

    static analizarInversion(data) {
        return {
            porCategoria: this.agruparPorPropiedad(data, 'CATEGORIA', 'APROBADO'),
            porTipoPrograma: this.agruparPorPropiedad(data, 'TIPO_PROGRAMA_PROYECTO', 'APROBADO'),
            porClasificacion: this.agruparPorPropiedad(data, 'CLASIFICACION', 'APROBADO')
        };
    }

    static analizarEjecucion(data) {
        return {
            totalEjecutoras: this.contarUnicos(data, 'INSTITUCION_EJECUTORA'),
            totalContratistas: this.contarUnicos(data, 'CONTRATISTA'),
            totalConvocantes: this.contarUnicos(data, 'CONVOCANTE')
        };
    }

    static analizarCobertura(data, estado, esEstatal) {
        const esCDMX = estado === 'Ciudad de México';
        const terminoGeografico = esCDMX ? 'alcaldías' : 'municipios';
        
        const localidades = this.contarUnicos(data, 'LOCALIDAD');
        const municipios = this.contarUnicos(data, 'NOMBRE_MUNICIPIO');
        
        const concentracion = this.calcularConcentracionInversion(
            data, 
            esEstatal ? 'NOMBRE_MUNICIPIO' : 'LOCALIDAD',
            'APROBADO'
        );

        return {
            totalLocalidades: localidades,
            distribucionGeografica: esEstatal ? 
                `${municipios} ${terminoGeografico}` : 
                `${localidades} localidades`,
            ...concentracion
        };
    }

    static analizarBeneficiarios(data) {
        const totales = data.reduce((acc, item) => {
            acc.mujeres += Number(item.MUJERES) || 0;
            acc.hombres += Number(item.HOMBRES) || 0;
            return acc;
        }, { mujeres: 0, hombres: 0 });

        const total = totales.mujeres + totales.hombres;

        return {
            totalMujeres: totales.mujeres,
            totalHombres: totales.hombres,
            ratioMujeres: this.calcularPorcentaje(totales.mujeres, total)
        };
    }

    static analizarTemporal(data) {
        const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
        
        const { inicios, terminos, tiempo } = this.procesarFechasProyectos(data);
        
        return {
            promedioTiempoEjecucion: tiempo.proyectosValidos > 0 ? 
                (tiempo.total / tiempo.proyectosValidos).toFixed(1) : "0",
            mesMasInicios: meses[inicios.indexOf(Math.max(...inicios))],
            mesMasTerminos: meses[terminos.indexOf(Math.max(...terminos))]
        };
    }

    static async generarInforme(data, filtros) {
        try {
            const doc = new window.jsPDF();
            const analisis = this.realizarAnalisisCompleto(data, filtros);
            
            await this.generarPDF(doc, analisis, filtros);
            
            const nombreArchivo = this.generarNombreArchivo(filtros);
            doc.save(nombreArchivo);
            
            return true;
        } catch (error) {
            console.error('Error en generación de informe:', error);
            showError('Error al generar el informe PDF');
            throw error;
        }
    }

    static calcularPorcentaje(valor, total) {
        return total > 0 ? ((valor / total) * 100).toFixed(2) : "0.00";
    }

    static calcularPromedio(suma, total) {
        return total > 0 ? (suma / total).toFixed(2) : "0.00";
    }

    static contarPorPropiedad(data, propiedad) {
        return data.reduce((acc, item) => {
            const valor = item[propiedad] || 'NO ESPECIFICADO';
            acc[valor] = (acc[valor] || 0) + 1;
            return acc;
        }, {});
    }

    static contarUnicos(data, propiedad) {
        return new Set(data.map(item => item[propiedad])).size;
    }

    static agruparPorPropiedad(data, propiedad, valorPropiedad) {
        return data.reduce((acc, item) => {
            const key = item[propiedad] || 'NO ESPECIFICADO';
            acc[key] = (acc[key] || 0) + (Number(item[valorPropiedad]) || 0);
            return acc;
        }, {});
    }

    static calcularConcentracionInversion(data, propiedad, valorPropiedad) {
        const concentracion = this.agruparPorPropiedad(data, propiedad, valorPropiedad);
        const valores = Object.values(concentracion);
        const total = valores.reduce((a, b) => a + b, 0);
        const maximo = Math.max(...valores, 0);

        return {
            concentracionInversion: concentracion,
            porcentajeConcentracion: this.calcularPorcentaje(maximo, total)
        };
    }

    static procesarFechasProyectos(data) {
        const inicios = Array(12).fill(0);
        const terminos = Array(12).fill(0);
        let tiempoTotal = 0;
        let proyectosValidos = 0;

        data.forEach(item => {
            if (item.FECHA_INICIO && item.FECHA_TERMINO) {
                const [inicio, termino] = this.procesarParFechas(item.FECHA_INICIO, item.FECHA_TERMINO);
                
                if (inicio && termino) {
                    inicios[inicio.getMonth()]++;
                    terminos[termino.getMonth()]++;
                    
                    const diferenciaMeses = this.calcularDiferenciaMeses(inicio, termino);
                    if (diferenciaMeses >= 0) {
                        tiempoTotal += diferenciaMeses;
                        proyectosValidos++;
                    }
                }
            }
        });

        return {
            inicios,
            terminos,
            tiempo: { total: tiempoTotal, proyectosValidos }
        };
    }

    static procesarParFechas(fechaInicio, fechaTermino) {
        const inicio = new Date(fechaInicio);
        const termino = new Date(fechaTermino);
        
        return [
            !isNaN(inicio.getTime()) ? inicio : null,
            !isNaN(termino.getTime()) ? termino : null
        ];
    }

    static calcularDiferenciaMeses(inicio, termino) {
        return (termino.getFullYear() - inicio.getFullYear()) * 12 + 
               (termino.getMonth() - inicio.getMonth());
    }

    static realizarAnalisisCompleto(data, filtros) {
        return {
            financiero: this.analizarFinanciero(data),
            fisico: this.analizarFisico(data),
            inversion: this.analizarInversion(data),
            ejecucion: this.analizarEjecucion(data),
            cobertura: this.analizarCobertura(data, filtros.estado, filtros.programa === 'I003-FAIS Entidades'),
            beneficiarios: this.analizarBeneficiarios(data),
            temporal: this.analizarTemporal(data)
        };
    }

    static generarNombreArchivo(filtros) {
        const { estado, ciclo, municipio } = filtros;
        return `FAIS_${estado.replace(/\s+/g, '_')}_${ciclo}${municipio ? '_' + municipio.replace(/\s+/g, '_') : ''}.pdf`;
    }

    static async generarPDF(doc, analisis, filtros) {
        try {
            const { estado, ciclo, programa, municipio } = filtros;
            const esCDMX = estado === 'Ciudad de México';
            const terminoGeografico = esCDMX ? 'Alcaldía' : 'Municipio';

            doc.setFont("helvetica");
            let yPos = 20;

            this.agregarEncabezado(doc, {
                estado,
                ciclo,
                programa,
                municipio,
                terminoGeografico,
                yPos
            });
            yPos = 50;

            yPos = this.agregarSeccionFinanciera(doc, analisis.financiero, yPos);
            yPos += 10;

            yPos = this.agregarSeccionFisica(doc, analisis.fisico, yPos);
            yPos += 10;

            yPos = this.agregarSeccionCobertura(doc, analisis.cobertura, yPos, terminoGeografico);
            yPos += 10;

            if (yPos > 250) {
                doc.addPage();
                yPos = 20;
            }

            yPos = this.agregarSeccionEjecucion(doc, analisis.ejecucion, yPos);
            yPos += 10;

            yPos = this.agregarSeccionBeneficiarios(doc, analisis.beneficiarios, yPos);
            yPos += 10;

            yPos = this.agregarSeccionTemporal(doc, analisis.temporal, yPos);

            doc.addPage();
            yPos = 20;
            yPos = this.agregarSeccionInversion(doc, analisis.inversion, yPos);

            const totalPages = doc.internal.getNumberOfPages();
            for (let i = 1; i <= totalPages; i++) {
                doc.setPage(i);
                this.agregarPiePagina(doc, i, totalPages);
            }

        } catch (error) {
            console.error('Error en generación de PDF:', error);
            throw new Error('Error al generar el PDF: ' + error.message);
        }
    }

    static agregarEncabezado(doc, { estado, ciclo, programa, municipio, terminoGeografico, yPos }) {
        doc.setFontSize(16);
        doc.text(`Análisis FAIS - ${estado}`, 105, yPos, { align: 'center' });
        
        doc.setFontSize(12);
        doc.text(`Ciclo: ${ciclo} | Programa: ${programa}`, 105, yPos + 10, { align: 'center' });
        
        if (municipio) {
            doc.text(`${terminoGeografico}: ${municipio}`, 105, yPos + 20, { align: 'center' });
        }
    }

    static agregarSeccionFinanciera(doc, financiero, yPos) {
        doc.setFontSize(14);
        doc.text("Información Financiera", 20, yPos);
        yPos += 10;
        
        doc.setFontSize(10);
        const items = [
            `Total Aprobado: $${this.formatNumber(financiero.totalAprobado)}`,
            `Total Ejercido: $${this.formatNumber(financiero.totalEjercido)}`,
            `Total Pagado: $${this.formatNumber(financiero.totalPagado)}`,
            `Porcentaje Ejercido: ${financiero.porcentajeEjercido}%`,
            `Porcentaje Pagado: ${financiero.porcentajePagado}%`
        ];

        items.forEach(item => {
            doc.text(item, 25, yPos);
            yPos += 7;
        });

        return yPos;
    }

    static agregarSeccionFisica(doc, fisico, yPos) {
        doc.setFontSize(14);
        doc.text("Información Física", 20, yPos);
        yPos += 10;
        
        doc.setFontSize(10);
        const items = [
            `Total Proyectos: ${fisico.totalProyectos}`,
            `Promedio de Avance: ${fisico.promedioAvance}%`,
            `Proyectos Terminados: ${fisico.proyectosTerminados}`,
            `Porcentaje Terminados: ${fisico.porcentajeTerminados}%`
        ];

        items.forEach(item => {
            doc.text(item, 25, yPos);
            yPos += 7;
        });

        return yPos;
    }

    static agregarSeccionCobertura(doc, cobertura, yPos, terminoGeografico) {
        doc.setFontSize(14);
        doc.text("Cobertura", 20, yPos);
        yPos += 10;
        
        doc.setFontSize(10);
        const items = [
            `Total Localidades: ${cobertura.totalLocalidades}`,
            `Distribución: ${cobertura.distribucionGeografica}`,
            `Concentración de Inversión: ${cobertura.porcentajeConcentracion}%`
        ];

        items.forEach(item => {
            doc.text(item, 25, yPos);
            yPos += 7;
        });

        return yPos;
    }

    static agregarSeccionEjecucion(doc, ejecucion, yPos) {
        doc.setFontSize(14);
        doc.text("Ejecución", 20, yPos);
        yPos += 10;
        
        doc.setFontSize(10);
        const items = [
            `Total Instituciones Ejecutoras: ${ejecucion.totalEjecutoras}`,
            `Total Contratistas: ${ejecucion.totalContratistas}`,
            `Total Convocantes: ${ejecucion.totalConvocantes}`
        ];

        items.forEach(item => {
            doc.text(item, 25, yPos);
            yPos += 7;
        });

        return yPos;
    }

    static agregarSeccionBeneficiarios(doc, beneficiarios, yPos) {
        doc.setFontSize(14);
        doc.text("Beneficiarios", 20, yPos);
        yPos += 10;
        
        doc.setFontSize(10);
        const items = [
            `Total Mujeres: ${this.formatNumber(beneficiarios.totalMujeres)}`,
            `Total Hombres: ${this.formatNumber(beneficiarios.totalHombres)}`,
            `Ratio Mujeres: ${beneficiarios.ratioMujeres}%`
        ];

        items.forEach(item => {
            doc.text(item, 25, yPos);
            yPos += 7;
        });

        return yPos;
    }

    static agregarSeccionTemporal(doc, temporal, yPos) {
        doc.setFontSize(14);
        doc.text("Información Temporal", 20, yPos);
        yPos += 10;
        
        doc.setFontSize(10);
        const items = [
            `Promedio Tiempo Ejecución: ${temporal.promedioTiempoEjecucion} meses`,
            `Mes con más Inicios: ${temporal.mesMasInicios}`,
            `Mes con más Términos: ${temporal.mesMasTerminos}`
        ];

        items.forEach(item => {
            doc.text(item, 25, yPos);
            yPos += 7;
        });

        return yPos;
    }

    static agregarSeccionInversion(doc, inversion, yPos) {
        doc.setFontSize(14);
        doc.text("Distribución de la Inversión", 20, yPos);
        yPos += 10;
        
        const agregarSubseccion = (titulo, datos, yStart) => {
            doc.setFontSize(12);
            doc.text(titulo, 25, yStart);
            yStart += 7;
            
            doc.setFontSize(10);
            Object.entries(datos).forEach(([categoria, monto]) => {
                const texto = `${categoria}: $${this.formatNumber(monto)}`;
                doc.text(texto, 30, yStart);
                yStart += 7;
            });
            
            return yStart + 5;
        };

        yPos = agregarSubseccion("Por Categoría", inversion.porCategoria, yPos);
        yPos = agregarSubseccion("Por Tipo de Programa", inversion.porTipoPrograma, yPos);
        yPos = agregarSubseccion("Por Clasificación", inversion.porClasificacion, yPos);

        return yPos;
    }

    static agregarPiePagina(doc, numeroPagina, totalPaginas) {
        const fecha = new Date().toLocaleDateString('es-MX');
        doc.setFontSize(8);
        doc.text(
            `Página ${numeroPagina} de ${totalPaginas}`,
            20,
            280
        );
        doc.text(
            `Gobierno Digital e Innovación © ${new Date().getFullYear()} - Generado el ${fecha}`,
            105,
            280,
            { align: 'center' }
        );
    }
}

export default AnalyticsManager;