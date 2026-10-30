const http = require('http');
const fs = require('fs');
const path = require('path');

const server = http.createServer((req, res) => {
  let reqPath = req.url.split('?')[0];
  if (reqPath === '/') reqPath = '/index.html';
  const filePath = path.join(process.cwd(), reqPath.replace(/^\//, ''));

  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    res.writeHead(200);
    fs.createReadStream(filePath).pipe(res);
  } else {
    res.writeHead(404);
    res.end('Not Found');
  }
});

server.listen(8089, async () => {
  console.log('Servidor de prueba iniciado en puerto 8089');

  const urls = [
    'http://localhost:8089/index.html',
    'http://localhost:8089/viewer.html',
    'http://localhost:8089/models.json',
    'http://localhost:8089/models/pato_muestra.glb',
    'http://localhost:8089/models/pieza_cristal.stl',
    'http://localhost:8089/css/style.css',
    'http://localhost:8089/js/config.js',
    'http://localhost:8089/js/admin.js',
    'http://localhost:8089/js/viewer.js'
  ];

  let allSuccess = true;
  for (const url of urls) {
    try {
      const resp = await fetch(url);
      console.log(`[${resp.status}] ${url}`);
      if (resp.status !== 200) allSuccess = false;
    } catch (e) {
      console.error(`Error en ${url}:`, e);
      allSuccess = false;
    }
  }

  server.close(() => {
    console.log(allSuccess ? '🎉 TODOS LOS ARCHIVOS RESPONDEN 200 OK' : '❌ HUBO ERRORES EN LAS PRUEBAS');
    process.exit(allSuccess ? 0 : 1);
  });
});
