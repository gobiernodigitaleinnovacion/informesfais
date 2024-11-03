# Sistema de Análisis FAIS

Sistema web para el análisis del Fondo de Aportaciones para la Infraestructura Social (FAIS).

## Configuración de GitHub Pages (Paso a Paso)

1. Ve a tu repositorio en GitHub: https://github.com/gobiernodigitaleinnovacion/informesfais

2. En la parte superior del repositorio, verás varias pestañas (Code, Issues, Pull requests, etc.). 
   Haz clic en "Settings" (tiene un ícono de engranaje ⚙️)

3. En el menú del lado izquierdo, busca y haz clic en "Pages" 
   (está en la sección "Code and automation")

4. En la página de GitHub Pages, verás una sección llamada "Build and deployment"

5. Dentro de esta sección, busca "Source". Aquí necesitas:
   - Hacer clic en el botón que dice "Deploy from a branch"
   - En el selector de rama (Branch), elige "master"
   - En el selector de carpeta, elige "/docs"
   - Haz clic en el botón "Save"

6. Espera unos minutos mientras GitHub construye tu sitio
   (verás un mensaje que dice "Your site is being built")

7. Cuando esté listo, verás un mensaje con la URL de tu sitio:
   https://gobiernodigitaleinnovacion.github.io/informesfais/

## Características

- Selección de estado, año y programa
- Generación de análisis estadísticos
- Visualización de datos en tablas
- Exportación de datos a CSV

## Uso

1. Selecciona un estado de la lista desplegable
2. Elige el año de análisis
3. Selecciona el programa (FISE o FISMDF)
4. Haz clic en "Generar Análisis" para ver los resultados
5. Utiliza el botón "Exportar Datos" para descargar los datos en formato CSV

## Instalación Local

1. Clonar el repositorio:
   ```bash
   git clone https://github.com/gobiernodigitaleinnovacion/informesfais.git
   ```

2. Navegar al directorio del proyecto:
   ```bash
   cd informesfais
   ```

3. Abrir `docs/index.html` en tu navegador web preferido

## Contacto

Para más información o soporte:
- Email: juanheriberto.rosas@gobiernodigitaleinnovacion.com
- Web: www.gobiernodigitaleinnovacion.com

## Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles.
