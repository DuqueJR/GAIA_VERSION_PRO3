# 🚀 GAIA CANSAT - Analizador de Datos de Vuelo

Una aplicación web moderna para analizar datos de vuelo de proyectos CANSAT con visualizaciones interactivas y tema espacial.

## ✨ Características

- **Carga de archivos CSV**: Arrastra y suelta o selecciona archivos CSV
- **Análisis automático**: Detecta automáticamente las columnas del CSV
- **Gráficas interactivas**: Genera gráficas de dispersión, línea y barras
- **Estadísticas en tiempo real**: Muestra estadísticas básicas de cada variable
- **Diseño espacial**: Tema oscuro con colores neón verde y azul
- **Responsive**: Funciona perfectamente en dispositivos móviles y desktop
- **Sin servidor**: Funciona completamente en local, sin necesidad de backend

## 🎯 Variables Soportadas

La aplicación está optimizada para datos de CANSAT con las siguientes variables:

- `Tiempo_ms` - Tiempo en milisegundos
- `Temperatura_C` - Temperatura en grados Celsius
- `Humedad_%` - Humedad relativa en porcentaje
- `Presion_hPa` - Presión atmosférica en hectopascales
- `Resistencia_kOhms` - Resistencia en kiloohmios
- `Accel_X_m_s2` - Aceleración en eje X (m/s²)
- `Accel_Y_m_s2` - Aceleración en eje Y (m/s²)
- `Accel_Z_m_s2` - Aceleración en eje Z (m/s²)
- `Gyro_X_deg_s` - Velocidad angular en eje X (°/s)
- `Gyro_Y_deg_s` - Velocidad angular en eje Y (°/s)
- `Gyro_Z_deg_s` - Velocidad angular en eje Z (°/s)
- `Roll_deg` - Ángulo de balanceo en grados
- `Pitch_deg` - Ángulo de cabeceo en grados
- `Altitud_m` - Altitud en metros

## 🚀 Cómo Ejecutar

### Opción 1: Abrir directamente
1. Coloca todos los archivos en una carpeta
2. Asegúrate de que `GAIAROCKETS.JPG` esté en la misma carpeta
3. Abre `index.html` en tu navegador web

### Opción 2: Servidor local (recomendado)
```bash
# Con Python 3
python -m http.server 8000

# Con Node.js (si tienes http-server instalado)
npx http-server

# Con PHP
php -S localhost:8000
```

Luego abre `http://localhost:8000` en tu navegador.

## 📁 Estructura de Archivos

```
GAIA_VERSION_PRO3/
├── index.html          # Estructura principal de la página
├── style.css           # Estilos del tema espacial
├── script.js           # Lógica de la aplicación
├── GAIAROCKETS.JPG     # Logo de la misión
└── README.md           # Este archivo
```

## 🎮 Cómo Usar

1. **Cargar datos**: 
   - Arrastra tu archivo CSV al área de carga
   - O haz clic en "Seleccionar Archivo"

2. **Configurar gráfica**:
   - Selecciona la variable para el eje X
   - Selecciona la variable para el eje Y
   - Elige el tipo de gráfica (dispersión, línea, barras)

3. **Generar visualización**:
   - Haz clic en "Generar Gráfica"
   - La gráfica interactiva aparecerá automáticamente

4. **Explorar datos**:
   - Revisa las estadísticas de cada variable
   - Cambia los ejes y regenera la gráfica
   - Usa las herramientas interactivas de Plotly

## 🛠️ Tecnologías Utilizadas

- **HTML5**: Estructura semántica
- **CSS3**: Diseño responsive con variables CSS
- **JavaScript ES6+**: Lógica de la aplicación
- **PapaParse**: Parsing de archivos CSV
- **Plotly.js**: Gráficas interactivas
- **Google Fonts**: Fuentes Orbitron y Roboto

## 🎨 Paleta de Colores

- **Negro primario**: `#0a0a0a`
- **Negro secundario**: `#1a1a1a`
- **Gris medio**: `#2a2a2a`
- **Gris claro**: `#666666`
- **Verde neón**: `#00ff88`
- **Azul espacial**: `#0088ff`
- **Blanco**: `#ffffff`

## 📱 Compatibilidad

- ✅ Chrome 60+
- ✅ Firefox 55+
- ✅ Safari 12+
- ✅ Edge 79+
- ✅ Dispositivos móviles

## 🔧 Personalización

Puedes modificar fácilmente:

- **Colores**: Cambia las variables CSS en `style.css`
- **Fuentes**: Modifica las fuentes en el HTML
- **Variables**: Ajusta `expectedVariables` en `script.js`
- **Estadísticas**: Personaliza `calculateStats()` en `script.js`

## 🐛 Solución de Problemas

### El logo no aparece
- Verifica que `GAIAROCKETS.JPG` esté en la misma carpeta que `index.html`

### Error al cargar CSV
- Asegúrate de que el archivo tenga formato CSV válido
- Verifica que la primera fila contenga los nombres de las columnas

### Gráfica no se genera
- Verifica que ambas variables (X e Y) estén seleccionadas
- Asegúrate de que los datos sean numéricos

## 📄 Licencia

Este proyecto está desarrollado para la misión GAIA CANSAT 2024.

---

**GAIA Rockets - Misión CANSAT 2024** 🚀
