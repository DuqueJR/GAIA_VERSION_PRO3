/**
 * GAIA CANSAT - Analizador de Datos de Vuelo
 * Script principal para el análisis de datos CSV y generación de gráficas
 */

// Variables globales para almacenar los datos del CSV
let csvData = null;
let csvHeaders = [];
let currentChart = null;

// Variables para limpieza de datos
let originalData = null;
let cleanedData = null;
let currentData = null;
let isDataCleaned = false;

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
    
    // Event listener para análisis de calidad del aire
    document.getElementById('airQualityBtn').addEventListener('click', toggleAirQualityAnalysis);
    
    // Event listener para actualizar análisis de calidad del aire
    document.getElementById('updateQualityBtn').addEventListener('click', updateAirQualityAnalysis);
    
    // Event listeners para limpieza de datos
    document.getElementById('cleanDataBtn').addEventListener('click', toggleDataCleaning);
    document.getElementById('proceedBtn').addEventListener('click', proceedWithCleanedData);
    document.getElementById('resetBtn').addEventListener('click', resetToOriginalData);
    
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
            
    // Guardar datos originales para limpieza
    originalData = [...results.data];
    currentData = results.data;
    
            // Mostrar sección de limpieza de datos
            showDataCleaningSection();
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
 * Muestra la sección de limpieza de datos
 */
function showDataCleaningSection() {
    const cleaningSection = document.getElementById('dataCleaningSection');
    cleaningSection.style.display = 'block';
    cleaningSection.scrollIntoView({ behavior: 'smooth' });
}

/**
 * Alterna la visualización del panel de limpieza de datos
 */
function toggleDataCleaning() {
    const cleaningContent = document.getElementById('cleaningContent');
    const cleanBtn = document.getElementById('cleanDataBtn');
    
    if (cleaningContent.style.display === 'none' || cleaningContent.style.display === '') {
        cleaningContent.style.display = 'block';
        cleanBtn.classList.add('active');
        cleanBtn.textContent = 'Ocultar Limpieza';
        
        // Ejecutar limpieza automáticamente
        cleanData();
    } else {
        cleaningContent.style.display = 'none';
        cleanBtn.classList.remove('active');
        cleanBtn.textContent = 'Limpiar Datos';
    }
}

/**
 * Realiza la limpieza de datos según los criterios especificados
 */
function cleanData() {
    if (!originalData) {
        alert('No hay datos para limpiar');
        return;
    }

    const baseAltitude = parseFloat(document.getElementById('baseAltitude').value) || 571;
    
    // Crear una copia de los datos originales
    let data = [...originalData];
    const originalCount = data.length;
    
    // Arrays para almacenar detalles de eliminación
    const duplicateDetails = [];
    const outlierDetails = [];
    
    // 1. Eliminar duplicados por tiempo (mantener el primero)
    const timeMap = new Map();
    const duplicatesRemoved = [];
    
    data = data.filter((row, index) => {
        const time = row['Tiempo_ms'];
        if (timeMap.has(time)) {
            duplicatesRemoved.push({
                index: index,
                time: time,
                reason: 'Duplicado de tiempo'
            });
            return false; // Duplicado, eliminar
        }
        timeMap.set(time, true);
        return true;
    });
    
    // 2. Filtrar por rangos físicos
    const physicalRanges = {
        'Temperatura_C': [-50, 85],
        'Presion_hPa': [300, 1100],
        'Humedad_%': [0, 100],
        'Accel_X_m_s2': [-160, 160],
        'Accel_Y_m_s2': [-160, 160],
        'Accel_Z_m_s2': [-160, 160],
        'Gyro_X_deg_s': [-2000, 2000],
        'Gyro_Y_deg_s': [-2000, 2000],
        'Gyro_Z_deg_s': [-2000, 2000],
        'Altitud_m': [-500, 100000]
    };
    
    let outliersRemoved = [];
    data = data.filter((row, index) => {
        for (const [column, range] of Object.entries(physicalRanges)) {
            if (row[column] !== undefined && row[column] !== null) {
                const value = parseFloat(row[column]);
                if (isNaN(value) || value < range[0] || value > range[1]) {
                    outliersRemoved.push({
                        index: index,
                        column: column,
                        value: value,
                        minRange: range[0],
                        maxRange: range[1],
                        reason: isNaN(value) ? 'Valor no numérico' : 
                               (value < range[0] ? `Valor muy bajo (${value} < ${range[0]})` : 
                                `Valor muy alto (${value} > ${range[1]})`)
                    });
                    return false;
                }
            }
        }
        return true;
    });
    
    // 3. Ajustar altitud restando la altura base
    data.forEach(row => {
        if (row['Altitud_m'] !== undefined && row['Altitud_m'] !== null) {
            row['Altitud_m'] = parseFloat(row['Altitud_m']) - baseAltitude;
        }
    });
    
    const cleanedCount = data.length;
    const totalRemoved = originalCount - cleanedCount;
    
    // Guardar datos limpios
    cleanedData = data;
    isDataCleaned = true;
    
    // Mostrar resumen de limpieza
    displayCleaningSummary(originalCount, cleanedCount, duplicatesRemoved.length, outliersRemoved.length, baseAltitude);
    
    // Mostrar detalles de limpieza
    displayCleaningDetails(duplicatesRemoved, outliersRemoved, baseAltitude);
}

