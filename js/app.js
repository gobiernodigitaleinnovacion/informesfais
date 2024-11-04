import { dataManager } from './dataManager.js';
import { UIManager } from './ui.js';
import { AnalyticsManager } from './analytics.js';
import { APP_CONFIG } from './config.js';

let uiManager;

export async function initializeApp() {
    try {
        console.log('Inicializando aplicación FAIS...');
        
        // Verificar que las dependencias externas estén cargadas
        if (!window.XLSX || !window.jsPDF) {
            throw new Error('Librerías externas no cargadas correctamente');
        }

        // Inicializar los manejadores
        uiManager = new UIManager();
        
        // Configurar event listeners globales
        setupGlobalErrorHandling();
        
        console.log('Aplicación inicializada correctamente');
        
        // Ocultar mensaje de carga si existe
        const loadingElement = document.getElementById('loadingMessage');
        if (loadingElement) {
            loadingElement.style.display = 'none';
        }

        // Mostrar contenedor de filtros
        const filtersContainer = document.getElementById('filtersContainer');
        if (filtersContainer) {
            filtersContainer.style.display = 'grid';
        }

    } catch (error) {
        console.error('Error durante la inicialización:', error);
        showError('Error al inicializar la aplicación: ' + error.message);
        throw error;
    }
}

function setupGlobalErrorHandling() {
    window.onerror = function(msg, url, lineNo, columnNo, error) {
        console.error('Error global:', { msg, url, lineNo, columnNo, error });
        showError('Se produjo un error inesperado. Por favor, recarga la página.');
        return false;
    };

    window.addEventListener('unhandledrejection', function(event) {
        console.error('Promesa no manejada:', event.reason);
        showError('Error de conexión. Por favor, verifica tu conexión a internet.');
    });
}

function showError(message) {
    const errorElement = document.getElementById('errorMessage');
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
    }
}

// Asegurar que la aplicación se inicialice cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp().catch(error => {
        console.error('Error al inicializar:', error);
        showError('No se pudo inicializar la aplicación');
    });
}