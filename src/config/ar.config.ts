export const AR_TEST_GLASSES = [
  {
    id: 'test-1',
    name: 'Clasica Negra',
    overlayUrl: 'https://www.pngall.com/wp-content/uploads/2016/03/Sunglasses-Free-PNG-Image.png',
    category: 'monturas',
  },
  {
    id: 'test-2',
    name: 'Aviador Dorado',
    overlayUrl: 'https://www.pngall.com/wp-content/uploads/2016/03/Sunglasses-PNG-Image.png',
    category: 'gafas-de-sol',
  },
] as const

// Configuracion de posicionamiento MediaPipe
export const AR_CONFIG = {
  // Indices de landmarks de MediaPipe FaceMesh para gafas
  landmarks: {
    leftEyeOuter: 33, // Esquina exterior ojo izquierdo
    rightEyeOuter: 263, // Esquina exterior ojo derecho
    noseBridge: 6, // Puente de la nariz (arriba)
    noseBase: 197, // Base de la nariz
    leftTemple: 234, // Sien izquierda
    rightTemple: 454, // Sien derecha
  },
  // Factor de escala del ancho de las gafas vs distancia entre ojos
  glassesWidthFactor: 1.85,
  // Factor de altura proporcional al ancho
  glassesAspectRatio: 0.42,
  // Offset vertical para bajar/subir las gafas
  verticalOffset: -0.02,
} as const
