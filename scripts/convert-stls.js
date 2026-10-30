const fs = require('fs');
const path = require('path');

// Robust FileReader polyfill for Node.js
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

const modelsDir = path.join(__dirname, '..', 'models');
const sandColorHex = 0xd2b48c;

async function convertStlToGlb(filename) {
  const stlPath = path.join(modelsDir, filename);
  const baseName = path.parse(filename).name;
  const glbPath = path.join(modelsDir, baseName + '.glb');

  console.log(`Processing STL: ${filename} -> ${baseName}.glb`);
  const buffer = fs.readFileSync(stlPath);
  const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);

  const loader = new STLLoader();
  const geometry = loader.parse(arrayBuffer);
  geometry.computeVertexNormals();
  geometry.center();

  geometry.computeBoundingBox();
  const size = new THREE.Vector3();
  geometry.boundingBox.getSize(size);
  const maxDim = Math.max(size.x, size.y, size.z);
  console.log(`  Dimensions of ${filename}: x=${size.x.toFixed(2)}, y=${size.y.toFixed(2)}, z=${size.z.toFixed(2)} (max=${maxDim.toFixed(2)})`);

  let scale = 1.0;
  if (maxDim > 5) {
    // Millimeters to meters (~25 cm)
    scale = 0.25 / maxDim;
  } else if (maxDim < 0.1) {
    // If very small (e.g. 0.04m), scale up to ~25cm for visibility
    scale = 0.25 / maxDim;
  }
  console.log(`  Scale applied: ${scale.toFixed(4)}`);

  const material = new THREE.MeshStandardMaterial({
    color: sandColorHex,
    roughness: 0.55,
    metalness: 0.15,
    side: THREE.DoubleSide
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.scale.set(scale, scale, scale);
  mesh.rotation.x = -Math.PI / 2; // Orient upright
  mesh.updateMatrixWorld(true);

  const scene = new THREE.Scene();
  scene.add(mesh);

  const exporter = new GLTFExporter();
  return new Promise((resolve, reject) => {
    exporter.parse(
      scene,
      (gltf) => {
        fs.writeFileSync(glbPath, Buffer.from(gltf));
        console.log(`  ✅ Successfully exported ${baseName}.glb (${(fs.statSync(glbPath).size/1024).toFixed(1)} KB)`);
        resolve(glbPath);
      },
      (err) => reject(err),
      { binary: true }
    );
  });
}

async function run() {
  const files = fs.readdirSync(modelsDir);
  const stls = files.filter(f => f.toLowerCase().endsWith('.stl'));
  for (const stl of stls) {
    await convertStlToGlb(stl);
  }
}

run().catch(console.error);
