const fs = require('fs');
const THREE = require('three');
const { STLLoader } = require('three/examples/jsm/loaders/STLLoader.js');

const buf = fs.readFileSync('models/Mobiliario Mariana Celiz.stl');
const geom = new STLLoader().parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));

// Let's test rotating around X, Y, Z:
function testTransform(rx, ry, rz) {
  const g = geom.clone();
  const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial());
  m.rotation.set(rx, ry, rz);
  m.updateMatrixWorld();
  const box = new THREE.Box3().setFromObject(m);
  const size = new THREE.Vector3();
  box.getSize(size);
  
  // Find where the plate is (original Y > 0.09)
  const pos = g.attributes.position;
  let pVerts = [];
  for (let i = 0; i < pos.count; i++) {
    if (pos.getY(i) > 0.09) {
      pVerts.push(new THREE.Vector3().fromBufferAttribute(pos, i).applyMatrix4(m.matrixWorld));
    }
  }
  let pMinY = Math.min(...pVerts.map(p=>p.y)), pMaxY = Math.max(...pVerts.map(p=>p.y));
  let pMinZ = Math.min(...pVerts.map(p=>p.z)), pMaxZ = Math.max(...pVerts.map(p=>p.z));
  let pMinX = Math.min(...pVerts.map(p=>p.x)), pMaxX = Math.max(...pVerts.map(p=>p.x));
  
  console.log(`Rot [${rx*(180/Math.PI)}, ${ry*(180/Math.PI)}, ${rz*(180/Math.PI)}] -> Size: X=${size.x.toFixed(3)}, Y=${size.y.toFixed(3)}, Z=${size.z.toFixed(3)} | Plate: X=[${pMinX.toFixed(2)},${pMaxX.toFixed(2)}] Y=[${pMinY.toFixed(2)},${pMaxY.toFixed(2)}] Z=[${pMinZ.toFixed(2)},${pMaxZ.toFixed(2)}]`);
}

console.log('Testing key rotations:');
testTransform(0, 0, 0);
testTransform(-Math.PI/2, 0, 0); // Current
testTransform(Math.PI/2, 0, 0);
testTransform(0, 0, Math.PI/2);
testTransform(0, 0, -Math.PI/2);
testTransform(0, Math.PI/2, 0);
testTransform(0, -Math.PI/2, 0);
testTransform(Math.PI/2, Math.PI/2, 0);
testTransform(-Math.PI/2, Math.PI/2, 0);
