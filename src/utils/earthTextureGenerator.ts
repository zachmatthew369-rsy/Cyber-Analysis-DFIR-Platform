import * as THREE from 'three';

/**
 * Creates a high-detail procedural canvas texture of planet Earth
 * with accurate continents, biomes (Sahara sand, European/American green, polar ice),
 * and ocean bathymetry gradients for instant WebGL texture binding.
 */
export function createProceduralEarthTexture(width = 2048, height = 1024): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    const fallbackCanvas = document.createElement('canvas');
    fallbackCanvas.width = 16;
    fallbackCanvas.height = 16;
    return new THREE.CanvasTexture(fallbackCanvas);
  }

  // Deep Ocean Base
  const oceanGrad = ctx.createLinearGradient(0, 0, 0, height);
  oceanGrad.addColorStop(0, '#041226');
  oceanGrad.addColorStop(0.2, '#062045');
  oceanGrad.addColorStop(0.5, '#0b3569');
  oceanGrad.addColorStop(0.8, '#062045');
  oceanGrad.addColorStop(1, '#041226');
  ctx.fillStyle = oceanGrad;
  ctx.fillRect(0, 0, width, height);

  // Helper to convert lat/lon to canvas x, y (equirectangular projection)
  const toX = (lon: number) => ((lon + 180) / 360) * width;
  const toY = (lat: number) => ((90 - lat) / 180) * height;

  // Draw landmasses with biome shading
  const drawPolygon = (
    coords: [number, number][],
    fillColor: string,
    strokeColor?: string
  ) => {
    if (coords.length < 3) return;
    ctx.beginPath();
    ctx.moveTo(toX(coords[0][1]), toY(coords[0][0]));
    for (let i = 1; i < coords.length; i++) {
      ctx.lineTo(toX(coords[i][1]), toY(coords[i][0]));
    }
    ctx.closePath();
    ctx.fillStyle = fillColor;
    ctx.fill();
    if (strokeColor) {
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  };

  // Africa (Sahara desert + green equatorial + savannah)
  const africa: [number, number][] = [
    [37, 10], [32, 25], [31, 32], [22, 38], [12, 44], [11, 51],
    [5, 48], [-1, 42], [-5, 39], [-12, 40], [-25, 33], [-34, 18],
    [-34, 15], [-23, 14], [-16, 12], [-6, 12], [4, 9], [5, 2],
    [6, -2], [5, -4], [5, -10], [15, -17], [21, -17], [28, -13],
    [31, -10], [36, -5], [37, 4], [37, 10]
  ];
  drawPolygon(africa, '#c29a5c', '#4d7c0f'); // Sand/beige land

  // Central/South Africa Green Overlay
  const centralAfrica: [number, number][] = [
    [10, -14], [12, 10], [10, 35], [5, 42], [-5, 39], [-15, 30],
    [-25, 28], [-33, 20], [-20, 14], [-5, 11], [5, -8], [10, -14]
  ];
  drawPolygon(centralAfrica, '#2d5a27');

  // Europe & Scandinavia
  const europe: [number, number][] = [
    [36, -5], [43, -9], [48, -4], [50, 1], [54, 8], [58, 6],
    [65, 12], [71, 26], [68, 30], [60, 30], [55, 38], [47, 40],
    [45, 35], [42, 28], [37, 24], [36, 15], [38, 12], [40, 18],
    [36, -5]
  ];
  drawPolygon(europe, '#3b6e3b', '#22c55e');

  // British Isles
  const uk: [number, number][] = [
    [50, -5], [55, -5], [58, -3], [58, -6], [54, -3], [51, 1], [50, -5]
  ];
  drawPolygon(uk, '#2d6a4f');

  // Eurasia (Russia, Central Asia, China, India, SE Asia)
  const eurasia: [number, number][] = [
    [70, 30], [75, 60], [77, 105], [72, 130], [70, 170], [65, 180],
    [60, 165], [52, 142], [42, 130], [38, 120], [30, 122], [22, 114],
    [10, 105], [1, 104], [15, 96], [22, 88], [13, 80], [8, 77],
    [22, 70], [25, 62], [26, 56], [30, 48], [38, 44], [42, 38],
    [48, 40], [55, 38], [60, 30], [70, 30]
  ];
  drawPolygon(eurasia, '#406343', '#15803d');

  // Arabian Peninsula (Desert)
  const arabia: [number, number][] = [
    [30, 34], [31, 36], [26, 50], [24, 57], [16, 53], [12, 44],
    [15, 42], [22, 38], [28, 35], [30, 34]
  ];
  drawPolygon(arabia, '#d4a373');

  // India
  const india: [number, number][] = [
    [25, 68], [28, 77], [26, 88], [20, 85], [13, 80], [8, 77],
    [15, 73], [22, 69], [25, 68]
  ];
  drawPolygon(india, '#407a4a');

  // North America
  const northAmerica: [number, number][] = [
    [71, -156], [70, -130], [60, -80], [62, -65], [52, -56], [45, -62],
    [40, -74], [30, -81], [25, -80], [28, -96], [21, -97], [16, -92],
    [14, -88], [8, -78], [10, -85], [18, -104], [30, -115], [34, -120],
    [48, -124], [58, -136], [60, -148], [65, -168], [71, -156]
  ];
  drawPolygon(northAmerica, '#3f6844', '#16a34a');

  // South America
  const southAmerica: [number, number][] = [
    [12, -72], [10, -62], [5, -52], [-3, -40], [-8, -35], [-22, -41],
    [-34, -53], [-55, -67], [-52, -75], [-38, -73], [-18, -70], [-5, -80],
    [2, -78], [9, -77], [12, -72]
  ];
  drawPolygon(southAmerica, '#2e6b3b');

  // Australia
  const australia: [number, number][] = [
    [-12, 131], [-12, 136], [-16, 137], [-14, 142], [-22, 149], [-28, 153],
    [-37, 150], [-38, 144], [-35, 137], [-32, 132], [-35, 117], [-22, 114],
    [-15, 124], [-12, 131]
  ];
  drawPolygon(australia, '#b07d4b');

  // Antarctica & Arctic Ice Caps
  ctx.fillStyle = '#e2e8f0';
  ctx.fillRect(0, 0, width, height * 0.08); // Arctic
  ctx.fillRect(0, height * 0.88, width, height * 0.12); // Antarctica

  // Soft atmospheric cloud traces
  ctx.fillStyle = 'rgba(255, 255, 255, 0.18)';
  for (let i = 0; i < 40; i++) {
    const cx = Math.random() * width;
    const cy = Math.random() * height * 0.7 + height * 0.15;
    const rx = Math.random() * 80 + 40;
    const ry = Math.random() * 20 + 8;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, Math.PI * (Math.random() - 0.5) * 0.3, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * Creates high-fidelity night lights texture for dark mode view
 */
export function createNightLightsTexture(width = 2048, height = 1024): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    const fallbackCanvas = document.createElement('canvas');
    return new THREE.CanvasTexture(fallbackCanvas);
  }

  // Pure dark navy night space
  ctx.fillStyle = '#020617';
  ctx.fillRect(0, 0, width, height);

  // Clusters of golden / amber city lights in major metropolitan areas
  const toX = (lon: number) => ((lon + 180) / 360) * width;
  const toY = (lat: number) => ((90 - lat) / 180) * height;

  const cityClusters: [number, number, number][] = [
    // [lat, lon, intensity]
    // Europe
    [51.5, -0.1, 14], [48.8, 2.3, 14], [52.5, 13.4, 12], [41.9, 12.5, 10], [47.4, 8.5, 12],
    [55.7, 37.6, 15], [59.9, 30.3, 10], [50.1, 8.6, 12], [52.3, 4.9, 11],
    // US East & West
    [40.7, -74.0, 18], [38.9, -77.0, 15], [42.3, -71.0, 13], [33.7, -84.3, 12], [25.7, -80.2, 10],
    [30.2, -97.7, 14], [32.7, -96.7, 13], [29.7, -95.3, 13], [41.8, -87.6, 15],
    [34.0, -118.2, 18], [37.7, -122.4, 16], [47.6, -122.3, 14],
    // Asia
    [35.6, 139.6, 20], [31.2, 121.4, 18], [39.9, 116.4, 17], [22.3, 114.1, 16], [1.3, 103.8, 14],
    [28.6, 77.2, 16], [19.0, 72.8, 15], [13.0, 80.2, 12], [37.5, 126.9, 17],
    // Middle East
    [25.2, 55.2, 15], [24.7, 46.6, 12], [32.0, 34.7, 12],
    // Australia & South America
    [-33.8, 151.2, 14], [-37.8, 144.9, 13], [-23.5, -46.6, 15], [-22.9, -43.1, 13], [-34.6, -58.3, 12],
  ];

  cityClusters.forEach(([lat, lon, size]) => {
    const x = toX(lon);
    const y = toY(lat);

    const grad = ctx.createRadialGradient(x, y, 0, x, y, size * 2);
    grad.addColorStop(0, 'rgba(254, 240, 138, 0.95)'); // Bright amber-white center
    grad.addColorStop(0.3, 'rgba(245, 158, 11, 0.7)'); // Golden glow
    grad.addColorStop(0.7, 'rgba(217, 119, 6, 0.25)');
    grad.addColorStop(1, 'rgba(217, 119, 6, 0)');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, size * 2, 0, Math.PI * 2);
    ctx.fill();

    // Small sharp bright dots for micro-nodes
    for (let i = 0; i < 5; i++) {
      const offsetX = (Math.random() - 0.5) * size * 1.5;
      const offsetY = (Math.random() - 0.5) * size * 1.5;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x + offsetX, y + offsetY, 1.5, 1.5);
    }
  });

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * Creates a thermographic radial gradient texture for 3D globe heatmap blooms
 */
export function createHeatmapRadialTexture(size = 256): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    const fallback = document.createElement('canvas');
    fallback.width = 8;
    fallback.height = 8;
    return new THREE.CanvasTexture(fallback);
  }

  const center = size / 2;
  const radius = size / 2;

  const grad = ctx.createRadialGradient(center, center, 0, center, center, radius);
  grad.addColorStop(0, 'rgba(255, 255, 255, 0.95)'); // Ultra-hot white core
  grad.addColorStop(0.18, 'rgba(239, 68, 68, 0.9)');  // Hot red bloom
  grad.addColorStop(0.45, 'rgba(245, 158, 11, 0.65)'); // Thermal amber ring
  grad.addColorStop(0.72, 'rgba(234, 179, 8, 0.3)');  // Outer yellow aura
  grad.addColorStop(1.0, 'rgba(234, 179, 8, 0.0)');   // Smooth fade to transparent

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(center, center, radius, 0, Math.PI * 2);
  ctx.fill();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
