const fs = require('fs');
const path = require('path');
const THREE = require('three');
const { STLLoader } = require('three/examples/jsm/loaders/STLLoader.js');

const stlPath = path.join(__dirname, '../models/Mobiliario Mariana Celiz.stl');
const buffer = fs.readFileSync(stlPath);
const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);

function renderSvg(rotX, rotY, rotZ, filename, title) {
  const loader = new STLLoader();
  const geometry = loader.parse(arrayBuffer);
  geometry.computeVertexNormals();

  // Mesh with rotation
  const mesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial());
  mesh.rotation.set(rotX, rotY, rotZ);
  mesh.updateMatrixWorld(true);

  // Compute transformed bounding box
  const box = new THREE.Box3().setFromObject(mesh);
  const center = new THREE.Vector3();
  box.getCenter(center);
  const size = new THREE.Vector3();
  box.getSize(size);
  const maxDim = Math.max(size.x, size.y, size.z);

  // Setup camera
  const W = 600, H = 500;
  const camera = new THREE.PerspectiveCamera(40, W / H, 0.1, 1000);
  // Isometric-ish angle looking from front-right-above
  camera.position.set(center.x + maxDim * 1.5, center.y + maxDim * 1.2, center.z + maxDim * 1.8);
  camera.lookAt(center);
  camera.updateMatrixWorld(true);
  camera.updateProjectionMatrix();

  const lightDir = new THREE.Vector3(0.5, 0.8, 0.6).normalize();
  const pos = geometry.attributes.position;
  const normal = geometry.attributes.normal;

  // Project triangles
  const triangles = [];
  const vA = new THREE.Vector3(), vB = new THREE.Vector3(), vC = new THREE.Vector3();
  const nA = new THREE.Vector3();

  for (let i = 0; i < pos.count; i += 3) {
    vA.fromBufferAttribute(pos, i).applyMatrix4(mesh.matrixWorld);
    vB.fromBufferAttribute(pos, i+1).applyMatrix4(mesh.matrixWorld);
    vC.fromBufferAttribute(pos, i+2).applyMatrix4(mesh.matrixWorld);

    // Compute face normal in world space
    const cb = new THREE.Vector3().subVectors(vC, vB);
    const ab = new THREE.Vector3().subVectors(vA, vB);
    const faceNormal = new THREE.Vector3().crossVectors(cb, ab).normalize();

    // Lighting
    const diffuse = Math.max(0.2, faceNormal.dot(lightDir));
    const r = Math.round(210 * diffuse);
    const g = Math.round(180 * diffuse);
    const b = Math.round(140 * diffuse);
    const hexColor = `rgb(${r},${g},${b})`;

    // Screen projection
    const pA = vA.clone().project(camera);
    const pB = vB.clone().project(camera);
    const pC = vC.clone().project(camera);

    // Depth for sorting (painter's algorithm)
    const depth = (pA.z + pB.z + pC.z) / 3;

    const sAx = ((pA.x + 1) / 2) * W;
    const sAy = ((1 - pA.y) / 2) * H;
    const sBx = ((pB.x + 1) / 2) * W;
    const sBy = ((1 - pB.y) / 2) * H;
    const sCx = ((pC.x + 1) / 2) * W;
    const sCy = ((1 - pC.y) / 2) * H;

    triangles.push({
      depth,
      points: `${sAx.toFixed(1)},${sAy.toFixed(1)} ${sBx.toFixed(1)},${sBy.toFixed(1)} ${sCx.toFixed(1)},${sCy.toFixed(1)}`,
      color: hexColor
    });
  }

  // Sort from farthest to nearest
  triangles.sort((a, b) => b.depth - a.depth);

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" style="background:#0f1117; font-family:Inter,sans-serif;">\n`;
  svg += `<text x="20" y="35" fill="#f3f4f6" font-size="16" font-weight="bold">${title}</text>\n`;
  svg += `<g stroke="rgba(0,0,0,0.15)" stroke-width="0.3">\n`;
  for (const tri of triangles) {
    svg += `  <polygon points="${tri.points}" fill="${tri.color}" />\n`;
  }
  svg += `</g>\n</svg>`;

  fs.writeFileSync(filename, svg);
  console.log(`Rendered ${filename}`);
}

// Render the 4 orientations
renderSvg(0, 0, 0, 'orientation_1_upright.svg', 'Opción 1: Patas abajo, cubierta/respaldo arriba');
renderSvg(-Math.PI/2, 0, 0, 'orientation_2_previous.svg', 'Opción 2: Anterior (acostado)');
renderSvg(-Math.PI/2, Math.PI/2, 0, 'orientation_3_back_vertical.svg', 'Opción 3: Respaldo vertical atrás');
renderSvg(Math.PI/2, 0, 0, 'orientation_4_inverted.svg', 'Opción 4: Invertido');
