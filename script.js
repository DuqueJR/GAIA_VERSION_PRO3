/**
 * GAIA CANSAT - Analizador de Datos de Vuelo
 * Script principal para el análisis de datos CSV y generación de gráficas
 */

// Variables globales para almacenar los datos del CSV
let csvData = null;
let csvHeaders = [];
let currentChart = null;

// Variables esperadas del proyecto CANSAT
const expectedVariables = [
    "Tiempo_ms",
    "Temperatura_C",
    "Humedad_%",
    "Presion_hPa",
    "Resistencia_kOhms",
    "Accel_X_m_s2",
    "Accel_Y_m_s2",
    "Accel_Z_m_s2",
    "Gyro_X_deg_s",
    "Gyro_Y_deg_s",
    "Gyro_Z_deg_s",
    "Roll_deg",
    "Pitch_deg",
    "Altitud_m"
];

// Mapeo de unidades para mostrar en las estadísticas
const variableUnits = {
    "Tiempo_ms": "ms",
    "Temperatura_C": "°C",
    "Humedad_%": "%",
    "Presion_hPa": "hPa",
    "Resistencia_kOhms": "kΩ",
    "Accel_X_m_s2": "m/s²",
    "Accel_Y_m_s2": "m/s²",
    "Accel_Z_m_s2": "m/s²",
    "Gyro_X_deg_s": "°/s",
    "Gyro_Y_deg_s": "°/s",
    "Gyro_Z_deg_s": "°/s",
    "Roll_deg": "°",
    "Pitch_deg": "°",
    "Altitud_m": "m"
};

// Paleta de verdes para las gráficas
const greenPalette = {
    neon: '#00ff88',      // Verde neón principal
    bright: '#00cc66',    // Verde brillante
    medium: '#00aa55',    // Verde medio
    dark: '#008844',      // Verde oscuro
    light: '#33ff99'      // Verde claro
};

// Inicialización cuando se carga la página
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

/**
 * Inicializa la aplicación y configura los event listeners
 */
function initializeApp() {
    console.log('🚀 Inicializando GAIA CANSAT Data Analyzer...');
    
    // Configurar elementos del DOM
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('csvFile');
    const uploadBtn = document.getElementById('uploadBtn');
    const generateBtn = document.getElementById('generateBtn');
    
    // Event listeners para la carga de archivos
    uploadArea.addEventListener('click', () => fileInput.click());
    uploadArea.addEventListener('dragover', handleDragOver);
    uploadArea.addEventListener('dragleave', handleDragLeave);
    uploadArea.addEventListener('drop', handleDrop);
    uploadBtn.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', handleFileSelect);
    
    // Event listener para generar gráfica
    generateBtn.addEventListener('click', generateChart);
    
    // Event listeners para cambios en los selects
    document.getElementById('xAxis').addEventListener('change', validateChartOptions);
    document.getElementById('yAxis').addEventListener('change', validateChartOptions);
    
    // Event listener para estadísticas
    document.getElementById('statsBtn').addEventListener('click', toggleStats);
    
    console.log('✅ Aplicación inicializada correctamente');
}

/**
 * Maneja el evento de arrastrar archivo sobre el área de carga
 */
function handleDragOver(e) {
    e.preventDefault();
    e.currentTarget.classList.add('dragover');
}

/**
 * Maneja el evento de quitar el archivo del área de carga
 */
function handleDragLeave(e) {
    e.preventDefault();
    e.currentTarget.classList.remove('dragover');
}

/**
 * Maneja el evento de soltar archivo en el área de carga
 */
function handleDrop(e) {
    e.preventDefault();
    e.currentTarget.classList.remove('dragover');
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        processFile(files[0]);
    }
}

/**
 * Maneja la selección de archivo desde el input
 */
function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) {
        processFile(file);
    }
}

/**
 * Procesa el archivo CSV seleccionado
 */
