/**
 * Configuración global de la aplicación AR Viewer
 */
const AR_CONFIG = {
  // Título de la aplicación
  appName: 'AR 3D Viewer Hub',

  // PIN de acceso al panel de administración (cámbialo aquí a tu gusto)
  adminPin: '1234',

  // Color de acabado por defecto para archivos STL (color arena / arcilla cálida)
  sandColor: '#d2b48c',
  stlRoughness: 0.55,
  stlMetalness: 0.15,

  // Escala inicial predeterminada para STL (en caso de modelos en milímetros de impresión 3D)
  stlDefaultScale: 1.0,

  /**
   * Obtiene la URL completa y absoluta para el visor de un modelo dado.
   * Funciona automáticamente tanto en desarrollo local como en GitHub Pages (ej: https://usuario.github.io/mi-repo/)
   * @param {string} filename Nombre del archivo en la carpeta models/ (ej: pieza.stl)
   * @returns {string} URL absoluta lista para el código QR
   */
  getViewerUrl: function (filename) {
    const origin = window.location.origin;
    const pathname = window.location.pathname;
    // Obtener el directorio base de la URL actual (manejando subdirectorios en GitHub Pages)
    const baseDir = pathname.substring(0, pathname.lastIndexOf('/') + 1);
    const viewerPage = 'viewer.html';
    const params = new URLSearchParams({ model: filename });
    return `${origin}${baseDir}${viewerPage}?${params.toString()}`;
  }
};
