const fs = require('fs');
const THREE = require('three');
const { STLLoader } = require('three/examples/jsm/loaders/STLLoader.js');

const buf = fs.readFileSync('models/Mobiliario Mariana Celiz.stl');
const geom = new STLLoader().parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
geom.computeVertexNormals();

// Let's inspect bounding box if Y is UP:
geom.computeBoundingBox();
const bb = geom.boundingBox;
console.log('Original bounds with Y as UP:');
console.log('X (width):', (bb.max.x - bb.min.x).toFixed(4));
console.log('Y (height):', (bb.max.y - bb.min.y).toFixed(4));
console.log('Z (depth):', (bb.max.z - bb.min.z).toFixed(4));