function processFile(file) {
    console.log('📁 Procesando archivo:', file.name);
    
    // Validar que sea un archivo CSV
    if (!file.name.toLowerCase().endsWith('.csv')) {
        alert('❌ Por favor selecciona un archivo CSV válido');
        return;
    }
    
    // Mostrar información del archivo
    showFileInfo(file);
    
    // Parsear el CSV usando PapaParse
    Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: function(results) {
            if (results.errors.length > 0) {
                console.warn('⚠️ Errores en el parsing:', results.errors);
            }
            
            csvData = results.data;
            csvHeaders = results.meta.fields;
            
            console.log('📊 Datos cargados:', csvData.length, 'filas');
            console.log('📋 Columnas encontradas:', csvHeaders);
            
            // Validar variables esperadas
            validateCSVStructure();
            
            // Configurar los selects con las columnas disponibles
            populateAxisSelects();
            
            // Mostrar secciones adicionales
            showChartSection();
            showStatsSection();
        },
        error: function(error) {
            console.error('❌ Error al procesar el CSV:', error);
            alert('❌ Error al procesar el archivo CSV. Verifica que el formato sea correcto.');
        }
    });
}

/**
 * Muestra la información del archivo cargado
 */
function showFileInfo(file) {
    const fileInfo = document.getElementById('fileInfo');
    const fileName = document.getElementById('fileName');
    const fileStats = document.getElementById('fileStats');
    
    fileName.textContent = `📄 ${file.name}`;
    fileStats.textContent = `Tamaño: ${(file.size / 1024).toFixed(2)} KB`;
    
    fileInfo.style.display = 'block';
}

/**
 * Valida que el CSV contenga las variables esperadas del proyecto CANSAT
 */
function validateCSVStructure() {
    const missingVariables = expectedVariables.filter(variable => 
        !csvHeaders.some(header => header.toLowerCase().includes(variable.toLowerCase()))
    );
    
    if (missingVariables.length > 0) {
        console.warn('⚠️ Variables esperadas no encontradas:', missingVariables);
        // No bloqueamos la carga, pero informamos al usuario
        const message = `⚠️ Algunas variables esperadas no se encontraron: ${missingVariables.join(', ')}`;
        console.log(message);
    } else {
        console.log('✅ Todas las variables esperadas encontradas');
    }
}

/**
 * Pobla los selects de ejes con las columnas disponibles
 */
function populateAxisSelects() {
    const xAxisSelect = document.getElementById('xAxis');
    const yAxisSelect = document.getElementById('yAxis');
    
    // Limpiar opciones existentes
    xAxisSelect.innerHTML = '<option value="">Selecciona una variable...</option>';
    yAxisSelect.innerHTML = '<option value="">Selecciona una variable...</option>';
    
    // Agregar opciones para cada columna
    csvHeaders.forEach(header => {
        const optionX = document.createElement('option');
        const optionY = document.createElement('option');
        
        optionX.value = header;
        optionX.textContent = header;
        
        optionY.value = header;
        optionY.textContent = header;
        
        xAxisSelect.appendChild(optionX);
        yAxisSelect.appendChild(optionY);
    });
    
    // Seleccionar valores por defecto si están disponibles
    if (csvHeaders.includes('Tiempo_ms')) {
        xAxisSelect.value = 'Tiempo_ms';
    }
    
    // Validar opciones
    validateChartOptions();
}

/**
 * Valida que las opciones de gráfica sean válidas
 */
function validateChartOptions() {
    const xAxis = document.getElementById('xAxis').value;
    const yAxis = document.getElementById('yAxis').value;
    const generateBtn = document.getElementById('generateBtn');
    
    const isValid = xAxis && yAxis && xAxis !== yAxis;
    generateBtn.disabled = !isValid;
    
    if (isValid) {
        generateBtn.style.opacity = '1';
    } else {
        generateBtn.style.opacity = '0.5';
    }
}

/**
 * Genera la gráfica con los datos seleccionados
 */
