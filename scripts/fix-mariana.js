const fs = require('fs');
const path = require('path');

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

const stlPath = path.join(__dirname, '../models/Mobiliario Mariana Celiz.stl');
const buffer = fs.readFileSync(stlPath);
const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);

const loader = new STLLoader();
const geometry = loader.parse(arrayBuffer);
geometry.computeVertexNormals();

// Measure original STL
geometry.computeBoundingBox();
const bb = geometry.boundingBox;
const size = new THREE.Vector3();
bb.getSize(size);
console.log('Original STL size:', size);

// We want real-world height to be ~65cm (0.65m)
// If Y is height (size.y = 0.0857):
const targetHeight = 0.65;
const scale = targetHeight / size.y;
console.log('Scale factor for 65cm height:', scale);

// Position so bottom is at Y=0, and X, Z are centered around 0
// Center X and Z, and place min Y at 0
const center = new THREE.Vector3();
bb.getCenter(center);
geometry.translate(-center.x, -bb.min.y, -center.z);

// Apply scale directly to geometry
geometry.scale(scale, scale, scale);
geometry.computeBoundingBox();

const finalBox = geometry.boundingBox;
console.log('Transformed geometry bounding box:');
console.log('  Min:', finalBox.min);
console.log('  Max:', finalBox.max);
const finalSize = new THREE.Vector3();
finalBox.getSize(finalSize);
console.log('  Size: Width(X)=' + finalSize.x.toFixed(3) + 'm, Height(Y)=' + finalSize.y.toFixed(3) + 'm, Depth(Z)=' + finalSize.z.toFixed(3) + 'm');

const material = new THREE.MeshStandardMaterial({
  color: 0xd2b48c,
  roughness: 0.55,
  metalness: 0.15,
  side: THREE.DoubleSide
});

const mesh = new THREE.Mesh(geometry, material);
const scene = new THREE.Scene();
scene.add(mesh);

const exporter = new GLTFExporter();
exporter.parse(
  scene,
  (gltf) => {
    const outPath = path.join(__dirname, '../models/Mobiliario Mariana Celiz.glb');
    fs.writeFileSync(outPath, Buffer.from(gltf));
    console.log(`Saved ${outPath} (${(fs.statSync(outPath).size/1024).toFixed(1)} KB)`);
  },
  (err) => console.error(err),
  { binary: true }
);
