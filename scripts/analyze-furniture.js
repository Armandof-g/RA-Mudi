const fs = require('fs');
const THREE = require('three');
const { STLLoader } = require('three/examples/jsm/loaders/STLLoader.js');

const buf = fs.readFileSync('models/Mobiliario Mariana Celiz.stl');
const geom = new STLLoader().parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
const pos = geom.attributes.position;

// Let's analyze all triangles to see which faces are connected
console.log('Total triangles:', pos.count / 3);

// Let's find the bounding box of the flat plate vs the other parts
// The flat plate seems to be a thin planar box.
// Where is it located?
let xMin = 1e9, xMax = -1e9, yMin = 1e9, yMax = -1e9, zMin = 1e9, zMax = -1e9;
for (let i = 0; i < pos.count; i++) {
  xMin = Math.min(xMin, pos.getX(i)); xMax = Math.max(xMax, pos.getX(i));
  yMin = Math.min(yMin, pos.getY(i)); yMax = Math.max(yMax, pos.getY(i));
  zMin = Math.min(zMin, pos.getZ(i)); zMax = Math.max(zMax, pos.getZ(i));
}
console.log('Bounds:', { xMin, xMax, yMin, yMax, zMin, zMax });

// In the current converted GLB (mesh.rotation.x = -Math.PI / 2):
// pos.x -> X
// pos.y -> -Z
// pos.z -> Y
// Let's see what is currently touching the floor in the converted GLB:
