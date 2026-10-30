/**
 * Visor 3D y Realidad Aumentada (AR Viewer)
 * Renderizado unificado de alto rendimiento mediante Google Model-Viewer
 * Compatible con modelos GLB y STL pre-procesados
 * Soporte garantizado para Android (Google Scene Viewer / S25 Ultra) e iOS (Apple Quick Look)
 */

document.addEventListener('DOMContentLoaded', () => {
  initViewer();
});

// Mapa canónico de nombres limpios sin espacios (para máxima compatibilidad con ARCore y Scene Viewer)
const MODEL_ALIASES = {
  // Cute Wob
  'cute-wob.glb': 'cute-wob.glb',
  'cute-wob': 'cute-wob.glb',
  'Cute Wob Fatima Nevarez.glb': 'cute-wob.glb',
  'Cute Wob Fatima Nevarez': 'cute-wob.glb',

  // Nessie
  'nessie.glb': 'nessie.glb',
  'nessie': 'nessie.glb',
  'Nessie - Kenia Burgos.glb': 'nessie.glb',
  'Nessie - Kenia Burgos': 'nessie.glb',

  // Mobiliario Mariana Celiz
  'mariana-celiz.glb': 'mariana-celiz.glb',
  'mariana-celiz.stl': 'mariana-celiz.glb',
  'mariana-celiz': 'mariana-celiz.glb',
  'Mobiliario Mariana Celiz.glb': 'mariana-celiz.glb',
  'Mobiliario Mariana Celiz.stl': 'mariana-celiz.glb',
  'Mobiliario Mariana Celiz': 'mariana-celiz.glb',

  // Mobiliario Adrian Cespedes
  'adrian-cespedes.glb': 'adrian-cespedes.glb',
  'adrian-cespedes.stl': 'adrian-cespedes.glb',
  'adrian-cespedes': 'adrian-cespedes.glb',
  'Mobililiario 3d Adrian Cespedes.glb': 'adrian-cespedes.glb',
  'Mobililiario 3d Adrian Cespedes.stl': 'adrian-cespedes.glb',
  'Mobililiario 3d Adrian Cespedes': 'adrian-cespedes.glb'
};

const MODEL_TITLES = {
  'cute-wob.glb': 'Cute Wob - Fátima Nevárez',
  'nessie.glb': 'Nessie - Kenia Burgos',
  'mariana-celiz.glb': 'Mobiliario - Mariana Celiz',
  'adrian-cespedes.glb': 'Mobiliario 3D - Adrián Céspedes'
};

