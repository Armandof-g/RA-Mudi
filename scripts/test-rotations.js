const fs = require('fs');

// We have the grid from draw-profile.js
// Let's create a script that rotates the grid 0, 90, 180, 270 degrees and prints them!
const THREE = require('three');
const { STLLoader } = require('three/examples/jsm/loaders/STLLoader.js');

const buf = fs.readFileSync('models/Mobiliario Mariana Celiz.stl');
const geom = new STLLoader().parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
const pos = geom.attributes.position;

function getGrid(axisU, axisV, invertU = false, invertV = false) {
  let minU = 1e9, maxU = -1e9, minV = 1e9, maxV = -1e9;
  for (let i = 0; i < pos.count; i++) {
    let u = pos['get' + axisU.toUpperCase()](i);
    let v = pos['get' + axisV.toUpperCase()](i);
    minU = Math.min(minU, u); maxU = Math.max(maxU, u);
    minV = Math.min(minV, v); maxV = Math.max(maxV, v);
  }
  const W = 60, H = 25;
  let grid = Array.from({length: H}, () => Array(W).fill(' '));
  for (let i = 0; i < pos.count; i += 3) {
    for (let j = 0; j < 3; j++) {
      let idx1 = i + j, idx2 = i + ((j+1)%3);
      let u1 = pos['get' + axisU.toUpperCase()](idx1), v1 = pos['get' + axisV.toUpperCase()](idx1);
      let u2 = pos['get' + axisU.toUpperCase()](idx2), v2 = pos['get' + axisV.toUpperCase()](idx2);
      
      let normU1 = (u1 - minU) / (maxU - minU); if (invertU) normU1 = 1 - normU1;
      let normV1 = (v1 - minV) / (maxV - minV); if (invertV) normV1 = 1 - normV1;
      let normU2 = (u2 - minU) / (maxU - minU); if (invertU) normU2 = 1 - normU2;
      let normV2 = (v2 - minV) / (maxV - minV); if (invertV) normV2 = 1 - normV2;

      let gx0 = Math.floor(normU1 * (W - 1)), gy0 = Math.floor((1 - normV1) * (H - 1));
      let gx1 = Math.floor(normU2 * (W - 1)), gy1 = Math.floor((1 - normV2) * (H - 1));
      
      let dx = Math.abs(gx1 - gx0), sx = gx0 < gx1 ? 1 : -1;
      let dy = -Math.abs(gy1 - gy0), sy = gy0 < gy1 ? 1 : -1;
      let err = dx + dy;
      while (true) {
        if (gx0 >= 0 && gx0 < W && gy0 >= 0 && gy0 < H) grid[gy0][gx0] = '█';
        if (gx0 === gx1 && gy0 === gy1) break;
        let e2 = 2 * err;
        if (e2 >= dy) { err += dy; gx0 += sx; }
        if (e2 <= dx) { err += dx; gy0 += sy; }
      }
    }
  }
  return grid.map(r => r.join('')).join('\n');
}

console.log('=== VIEW XY (U=X, V=Y) ===');
console.log(getGrid('x', 'y'));
console.log('=== VIEW YX (U=Y, V=X) ===');
console.log(getGrid('y', 'x'));
console.log('=== VIEW Y(-X) (U=Y, V=-X: rotated 90 deg) ===');
console.log(getGrid('y', 'x', false, true));
console.log('=== VIEW (-Y)X (U=-Y, V=X: rotated -90 deg) ===');
console.log(getGrid('y', 'x', true, false));
