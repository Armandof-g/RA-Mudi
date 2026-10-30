const fs = require('fs');
const THREE = require('three');
const { STLLoader } = require('three/examples/jsm/loaders/STLLoader.js');

const buffer = fs.readFileSync('models/Mobiliario Mariana Celiz.stl');
const loader = new STLLoader();
const geometry = loader.parse(buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength));
const pos = geometry.attributes.position;

let pts = [];
for (let i = 0; i < pos.count; i++) {
  if (Math.abs(pos.getZ(i) - 0.01714) < 0.001) {
    pts.push({ x: pos.getX(i), y: pos.getY(i) });
  }
}

let minX = Math.min(...pts.map(p => p.x)), maxX = Math.max(...pts.map(p => p.x));
let minY = Math.min(...pts.map(p => p.y)), maxY = Math.max(...pts.map(p => p.y));

let svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800" width="800" height="800" style="background:#222">';
for (let i = 0; i < pos.count; i += 3) {
  if (Math.abs(pos.getZ(i) - 0.01714) < 0.001 && 
      Math.abs(pos.getZ(i+1) - 0.01714) < 0.001 && 
      Math.abs(pos.getZ(i+2) - 0.01714) < 0.001) {
    let x1 = ((pos.getX(i) - minX) / (maxX - minX)) * 700 + 50;
    let y1 = (1 - (pos.getY(i) - minY) / (maxY - minY)) * 700 + 50;
    let x2 = ((pos.getX(i+1) - minX) / (maxX - minX)) * 700 + 50;
    let y2 = (1 - (pos.getY(i+1) - minY) / (maxY - minY)) * 700 + 50;
    let x3 = ((pos.getX(i+2) - minX) / (maxX - minX)) * 700 + 50;
    let y3 = (1 - (pos.getY(i+2) - minY) / (maxY - minY)) * 700 + 50;
    svg += `<polygon points="${x1.toFixed(1)},${y1.toFixed(1)} ${x2.toFixed(1)},${y2.toFixed(1)} ${x3.toFixed(1)},${y3.toFixed(1)}" fill="#4488ff" stroke="#ffffff" stroke-width="0.5" />\n`;
  }
}
svg += '</svg>';
fs.writeFileSync('mariana_profile.svg', svg);
console.log('mariana_profile.svg generated');