function initViewer() {
  const urlParams = new URLSearchParams(window.location.search);
  const rawModelParam = urlParams.get('model');

  const loaderOverlay = document.getElementById('loader-overlay');
  const loaderText = document.getElementById('loader-text');
  const titleEl = document.getElementById('model-display-name');
  const badgeEl = document.getElementById('model-format-badge');
  const modelViewer = document.getElementById('ar-model-viewer');
  const stlPanel = document.getElementById('stl-panel');
  const btnLaunchAr = document.getElementById('btn-launch-ar');

  if (!rawModelParam) {
    loaderText.innerHTML = `
      <p style="color: var(--danger); margin-bottom: 1rem;">No se indicó ningún modelo 3D.</p>
      <a href="index.html" class="btn btn-secondary btn-sm">Volver al Panel</a>
    `;
    return;
  }

  // Resolver nombre de archivo canónico limpio sin espacios
  const resolvedGlb = MODEL_ALIASES[rawModelParam] || rawModelParam.replace(/\.stl$/i, '.glb');
  const cleanTitle = MODEL_TITLES[resolvedGlb] || rawModelParam.replace(/\.[^/.]+$/, "").replace(/[-_]+/g, ' ');

  titleEl.textContent = cleanTitle;
  document.title = `${cleanTitle} - AR Viewer`;

  const isStl = rawModelParam.toLowerCase().endsWith('.stl') || 
                resolvedGlb === 'mariana-celiz.glb' || 
                resolvedGlb === 'adrian-cespedes.glb';

  // Modal QR para cuando se abre desde una computadora
  setupDesktopQrModal(rawModelParam);

  if (isStl) {
    badgeEl.textContent = 'STL • Arena';
    badgeEl.className = 'badge badge-stl';
    if (stlPanel) stlPanel.style.display = 'flex';

    // Control deslizante de escala física nativo para STL
    const scaleSlider = document.getElementById('scale-slider');
    const scaleLabel = document.getElementById('scale-value-label');
    if (scaleSlider && scaleLabel) {
      scaleSlider.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        modelViewer.scale = `${val} ${val} ${val}`;
        const currentCm = Math.round(65 * val);
        scaleLabel.textContent = `${val.toFixed(1)}x (~${currentCm} cm)`;
      });
    }

    // Controles de Orientación 3D interactivos en tiempo real para STL
    let rotX = 0, rotY = 0, rotZ = 0;
    const rotLabel = document.getElementById('current-rotation-label');
    const rotStatus = document.getElementById('orientation-save-status');
    const updateOrientation = () => {
      modelViewer.orientation = `${rotX}deg ${rotY}deg ${rotZ}deg`;
      if (rotLabel) rotLabel.textContent = `${rotX}°, ${rotY}°, ${rotZ}°`;
    };

    document.getElementById('btn-rot-x')?.addEventListener('click', () => {
      rotX = (rotX + 90) % 360;
      updateOrientation();
    });
    document.getElementById('btn-rot-y')?.addEventListener('click', () => {
      rotY = (rotY + 90) % 360;
      updateOrientation();
    });
    document.getElementById('btn-rot-z')?.addEventListener('click', () => {
      rotZ = (rotZ + 90) % 360;
      updateOrientation();
    });
    document.getElementById('btn-rot-reset')?.addEventListener('click', () => {
      rotX = 0; rotY = 0; rotZ = 0;
      updateOrientation();
    });

    document.getElementById('btn-save-orientation')?.addEventListener('click', async () => {
      if (rotStatus) rotStatus.textContent = 'Guardando orientación...';
      try {
        const resp = await fetch('/api/save-orientation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ filename: resolvedGlb, rotX, rotY, rotZ })
        });
        const resJson = await resp.json();
        if (resJson.success) {
          if (rotStatus) rotStatus.textContent = '✅ Guardado para AR';
          rotX = 0; rotY = 0; rotZ = 0;
          updateOrientation();
          modelViewer.src = absoluteModelUrl + '?v=' + Date.now();
        } else {
          if (rotStatus) rotStatus.textContent = '❌ Error al guardar';
        }
      } catch (e) {
        console.error(e);
        if (rotStatus) rotStatus.textContent = '❌ Error de conexión';
      }
    });
  } else {
    badgeEl.textContent = 'GLB';
    badgeEl.className = 'badge badge-glb';
    if (stlPanel) stlPanel.style.display = 'none';
  }

  // Ruta absoluta limpia al archivo GLB (sin espacios, 100% compatible con Scene Viewer y ARCore)
  const modelPath = 'models/' + resolvedGlb;
  const absoluteModelUrl = new URL(modelPath, window.location.href).toString();
  modelViewer.src = absoluteModelUrl;

  // Evento cuando el modelo termina de cargar en memoria
  modelViewer.addEventListener('load', () => {
    loaderOverlay.classList.add('hidden');
  });

  // Evento si ocurre un error de descarga
  modelViewer.addEventListener('error', (e) => {
    console.error('Error cargando modelo:', e);
    loaderText.innerHTML = `
      <p style="color: var(--danger); margin-bottom: 1rem;">No se pudo cargar el archivo 3D.</p>
      <a href="index.html" class="btn btn-secondary btn-sm">Volver al Panel</a>
    `;
  });

  // Detección de plataforma
  const isAndroid = /Android/i.test(navigator.userAgent);
  const isSamsung = /SamsungBrowser/i.test(navigator.userAgent);
  const samsungBanner = document.getElementById('samsung-browser-banner');
  const btnOpenChrome = document.getElementById('btn-open-chrome');
  const androidNativeBar = document.getElementById('android-native-bar');
  const btnAndroidIntent = document.getElementById('btn-android-intent');

  if (isSamsung && samsungBanner) {
    samsungBanner.style.display = 'flex';
    if (btnOpenChrome) {
      // Intent para abrir la URL actual directamente en Google Chrome si el usuario lo desea
      const chromeIntent = `intent://${window.location.host}${window.location.pathname}${window.location.search}#Intent;scheme=https;package=com.android.chrome;end;`;
      btnOpenChrome.href = chromeIntent;
    }
  }

  // Configuración de AR para Android (Google Scene Viewer / ARCore)
  if (isAndroid) {
    const fileUrl = encodeURIComponent(absoluteModelUrl);
    const title = encodeURIComponent(cleanTitle);
    // Intent oficial verificado para Scene Viewer en Android
    const sceneViewerIntent = `intent://arvr.google.com/scene-viewer/1.0?file=${fileUrl}&mode=ar_preferred&title=${title}#Intent;scheme=https;package=com.google.android.googlequicksearchbox;action=android.intent.action.VIEW;end;`;

    // Barra de acceso alternativo para Scene Viewer nativo visible
    if (androidNativeBar) {
      androidNativeBar.style.display = 'flex';
    }

    if (btnAndroidIntent) {
      btnAndroidIntent.href = sceneViewerIntent;
    }
  }

  // Interceptar clic en escritorio para mostrar código QR (en móviles dejamos el flujo nativo de model-viewer)
  if (btnLaunchAr) {
    btnLaunchAr.addEventListener('click', (e) => {
      if (!isMobileDevice() && !modelViewer.canActivateAR) {
        e.preventDefault();
        e.stopPropagation();
        openDesktopQrModal();
      }
    });
  }

  // Escuchar estado de sesión AR para guiar al usuario
  modelViewer.addEventListener('ar-status', (event) => {
    console.log('Estado AR:', event.detail.status);
    const prompt = document.getElementById('ar-prompt');
    if (!prompt) return;
    if (event.detail.status === 'session-started') {
      prompt.style.display = 'flex';
    } else if (event.detail.status === 'object-placed' || event.detail.status === 'failed') {
      prompt.style.display = 'none';
    }
  });
}

// ==========================================
// MODAL QR PARA ESCRITORIO
// ==========================================
function setupDesktopQrModal(filename) {
  const modal = document.getElementById('desktop-qr-modal');
  const closeBtn = document.getElementById('close-desktop-qr');
  const box = document.getElementById('desktop-qr-box');

  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      modal.classList.add('hidden');
    });
  }

  // Generar QR de la URL actual
  if (box && typeof QRCode !== 'undefined') {
    new QRCode(box, {
      text: window.location.href,
      width: 200,
      height: 200,
      colorDark: '#0f1117',
      colorLight: '#ffffff'
    });
  }
}

function openDesktopQrModal() {
  const modal = document.getElementById('desktop-qr-modal');
  if (modal) modal.classList.remove('hidden');
}

function isMobileDevice() {
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

function escapeHtml(string) {
  if (!string) return '';
  return String(string)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
