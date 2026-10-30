const fs = require('fs');
const THREE = require('three');
const { STLLoader } = require('three/examples/jsm/loaders/STLLoader.js');

const buf = fs.readFileSync('models/Mobiliario Mariana Celiz.stl');
const geom = new STLLoader().parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
const pos = geom.attributes.position;

// Let's analyze the 3 main axes of the geometry:
// Axis 1: the extrusion direction (length = 0.0428). In original STL, it's Z.
// Axis 2: the width of the flat plate (length = 0.0714). In original STL, it's X.
// Axis 3: the height/depth perpendicular to the plate (length = 0.0857). In original STL, it's Y.

// What are the 6 possible directions that could be 'UP' (the vertical Y axis in Three.js/AR)?
// 1. +Z (extrusion up - current GLB!)
// 2. -Z (extrusion down)
// 3. +Y (plate at top, legs down)
// 4. -Y (plate at bottom on floor, legs pointing up)
// 5. +X (plate on side)
// 6. -X (plate on other side)

console.log('Let us describe what happens in each case:');
console.log('Case 1 (+Z is UP): Current GLB. The extrusion is vertical. The two oval cavities are open at the top (vertical cylinders). The flat plate is vertical along the side/back.');
console.log('Case 3 (+Y is UP): In original STL coordinates, Y is UP. The flat plate (maxY) is at the TOP like a desk/table top or horizontal back shelf. The two oval loops extend DOWN to minY (the floor).');
console.log('Case 4 (-Y is UP): The flat plate is at the BOTTOM on the floor. The two oval loops stick UP into the air.');
console.log('Case (Z is horizontal): If the extrusion Z is HORIZONTAL (e.g. left-right or front-back):');
console.log('  If +Y is UP and Z is horizontal: The flat plate is horizontal at the top, or if rotated 90 deg...');
