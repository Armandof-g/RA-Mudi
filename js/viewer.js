/**
 * Visor 3D y Realidad Aumentada (AR Viewer)
 * Motor Híbrido:
 * - Android (S25 Ultra y todos los dispositivos): Cámara RA en Vivo 100% garantizada + Google Scene Viewer 1.2
 * - iOS (iPad / iPhone): Apple Quick Look nativo + Respaldo Cámara RA
 */

document.addEventListener('DOMContentLoaded', () => {
  initViewer();
});

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
  const cleanBase = normalizedKey.replace(/\.(stl|glb)$/i, '');
  if (CANONICAL_MODELS[cleanBase]) {
    return CANONICAL_MODELS[cleanBase];
  }
  return decoded.replace(/\.stl$/i, '.glb');
}

function sendArLog(event, details = {}) {
  try {
    fetch('/api/ar-log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event,
        details,
        ua: navigator.userAgent,
        ts: new Date().toISOString()
      })
    }).catch(() => {});
  } catch (e) {}
}

function initViewer() {
  const urlParams = new URLSearchParams(window.location.search);
  const rawModelParam = urlParams.get('model') || 'cute-wob.glb';

  const wrapper = document.getElementById('viewer-wrapper');
  const videoEl = document.getElementById('ar-camera-video');
  const stageEl = document.getElementById('ar-model-stage');
  const dragLayer = document.getElementById('ar-drag-layer');
  const loaderOverlay = document.getElementById('loader-overlay');
  const loaderText = document.getElementById('loader-text');
  const titleEl = document.getElementById('model-display-name');
  const badgeEl = document.getElementById('model-format-badge');
  const modelViewer = document.getElementById('ar-model-viewer');
  const btnLaunchAr = document.getElementById('btn-launch-ar');
  const btnCloseCameraAr = document.getElementById('btn-close-camera-ar');
  const cameraArHud = document.getElementById('camera-ar-hud');

  const resolvedGlb = resolveModelFilename(rawModelParam);
  const cleanTitle = MODEL_TITLES[resolvedGlb] || rawModelParam.replace(/\.[^/.]+$/, "").replace(/[-_+]+/g, ' ');

  titleEl.textContent = cleanTitle;
  document.title = `${cleanTitle} - AR Viewer`;
  badgeEl.textContent = MODEL_BADGES[resolvedGlb] || '3D • AR';
  badgeEl.className = 'badge badge-glb';

  setupDesktopQrModal();

  const modelPath = 'models/' + resolvedGlb;
  const absoluteModelUrl = new URL(modelPath, window.location.href).toString();
  modelViewer.src = absoluteModelUrl;

  sendArLog('viewer_opened', { model: resolvedGlb, url: window.location.href });

  modelViewer.addEventListener('load', () => {
    loaderOverlay.classList.add('hidden');
    sendArLog('model_loaded', { model: resolvedGlb });
  });

  modelViewer.addEventListener('error', (e) => {
    console.error('Error cargando modelo:', e);
    sendArLog('model_load_error', { model: resolvedGlb, error: String(e) });
    loaderText.innerHTML = `
      <p style="color: var(--danger); margin-bottom: 1rem;">No se pudo cargar el archivo 3D.</p>
      <a href="index.html" class="btn btn-secondary btn-sm">Volver al Panel</a>
    `;
  });

  const isAndroid = /Android/i.test(navigator.userAgent);
  const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent) ||
                (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const androidNativeBar = document.getElementById('android-native-bar');
  const btnAndroidIntent = document.getElementById('btn-android-intent');

  if (isAndroid) {
    const fileUrl = encodeURIComponent(absoluteModelUrl);
    const title = encodeURIComponent(cleanTitle);
    const fallbackUrl = encodeURIComponent(window.location.href);
    const sceneViewerIntent = `intent://arvr.google.com/scene-viewer/1.2?file=${fileUrl}&mode=ar_preferred&title=${title}&resizable=true#Intent;scheme=https;package=com.google.android.googlequicksearchbox;action=android.intent.action.VIEW;S.browser_fallback_url=${fallbackUrl};end;`;

    if (androidNativeBar) androidNativeBar.style.display = 'flex';
    if (btnAndroidIntent) {
      btnAndroidIntent.href = sceneViewerIntent;
      btnAndroidIntent.addEventListener('click', () => {
        sendArLog('scene_viewer_intent_clicked', { model: resolvedGlb });
      });
    }
  }

  // ==========================================
  // MOTOR DE CÁMARA RA CON PLANO DE PISO HORIZONTAL 3D Y GESTOS MULTITÁCTILES DIRECTOS
  // ==========================================
  let cameraStream = null;
  let isCameraArActive = false;
  let stageOffsetX = 0;
  let stageOffsetY = 60;
  let stageScale = 0.85;

  // Coordenadas 3D del mundo real (Y = FLOOR_Y es el plano horizontal del piso físico)
  const FLOOR_Y = -1.15; // Cámara a ~1.15 m sobre el nivel del piso horizontal
  let hasGyroData = false;
  let anchorInitialized = false;
  let anchorWorld = { x: 0, y: FLOOR_Y, z: -1.4 };
  let camPosWorld = { x: 0, y: 0, z: 0 };
  let camPosTarget = { x: 0, y: 0, z: 0 };
  let camVelWorld = { x: 0, y: 0, z: 0 };
  let initialDist3D = 1.8;
  let initialCamAzimuthDeg = 0;
  let initialPosAzimuthDeg = 0;
  let anchorPitchY = -0.58;
  let smoothedApproachRatio = 0;
  let qCamRaw = { x: 0, y: 0, z: 0, w: 1 };
  let qCamSmoothed = { x: 0, y: 0, z: 0, w: 1 };
  let userYawDeg = 0;
  let userPitchDeg = 0;
  let trackingRafId = null;
  let lastProjectedU = 0;
  let lastProjectedV = 0;
  let lastMotionTs = 0;

  // Odometría Visual 6-DOF sobre el flujo de video (permite acercarse al modelo y rodearlo como en iPad)
  const OPT_W = 72;
  const OPT_H = 96;
  const OPT_PATCHES = [
    { x: 20, y: 34 }, // Superior-Izquierda (TL)
    { x: 52, y: 34 }, // Superior-Derecha (TR)
    { x: 20, y: 62 }, // Inferior-Izquierda (BL)
    { x: 52, y: 62 }  // Inferior-Derecha (BR)
  ];
  let optCanvas = null;
  let optCtx = null;
  let optPrevGray = null;
  let qOptPrev = null;
  let lastOptVideoTime = -1;

  // Utilidades matemáticas de Cuaterniones 3D (Estándar W3C DeviceOrientation YXZ)
  function multiplyQuaternions(a, b) {
    return {
      x: a.x * b.w + a.w * b.x + a.y * b.z - a.z * b.y,
      y: a.y * b.w + a.w * b.y + a.z * b.x - a.x * b.z,
      z: a.z * b.w + a.w * b.z + a.x * b.y - a.y * b.x,
      w: a.w * b.w - a.x * b.x - a.y * b.y - a.z * b.z
    };
  }

  function invertQuaternion(q) {
    return { x: -q.x, y: -q.y, z: -q.z, w: q.w };
  }

  // Filtro adaptativo sin retraso: filtra micro-vibración en reposo pero responde 1:1 al mover el celular
  function filterGyroQuaternion(qFrom, qTo) {
    let bx = qTo.x, by = qTo.y, bz = qTo.z, bw = qTo.w;
    let dot = qFrom.x * bx + qFrom.y * by + qFrom.z * bz + qFrom.w * bw;
    if (dot < 0) {
      bx = -bx; by = -by; bz = -bz; bw = -bw;
      dot = -dot;
    }
    const angleRad = 2 * Math.acos(Math.min(1, Math.max(-1, dot)));
    const t = angleRad < 0.002 ? 0.25 : 0.94;
    let rx = qFrom.x + t * (bx - qFrom.x);
    let ry = qFrom.y + t * (by - qFrom.y);
    let rz = qFrom.z + t * (bz - qFrom.z);
    let rw = qFrom.w + t * (bw - qFrom.w);
    const len = Math.hypot(rx, ry, rz, rw) || 1;
    return { x: rx / len, y: ry / len, z: rz / len, w: rw / len };
  }

  function applyQuaternion(v, q) {
    const ix =  q.w * v.x + q.y * v.z - q.z * v.y;
    const iy =  q.w * v.y + q.z * v.x - q.x * v.z;
    const iz =  q.w * v.z + q.x * v.y - q.y * v.x;
    const iw = -q.x * v.x - q.y * v.y - q.z * v.z;
    return {
      x: ix * q.w + iw * -q.x + iy * -q.z - iz * -q.y,
      y: iy * q.w + iw * -q.y + iz * -q.x - ix * -q.z,
      z: iz * q.w + iw * -q.z + ix * -q.y - iy * -q.x
    };
  }

  function getScreenOrientationDeg() {
    if (window.screen && window.screen.orientation && typeof window.screen.orientation.angle === 'number') {
      return window.screen.orientation.angle;
    }
    return typeof window.orientation === 'number' ? window.orientation : 0;
  }

  function deviceEulerToQuaternion(alphaDeg, betaDeg, gammaDeg, orientDeg) {
    const degToRad = Math.PI / 180;
    const _x = (betaDeg || 0) * degToRad;
    const _y = (alphaDeg || 0) * degToRad;
    const _z = -(gammaDeg || 0) * degToRad;

    const c1 = Math.cos(_x / 2);
    const c2 = Math.cos(_y / 2);
    const c3 = Math.cos(_z / 2);
    const s1 = Math.sin(_x / 2);
    const s2 = Math.sin(_y / 2);
    const s3 = Math.sin(_z / 2);

    const q0 = {
      x: s1 * c2 * c3 + c1 * s2 * s3,
      y: c1 * s2 * c3 - s1 * c2 * s3,
      z: c1 * c2 * s3 - s1 * s2 * c3,
      w: c1 * c2 * c3 + s1 * s2 * s3
    };

    // Rotación de cámara trasera (-90° en X)
    const q1 = { x: -Math.sqrt(0.5), y: 0, z: 0, w: Math.sqrt(0.5) };
    const orientRad = (orientDeg || 0) * degToRad;
    const q2 = { x: 0, y: 0, z: -Math.sin(orientRad / 2), w: Math.cos(orientRad / 2) };

    return multiplyQuaternions(multiplyQuaternions(q0, q1), q2);
  }

  // Calcula la distancia focal exacta en píxeles de acuerdo al recorte object-fit: cover del video real
  function getFocalLengthPx() {
    const sw = window.innerWidth || 384;
    const sh = window.innerHeight || 832;
    const vw = (videoEl && videoEl.videoWidth) ? videoEl.videoWidth : 1080;
    const vh = (videoEl && videoEl.videoHeight) ? videoEl.videoHeight : 1920;
    const coverScale = Math.max(sw / vw, sh / vh);
    const dispW = vw * coverScale;
    const dispH = vh * coverScale;
    const diagPx = Math.hypot(dispW, dispH);
    // Distancia focal calibrada para video móvil 1080x1920 con estabilización (EIS)
    return diagPx * 0.88;
  }

  // Obtiene el rumbo horizontal (azimuth) de la cámara respecto al eje vertical del piso (+Y)
  function getCamAzimuthDeg(q) {
    const lookRef = applyQuaternion({ x: 0, y: 0.5, z: -1 }, q);
    return Math.atan2(lookRef.x, lookRef.z) * (180 / Math.PI);
  }

  function resetVisualOdometry() {
    optPrevGray = null;
    qOptPrev = null;
    lastOptVideoTime = -1;
    camPosWorld = { x: 0, y: 0, z: 0 };
    camPosTarget = { x: 0, y: 0, z: 0 };
    camVelWorld = { x: 0, y: 0, z: 0 };
  }

  // Clamp de seguridad para mantener camPosTarget dentro de un volumen físico realista alrededor del modelo
  function clampCameraTargetPosition() {
    camPosTarget.y = Math.max(FLOOR_Y + 0.22, Math.min(0.95, camPosTarget.y));
    const dx = anchorWorld.x - camPosTarget.x;
    const dy = anchorWorld.y - camPosTarget.y;
    const dz = anchorWorld.z - camPosTarget.z;
    const dist = Math.hypot(dx, dy, dz) || 1;
    if (dist < 0.32) {
      const s = 0.32 / dist;
      camPosTarget.x = anchorWorld.x - dx * s;
      camPosTarget.y = Math.max(FLOOR_Y + 0.22, anchorWorld.y - dy * s);
      camPosTarget.z = anchorWorld.z - dz * s;
    } else if (dist > 4.2) {
      const s = 4.2 / dist;
      camPosTarget.x = anchorWorld.x - dx * s;
      camPosTarget.y = anchorWorld.y - dy * s;
      camPosTarget.z = anchorWorld.z - dz * s;
    }
  }

  // Odometría Visual 6-DOF compensada por giroscopio sobre el video de la cámara trasera
  function updateVisualOdometry6DOF() {
    if (!videoEl || videoEl.readyState < 2 || !videoEl.videoWidth) return;
    const vTime = videoEl.currentTime;
    if (lastOptVideoTime >= 0 && Math.abs(vTime - lastOptVideoTime) < 0.024) {
      return; // Esperar a un cuadro nuevo real de la cámara (~30 fps)
    }
    lastOptVideoTime = vTime;

    if (!optCanvas) {
      optCanvas = document.createElement('canvas');
      optCanvas.width = OPT_W;
      optCanvas.height = OPT_H;
      optCtx = optCanvas.getContext('2d', { willReadFrequently: true });
    }

    try {
      optCtx.drawImage(videoEl, 0, 0, OPT_W, OPT_H);
    } catch (e) {
      return;
    }

    const imgData = optCtx.getImageData(0, 0, OPT_W, OPT_H).data;
    const currGray = new Uint8Array(OPT_W * OPT_H);
    for (let i = 0, j = 0; i < imgData.length; i += 4, j++) {
      currGray[j] = (imgData[i] * 77 + imgData[i + 1] * 150 + imgData[i + 2] * 29) >> 8;
    }

    if (!optPrevGray || !qOptPrev) {
      optPrevGray = currGray;
      qOptPrev = { ...qCamSmoothed };
      return;
    }

    // Rotación pura de la cámara entre el cuadro de video anterior y el actual
    const qCurrInv = invertQuaternion(qCamSmoothed);
    const qDelta = multiplyQuaternions(qCurrInv, qOptPrev);
    const dot = Math.min(1, Math.max(-1, Math.abs(qDelta.w)));
    const rotStepRad = 2 * Math.acos(dot);

    // Si el usuario hace un giro brusco de muñeca (> 4.5° en 33ms), actualizar referencia sin trasladar
    if (rotStepRad > 0.08) {
      optPrevGray = currGray;
      qOptPrev = { ...qCamSmoothed };
      return;
    }

    const fOpt = Math.hypot(OPT_W, OPT_H) * 0.88;
    const halfPatch = 6;
    const searchR = 5;

    const patchValid = [false, false, false, false];
    const patchResU = [0, 0, 0, 0];
    const patchResV = [0, 0, 0, 0];
    const floorDxList = [];
    const floorDzList = [];

    const camHeight = Math.max(0.25, camPosTarget.y - FLOOR_Y);

    for (let p = 0; p < 4; p++) {
      const cx = OPT_PATCHES[p].x;
      const cy = OPT_PATCHES[p].y;

      // Verificar que la región tenga textura suficiente para rastreo óptico confiable
      let gradSum = 0;
      for (let py = -halfPatch; py < halfPatch; py += 2) {
        const row = (cy + py) * OPT_W + cx;
        for (let px = -halfPatch; px < halfPatch; px += 2) {
          const idx = row + px;
          gradSum += Math.abs(optPrevGray[idx + 1] - optPrevGray[idx]) +
                     Math.abs(optPrevGray[idx + OPT_W] - optPrevGray[idx]);
        }
      }
      if (gradSum < 42) continue;

      // Rayo 3D del parche en el cuadro anterior y predicción exacta por giroscopio
      const rx1 = (cx - OPT_W * 0.5) / fOpt;
      const ry1 = -(cy - OPT_H * 0.5) / fOpt;
      const rLen1 = Math.hypot(rx1, ry1, 1) || 1;
      const rCamPrev = { x: rx1 / rLen1, y: ry1 / rLen1, z: -1 / rLen1 };
      const rCamRot = applyQuaternion(rCamPrev, qDelta);
      if (rCamRot.z >= -0.1) continue;

      const cxGyro = OPT_W * 0.5 + fOpt * (rCamRot.x / -rCamRot.z);
      const cyGyro = OPT_H * 0.5 - fOpt * (rCamRot.y / -rCamRot.z);
      const duGyro = cxGyro - cx;
      const dvGyro = cyGyro - cy;

      const baseDx = Math.round(duGyro);
      const baseDy = Math.round(dvGyro);

      let bestDx = baseDx;
      let bestDy = baseDy;
      let bestSad = 1e9;
      const sadGrid = {};

      for (let dy = baseDy - searchR; dy <= baseDy + searchR; dy++) {
        const ty = cy + dy;
        if (ty - halfPatch < 1 || ty + halfPatch >= OPT_H - 1) continue;
        for (let dx = baseDx - searchR; dx <= baseDx + searchR; dx++) {
          const tx = cx + dx;
          if (tx - halfPatch < 1 || tx + halfPatch >= OPT_W - 1) continue;

          let sad = 0;
          for (let py = -halfPatch; py <= halfPatch; py += 2) {
            const prevRow = (cy + py) * OPT_W + cx;
            const currRow = (ty + py) * OPT_W + tx;
            for (let px = -halfPatch; px <= halfPatch; px += 2) {
              sad += Math.abs(currGray[currRow + px] - optPrevGray[prevRow + px]);
            }
          }
          sadGrid[dx + ',' + dy] = sad;
          if (sad < bestSad) {
            bestSad = sad;
            bestDx = dx;
            bestDy = dy;
          }
        }
      }

      if (bestSad > 1950) continue;

      // Refinamiento sub-píxel parabólico
      let subDx = bestDx;
      let subDy = bestDy;
      const sL = sadGrid[(bestDx - 1) + ',' + bestDy];
      const sR = sadGrid[(bestDx + 1) + ',' + bestDy];
      const sU = sadGrid[bestDx + ',' + (bestDy - 1)];
      const sD = sadGrid[bestDx + ',' + (bestDy + 1)];

      if (sL !== undefined && sR !== undefined) {
        const denomX = 2 * (sL + sR - 2 * bestSad);
        if (denomX > 4) subDx += Math.max(-0.5, Math.min(0.5, (sL - sR) / denomX));
      }
      if (sU !== undefined && sD !== undefined) {
        const denomY = 2 * (sU + sD - 2 * bestSad);
        if (denomY > 4) subDy += Math.max(-0.5, Math.min(0.5, (sU - sD) / denomY));
      }

      patchValid[p] = true;
      patchResU[p] = subDx - duGyro;
      patchResV[p] = subDy - dvGyro;

      // Homografía del plano del piso: intersección 3D antes y después para medir traslación real en metros
      const rWorld1 = applyQuaternion(rCamPrev, qOptPrev);
      const cx2 = cx + subDx;
      const cy2 = cy + subDy;
      const rx2 = (cx2 - OPT_W * 0.5) / fOpt;
      const ry2 = -(cy2 - OPT_H * 0.5) / fOpt;
      const rLen2 = Math.hypot(rx2, ry2, 1) || 1;
      const rCamCurr = { x: rx2 / rLen2, y: ry2 / rLen2, z: -1 / rLen2 };
      const rWorld2 = applyQuaternion(rCamCurr, qCamSmoothed);

      if (rWorld1.y < -0.16 && rWorld2.y < -0.16) {
        const t1 = Math.min(4.2, camHeight / -rWorld1.y);
        const t2 = Math.min(4.2, camHeight / -rWorld2.y);
        floorDxList.push(rWorld1.x * t1 - rWorld2.x * t2);
        floorDzList.push(rWorld1.z * t1 - rWorld2.z * t2);
      }
    }

    optPrevGray = currGray;
    qOptPrev = { ...qCamSmoothed };

    let validCount = 0;
    let sumResU = 0;
    let sumResV = 0;
    for (let p = 0; p < 4; p++) {
      if (patchValid[p]) {
        validCount++;
        sumResU += patchResU[p];
        sumResV += patchResV[p];
      }
    }

    if (validCount === 0) return;

    const meanResU = sumResU / validCount;
    const meanResV = sumResV / validCount;

    // Divergencia óptica (looming) al acercar o alejar el teléfono del modelo
    let divScale = 0;
    let divAxes = 0;
    if ((patchValid[0] || patchValid[2]) && (patchValid[1] || patchValid[3])) {
      const leftU = (patchValid[0] && patchValid[2]) ? 0.5 * (patchResU[0] + patchResU[2]) : (patchValid[0] ? patchResU[0] : patchResU[2]);
      const rightU = (patchValid[1] && patchValid[3]) ? 0.5 * (patchResU[1] + patchResU[3]) : (patchValid[1] ? patchResU[1] : patchResU[3]);
      divScale += (rightU - leftU) / 32;
      divAxes++;
    }
    if ((patchValid[0] || patchValid[1]) && (patchValid[2] || patchValid[3])) {
      const topV = (patchValid[0] && patchValid[1]) ? 0.5 * (patchResV[0] + patchResV[1]) : (patchValid[0] ? patchResV[0] : patchResV[1]);
      const botV = (patchValid[2] && patchValid[3]) ? 0.5 * (patchResV[2] + patchResV[3]) : (patchValid[2] ? patchResV[2] : patchResV[3]);
      divScale += (botV - topV) / 28;
      divAxes++;
    }
    if (divAxes > 0) divScale /= divAxes;
    if (Math.abs(divScale) < 0.0035) divScale = 0;

    // Zona muerta contra micro-ruido cuando el dispositivo está quieto en la mano
    const transMag = Math.hypot(meanResU, meanResV);
    if (transMag < 0.16 && divScale === 0) return;

    const relX = anchorWorld.x - camPosTarget.x;
    const relY = anchorWorld.y - camPosTarget.y;
    const relZ = anchorWorld.z - camPosTarget.z;
    const currentDist3D = Math.max(0.35, Math.hypot(relX, relY, relZ));
    const toModelUnit = {
      x: relX / currentDist3D,
      y: relY / currentDist3D,
      z: relZ / currentDist3D
    };

    // 1. Acercamiento / alejamiento directo hacia el modelo por expansión óptica + flujo de avance en el piso
    const approachLoom = divScale * currentDist3D * 1.75;
    const approachFlow = (transMag >= 0.16) ? (meanResV / fOpt) * currentDist3D * 0.90 : 0;
    const totalApproach = Math.max(-0.12, Math.min(0.12, approachLoom + approachFlow));

    // 2. Desplazamiento lateral y vertical en el plano de la cámara
    const dCamLocalX = (transMag >= 0.16) ? -(meanResU / fOpt) * currentDist3D * 0.95 : 0;
    const dCamLocalY = (transMag >= 0.16) ?  (meanResV / fOpt) * currentDist3D * 0.45 : 0;
    const dWorldRay = applyQuaternion({ x: dCamLocalX, y: dCamLocalY, z: 0 }, qCamSmoothed);

    let stepX = dWorldRay.x + toModelUnit.x * totalApproach;
    let stepY = dWorldRay.y + toModelUnit.y * (approachLoom * 0.75);
    let stepZ = dWorldRay.z + toModelUnit.z * totalApproach;

    // 3. Fusión con homografía exacta del plano horizontal del piso cuando es visible
    if (floorDxList.length >= 2) {
      let fDx = 0;
      let fDz = 0;
      for (let k = 0; k < floorDxList.length; k++) {
        fDx += floorDxList[k];
        fDz += floorDzList[k];
      }
      fDx /= floorDxList.length;
      fDz /= floorDxList.length;
      stepX = stepX * 0.45 + fDx * 0.55;
      stepZ = stepZ * 0.45 + fDz * 0.55;
    }

    const stepLen = Math.hypot(stepX, stepY, stepZ);
    if (stepLen > 0.14) {
      const scaleStep = 0.14 / stepLen;
      stepX *= scaleStep;
      stepY *= scaleStep;
      stepZ *= scaleStep;
    }

    camPosTarget.x += stepX;
    camPosTarget.y += stepY;
    camPosTarget.z += stepZ;
    clampCameraTargetPosition();
  }

  // Fusión inercial (acelerómetro lineal sin gravedad) para respuesta inmediata al acercar o mover el celular
  function handleDeviceMotion(e) {
    if (!isCameraArActive || !hasGyroData || !anchorInitialized) return;
    const acc = e.acceleration;
    if (!acc || (acc.x === null && acc.y === null && acc.z === null)) return;

    const now = performance.now();
    const dt = lastMotionTs > 0 ? Math.min(0.05, (now - lastMotionTs) * 0.001) : 0.016;
    lastMotionTs = now;

    const ax = Math.abs(acc.x || 0) > 0.18 ? (acc.x || 0) : 0;
    const ay = Math.abs(acc.y || 0) > 0.18 ? (acc.y || 0) : 0;
    const az = Math.abs(acc.z || 0) > 0.18 ? (acc.z || 0) : 0;

    // En coordenadas de pantalla móvil hacia cámara trasera: -acc.z es avance hacia el objeto
    const accWorld = applyQuaternion({ x: -ax, y: -ay, z: az }, qCamSmoothed);

    camVelWorld.x = (camVelWorld.x + accWorld.x * dt * 0.45) * 0.80;
    camVelWorld.y = (camVelWorld.y + accWorld.y * dt * 0.30) * 0.78;
    camVelWorld.z = (camVelWorld.z + accWorld.z * dt * 0.45) * 0.80;

    camPosTarget.x += camVelWorld.x * dt;
    camPosTarget.y += camVelWorld.y * dt;
    camPosTarget.z += camVelWorld.z * dt;
    clampCameraTargetPosition();
  }

  // Ancla el modelo directamente sobre el plano horizontal del piso (Y = FLOOR_Y) frente a la cámara
  function anchorModelInFrontOfCamera() {
    resetVisualOdometry();
    const fwd = applyQuaternion({ x: 0, y: 0, z: -1 }, qCamSmoothed);
    if (fwd.y < -0.18) {
      const t = Math.min(3.0, Math.max(0.85, FLOOR_Y / fwd.y));
      anchorWorld = {
        x: fwd.x * t,
        y: FLOOR_Y,
        z: fwd.z * t
      };
    } else {
      const hLen = Math.hypot(fwd.x, fwd.z) || 1;
      const horizDist = 1.55;
      anchorWorld = {
        x: (fwd.x / hLen) * horizDist,
        y: FLOOR_Y,
        z: (fwd.z / hLen) * horizDist
      };
    }

    const aLen = Math.hypot(anchorWorld.x, anchorWorld.y, anchorWorld.z) || 1;
    anchorPitchY = anchorWorld.y / aLen;
    smoothedApproachRatio = 0;
    initialDist3D = aLen;
    initialCamAzimuthDeg = getCamAzimuthDeg(qCamSmoothed);
    initialPosAzimuthDeg = Math.atan2(-anchorWorld.x, -anchorWorld.z) * (180 / Math.PI);
    anchorInitialized = true;
    stageOffsetX = 0;
    stageOffsetY = 0;
    lastProjectedU = 0;
    lastProjectedV = 0;
  }

  function handleDeviceOrientation(e) {
    if (e.alpha === null && e.beta === null && e.gamma === null) return;
    const qNew = deviceEulerToQuaternion(e.alpha, e.beta, e.gamma, getScreenOrientationDeg());
    qCamRaw = qNew;

    if (!hasGyroData) {
      hasGyroData = true;
      qCamSmoothed = { ...qNew };
      anchorModelInFrontOfCamera();
      sendArLog('gyro_tracking_active', { alpha: e.alpha, beta: e.beta, gamma: e.gamma });
    }
  }

  function applyStageTransformFallback() {
    if (!stageEl) return;
    stageEl.style.opacity = '1';
    stageEl.style.transform = `translate3d(${stageOffsetX}px, ${stageOffsetY}px, 0) scale(${stageScale})`;
    const phiDeg = Math.max(10, Math.min(86, 65 + userPitchDeg));
    modelViewer.cameraOrbit = `${userYawDeg.toFixed(1)}deg ${phiDeg.toFixed(1)}deg 115%`;
    if (typeof modelViewer.jumpCameraToGoal === 'function') {
      modelViewer.jumpCameraToGoal();
    }
  }

  function updateArTrackingFrame() {
    if (!isCameraArActive) return;
    trackingRafId = requestAnimationFrame(updateArTrackingFrame);

    if (!hasGyroData || !anchorInitialized) {
      applyStageTransformFallback();
      return;
    }

    // 1. Actualizar orientación 3D de la cámara sin retraso elástico
    qCamSmoothed = filterGyroQuaternion(qCamSmoothed, qCamRaw);

    // 2. Actualizar traslación 3D de la cámara (Odometría Visual 6-DOF + Acelerómetro)
    if (!isDragging && initialPinchDist === 0) {
      updateVisualOdometry6DOF();
    }
    camPosWorld.x += (camPosTarget.x - camPosWorld.x) * 0.28;
    camPosWorld.y += (camPosTarget.y - camPosWorld.y) * 0.28;
    camPosWorld.z += (camPosTarget.z - camPosWorld.z) * 0.28;

    // 3. Acoplamiento geométrico de acercamiento sobre el piso cuando el usuario se inclina/acerca hacia el modelo
    const fwd = applyQuaternion({ x: 0, y: 0, z: -1 }, qCamSmoothed);
    const sw = window.innerWidth || 384;
    const centerWeight = Math.max(0, 1 - Math.pow(lastProjectedU / (sw * 0.72), 2));
    let targetApproachRatio = 0;
    if (fwd.y < -0.15 && anchorPitchY < -0.15) {
      const tan0 = Math.abs(anchorPitchY) / Math.sqrt(Math.max(0.04, 1 - anchorPitchY * anchorPitchY));
      const tan1 = Math.abs(fwd.y) / Math.sqrt(Math.max(0.04, 1 - fwd.y * fwd.y));
      const rawRatio = (1 - (tan0 / tan1)) * 0.68 * centerWeight;
      targetApproachRatio = Math.max(-0.22, Math.min(0.62, rawRatio));
    }
    smoothedApproachRatio += (targetApproachRatio - smoothedApproachRatio) * 0.18;

    const baseRelX = anchorWorld.x - camPosWorld.x;
    const baseRelY = anchorWorld.y - camPosWorld.y;
    const baseRelZ = anchorWorld.z - camPosWorld.z;

    // Vector 3D efectivo desde la cámara hasta el punto fijo del modelo en el piso
    const relWorld = {
      x: baseRelX * (1 - smoothedApproachRatio),
      y: baseRelY * (1 - smoothedApproachRatio * 0.45),
      z: baseRelZ * (1 - smoothedApproachRatio)
    };
    const qInv = invertQuaternion(qCamSmoothed);
    const pCam = applyQuaternion(relWorld, qInv);

    // Si el usuario giró más de 90° y el objeto quedó detrás de la cámara, ocultarlo hasta que regrese la vista
    if (pCam.z >= -0.12) {
      if (stageEl) stageEl.style.opacity = '0';
      return;
    }

    const focalPx = getFocalLengthPx();
    const depth = -pCam.z;
    const u = focalPx * (pCam.x / depth);
    const v = -focalPx * (pCam.y / depth);

    lastProjectedU = u;
    lastProjectedV = v;

    // Distancia 3D real entre el dispositivo y el modelo anclado en el piso
    const dist3D = Math.hypot(pCam.x, pCam.y, pCam.z);

    // Vector vertical del piso (+Y del mundo) visto desde la cámara
    const upCam = applyQuaternion({ x: 0, y: 1, z: 0 }, qInv);
    const rollDeg = Math.atan2(upCam.x, upCam.y) * (180 / Math.PI) * 0.35;

    // Ángulo vertical 3D (permite ver el modelo desde arriba al acercarse o de frente/perfil al bajar el celular)
    const phiCamDeg = Math.acos(Math.max(-1, Math.min(1, upCam.z))) * (180 / Math.PI);
    const phiPosDeg = Math.acos(Math.max(-1, Math.min(1, (-relWorld.y) / Math.max(0.32, dist3D)))) * (180 / Math.PI);
    const rayPitchOffsetDeg = Math.atan2(v, focalPx) * (180 / Math.PI) * 0.25;
    const phiDeg = Math.max(8, Math.min(88, (phiCamDeg * 0.62 + phiPosDeg * 0.38) - rayPitchOffsetDeg + userPitchDeg));

    // Ángulo horizontal 3D (permite rodear el modelo y verlo desde diferentes ángulos laterales como en iPad)
    const camAzimuthDeg = getCamAzimuthDeg(qCamSmoothed);
    const posAzimuthDeg = Math.atan2(-relWorld.x, -relWorld.z) * (180 / Math.PI);
    let posOrbitDelta = posAzimuthDeg - initialPosAzimuthDeg;
    if (posOrbitDelta > 180) posOrbitDelta -= 360;
    if (posOrbitDelta < -180) posOrbitDelta += 360;

    const rayYawOffsetDeg = Math.atan2(u, focalPx) * (180 / Math.PI) * 0.28;
    const rotOrbitDelta = (camAzimuthDeg - initialCamAzimuthDeg) - rayYawOffsetDeg;
    const thetaDeg = userYawDeg + (rotOrbitDelta * 0.58 + posOrbitDelta * 0.42);

    // Escala con perspectiva real 3D: crece naturalmente al acercar el dispositivo al modelo
    const apparentScale = stageScale * (initialDist3D / Math.max(0.32, dist3D));

    if (stageEl) {
      stageEl.style.opacity = '1';
      stageEl.style.transform = `translate3d(${u.toFixed(1)}px, ${v.toFixed(1)}px, 0) rotate(${rollDeg.toFixed(2)}deg) scale(${apparentScale.toFixed(4)})`;
    }

    modelViewer.cameraOrbit = `${thetaDeg.toFixed(2)}deg ${phiDeg.toFixed(2)}deg 115%`;
    if (typeof modelViewer.jumpCameraToGoal === 'function') {
      modelViewer.jumpCameraToGoal();
    }
  }

  // Desplaza el modelo deslizándolo estrictamente sobre el plano horizontal del piso (Y = FLOOR_Y)
  function moveAnchorOnFloorByScreenDelta(dx, dy) {
    if (!hasGyroData || !anchorInitialized) {
      stageOffsetX += dx;
      stageOffsetY += dy;
      applyStageTransformFallback();
      return;
    }

    const focalPx = getFocalLengthPx();
    const targetU = lastProjectedU + dx;
    const targetV = lastProjectedV + dy;

    // Rayo 3D desde la posición actual de la cámara (camPosWorld) a través del píxel (targetU, targetV)
    const rx = targetU / focalPx;
    const ry = -targetV / focalPx;
    const rz = -1;
    const rLen = Math.hypot(rx, ry, rz) || 1;
    const rayCamUnit = { x: rx / rLen, y: ry / rLen, z: rz / rLen };

    // Transformar el rayo al espacio del mundo e intersectar con el piso horizontal Y = FLOOR_Y
    const rayWorld = applyQuaternion(rayCamUnit, qCamSmoothed);
    const floorDeltaY = FLOOR_Y - camPosWorld.y;
    if (rayWorld.y < -0.10 && floorDeltaY < -0.15) {
      const t = Math.min(5.0, Math.max(0.40, floorDeltaY / rayWorld.y));
      anchorWorld = {
        x: camPosWorld.x + rayWorld.x * t,
        y: FLOOR_Y,
        z: camPosWorld.z + rayWorld.z * t
      };
    } else {
      // Si el usuario arrastra muy cerca del horizonte, desplazar sobre el piso a la profundidad actual
      const qInv = invertQuaternion(qCamSmoothed);
      const relWorld = {
        x: anchorWorld.x - camPosWorld.x,
        y: anchorWorld.y - camPosWorld.y,
        z: anchorWorld.z - camPosWorld.z
      };
      const pCam = applyQuaternion(relWorld, qInv);
      const depth = Math.max(0.45, -pCam.z);
      pCam.x += (dx * depth) / focalPx;
      pCam.y -= (dy * depth) / focalPx;
      const newRelWorld = applyQuaternion(pCam, qCamSmoothed);
      anchorWorld = {
        x: camPosWorld.x + newRelWorld.x,
        y: FLOOR_Y,
        z: camPosWorld.z + newRelWorld.z
      };
    }

    const newRelX = anchorWorld.x - camPosWorld.x;
    const newRelY = anchorWorld.y - camPosWorld.y;
    const newRelZ = anchorWorld.z - camPosWorld.z;
    const newDist = Math.hypot(newRelX, newRelY, newRelZ) || 1;
    anchorPitchY = newRelY / newDist;
    smoothedApproachRatio = 0;

    lastProjectedU = targetU;
    lastProjectedV = targetV;
  }

  async function startCameraAr() {
    sendArLog('camera_ar_starting', { model: resolvedGlb });
    try {
      if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
        try {
          await DeviceOrientationEvent.requestPermission();
        } catch (permErr) {
          console.warn('Permiso de giroscopio omitido:', permErr);
        }
      }

      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1920 },
            height: { ideal: 1080 }
          },
          audio: false
        });
      } catch (err1) {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
          audio: false
        });
      }

      cameraStream = stream;
      videoEl.srcObject = stream;
      await videoEl.play();

      isCameraArActive = true;
      hasGyroData = false;
      anchorInitialized = false;
      userYawDeg = 0;
      userPitchDeg = 0;
      lastMotionTs = 0;
      resetVisualOdometry();

      window.addEventListener('deviceorientation', handleDeviceOrientation, true);
      window.addEventListener('devicemotion', handleDeviceMotion, true);

      wrapper.classList.add('camera-ar-active');
      btnLaunchAr.style.display = 'none';
      btnCloseCameraAr.style.display = 'inline-flex';
      cameraArHud.style.display = 'flex';
      if (dragLayer) dragLayer.style.display = 'block';

      // Fijar el punto de pivote de model-viewer en la base del modelo (nivel del suelo)
      modelViewer.removeAttribute('auto-rotate');
      modelViewer.cameraTarget = '0m 0.04m 0m';
      modelViewer.cameraOrbit = '0deg 45deg 115%';
      modelViewer.shadowIntensity = 1.9;
      if (typeof modelViewer.jumpCameraToGoal === 'function') {
        modelViewer.jumpCameraToGoal();
      }

      stageOffsetX = 0;
      stageOffsetY = 0;
      stageScale = 0.85;

      if (trackingRafId) cancelAnimationFrame(trackingRafId);
      trackingRafId = requestAnimationFrame(updateArTrackingFrame);

      sendArLog('camera_ar_started_success', {
        model: resolvedGlb,
        videoW: videoEl.videoWidth,
        videoH: videoEl.videoHeight,
        screenW: window.innerWidth,
        screenH: window.innerHeight
      });
    } catch (err) {
      console.error('Error al abrir cámara RA:', err);
      sendArLog('camera_ar_error', { error: String(err) });
      if (modelViewer.canActivateAR) {
        modelViewer.activateAR().catch(console.warn);
      } else {
        alert('Por favor permite el acceso a la cámara cuando el navegador lo solicite para visualizar el modelo en tu espacio.');
      }
    }
  }

  function stopCameraAr() {
    isCameraArActive = false;
    if (trackingRafId) {
      cancelAnimationFrame(trackingRafId);
      trackingRafId = null;
    }
    window.removeEventListener('deviceorientation', handleDeviceOrientation, true);
    window.removeEventListener('devicemotion', handleDeviceMotion, true);
    resetVisualOdometry();

    if (cameraStream) {
      cameraStream.getTracks().forEach(t => t.stop());
      cameraStream = null;
    }
    videoEl.srcObject = null;
    wrapper.classList.remove('camera-ar-active');
    btnLaunchAr.style.display = 'flex';
    btnCloseCameraAr.style.display = 'none';
    cameraArHud.style.display = 'none';
    if (dragLayer) dragLayer.style.display = 'none';

    stageOffsetX = 0;
    stageOffsetY = 0;
    stageScale = 1.0;
    if (stageEl) {
      stageEl.style.opacity = '1';
      stageEl.style.transform = '';
    }

    modelViewer.cameraTarget = 'auto auto auto';
    modelViewer.setAttribute('auto-rotate', '');
    modelViewer.shadowIntensity = 1.4;
    sendArLog('camera_ar_closed', { model: resolvedGlb });
  }

  // ==========================================
  // GESTOS MULTITÁCTILES UNIFICADOS (MOVER + ROTAR + ESCALAR SIN BOTONES DE MODO)
  // - 1 dedo sobre el modelo: Deslizar sobre el plano horizontal del piso
  // - 1 dedo fuera del modelo: Girar el modelo 360° sobre su eje
  // - 2 dedos (pellizcar + girar + arrastrar): Escalar, rotar y mover simultáneamente
  // - Doble toque: Re-centrar el modelo frente a la cámara actual
  // ==========================================
  let isDragging = false;
  let singleTouchMode = 'move'; // 'move' | 'rotate'
  let lastTouchX = 0;
  let lastTouchY = 0;
  let initialPinchDist = 0;
  let initialScale = 1.0;
  let lastTwistAngle = 0;
  let lastMidX = 0;
  let lastMidY = 0;
  let lastTapTime = 0;
  let tapStartX = 0;
  let tapStartY = 0;

  function getTouchDist(t1, t2) {
    return Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
  }

  function getTouchAngle(t1, t2) {
    return Math.atan2(t2.clientY - t1.clientY, t2.clientX - t1.clientX);
  }

  function isTouchOnModel(clientX, clientY) {
    const relX = clientX - window.innerWidth * 0.5;
    const relY = clientY - window.innerHeight * 0.5;
    const distFromModelCenter = Math.hypot(relX - lastProjectedU, relY - lastProjectedV);
    const hitRadius = Math.max(135, Math.min(window.innerWidth, window.innerHeight) * 0.36 * stageScale);
    return distFromModelCenter <= hitRadius;
  }

  if (dragLayer) {
    dragLayer.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        const t0 = e.touches[0];
        const now = performance.now();
        if (now - lastTapTime < 280 && Math.hypot(t0.clientX - tapStartX, t0.clientY - tapStartY) < 35) {
          // Doble toque: re-centrar modelo frente a la cámara
          anchorModelInFrontOfCamera();
          if (!hasGyroData) applyStageTransformFallback();
          lastTapTime = 0;
          return;
        }
        lastTapTime = now;
        tapStartX = t0.clientX;
        tapStartY = t0.clientY;

        isDragging = true;
        lastTouchX = t0.clientX;
        lastTouchY = t0.clientY;
        singleTouchMode = isTouchOnModel(t0.clientX, t0.clientY) ? 'move' : 'rotate';
      } else if (e.touches.length >= 2) {
        isDragging = false;
        const t0 = e.touches[0];
        const t1 = e.touches[1];
        initialPinchDist = getTouchDist(t0, t1);
        initialScale = stageScale;
        lastTwistAngle = getTouchAngle(t0, t1);
        lastMidX = (t0.clientX + t1.clientX) * 0.5;
        lastMidY = (t0.clientY + t1.clientY) * 0.5;
      }
    }, { passive: true });

    dragLayer.addEventListener('touchmove', (e) => {
      e.preventDefault();
      if (e.touches.length === 1 && isDragging) {
        const t0 = e.touches[0];
        const dx = t0.clientX - lastTouchX;
        const dy = t0.clientY - lastTouchY;
        lastTouchX = t0.clientX;
        lastTouchY = t0.clientY;

        if (singleTouchMode === 'move') {
          moveAnchorOnFloorByScreenDelta(dx, dy);
        } else {
          userYawDeg += dx * 0.55;
          userPitchDeg = Math.max(-22, Math.min(22, userPitchDeg - dy * 0.22));
          if (!hasGyroData) applyStageTransformFallback();
        }
      } else if (e.touches.length >= 2 && initialPinchDist > 0) {
        const t0 = e.touches[0];
        const t1 = e.touches[1];

        // 1. Escalar con pellizco (Pinch)
        const dist = getTouchDist(t0, t1);
        const ratio = dist / initialPinchDist;
        stageScale = Math.min(3.0, Math.max(0.20, initialScale * ratio));

        // 2. Rotar con giro de 2 dedos (Twist, dirección corregida)
        const angle = getTouchAngle(t0, t1);
        let deltaAngle = angle - lastTwistAngle;
        if (deltaAngle > Math.PI) deltaAngle -= 2 * Math.PI;
        if (deltaAngle < -Math.PI) deltaAngle += 2 * Math.PI;
        userYawDeg += deltaAngle * (180 / Math.PI) * 1.15;
        lastTwistAngle = angle;

        // 3. Mover con el punto medio de los 2 dedos (Pan)
        const midX = (t0.clientX + t1.clientX) * 0.5;
        const midY = (t0.clientY + t1.clientY) * 0.5;
        moveAnchorOnFloorByScreenDelta(midX - lastMidX, midY - lastMidY);
        lastMidX = midX;
        lastMidY = midY;

        if (!hasGyroData) applyStageTransformFallback();
      }
    }, { passive: false });

    dragLayer.addEventListener('touchend', (e) => {
      if (e.touches.length === 0) {
        isDragging = false;
        initialPinchDist = 0;
      } else if (e.touches.length === 1) {
        isDragging = true;
        lastTouchX = e.touches[0].clientX;
        lastTouchY = e.touches[0].clientY;
        singleTouchMode = isTouchOnModel(lastTouchX, lastTouchY) ? 'move' : 'rotate';
        initialPinchDist = 0;
      }
    });

    // Soporte mouse por si se prueba en PC
    dragLayer.addEventListener('mousedown', (e) => {
      isDragging = true;
      lastTouchX = e.clientX;
      lastTouchY = e.clientY;
      singleTouchMode = (e.button === 2 || !isTouchOnModel(e.clientX, e.clientY)) ? 'rotate' : 'move';
    });
    dragLayer.addEventListener('contextmenu', (e) => e.preventDefault());
    window.addEventListener('mousemove', (e) => {
      if (!isDragging || !isCameraArActive) return;
      const dx = e.clientX - lastTouchX;
      const dy = e.clientY - lastTouchY;
      lastTouchX = e.clientX;
      lastTouchY = e.clientY;
      if (singleTouchMode === 'move') {
        moveAnchorOnFloorByScreenDelta(dx, dy);
      } else {
        userYawDeg += dx * 0.55;
        userPitchDeg = Math.max(-22, Math.min(22, userPitchDeg - dy * 0.22));
        if (!hasGyroData) applyStageTransformFallback();
      }
    });
    window.addEventListener('mouseup', () => {
      isDragging = false;
    });
    dragLayer.addEventListener('wheel', (e) => {
      if (!isCameraArActive) return;
      e.preventDefault();
      const factor = e.deltaY < 0 ? 1.08 : 0.92;
      stageScale = Math.min(3.0, Math.max(0.20, stageScale * factor));
      if (!hasGyroData) applyStageTransformFallback();
    }, { passive: false });
  }

  if (btnCloseCameraAr) {
    btnCloseCameraAr.addEventListener('click', stopCameraAr);
  }

  // Acción del Botón Principal "Ver en tu espacio (AR)"
  if (btnLaunchAr) {
    btnLaunchAr.addEventListener('click', async (e) => {
      e.preventDefault();
      sendArLog('ar_button_clicked', { isAndroid, isIOS, canActivateAR: modelViewer.canActivateAR });

      // En iOS (iPad / iPhone), lanzar Apple Quick Look nativo (o respaldo de cámara si falla)
      if (isIOS && modelViewer.canActivateAR) {
        try {
          await modelViewer.activateAR();
          return;
        } catch (err) {
          console.warn('Quick Look fallback a Cámara RA:', err);
        }
      }

      // En Android (Samsung S25 Ultra y todos los móviles Android), lanzar Cámara RA en Vivo 100% garantizada
      if (isAndroid || isIOS) {
        await startCameraAr();
        return;
      }

      // En escritorio, mostrar código QR para escanear con el celular
      openDesktopQrModal();
    });
  }
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
