const fs = require('fs');
const THREE = require('three');
const { STLLoader } = require('three/examples/jsm/loaders/STLLoader.js');

const buf = fs.readFileSync('models/Mobiliario Mariana Celiz.stl');
const geom = new STLLoader().parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
const pos = geom.attributes.position;

let minX = 1e9, maxX = -1e9, minY = 1e9, maxY = -1e9;
for (let i = 0; i < pos.count; i++) {
  minX = Math.min(minX, pos.getX(i)); maxX = Math.max(maxX, pos.getX(i));
  minY = Math.min(minY, pos.getY(i)); maxY = Math.max(maxY, pos.getY(i));
}

const W = 80, H = 40;
let grid = Array.from({length: H}, () => Array(W).fill(' '));

function drawLine(x0, y0, x1, y1) {
  let dx = Math.abs(x1 - x0), sx = x0 < x1 ? 1 : -1;
  let dy = -Math.abs(y1 - y0), sy = y0 < y1 ? 1 : -1;
  let err = dx + dy, e2;
  while (true) {
    if (x0 >= 0 && x0 < W && y0 >= 0 && y0 < H) grid[y0][x0] = '█';
    if (x0 === x1 && y0 === y1) break;
    e2 = 2 * err;
    if (e2 >= dy) { err += dy; x0 += sx; }
    if (e2 <= dx) { err += dx; y0 += sy; }
  }
}

// Find edges that lie on Z = 0.01714 (the bottom end of the extrusion)
for (let i = 0; i < pos.count; i += 3) {
  // check if triangle vertices are at min Z
  let z0 = pos.getZ(i), z1 = pos.getZ(i+1), z2 = pos.getZ(i+2);
  let v = [
    { x: pos.getX(i), y: pos.getY(i), z: z0 },
    { x: pos.getX(i+1), y: pos.getY(i+1), z: z1 },
    { x: pos.getX(i+2), y: pos.getY(i+2), z: z2 }
  ];
  // If this triangle is on the side wall (i.e. spans from minZ to maxZ)
  // then the edge between two vertices with the same Z is a boundary edge
  // Or simply draw all edges projected to XY!
  for (let j = 0; j < 3; j++) {
    let pA = v[j], pB = v[(j+1)%3];
    if (Math.abs(pA.z - pB.z) < 0.001) {
      let gx0 = Math.floor(((pA.x - minX) / (maxX - minX)) * (W - 1));
      let gy0 = Math.floor((1 - (pA.y - minY) / (maxY - minY)) * (H - 1));
      let gx1 = Math.floor(((pB.x - minX) / (maxX - minX)) * (W - 1));
      let gy1 = Math.floor((1 - (pB.y - minY) / (maxY - minY)) * (H - 1));
      drawLine(gx0, gy0, gx1, gy1);
    }
  }
}

console.log(grid.map(row => row.join('')).join('\n'));
