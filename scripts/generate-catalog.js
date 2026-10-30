const fs = require('fs');
const path = require('path');

const modelsDir = path.join(__dirname, '..', 'models');
const outputFile = path.join(__dirname, '..', 'models.json');

function formatBytes(bytes, decimals = 1) {
  if (!+bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

const canonicalModels = [
  {
    filename: 'cute-wob.glb',
    title: 'Cute Wob - Fátima Nevárez',
    format: 'GLB • Rosa',
    realScale: '110 cm'
  },
  {
    filename: 'nessie.glb',
    title: 'Nessie - Kenia Burgos',
    format: 'GLB • Turquesa',
    realScale: '100 cm'
  },
  {
    filename: 'mariana-celiz.glb',
    title: 'Mobiliario - Mariana Celiz',
    format: 'GLB • Arena',
    realScale: '65 cm'
  },
  {
    filename: 'adrian-cespedes.glb',
    title: 'Mobiliario 3D - Adrián Céspedes',
    format: 'GLB • Arena',
    realScale: '65 cm'
  }
];

try {
  const models = canonicalModels.map(item => {
    const filePath = path.join(modelsDir, item.filename);
    let size = 0;
    let updatedAt = new Date().toISOString();
    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);
      size = stats.size;
      updatedAt = stats.mtime.toISOString();
    }

    return {
      id: Buffer.from(item.filename).toString('base64url'),
      filename: item.filename,
      title: item.title,
      format: item.format,
      realScale: item.realScale,
      size: size,
      sizeFormatted: formatBytes(size),
      updatedAt: updatedAt,
      path: `models/${item.filename}`
    };
  });

  fs.writeFileSync(outputFile, JSON.stringify(models, null, 2), 'utf-8');
  console.log(`✅ Catálogo generado con éxito: ${models.length} modelos indexados.`);
  console.log(`📄 Archivo guardado en: ${outputFile}`);
} catch (error) {
  console.error('❌ Error generando el catálogo:', error);
  process.exit(1);
}
