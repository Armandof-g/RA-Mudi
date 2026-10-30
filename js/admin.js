/**
 * Lógica del Panel de Administración de AR Viewer
 * Controla autenticación por PIN, carga del catálogo y generación de QR
 */

document.addEventListener('DOMContentLoaded', () => {
  initAuth();
});

// ==========================================
// 1. AUTENTICACIÓN POR PIN
// ==========================================
function initAuth() {
  const pinModal = document.getElementById('pin-modal');
  const pinInput = document.getElementById('pin-input');
  const pinSubmit = document.getElementById('pin-submit');
  const pinError = document.getElementById('pin-error');
  const logoutBtn = document.getElementById('logout-btn');

  const isAuth = sessionStorage.getItem('ar_admin_authenticated') === 'true';

  if (isAuth) {
    pinModal.classList.add('hidden');
    loadCatalog();
  } else {
    pinModal.classList.remove('hidden');
    setTimeout(() => pinInput.focus(), 200);
  }

  function handlePinCheck() {
    const enteredPin = pinInput.value.trim();
    if (enteredPin === AR_CONFIG.adminPin) {
      sessionStorage.setItem('ar_admin_authenticated', 'true');
      pinModal.classList.add('hidden');
      pinError.textContent = '';
      loadCatalog();
    } else {
      pinError.textContent = 'PIN incorrecto. Intenta nuevamente.';
      const card = pinModal.querySelector('.pin-card');
      card.classList.add('shake');
      setTimeout(() => card.classList.remove('shake'), 400);
      pinInput.value = '';
      pinInput.focus();
    }
  }

  pinSubmit.addEventListener('click', handlePinCheck);
  pinInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handlePinCheck();
  });

  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      sessionStorage.removeItem('ar_admin_authenticated');
      window.location.reload();
    });
  }
}

// ==========================================
// 2. CARGA DE CATÁLOGO Y RENDERIZADO
// ==========================================
async function loadCatalog() {
  const grid = document.getElementById('models-grid');
  const emptyState = document.getElementById('empty-state');
  const statTotal = document.getElementById('stat-total');
  const statGlb = document.getElementById('stat-glb');
  const statStl = document.getElementById('stat-stl');

  try {
    const response = await fetch('models.json?t=' + Date.now());
    if (!response.ok) {
      throw new Error('No se encontró models.json');
    }
    const models = await response.json();

    if (!Array.isArray(models) || models.length === 0) {
      emptyState.style.display = 'block';
      updateStats(0, 0, 0);
      return;
    }

    emptyState.style.display = 'none';
    const glbCount = models.filter(m => m.format === 'GLB' || m.format === 'GLTF').length;
    const stlCount = models.filter(m => m.format === 'STL').length;
    updateStats(models.length, glbCount, stlCount);

    grid.innerHTML = '';
    models.forEach(model => {
      const card = createModelCard(model);
      grid.appendChild(card);
    });

  } catch (error) {
    console.warn('Aviso al cargar catálogo:', error);
    emptyState.style.display = 'block';
    updateStats(0, 0, 0);
  }
}

function updateStats(total, glb, stl) {
  const statTotal = document.getElementById('stat-total');
  const statGlb = document.getElementById('stat-glb');
  const statStl = document.getElementById('stat-stl');
  if (statTotal) statTotal.textContent = total;
  if (statGlb) statGlb.textContent = glb;
  if (statStl) statStl.textContent = stl;
}

// ==========================================
// 3. TARJETA DE MODELO Y CÓDIGO QR
// ==========================================
function createModelCard(model) {
  const card = document.createElement('div');
  card.className = 'model-card';

  const viewerUrl = AR_CONFIG.getViewerUrl(model.filename);
  const badgeClass = model.format === 'STL' ? 'badge-stl' : 'badge-glb';

  card.innerHTML = `
    <div class="model-card-header">
      <div>
        <h3 class="model-title">${escapeHtml(model.title)}</h3>
        <p class="model-filename">${escapeHtml(model.filename)}</p>
      </div>
      <span class="badge ${badgeClass}">${model.format} • ${model.sizeFormatted}</span>
    </div>

    <div class="qr-preview-wrapper">
      <div class="qr-box" id="qr-box-${escapeHtml(model.id)}"></div>
      <div class="qr-caption">Escanea con la cámara de tu celular</div>
    </div>

    <div class="card-details">
      <div class="direct-link-box">
        <input type="text" class="direct-link-input" readonly value="${viewerUrl}" id="link-${escapeHtml(model.id)}">
        <button class="btn btn-secondary btn-sm" onclick="copyLink('${escapeHtml(model.id)}')">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
          Copiar
        </button>
      </div>

      <div class="card-actions">
        <button class="btn btn-secondary btn-sm" onclick="downloadQR('${escapeHtml(model.id)}', '${escapeHtml(model.filename)}')">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
          Descargar QR
        </button>
        <a href="${viewerUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-primary btn-sm">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
          Abrir Visor
        </a>
      </div>
    </div>
  `;

  // Generar el código QR dentro del contenedor tras insertar el elemento
  setTimeout(() => {
    const box = document.getElementById(`qr-box-${model.id}`);
    if (box && typeof QRCode !== 'undefined') {
      new QRCode(box, {
        text: viewerUrl,
        width: 180,
        height: 180,
        colorDark: '#0f1117',
        colorLight: '#ffffff',
        correctLevel: QRCode.CorrectLevel.M
      });
    }
  }, 10);

  return card;
}

// ==========================================
// 4. FUNCIONES DE ACCIÓN (COPIAR Y DESCARGAR)
// ==========================================
window.copyLink = function (modelId) {
  const input = document.getElementById(`link-${modelId}`);
  if (input) {
    navigator.clipboard.writeText(input.value).then(() => {
      showToast('¡Enlace copiado al portapapeles!');
    }).catch(() => {
      input.select();
      document.execCommand('copy');
      showToast('¡Enlace copiado!');
    });
  }
};

window.downloadQR = function (modelId, filename) {
  const box = document.getElementById(`qr-box-${modelId}`);
  if (!box) return;

  // Crear un QR temporal de alta resolución para descarga óptima
  const tempDiv = document.createElement('div');
  new QRCode(tempDiv, {
    text: AR_CONFIG.getViewerUrl(filename),
    width: 600,
    height: 600,
    colorDark: '#0f1117',
    colorLight: '#ffffff',
    correctLevel: QRCode.CorrectLevel.H
  });

  setTimeout(() => {
    const canvas = tempDiv.querySelector('canvas');
    const img = tempDiv.querySelector('img');
    const dataUrl = canvas ? canvas.toDataURL('image/png') : (img ? img.src : '');
    if (dataUrl) {
      const link = document.createElement('a');
      link.download = `QR_${filename.replace(/\.[^/.]+$/, "")}.png`;
      link.href = dataUrl;
      link.click();
      showToast('Código QR descargado en alta resolución.');
    }
  }, 80);
};

function showToast(message) {
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--success)" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
    <span>${message}</span>
  `;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3000);
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
