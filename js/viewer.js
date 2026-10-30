/**
 * Visor 3D y Realidad Aumentada (AR Viewer)
 * Renderizado unificado de alto rendimiento mediante Google Model-Viewer
 * Modelos GLB pre-optimizados con orientación, color y escala física real
 * Soporte garantizado para Android (Google Scene Viewer / S25 Ultra) e iOS (Apple Quick Look)
 */

document.addEventListener('DOMContentLoaded', () => {
  initViewer();
});

// Mapa canónico de resolución ultra-robusta de nombres de modelos
const CANONICAL_MODELS = {
  // Cute Wob
  'cute-wob': 'cute-wob.glb',
  'cute-wob.glb': 'cute-wob.glb',
  'cute wob': 'cute-wob.glb',
  'cute wob fatima nevarez': 'cute-wob.glb',
  'cute wob fatima nevarez.glb': 'cute-wob.glb',

  // Nessie
  'nessie': 'nessie.glb',
  'nessie.glb': 'nessie.glb',
  'nessie - kenia burgos': 'nessie.glb',
  'nessie - kenia burgos.glb': 'nessie.glb',
  'nessie kenia burgos': 'nessie.glb',

  // Mobiliario Mariana Celiz
  'mariana-celiz': 'mariana-celiz.glb',
  'mariana-celiz.glb': 'mariana-celiz.glb',
  'mariana-celiz.stl': 'mariana-celiz.glb',
  'mobiliario mariana celiz': 'mariana-celiz.glb',
  'mobiliario mariana celiz.glb': 'mariana-celiz.glb',
  'mobiliario mariana celiz.stl': 'mariana-celiz.glb',

  // Mobiliario Adrian Cespedes
  'adrian-cespedes': 'adrian-cespedes.glb',
  'adrian-cespedes.glb': 'adrian-cespedes.glb',
  'adrian-cespedes.stl': 'adrian-cespedes.glb',
  'mobiliario adrian cespedes': 'adrian-cespedes.glb',
  'mobililiario 3d adrian cespedes': 'adrian-cespedes.glb',
  'mobililiario 3d adrian cespedes.glb': 'adrian-cespedes.glb',
  'mobililiario 3d adrian cespedes.stl': 'adrian-cespedes.glb'
};

const MODEL_TITLES = {
  'cute-wob.glb': 'Cute Wob - Fátima Nevárez',
  'nessie.glb': 'Nessie - Kenia Burgos',
  'mariana-celiz.glb': 'Mobiliario - Mariana Celiz',
  'adrian-cespedes.glb': 'Mobiliario 3D - Adrián Céspedes'
};

const MODEL_BADGES = {
  'cute-wob.glb': 'GLB • Rosa',
  'nessie.glb': 'GLB • Turquesa',
  'mariana-celiz.glb': 'GLB • Arena',
  'adrian-cespedes.glb': 'GLB • Arena'
};

function resolveModelFilename(param) {
  if (!param) return null;
  const decoded = decodeURIComponent(param).trim();
  const normalizedKey = decoded.toLowerCase().replace(/\+/g, ' ');
  if (CANONICAL_MODELS[normalizedKey]) {
    return CANONICAL_MODELS[normalizedKey];
  }
  // Fallback si termina en .stl o .glb
  const cleanBase = normalizedKey.replace(/\.(stl|glb)$/i, '');
  if (CANONICAL_MODELS[cleanBase]) {
    return CANONICAL_MODELS[cleanBase];
  }
  return decoded.replace(/\.stl$/i, '.glb');
}

function initViewer() {
  const urlParams = new URLSearchParams(window.location.search);
  const rawModelParam = urlParams.get('model');

  const loaderOverlay = document.getElementById('loader-overlay');
  const loaderText = document.getElementById('loader-text');
  const titleEl = document.getElementById('model-display-name');
  const badgeEl = document.getElementById('model-format-badge');
  const modelViewer = document.getElementById('ar-model-viewer');
  const btnLaunchAr = document.getElementById('btn-launch-ar');

  if (!rawModelParam) {
    loaderText.innerHTML = `
      <p style="color: var(--danger); margin-bottom: 1rem;">No se indicó ningún modelo 3D.</p>
      <a href="index.html" class="btn btn-secondary btn-sm">Volver al Panel</a>
    `;
    return;
  }

  // Resolver nombre de archivo canónico limpio sin espacios
  const resolvedGlb = resolveModelFilename(rawModelParam);
  const cleanTitle = MODEL_TITLES[resolvedGlb] || rawModelParam.replace(/\.[^/.]+$/, "").replace(/[-_+]+/g, ' ');

  titleEl.textContent = cleanTitle;
  document.title = `${cleanTitle} - AR Viewer`;

  badgeEl.textContent = MODEL_BADGES[resolvedGlb] || '3D • AR';
  badgeEl.className = 'badge badge-glb';

  // Modal QR para cuando se abre desde una computadora
  setupDesktopQrModal();

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
      const chromeIntent = `intent://${window.location.host}${window.location.pathname}${window.location.search}#Intent;scheme=https;package=com.android.chrome;end;`;
      btnOpenChrome.href = chromeIntent;
    }
  }

  // Configuración de AR para Android (Google Scene Viewer / ARCore)
  if (isAndroid) {
    const fileUrl = encodeURIComponent(absoluteModelUrl);
    const title = encodeURIComponent(cleanTitle);
    const fallbackUrl = encodeURIComponent(window.location.href);

    // Intent versión 1.2 oficial de Google con fallback automático
    const sceneViewerIntent = `intent://arvr.google.com/scene-viewer/1.2?file=${fileUrl}&mode=ar_preferred&title=${title}&resizable=true#Intent;scheme=https;package=com.google.android.googlequicksearchbox;action=android.intent.action.VIEW;S.browser_fallback_url=${fallbackUrl};end;`;

    if (androidNativeBar) {
      androidNativeBar.style.display = 'flex';
    }

    if (btnAndroidIntent) {
      btnAndroidIntent.href = sceneViewerIntent;
      btnAndroidIntent.addEventListener('click', () => {
        setTimeout(() => {
          if (document.visibilityState === 'visible') {
            modelViewer.activateAR().catch(console.warn);
          }
        }, 1000);
      });
    }
  }

  // Interceptar clic en escritorio para mostrar código QR
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

function setupDesktopQrModal() {
  const modal = document.getElementById('desktop-qr-modal');
  const closeBtn = document.getElementById('close-desktop-qr');
  const box = document.getElementById('desktop-qr-box');

  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      modal.classList.add('hidden');
    });
  }

  if (box && typeof QRCode !== 'undefined') {
    box.innerHTML = '';
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
