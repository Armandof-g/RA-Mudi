const fs = require('fs');
const THREE = require('three');
const { STLLoader } = require('three/examples/jsm/loaders/STLLoader.js');

const buf = fs.readFileSync('models/Mobiliario Mariana Celiz.stl');
const geom = new STLLoader().parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
const pos = geom.attributes.position;

// Let's identify the 3 parts:
// 1. Flat plate: in original STL, Y in [0.090, 0.100]
// 2. Extrusion direction: Z in [0.017, 0.060]
// 3. Two pill shapes: in original STL, connected to the plate

console.log('Original STL analysis:');
console.log('X range: 0.0246 to 0.0961 (width 0.0714)');
console.log('Y range: 0.0147 to 0.1004 (depth 0.0857)');
console.log('Z range: 0.0171 to 0.0600 (extrusion 0.0428)');
