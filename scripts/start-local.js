const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

// FileReader polyfill for Three.js GLTFExporter
global.FileReader = class FileReader {
  readAsArrayBuffer(blob) {
    blob.arrayBuffer().then(buf => {
      this.result = buf;
      if (this.onload) this.onload({ target: this });
      if (this.onloadend) this.onloadend({ target: this });
    });
  }
};

const THREE = require('three');
const { STLLoader } = require('three/examples/jsm/loaders/STLLoader.js');
const { GLTFExporter } = require('three/examples/jsm/exporters/GLTFExporter.js');

const PORT = 8080;
const rootDir = path.join(__dirname, '..');
const modelsDir = path.join(rootDir, 'models');

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.glb': 'model/gltf-binary',
  '.gltf': 'model/gltf+json',
  '.stl': 'model/stl',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml'
};

function saveCustomStlOrientation(stlFilename, rotXdeg, rotYdeg, rotZdeg) {
  let sourceStl = 'Mobiliario Mariana Celiz.stl';
  let targetGlbs = ['mariana-celiz.glb', 'Mobiliario Mariana Celiz.glb'];

  if (stlFilename.toLowerCase().includes('adrian')) {
    sourceStl = 'Mobililiario 3d Adrian Cespedes.stl';
    targetGlbs = ['adrian-cespedes.glb', 'Mobililiario 3d Adrian Cespedes.glb'];
  }

  const stlPath = path.join(modelsDir, sourceStl);
  const buffer = fs.readFileSync(stlPath);
  const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);

  const loader = new STLLoader();
  const geometry = loader.parse(arrayBuffer);
  geometry.computeVertexNormals();

  const rx = (rotXdeg * Math.PI) / 180;
  const ry = (rotYdeg * Math.PI) / 180;
  const rz = (rotZdeg * Math.PI) / 180;

  // Apply rotation
  const rotMesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial());
  rotMesh.rotation.set(rx, ry, rz);
  rotMesh.updateMatrixWorld(true);

  // Measure oriented bounding box
  const box = new THREE.Box3().setFromObject(rotMesh);
  const size = new THREE.Vector3();
  box.getSize(size);
  const maxDim = Math.max(size.x, size.y, size.z);

  // Scale to real-world target (~65 cm for furniture)
  let scale = 0.65 / maxDim;

  // Center X and Z around 0, and align minimum Y to floor level (Y = 0)
  const center = new THREE.Vector3();
  box.getCenter(center);

  // Apply matrix to geometry directly
  const matrix = new THREE.Matrix4();
  matrix.makeRotationFromEuler(new THREE.Euler(rx, ry, rz));
  geometry.applyMatrix4(matrix);

  // Re-measure after baking rotation
  geometry.computeBoundingBox();
  const postBox = geometry.boundingBox;
  const postCenter = new THREE.Vector3();
  postBox.getCenter(postCenter);

  // Translate to center X, Z and floor Y=0
  geometry.translate(-postCenter.x, -postBox.min.y, -postCenter.z);
  geometry.scale(scale, scale, scale);
  geometry.computeBoundingBox();

  const material = new THREE.MeshStandardMaterial({
    color: 0xd2b48c,
    roughness: 0.55,
    metalness: 0.15,
    side: THREE.DoubleSide
  });

  const mesh = new THREE.Mesh(geometry, material);
  const scene = new THREE.Scene();
  scene.add(mesh);

  return new Promise((resolve, reject) => {
    const exporter = new GLTFExporter();
    exporter.parse(
      scene,
      (gltf) => {
        const outBuf = Buffer.from(gltf);
        targetGlbs.forEach(gName => {
          const gPath = path.join(modelsDir, gName);
          fs.writeFileSync(gPath, outBuf);
          console.log(`[API] Saved rotated GLB: ${gName} (scale=${scale.toFixed(4)}, rot=[${rotXdeg},${rotYdeg},${rotZdeg}])`);
        });
        resolve(path.join(modelsDir, targetGlbs[0]));
      },
      (err) => reject(err),
      { binary: true }
    );
  });
}

const server = http.createServer(async (req, res) => {
  let rawPath = req.url.split('?')[0];

  // Decode URI safely (handles %20 and accidental double encoding %2520)
  let reqPath = decodeURIComponent(rawPath);
  try {
    if (reqPath.includes('%')) reqPath = decodeURIComponent(reqPath);
  } catch (e) {}

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');
  res.setHeader('Accept-Ranges', 'bytes');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }

  // API to save custom orientation for an STL model
  if (req.method === 'POST' && reqPath === '/api/save-orientation') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const data = JSON.parse(body);
        const { filename, rotX = 0, rotY = 0, rotZ = 0 } = data;
        if (!filename) throw new Error('Missing filename');
        await saveCustomStlOrientation(filename, rotX, rotY, rotZ);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, message: 'Orientación guardada y GLB re-generado exitosamente' }));
      } catch (err) {
        console.error('[API Error]', err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  if (reqPath === '/') reqPath = '/index.html';
  const filePath = path.join(rootDir, reqPath.replace(/^\//, ''));

  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath).toLowerCase();
    const contentType = mimeTypes[ext] || 'application/octet-stream';
    const stats = fs.statSync(filePath);
    const totalSize = stats.size;
    const range = req.headers.range;

    const headers = {
      'Content-Type': contentType,
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': '*',
      'Accept-Ranges': 'bytes'
    };

    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : totalSize - 1;
      const chunkSize = (end - start) + 1;

      headers['Content-Range'] = `bytes ${start}-${end}/${totalSize}`;
      headers['Content-Length'] = chunkSize;

      console.log(`[${new Date().toLocaleTimeString()}] 206 ${req.method} ${reqPath} (bytes ${start}-${end}/${totalSize})`);
      res.writeHead(206, headers);
      if (req.method === 'HEAD') return res.end();
      fs.createReadStream(filePath, { start, end }).pipe(res);
    } else {
      headers['Content-Length'] = totalSize;
      console.log(`[${new Date().toLocaleTimeString()}] 200 ${req.method} ${reqPath} (${(totalSize/1024).toFixed(1)} KB)`);
      res.writeHead(200, headers);
      if (req.method === 'HEAD') return res.end();
      fs.createReadStream(filePath).pipe(res);
    }
  } else {
    console.log(`[${new Date().toLocaleTimeString()}] 404 ${req.method} ${reqPath}`);
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('404 No Encontrado');
  }
});

server.listen(PORT, () => {
  const url = `http://localhost:${PORT}`;
  console.log('====================================================');
  console.log(`🚀 Servidor AR Viewer iniciado en: ${url}`);
  console.log(`🔑 PIN de acceso por defecto: 1234`);
  console.log('====================================================');
});
