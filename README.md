# 📦 AR 3D Viewer Hub (Web & Realidad Aumentada)

Plataforma web para alojar y visualizar modelos 3D en formatos **STL** y **GLB** mediante **Realidad Aumentada (AR)** en teléfonos **Android** e **iOS** a través del escaneo de códigos QR individuales.

Diseñado para alojarse de forma 100% gratuita y automatizada en **GitHub Pages**.

---

## 🚀 Características Principales

- **📱 Compatible con Móviles (iOS & Android):**
  - **Android:** Utiliza Google Scene Viewer / WebXR para proyectar con sombras e iluminación del entorno real.
  - **iOS (iPhone/iPad):** Compatible con Apple AR Quick Look nativo.
- **🏺 Soporte Inteligente de STL y GLB:**
  - **GLB:** Muestra texturas completas, materiales PBR y animaciones.
  - **STL:** Renderizado con **color fijo arena** (`#d2b48c` mate / arcilla cálida) y un **control deslizante de escala** táctil para ajustar las dimensiones en cm/mm antes de proyectar.
- **🔒 Panel de Gestión Protegido por PIN:**
  - Acceso privado mediante clave en el navegador (PIN por defecto: `1234`).
  - Generación instantánea de códigos QR para cada modelo subido.
  - Botón para descargar el QR en imagen **PNG de alta resolución** (ideal para imprimir en etiquetas, cajas o soportes de impresión 3D).
  - Copiado rápido de enlace directo al portapapeles.
- **🎯 Visor Aislado y Dedicado:**
  - Los usuarios que escanean el código QR acceden directamente al visor limpio y sin distracciones del modelo específico (`viewer.html?model=...`).
- **⚡ Automatización con GitHub Actions:**
  - Solo colocas tus archivos en la carpeta `models/`, haces `git push` y GitHub Actions compila el catálogo y publica la web automáticamente.

---

## 📂 Dónde colocar tus Modelos 3D

Copia o guarda tus archivos `.stl` y `.glb` dentro de la carpeta:
```
models/
  ├── mi_pieza_mecanica.stl
  ├── figura_coleccionable.glb
  └── soporte_camara.stl
```

---

## 🛠️ Cómo Probar Localmente en tu Computadora

1. Abre una terminal en la carpeta del proyecto.
2. Inicia un servidor web local (por ejemplo con Python o Node):
   ```bash
   # Con Python:
   python -m http.server 8080

   # O con Node.js:
   npx serve .
   ```
3. Abre tu navegador en: [http://localhost:8080](http://localhost:8080)
4. Ingresa el PIN por defecto: `1234`
5. Verás tus modelos con sus códigos QR listos. Puedes hacer clic en **"Abrir Visor"** para interactuar con la pieza en 3D.

---

## 🌐 Cómo Subirlo a GitHub y Activar GitHub Pages

### Paso 1: Subir tus archivos a un repositorio de GitHub
Si aún no has inicializado el repositorio Git:
```bash
git init
git add .
git commit -m "Inicializar AR Viewer con catálogo automático"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/TU_REPOSITORIO.git
git push -u origin main
```

### Paso 2: Activar GitHub Pages
1. Ve a tu repositorio en GitHub en el navegador.
2. Haz clic en **Settings** (Configuración) > pestaña **Pages** (en el menú lateral izquierdo).
3. En la sección **Build and deployment** > **Source**, selecciona:
   **GitHub Actions** *(en lugar de "Deploy from a branch")*.
4. ¡Listo! El archivo `.github/workflows/deploy.yml` que ya dejamos configurado se encargará de:
   - Indexar todos los modelos dentro de `models/`.
   - Generar `models.json`.
   - Publicar tu sitio en: `https://TU_USUARIO.github.io/TU_REPOSITORIO/`

Cada vez que agregues o borres modelos en `models/` y hagas `git push`, el sitio se actualizará solo en 1 minuto.

---

## ⚙️ Personalización (Cambiar PIN o Color)

Abre el archivo `js/config.js`:

```javascript
const AR_CONFIG = {
  appName: 'AR 3D Viewer Hub',

  // Cambia tu clave de acceso aquí:
  adminPin: '1234',

  // Color de acabado para modelos STL (arena / arcilla):
  sandColor: '#d2b48c',
  stlRoughness: 0.55,
  stlMetalness: 0.15,

  // Escala inicial:
  stlDefaultScale: 1.0,
  ...
};
```

---

## 📱 Cómo Funciona la Experiencia de Escaneo en el Celular

1. Una persona apunta la cámara de su celular al código QR impreso o en pantalla.
2. Su navegador móvil abre automáticamente la URL directa:
   `https://TU_USUARIO.github.io/TU_REPOSITORIO/viewer.html?model=mi_pieza.stl`
3. Puede interactuar con el modelo con gestos táctiles (rotar, zoom, ajustar escala si es STL).
4. Al pulsar el botón **"Ver en tu espacio (AR)"**:
   - En **Android**: Se abre la cámara de Google Scene Viewer para colocar la pieza sobre el suelo o una mesa.
   - En **iOS (iPhone)**: Se abre Apple Quick Look con seguimiento espacial y sombras realistas.