function generateChart() {
    const xAxis = document.getElementById('xAxis').value;
    const yAxis = document.getElementById('yAxis').value;
    const chartType = document.getElementById('chartType').value;
    
    if (!xAxis || !yAxis) {
        alert('❌ Por favor selecciona ambos ejes para generar la gráfica');
        return;
    }
    
    console.log('📈 Generando gráfica:', { xAxis, yAxis, chartType });
    
    // Preparar datos para Plotly
    const xData = csvData.map(row => parseFloat(row[xAxis])).filter(val => !isNaN(val));
    const yData = csvData.map(row => parseFloat(row[yAxis])).filter(val => !isNaN(val));
    
    // Configurar el tipo de gráfica
    let trace;
    switch (chartType) {
        case 'scatter':
            trace = {
                x: xData,
                y: yData,
                mode: 'markers',
                type: 'scatter',
                marker: {
                    color: greenPalette.neon,
                    size: 12,
                    opacity: 0.8,
                    line: {
                        color: greenPalette.dark,
                        width: 1
                    }
                },
                name: `${yAxis} vs ${xAxis}`
            };
            break;
        case 'line':
            trace = {
                x: xData,
                y: yData,
                mode: 'lines+markers',
                type: 'scatter',
                line: {
                    color: greenPalette.neon,
                    width: 3,
                    shape: 'spline',
                    smoothing: 0.3
                },
                marker: {
                    color: greenPalette.bright,
                    size: 10,
                    opacity: 0.9,
                    line: {
                        color: greenPalette.dark,
                        width: 1
                    }
                },
                name: `${yAxis} vs ${xAxis}`
            };
            break;
        case 'bar':
            trace = {
                x: xData,
                y: yData,
                type: 'bar',
                marker: {
                    color: greenPalette.bright,
                    opacity: 0.9,
                    line: {
                        color: greenPalette.neon,
                        width: 1
                    }
                },
                name: `${yAxis} vs ${xAxis}`
            };
            break;
    }
    
    // Configuración del layout
    const layout = {
        title: {
            text: `${yAxis} vs ${xAxis}`,
            font: {
                family: 'Orbitron, monospace',
                size: 20,
                color: '#00ff88'
            },
            x: 0.5,
            xanchor: 'center'
        },
        xaxis: {
            title: {
                text: xAxis,
                font: {
                    family: 'Roboto, sans-serif',
                    size: 16,
                    color: '#ffffff'
                }
            },
            gridcolor: '#2a2a2a',
            color: '#ffffff',
            tickfont: {
                color: '#ffffff',
                size: 12
            },
            showline: true,
            linecolor: '#00ff88',
            linewidth: 2,
            zeroline: false
        },
        yaxis: {
            title: {
                text: yAxis,
                font: {
                    family: 'Roboto, sans-serif',
                    size: 16,
                    color: '#ffffff'
                }
            },
            gridcolor: '#2a2a2a',
            color: '#ffffff',
            tickfont: {
                color: '#ffffff',
                size: 12
            },
            showline: true,
            linecolor: '#00ff88',
            linewidth: 2,
            zeroline: false
        },
        plot_bgcolor: '#0a0a0a',
        paper_bgcolor: '#0a0a0a',
        font: {
            family: 'Roboto, sans-serif',
            color: '#ffffff'
        },
        margin: {
            l: 60,
            r: 20,
            t: 80,
            b: 40
        },
        hovermode: 'closest',
        showlegend: true,
        legend: {
            x: 0.5,
            y: 1.005,
            xanchor: 'center',
            yanchor: 'bottom',
            orientation: 'h',
            bgcolor: 'rgba(0,0,0,0.5)',
            bordercolor: '#00ff88',
            borderwidth: 1,
            font: {
                color: '#ffffff',
                size: 12
            }
        }
    };
    
    // Configuración de opciones
    const config = {
        responsive: true,
        displayModeBar: true,
        modeBarButtonsToRemove: ['pan2d', 'lasso2d', 'select2d'],
        displaylogo: false
    };
    
    // Generar la gráfica
    Plotly.newPlot('chart', [trace], layout, config);
    
    // Mostrar sección de visualización
    showVisualizationSection();
    
    // Actualizar descripción
    updateChartDescription(xAxis, yAxis, chartType, xData.length);
    
    console.log('✅ Gráfica generada exitosamente');
}