/**
 * Muestra el resumen de limpieza de datos
 */
function displayCleaningSummary(originalCount, cleanedCount, duplicatesRemoved, outliersRemoved, baseAltitude) {
    const summaryContainer = document.getElementById('cleaningSummary');
    
    const summaryHTML = `
        <div class="summary-title">Resumen de Limpieza</div>
        <div class="summary-stats">
            <div class="summary-stat">
                <div class="stat-value">${originalCount}</div>
                <div class="stat-label">Datos Originales</div>
            </div>
            <div class="summary-stat">
                <div class="stat-value">${cleanedCount}</div>
                <div class="stat-label">Datos Limpios</div>
            </div>
            <div class="summary-stat">
                <div class="stat-value">${originalCount - cleanedCount}</div>
                <div class="stat-label">Total Eliminados</div>
            </div>
            <div class="summary-stat">
                <div class="stat-value">${((cleanedCount / originalCount) * 100).toFixed(1)}%</div>
                <div class="stat-label">Datos Válidos</div>
            </div>
        </div>
    `;
    
    summaryContainer.innerHTML = summaryHTML;
}

/**
 * Muestra los detalles de qué datos fueron eliminados
 */
function displayCleaningDetails(duplicatesRemoved, outliersRemoved, baseAltitude) {
    const detailsContainer = document.getElementById('cleaningDetails');
    
    // Crear HTML para duplicados
    let duplicatesHTML = '';
    if (duplicatesRemoved.length > 0) {
        duplicatesHTML = `
            <div class="detail-card duplicates">
                <div class="detail-card-title">Duplicados Eliminados (${duplicatesRemoved.length})</div>
                <div class="detail-card-description">Registros con el mismo tiempo (Tiempo_ms)</div>
                <div class="detail-card-count">${duplicatesRemoved.length}</div>
                <div class="detail-list">
                    ${duplicatesRemoved.slice(0, 10).map(dup => 
                        `<div class="detail-item">Fila ${dup.index}: Tiempo ${dup.time}ms - ${dup.reason}</div>`
                    ).join('')}
                    ${duplicatesRemoved.length > 10 ? `<div class="detail-item">... y ${duplicatesRemoved.length - 10} más</div>` : ''}
                </div>
            </div>
        `;
    }
    
    // Crear HTML para valores fuera de rango
    let outliersHTML = '';
    if (outliersRemoved.length > 0) {
        outliersHTML = `
            <div class="detail-card outliers">
                <div class="detail-card-title">Valores Fuera de Rango (${outliersRemoved.length})</div>
                <div class="detail-card-description">Datos que exceden límites físicos realistas</div>
                <div class="detail-card-count">${outliersRemoved.length}</div>
                <div class="detail-list">
                    ${outliersRemoved.slice(0, 10).map(outlier => 
                        `<div class="detail-item">Fila ${outlier.index}: ${outlier.column} = ${outlier.value} - ${outlier.reason}</div>`
                    ).join('')}
                    ${outliersRemoved.length > 10 ? `<div class="detail-item">... y ${outliersRemoved.length - 10} más</div>` : ''}
                </div>
            </div>
        `;
    }
    
    const detailsHTML = `
        <div class="details-title">Detalles de Limpieza</div>
        <div class="details-grid">
            ${duplicatesHTML}
            ${outliersHTML}
            <div class="detail-card adjusted">
                <div class="detail-card-title">Altitud Ajustada</div>
                <div class="detail-card-description">Altura base restada: ${baseAltitude}m</div>
                <div class="detail-card-count">✓</div>
                <div class="detail-item">Todas las alturas ajustadas correctamente</div>
            </div>
        </div>
    `;
    
    detailsContainer.innerHTML = detailsHTML;
}

/**
 * Procede con los datos limpios para el análisis
 */
function proceedWithCleanedData() {
    if (!cleanedData) {
        alert('No hay datos limpios disponibles');
        return;
    }
    
    // Usar los datos limpios
    currentData = cleanedData;
    csvData = cleanedData;
    
    // Ocultar sección de limpieza
    document.getElementById('dataCleaningSection').style.display = 'none';
    
    // Mostrar secciones de análisis
    showChartSection();
    showStatsSection();
    showAirQualitySection();
    
    // Actualizar dropdowns
    updateColumnDropdowns();
    
    alert('Datos limpios cargados exitosamente. Puede proceder con el análisis.');
}

/**
 * Resetea a los datos originales
 */
function resetToOriginalData() {
    if (!originalData) {
        alert('No hay datos originales disponibles');
        return;
    }
    
    // Usar los datos originales
    currentData = originalData;
    csvData = originalData;
    isDataCleaned = false;
    
    // Ocultar sección de limpieza
    document.getElementById('dataCleaningSection').style.display = 'none';
    
    // Mostrar secciones de análisis
    showChartSection();
    showStatsSection();
    showAirQualitySection();
    
    // Actualizar dropdowns
    updateColumnDropdowns();
    
    alert('Datos originales restaurados. Puede proceder con el análisis.');
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
 * Muestra la sección de análisis de calidad del aire
 */
function showAirQualitySection() {
    document.getElementById('airQualitySection').style.display = 'block';
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

// Métricas de calidad del aire basadas en resistencia de gases
const airQualityMetrics = {
    excellent: { min: 300, max: Infinity, label: 'Excelente', color: '#00ff88' },
    good: { min: 200, max: 300, label: 'Buena', color: '#00ccff' },
    moderate: { min: 100, max: 200, label: 'Moderada', color: '#ffaa00' },
    poor: { min: 50, max: 100, label: 'Mala', color: '#ff6600' },
    veryPoor: { min: 0, max: 50, label: 'Muy mala', color: '#ff0000' }
};

/**
 * Alterna la visualización del análisis de calidad del aire
 */
function toggleAirQualityAnalysis() {
    const airQualityBtn = document.getElementById('airQualityBtn');
    const airQualityContent = document.getElementById('airQualityContent');
    
    if (airQualityContent.style.display === 'none') {
        // Mostrar análisis de calidad del aire
        generateAirQualityAnalysis();
        airQualityContent.style.display = 'block';
        airQualityBtn.textContent = 'Ocultar Análisis';
        airQualityBtn.classList.add('active');
    } else {
        // Ocultar análisis de calidad del aire
        airQualityContent.style.display = 'none';
        airQualityBtn.textContent = 'Analizar Calidad del Aire';
        airQualityBtn.classList.remove('active');
    }
}

/**
 * Actualiza el análisis de calidad del aire con el intervalo seleccionado
 */
function updateAirQualityAnalysis() {
    if (!csvData || !csvHeaders.includes('Resistencia_kOhms')) {
        alert('❌ No se encontró la variable Resistencia_kOhms en los datos');
        return;
    }
    
    console.log('🔄 Actualizando análisis de calidad del aire...');
    
    // Obtener datos de resistencia
    const resistanceData = csvData.map(row => parseFloat(row['Resistencia_kOhms'])).filter(val => !isNaN(val));
    
    // Procesar datos según el intervalo seleccionado
    const interval = document.getElementById('altitudeInterval').value;
    const processedData = processAltitudeData(resistanceData, interval);
    
    // Clasificar datos por calidad del aire
    const qualityAnalysis = classifyAirQuality(processedData.map(d => d.resistance));
    
    // Generar resumen
    generateQualityOverview(qualityAnalysis);
    
    // Generar gráfica de perfil vertical
    generateQualityChart(resistanceData);
    
    // Generar métricas detalladas
    generateQualityMetrics(qualityAnalysis, processedData.map(d => d.resistance));
}

/**
 * Genera el análisis completo de calidad del aire
 */
function generateAirQualityAnalysis() {
    if (!csvData || !csvHeaders.includes('Resistencia_kOhms')) {
        alert('❌ No se encontró la variable Resistencia_kOhms en los datos');
        return;
    }
    
    console.log('🌬️ Generando análisis de calidad del aire...');
    
    // Obtener datos de resistencia
    const resistanceData = csvData.map(row => parseFloat(row['Resistencia_kOhms'])).filter(val => !isNaN(val));
    
    // Clasificar datos por calidad del aire
    const qualityAnalysis = classifyAirQuality(resistanceData);
    
    // Generar resumen
    generateQualityOverview(qualityAnalysis);
    
    // Generar gráfica de perfil vertical
    generateQualityChart(resistanceData);
    
    // Generar métricas detalladas
    generateQualityMetrics(qualityAnalysis, resistanceData);
}

/**
 * Clasifica los datos de resistencia según la calidad del aire
 */
function classifyAirQuality(resistanceData) {
    const classification = {
        excellent: [],
        good: [],
        moderate: [],
        poor: [],
        veryPoor: []
    };
    
    resistanceData.forEach(value => {
        if (value >= 300) {
            classification.excellent.push(value);
        } else if (value >= 200) {
            classification.good.push(value);
        } else if (value >= 100) {
            classification.moderate.push(value);
        } else if (value >= 50) {
            classification.poor.push(value);
        } else {
            classification.veryPoor.push(value);
        }
    });
    
    return classification;
}

/**
 * Genera el resumen de calidad del aire
 */
function generateQualityOverview(qualityAnalysis) {
    const overview = document.getElementById('qualityOverview');
    const totalData = Object.values(qualityAnalysis).reduce((sum, arr) => sum + arr.length, 0);
    
    overview.innerHTML = '';
    
    Object.keys(airQualityMetrics).forEach(key => {
        const metric = airQualityMetrics[key];
        const data = qualityAnalysis[key];
        const percentage = totalData > 0 ? ((data.length / totalData) * 100).toFixed(1) : 0;
        
        const card = document.createElement('div');
        card.className = `quality-card ${key}`;
        card.innerHTML = `
            <div class="quality-title">${metric.label}</div>
            <div class="quality-value">${data.length}</div>
            <div class="quality-percentage">${percentage}% del vuelo</div>
        `;
        
        overview.appendChild(card);
    });
}

/**
 * Genera la gráfica de perfil vertical de calidad del aire
 */
function generateQualityChart(resistanceData) {
    const interval = document.getElementById('altitudeInterval').value;
    const processedData = processAltitudeData(resistanceData, interval);
    
    // Crear colores individuales para cada punto según su calidad
    const colors = processedData.map(point => {
        if (point.resistance >= 300) return '#00ff88';      // Excelente - Verde neón brillante
        if (point.resistance >= 200) return '#00ccff';      // Buena - Azul cian muy distinguible
        if (point.resistance >= 100) return '#ffaa00';     // Moderada - Naranja
        if (point.resistance >= 50) return '#ff6600';       // Mala - Naranja oscuro
        return '#ff0000';                                    // Muy mala - Rojo
    });
    
    // Crear texto de hover con información detallada
    const hoverText = processedData.map(point => {
        let quality = '';
        if (point.resistance >= 300) quality = 'Excelente';
        else if (point.resistance >= 200) quality = 'Buena';
        else if (point.resistance >= 100) quality = 'Moderada';
        else if (point.resistance >= 50) quality = 'Mala';
        else quality = 'Muy mala';
        
        return `Altitud: ${point.altitude.toFixed(1)}m<br>Resistencia: ${point.resistance.toFixed(2)}kΩ<br>Calidad: ${quality}`;
    });
    
    // Crear una sola traza con todos los puntos coloreados individualmente
    const trace = {
        x: processedData.map(d => d.altitude),
        y: processedData.map(d => d.resistance),
        mode: 'markers',
        type: 'scatter',
        name: 'Calidad del Aire',
        marker: {
            color: colors,
            size: 12,
            opacity: 0.8,
            line: {
                color: '#ffffff',
                width: 1
            }
        },
        hovertemplate: '%{text}<extra></extra>',
        text: hoverText
    };
    
    const layout = {
        title: {
            text: `Perfil Vertical de Calidad del Aire ${interval === 'all' ? '(Todas las lecturas)' : `(Promedio cada ${interval}m)`}`,
            font: {
                family: 'Orbitron, monospace',
                size: 18,
                color: '#00ff88'
            },
            x: 0.5,
            xanchor: 'center'
        },
        xaxis: {
            title: {
                text: 'Altitud (m)',
                font: {
                    family: 'Roboto, sans-serif',
                    size: 14,
                    color: '#ffffff'
                }
            },
            gridcolor: '#2a2a2a',
            color: '#ffffff',
            tickfont: { color: '#ffffff' },
            showline: true,
            linecolor: '#00ff88',
            linewidth: 2
        },
        yaxis: {
            title: {
                text: 'Resistencia (kΩ)',
                font: {
                    family: 'Roboto, sans-serif',
                    size: 14,
                    color: '#ffffff'
                }
            },
            gridcolor: '#2a2a2a',
            color: '#ffffff',
            tickfont: { color: '#ffffff' },
            showline: true,
            linecolor: '#00ff88',
            linewidth: 2
        },
        plot_bgcolor: '#0a0a0a',
        paper_bgcolor: '#0a0a0a',
        font: { family: 'Roboto, sans-serif', color: '#ffffff' },
        margin: { l: 60, r: 20, t: 100, b: 60 },
        hovermode: 'closest',
        showlegend: true,
        legend: {
            x: 0.5,
            y: 1.01,
            xanchor: 'center',
            yanchor: 'bottom',
            orientation: 'h',
            bgcolor: 'rgba(0,0,0,0.5)',
            bordercolor: '#00ff88',
            borderwidth: 1,
            font: { color: '#ffffff', size: 12 }
        },
        annotations: [
            {
                x: 0.02,
                y: 0.98,
                xref: 'paper',
                yref: 'paper',
                text: '🟢 Excelente (>300kΩ) 🔵 Buena (200-300kΩ) 🟠 Moderada (100-200kΩ) 🔶 Mala (50-100kΩ) 🔴 Muy mala (<50kΩ)',
                showarrow: false,
                font: { color: '#ffffff', size: 10 },
                bgcolor: 'rgba(0,0,0,0.7)',
                bordercolor: '#00ff88',
                borderwidth: 1,
                borderpad: 4
            }
        ]
    };
    
    const config = {
        responsive: true,
        displayModeBar: true,
        modeBarButtonsToRemove: ['pan2d', 'lasso2d', 'select2d'],
        displaylogo: false
    };
    
    Plotly.newPlot('qualityChart', [trace], layout, config);
}

/**
 * Procesa los datos de altitud según el intervalo seleccionado
 */
function processAltitudeData(resistanceData, interval) {
    if (interval === 'all') {
        // Usar todas las lecturas
        const altitudeData = csvHeaders.includes('Altitud_m') 
            ? csvData.map(row => parseFloat(row['Altitud_m'])).filter(val => !isNaN(val))
            : Array(resistanceData.length).fill(0);
        
        return resistanceData.map((resistance, index) => ({
            altitude: altitudeData[index] || index,
            resistance: resistance
        }));
    } else {
        // Calcular promedios por intervalos de altitud
        const intervalSize = parseInt(interval);
        const altitudeData = csvHeaders.includes('Altitud_m') 
            ? csvData.map(row => parseFloat(row['Altitud_m'])).filter(val => !isNaN(val))
            : Array(resistanceData.length).fill(0);
        
        // Crear grupos por intervalos de altitud
        const groups = {};
        resistanceData.forEach((resistance, index) => {
            const altitude = altitudeData[index] || index;
            const groupKey = Math.floor(altitude / intervalSize) * intervalSize;
            
            if (!groups[groupKey]) {
                groups[groupKey] = [];
            }
            groups[groupKey].push({ altitude, resistance });
        });
        
        // Calcular promedios para cada grupo
        const processedData = [];
        Object.keys(groups).forEach(groupKey => {
            const group = groups[groupKey];
            const avgAltitude = group.reduce((sum, point) => sum + point.altitude, 0) / group.length;
            const avgResistance = group.reduce((sum, point) => sum + point.resistance, 0) / group.length;
            
            processedData.push({
                altitude: avgAltitude,
                resistance: avgResistance,
                count: group.length
            });
        });
        
        return processedData.sort((a, b) => a.altitude - b.altitude);
    }
}

/**
 * Genera métricas detalladas de calidad del aire
 */
function generateQualityMetrics(qualityAnalysis, resistanceData) {
    const metrics = document.getElementById('qualityMetrics');
    const totalData = resistanceData.length;
    
    // Calcular estadísticas generales
    const avgResistance = resistanceData.reduce((sum, val) => sum + val, 0) / totalData;
    const maxResistance = Math.max(...resistanceData);
    const minResistance = Math.min(...resistanceData);
    
    // Determinar calidad predominante
    const predominantQuality = Object.keys(qualityAnalysis).reduce((a, b) => 
        qualityAnalysis[a].length > qualityAnalysis[b].length ? a : b
    );
    
    metrics.innerHTML = `
        <div class="quality-metric-card">
            <div class="quality-metric-title">Resistencia Promedio</div>
            <div class="quality-metric-value">${avgResistance.toFixed(2)} kΩ</div>
            <div class="quality-metric-description">Valor promedio durante el vuelo</div>
        </div>
        <div class="quality-metric-card">
            <div class="quality-metric-title">Resistencia Máxima</div>
            <div class="quality-metric-value">${maxResistance.toFixed(2)} kΩ</div>
            <div class="quality-metric-description">Mejor calidad registrada</div>
        </div>
        <div class="quality-metric-card">
            <div class="quality-metric-title">Resistencia Mínima</div>
            <div class="quality-metric-value">${minResistance.toFixed(2)} kΩ</div>
            <div class="quality-metric-description">Peor calidad registrada</div>
        </div>
        <div class="quality-metric-card">
            <div class="quality-metric-title">Calidad Predominante</div>
            <div class="quality-metric-value">${airQualityMetrics[predominantQuality].label}</div>
            <div class="quality-metric-description">Durante ${((qualityAnalysis[predominantQuality].length / totalData) * 100).toFixed(1)}% del vuelo</div>
        </div>
    `;
}

console.log('🚀 GAIA CANSAT Data Analyzer cargado correctamente');