/**
 * Muestra la sección de configuración de gráfica
 */
function showChartSection() {
    document.getElementById('chartSection').style.display = 'block';
}

/**
 * Muestra la sección de visualización
 */
function showVisualizationSection() {
    document.getElementById('visualizationSection').style.display = 'block';
}

/**
 * Muestra la sección de estadísticas
 */
function showStatsSection() {
    document.getElementById('statsSection').style.display = 'block';
}

/**
 * Actualiza la descripción de la gráfica
 */
function updateChartDescription(xAxis, yAxis, chartType, dataPoints) {
    const description = document.getElementById('chartDescription');
    const chartTypeNames = {
        'scatter': 'Dispersión',
        'line': 'Línea',
        'bar': 'Barras'
    };
    
    description.textContent = 
        `Gráfica de ${chartTypeNames[chartType]} mostrando ${dataPoints} puntos de datos. ` +
        `Eje X: ${xAxis}, Eje Y: ${yAxis}`;
}

/**
 * Alterna la visualización de las estadísticas
 */
function toggleStats() {
    const statsBtn = document.getElementById('statsBtn');
    const statsContent = document.getElementById('statsContent');
    
    if (statsContent.style.display === 'none') {
        // Mostrar estadísticas
        generateStatistics();
        statsContent.style.display = 'block';
        statsBtn.textContent = 'Ocultar Estadísticas';
        statsBtn.classList.add('active');
    } else {
        // Ocultar estadísticas
        statsContent.style.display = 'none';
        statsBtn.textContent = 'Mostrar Estadísticas';
        statsBtn.classList.remove('active');
    }
}

/**
 * Genera estadísticas básicas para cada variable
 */
function generateStatistics() {
    const statsGrid = document.getElementById('statsGrid');
    statsGrid.innerHTML = '';
    
    csvHeaders.forEach(header => {
        const values = csvData.map(row => parseFloat(row[header])).filter(val => !isNaN(val));
        
        if (values.length > 0) {
            const stats = calculateStats(values);
            const unit = variableUnits[header] || '';
            
            const statCard = document.createElement('div');
            statCard.className = 'stat-card';
            statCard.innerHTML = `
                <div class="stat-title">${header}</div>
                <div class="stat-value">${stats.mean.toFixed(2)}</div>
                <div class="stat-unit">Promedio ${unit}</div>
                <div style="margin-top: 10px;">
                    <div style="font-size: 0.9rem; color: #666;">Min: ${stats.min.toFixed(2)} ${unit}</div>
                    <div style="font-size: 0.9rem; color: #666;">Max: ${stats.max.toFixed(2)} ${unit}</div>
                    <div style="font-size: 0.9rem; color: #666;">Puntos: ${values.length}</div>
                </div>
            `;
            
            statsGrid.appendChild(statCard);
        }
    });
}

/**
 * Calcula estadísticas básicas para un array de valores
 */
function calculateStats(values) {
    const sorted = [...values].sort((a, b) => a - b);
    const sum = values.reduce((acc, val) => acc + val, 0);
    const mean = sum / values.length;
    
    // Calcular desviación estándar
    const variance = values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);
    
    return {
        min: sorted[0],
        max: sorted[sorted.length - 1],
        mean: mean,
        median: sorted[Math.floor(sorted.length / 2)],
        stdDev: stdDev
    };
}

/**
 * Función de utilidad para formatear números
 */
function formatNumber(num, decimals = 2) {
    return parseFloat(num).toFixed(decimals);
}

/**
 * Función de utilidad para validar datos numéricos
 */
function isValidNumber(value) {
    return !isNaN(parseFloat(value)) && isFinite(value);
}

// Exportar funciones para uso global si es necesario
window.GAIACANSAT = {
    generateChart,
    processFile,
    calculateStats,
    formatNumber
};

console.log('🚀 GAIA CANSAT Data Analyzer cargado correctamente');
