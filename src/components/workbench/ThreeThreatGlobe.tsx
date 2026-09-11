import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { useCyber } from '../../context/CyberPlatformContext';
import {
  ShieldAlert,
  Radio,
  Activity,
  Eye,
  Zap,
  Globe,
  Globe2,
  Compass,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Play,
  Pause,
  Layers,
  Crosshair,
  Search,
  Maximize2,
  Minimize2,
  Info,
  Flame,
  Download,
  Terminal,
  ExternalLink,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  Shield,
  Server,
  Laptop,
  Smartphone,
  Satellite
} from 'lucide-react';
import {
  ThreatNodeData,
  AttackVectorFlow,
  ThreatHeatmapPoint,
  ThreatActorIntel,
} from '../../types/threatGlobe';
import {
  INITIAL_THREAT_NODES,
  INITIAL_ATTACK_VECTORS,
  REAL_WORLD_HEATMAP_POINTS,
  WORLDWIDE_THREAT_ACTORS,
} from '../../data/threatIntelligenceData';
import { ThreatGlobeDeepResearch } from './ThreatGlobeDeepResearch';
import { ThreatLatencyStatsPanel } from './ThreatLatencyStatsPanel';
import { ThreatActorOverlayHUD } from './ThreatActorOverlayHUD';
import { ThreatHeatmapLegend } from './ThreatHeatmapLegend';
import {
  createProceduralEarthTexture,
  createNightLightsTexture,
  createHeatmapRadialTexture,
} from '../../utils/earthTextureGenerator';


export const ThreeThreatGlobe: React.FC<{ interactiveHeight?: string }> = ({
  interactiveHeight = 'h-96',
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const { theme } = useCyber();

  // State Management
  const [selectedNode, setSelectedNode] = useState<ThreatNodeData | null>(null);
  const [hoveredNode, setHoveredNode] = useState<ThreatNodeData | null>(null);
  const [hoveredVector, setHoveredVector] = useState<AttackVectorFlow | null>(null);
  const [activeVectorFilter, setActiveVectorFilter] = useState<'ALL' | 'INFILTRATION' | 'LATERAL' | 'EXFILTRATION'>('ALL');
  const [mapStyle, setMapStyle] = useState<'REAL_SATELLITE' | 'NIGHT_LIGHTS' | 'TACTICAL_CYBER'>('REAL_SATELLITE');
  const [isAutoRotating, setIsAutoRotating] = useState(true);
  const [deepResearchOpen, setDeepResearchOpen] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [cameraZoomLevel, setCameraZoomLevel] = useState(1.0);
  const [currentCoordsTelemetry, setCurrentCoordsTelemetry] = useState({ lat: 15.0, lon: 20.0, altKm: 12400 });

  // Real-Time Heatmap, Gestures, Latency & Threat Actor States
  const [heatmapEnabled, setHeatmapEnabled] = useState(true);
  const [selectedHeatmapPoint, setSelectedHeatmapPoint] = useState<ThreatHeatmapPoint | null>(null);
  const [heatmapLegendOpen, setHeatmapLegendOpen] = useState(false);
  const [threatActorOverlayOpen, setThreatActorOverlayOpen] = useState(true);
  const [selectedActor, setSelectedActor] = useState<ThreatActorIntel | null>(WORLDWIDE_THREAT_ACTORS[0]);
  const [isAutoTrackingActor, setIsAutoTrackingActor] = useState(false);
  const [latencyPanelOpen, setLatencyPanelOpen] = useState(false);
  const [selectedVectorForLatency, setSelectedVectorForLatency] = useState<AttackVectorFlow | null>(INITIAL_ATTACK_VECTORS[0]);
  const [gestureGuideOpen, setGestureGuideOpen] = useState(false);
  const [gestureFeedback, setGestureFeedback] = useState<string | null>(null);

  // Refs for 3D state & animation loop
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const globeGroupRef = useRef<THREE.Group | null>(null);
  const globeMeshRef = useRef<THREE.Mesh | null>(null);
  const cloudsMeshRef = useRef<THREE.Mesh | null>(null);
  const pulseRingsRef = useRef<THREE.Mesh[]>([]);
  const flowPacketsRef = useRef<{ mesh: THREE.Mesh; curve: THREE.QuadraticBezierCurve3; speed: number; offset: number; vector: AttackVectorFlow }[]>([]);
  const focusAnimationRef = useRef<{ active: boolean; targetX: number; targetY: number; targetDist: number; progress: number } | null>(null);
  const heatmapGroupRef = useRef<THREE.Group | null>(null);
  const vectorLinesRef = useRef<THREE.Line[]>([]);

  // Drag & Inertia state refs
  const dragRef = useRef({
    isDragging: false,
    startX: 0,
    startY: 0,
    prevX: 0,
    prevY: 0,
    rotX: 0.18, // Default pitch, perfectly framing Africa/Europe like user's photo
    rotY: -0.65, // Default yaw, centered on Prime Meridian / Mediterranean
    targetRotX: 0.18,
    targetRotY: -0.65,
    velX: 0,
    velY: 0,
    distance: 23,
    targetDistance: 23,
    lastInteraction: performance.now(),
  });

  // Convert (Lat, Lon) to 3D Cartesian coordinates on sphere
  const latLonToVector3 = useCallback((lat: number, lon: number, radius: number): THREE.Vector3 => {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lon + 180) * (Math.PI / 180);
    return new THREE.Vector3(
      -(radius * Math.sin(phi) * Math.cos(theta)),
      radius * Math.cos(phi),
      radius * Math.sin(phi) * Math.sin(theta)
    );
  }, []);

  // Smoothly center the globe on a specific (lat, lon)
  const focusOnCoordinates = useCallback((lat: number, lon: number, zoomDistance = 18) => {
    const phi = lat * (Math.PI / 180);
    const theta = (lon) * (Math.PI / 180);

    // Calculate target rotation angles that bring (lat, lon) directly to the front (+Z camera view)
    const targetY = -theta - Math.PI / 2;
    const targetX = phi * 0.7; // slight dampening for natural horizon

    dragRef.current.targetRotX = targetX;
    dragRef.current.targetRotY = targetY;
    dragRef.current.targetDistance = zoomDistance;
    dragRef.current.velX = 0;
    dragRef.current.velY = 0;
    dragRef.current.lastInteraction = performance.now();

    setIsAutoRotating(false);
  }, []);

  // Auto-Track Threat Actor Cycle (cycles every 8 seconds when active)
  useEffect(() => {
    if (!isAutoTrackingActor) return;
    const interval = setInterval(() => {
      setSelectedActor((prevActor) => {
        const currentIndex = WORLDWIDE_THREAT_ACTORS.findIndex((a) => a.id === prevActor?.id);
        const nextIndex = (currentIndex + 1) % WORLDWIDE_THREAT_ACTORS.length;
        const nextActor = WORLDWIDE_THREAT_ACTORS[nextIndex];

        if (nextActor.operationalNodes.length > 0) {
          const targetNode = INITIAL_THREAT_NODES.find((n) => n.id === nextActor.operationalNodes[0]);
          if (targetNode) {
            focusOnCoordinates(targetNode.lat, targetNode.lon, 17);
            setSelectedNode(targetNode);
          }
        }
        return nextActor;
      });
    }, 8000);

    return () => clearInterval(interval);
  }, [isAutoTrackingActor, focusOnCoordinates]);

  // Sync Heatmap layer visibility
  useEffect(() => {
    if (heatmapGroupRef.current) {
      heatmapGroupRef.current.visible = heatmapEnabled;
    }
  }, [heatmapEnabled]);

  // Highlight vector lines affiliated with the selected actor
  useEffect(() => {
    if (!vectorLinesRef.current) return;
    vectorLinesRef.current.forEach((line) => {
      const vec = line.userData.vectorData as AttackVectorFlow;
      const mat = line.material as THREE.LineBasicMaterial;
      if (!selectedActor) {
        mat.opacity = 0.55;
      } else {
        const isAffiliated = selectedActor.vectorIds.includes(vec.id);
        mat.opacity = isAffiliated ? 0.95 : 0.18;
      }
      mat.needsUpdate = true;
    });
  }, [selectedActor]);

  // Virtual D-Pad / Orientation Nudge
  const handleNudge = useCallback((dir: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT') => {
    if (dir === 'UP') dragRef.current.targetRotX = Math.min(Math.PI / 2.2, dragRef.current.targetRotX + 0.25);
    if (dir === 'DOWN') dragRef.current.targetRotX = Math.max(-Math.PI / 2.2, dragRef.current.targetRotX - 0.25);
    if (dir === 'LEFT') dragRef.current.targetRotY -= 0.35;
    if (dir === 'RIGHT') dragRef.current.targetRotY += 0.35;
    dragRef.current.velX = 0;
    dragRef.current.velY = 0;
    dragRef.current.lastInteraction = performance.now();
    setIsAutoRotating(false);
    setGestureFeedback(`Orbit: ${dir}`);
    setTimeout(() => setGestureFeedback(null), 1500);
  }, []);

  // Quick Preset Focus Handlers
  const handleFocusOrigin = useCallback(() => {
    const origin = INITIAL_THREAT_NODES.find((n) => n.status === 'C2_ORIGIN');
    if (origin) {
      focusOnCoordinates(origin.lat, origin.lon, 17);
      setSelectedNode(origin);
    }
  }, [focusOnCoordinates]);

  const handleFocusVictim = useCallback(() => {
    const victim = INITIAL_THREAT_NODES.find((n) => n.id === 'node-endpoint-austin');
    if (victim) {
      focusOnCoordinates(victim.lat, victim.lon, 17);
      setSelectedNode(victim);
    }
  }, [focusOnCoordinates]);

  const handleFocusEMEA = useCallback(() => {
    // Exact view from user's attached photo: Centered on Africa & Europe / Mediterranean
    focusOnCoordinates(16.0, 22.0, 23);
  }, [focusOnCoordinates]);

  const handleFocusAmericas = useCallback(() => {
    focusOnCoordinates(34.0, -96.0, 21);
  }, [focusOnCoordinates]);

  const handleFocusAPAC = useCallback(() => {
    focusOnCoordinates(12.0, 130.0, 22);
  }, [focusOnCoordinates]);

  const handleResetView = useCallback(() => {
    dragRef.current.targetRotX = 0.18;
    dragRef.current.targetRotY = -0.65;
    dragRef.current.targetDistance = 23;
    dragRef.current.velX = 0;
    dragRef.current.velY = 0;
    setIsAutoRotating(true);
    setSelectedNode(null);
  }, []);

  const handleZoomIn = useCallback(() => {
    dragRef.current.targetDistance = Math.max(13, dragRef.current.targetDistance - 3.5);
    dragRef.current.lastInteraction = performance.now();
  }, []);

  const handleZoomOut = useCallback(() => {
    dragRef.current.targetDistance = Math.min(38, dragRef.current.targetDistance + 3.5);
    dragRef.current.lastInteraction = performance.now();
  }, []);

  // Initialize WebGL Scene
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 450;

    // Scene & Camera
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 0, dragRef.current.distance);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    rendererRef.current = renderer;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // Deep Space Starfield Background
    const starCount = 1400;
    const starGeometry = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starCount * 3);
    const starColors = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount; i++) {
      const idx = i * 3;
      const radius = 90 + Math.random() * 80;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);

      starPositions[idx] = radius * Math.sin(phi) * Math.cos(theta);
      starPositions[idx + 1] = radius * Math.sin(phi) * Math.sin(theta);
      starPositions[idx + 2] = radius * Math.cos(phi);

      // Star Spectral Temperatures (cool blue, diamond white, warm amber)
      const colorType = Math.random();
      if (colorType > 0.8) {
        starColors[idx] = 0.6; starColors[idx + 1] = 0.8; starColors[idx + 2] = 1.0; // Blue star
      } else if (colorType > 0.65) {
        starColors[idx] = 1.0; starColors[idx + 1] = 0.9; starColors[idx + 2] = 0.7; // Warm star
      } else {
        starColors[idx] = 0.95; starColors[idx + 1] = 0.95; starColors[idx + 2] = 1.0; // White star
      }
    }

    starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    starGeometry.setAttribute('color', new THREE.BufferAttribute(starColors, 3));
    const starMaterial = new THREE.PointsMaterial({
      size: 1.1,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
    });
    const stars = new THREE.Points(starGeometry, starMaterial);
    scene.add(stars);

    // Dynamic Lighting (Fixed in cosmic space to create realistic day/night terminator)
    const sunLight = new THREE.DirectionalLight(0xffffff, 2.6);
    sunLight.position.set(30, 14, 26);
    scene.add(sunLight);

    const ambientLight = new THREE.AmbientLight(0x0f172a, 0.45);
    scene.add(ambientLight);

    // Subtle atmospheric cyan bounce light on day/night limb
    const rimLight = new THREE.DirectionalLight(0x38bdf8, 0.9);
    rimLight.position.set(-25, -10, 15);
    scene.add(rimLight);

    // Master Globe Group (Rotates with mouse drag & inertia)
    const globeGroup = new THREE.Group();
    scene.add(globeGroup);
    globeGroupRef.current = globeGroup;

    const sphereRadius = 8.0;

    // 1. Procedural Base Texture (Loaded immediately so ZERO black screen)
    const proceduralEarthTex = createProceduralEarthTexture(2048, 1024);
    const globeGeo = new THREE.SphereGeometry(sphereRadius, 64, 64);
    const globeMat = new THREE.MeshStandardMaterial({
      map: proceduralEarthTex,
      roughness: 0.55,
      metalness: 0.12,
    });
    const globeMesh = new THREE.Mesh(globeGeo, globeMat);
    globeGroup.add(globeMesh);
    globeMeshRef.current = globeMesh;

    // Load High-Res NASA Blue Marble Satellite Texture
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load(
      '/textures/earth_real_map.jpg',
      (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.generateMipmaps = true;
        tex.minFilter = THREE.LinearMipmapLinearFilter;
        globeMat.map = tex;
        globeMat.needsUpdate = true;
      },
      undefined,
      (err) => {
        console.warn('Real satellite map using high-res procedural fallback', err);
      }
    );

    // 2. Atmospheric Cloud Layer (Realistic weather swirls floating above terrain)
    const cloudsGeo = new THREE.SphereGeometry(sphereRadius * 1.014, 64, 64);
    const cloudsMat = new THREE.MeshStandardMaterial({
      transparent: true,
      opacity: 0.42,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const cloudsMesh = new THREE.Mesh(cloudsGeo, cloudsMat);
    globeGroup.add(cloudsMesh);
    cloudsMeshRef.current = cloudsMesh;

    textureLoader.load(
      '/textures/earth_clouds_map.jpg',
      (cloudTex) => {
        cloudTex.colorSpace = THREE.SRGBColorSpace;
        cloudsMat.map = cloudTex;
        cloudsMat.needsUpdate = true;
      },
      undefined,
      () => {
        // Fallback procedural clouds
        cloudsMat.opacity = 0.25;
      }
    );

    // 3. Photorealistic Atmospheric Rim Glow / Fresnel Halo (Matching User's Photo)
    const atmosphereVertexShader = `
      varying vec3 vNormal;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;

    const atmosphereFragmentShader = `
      varying vec3 vNormal;
      uniform vec3 glowColor;
      void main() {
        float intensity = pow(0.64 - dot(vNormal, vec3(0, 0, 1.0)), 2.2);
        gl_FragColor = vec4(glowColor, 1.0) * intensity;
      }
    `;

    const atmosphereMat = new THREE.ShaderMaterial({
      vertexShader: atmosphereVertexShader,
      fragmentShader: atmosphereFragmentShader,
      uniforms: {
        glowColor: { value: new THREE.Color(0x38bdf8) }, // Brilliant Sky/Cyan atmospheric glow
      },
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      transparent: true,
      depthWrite: false,
    });

    const atmosphereGeo = new THREE.SphereGeometry(sphereRadius * 1.15, 64, 64);
    const atmosphereMesh = new THREE.Mesh(atmosphereGeo, atmosphereMat);
    scene.add(atmosphereMesh);

    // 4. Tactical Latitude / Longitude Coordinate Grid (Optional visual overlay)
    const gridGeo = new THREE.SphereGeometry(sphereRadius * 1.002, 36, 18);
    const gridMat = new THREE.MeshBasicMaterial({
      color: 0x0ea5e9,
      wireframe: true,
      transparent: true,
      opacity: 0.12,
    });
    const gridMesh = new THREE.Mesh(gridGeo, gridMat);
    globeGroup.add(gridMesh);

    // Equator ring
    const equatorGeo = new THREE.RingGeometry(sphereRadius * 1.003, sphereRadius * 1.008, 64);
    const equatorMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.35,
    });
    const equator = new THREE.Mesh(equatorGeo, equatorMat);
    equator.rotation.x = Math.PI / 2;
    globeGroup.add(equator);

    // 5. Threat Nodes & Tactical Anchors
    const nodesGroup = new THREE.Group();
    globeGroup.add(nodesGroup);

    const nodeMeshes: THREE.Mesh[] = [];
    const pulseRings: THREE.Mesh[] = [];

    INITIAL_THREAT_NODES.forEach((node) => {
      const pos = latLonToVector3(node.lat, node.lon, sphereRadius * 1.02);
      node.position = pos;

      const isOrigin = node.status === 'C2_ORIGIN';
      const nodeColor = isOrigin
        ? 0xef4444 // Red for Origin
        : node.status === 'COMPROMISED'
        ? 0xf59e0b // Amber
        : node.status === 'VICTIM'
        ? 0xeab308 // Yellow
        : 0x06b6d4; // Cyan

      // Elevated Node Core Marker
      const nodeGeo = new THREE.SphereGeometry(isOrigin ? 0.42 : 0.32, 16, 16);
      const nodeMat = new THREE.MeshStandardMaterial({
        color: nodeColor,
        emissive: nodeColor,
        emissiveIntensity: isOrigin ? 0.9 : 0.6,
        roughness: 0.2,
      });
      const mesh = new THREE.Mesh(nodeGeo, nodeMat);
      mesh.position.copy(pos);
      mesh.userData = { nodeData: node };
      nodesGroup.add(mesh);
      nodeMeshes.push(mesh);

      // Elevated tactical beacon pillar for the attack origin
      if (isOrigin) {
        const poleGeo = new THREE.CylinderGeometry(0.06, 0.06, 1.8, 8);
        const poleMat = new THREE.MeshBasicMaterial({ color: 0xef4444, transparent: true, opacity: 0.8 });
        const pole = new THREE.Mesh(poleGeo, poleMat);
        const elevatedPos = pos.clone().multiplyScalar(1.07);
        pole.position.copy(pos.clone().lerp(elevatedPos, 0.5));
        pole.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), pos.clone().normalize());
        nodesGroup.add(pole);

        // Holographic Target Beacon Beacon Head
        const headGeo = new THREE.OctahedronGeometry(0.25, 0);
        const headMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const head = new THREE.Mesh(headGeo, headMat);
        head.position.copy(elevatedPos);
        nodesGroup.add(head);
      }

      // Animated Concentric Pulse Shockwave Rings on Globe Surface
      const ringCount = isOrigin ? 3 : 1;
      for (let r = 0; r < ringCount; r++) {
        const ringGeo = new THREE.RingGeometry(0.35, 0.55, 32);
        const ringMat = new THREE.MeshBasicMaterial({
          color: nodeColor,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.7,
        });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.position.copy(pos.clone().multiplyScalar(1.005));
        ring.lookAt(pos.clone().multiplyScalar(2));
        ring.userData = {
          baseScale: 1.0,
          scaleOffset: r * 0.35,
          speed: isOrigin ? 0.018 : 0.012,
        };
        nodesGroup.add(ring);
        pulseRings.push(ring);
      }
    });

    pulseRingsRef.current = pulseRings;

    // 6. 3D Flowing Attack Vector Arcs & Laser Comet Particles
    const vectorsGroup = new THREE.Group();
    globeGroup.add(vectorsGroup);

    const flowPackets: {
      mesh: THREE.Mesh;
      curve: THREE.QuadraticBezierCurve3;
      speed: number;
      offset: number;
      vector: AttackVectorFlow;
    }[] = [];

    const vectorLines: THREE.Line[] = [];

    INITIAL_ATTACK_VECTORS.forEach((vector) => {
      const sourceNode = INITIAL_THREAT_NODES.find((n) => n.id === vector.sourceNodeId);
      const targetNode = INITIAL_THREAT_NODES.find((n) => n.id === vector.targetNodeId);
      if (!sourceNode || !targetNode) return;

      const startPos = latLonToVector3(sourceNode.lat, sourceNode.lon, sphereRadius * 1.02);
      const endPos = latLonToVector3(targetNode.lat, targetNode.lon, sphereRadius * 1.02);

      // Elevated Great Circle Midpoint
      const distance = startPos.distanceTo(endPos);
      const midPos = startPos.clone().lerp(endPos, 0.5);
      const arcAltitude = Math.min(Math.max(distance * 0.28, 1.8), 4.2);
      midPos.normalize().multiplyScalar(sphereRadius + arcAltitude);

      const curve = new THREE.QuadraticBezierCurve3(startPos, midPos, endPos);
      const points = curve.getPoints(48);

      // Base Glowing Trajectory Arc
      const arcGeo = new THREE.BufferGeometry().setFromPoints(points);
      const arcMat = new THREE.LineBasicMaterial({
        color: vector.color,
        transparent: true,
        opacity: 0.55,
      });
      const arcLine = new THREE.Line(arcGeo, arcMat);
      arcLine.userData = { vectorData: vector };
      vectorsGroup.add(arcLine);
      vectorLines.push(arcLine);

      // Multiple Flowing Laser Plasma Packets per Trajectory
      const packetCount = 4;
      for (let p = 0; p < packetCount; p++) {
        const packetGeo = new THREE.SphereGeometry(0.18, 10, 10);
        const packetMat = new THREE.MeshBasicMaterial({
          color: vector.color === 0xef4444 ? 0xffffff : vector.color,
          transparent: true,
          opacity: 0.95,
        });
        const packetMesh = new THREE.Mesh(packetGeo, packetMat);
        packetMesh.position.copy(curve.getPoint(p / packetCount));
        vectorsGroup.add(packetMesh);

        flowPackets.push({
          mesh: packetMesh,
          curve,
          speed: 0.28, // Speed of packet flow
          offset: p / packetCount,
          vector,
        });
      }
    });

    vectorLinesRef.current = vectorLines;
    flowPacketsRef.current = flowPackets;

    // 6b. Global Threat Density Heatmap Blooms Layer
    const heatmapGroup = new THREE.Group();
    globeGroup.add(heatmapGroup);
    heatmapGroupRef.current = heatmapGroup;
    heatmapGroup.visible = heatmapEnabled;

    const heatmapRadialTex = createHeatmapRadialTexture(256);
    const heatmapMeshes: THREE.Mesh[] = [];
    const heatmapItems: { mesh: THREE.Mesh; baseScale: number; intensity: number; index: number }[] = [];

    REAL_WORLD_HEATMAP_POINTS.forEach((point, idx) => {
      const pos = latLonToVector3(point.lat, point.lon, sphereRadius * 1.008);
      const clusterRadius = 0.95 + point.intensity * 2.2;
      const geom = new THREE.CircleGeometry(clusterRadius, 32);
      const mat = new THREE.MeshBasicMaterial({
        map: heatmapRadialTex,
        transparent: true,
        opacity: 0.88,
        depthWrite: false,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
      });
      const mesh = new THREE.Mesh(geom, mat);
      mesh.position.copy(pos);
      mesh.lookAt(pos.clone().multiplyScalar(2));
      mesh.userData = { heatmapPoint: point };
      heatmapGroup.add(mesh);
      heatmapMeshes.push(mesh);
      heatmapItems.push({ mesh, baseScale: 1.0, intensity: point.intensity, index: idx });
    });

    // 7. Multi-Touch Gesture Controls, Drag, Orbit & Raycasting Interaction
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2(-999, -999);
    const activePointers = new Map<number, { x: number; y: number }>();
    let initialPinchDist: number | null = null;
    let lastTapTime = 0;
    let lastTapX = 0;
    let lastTapY = 0;

    const onPointerDown = (e: PointerEvent) => {
      activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

      if (activePointers.size === 1) {
        if (e.button !== 0 && e.pointerType === 'mouse') return;
        dragRef.current.isDragging = true;
        dragRef.current.startX = e.clientX;
        dragRef.current.startY = e.clientY;
        dragRef.current.prevX = e.clientX;
        dragRef.current.prevY = e.clientY;
        dragRef.current.velX = 0;
        dragRef.current.velY = 0;
        dragRef.current.lastInteraction = performance.now();
        setIsAutoRotating(false);
      } else if (activePointers.size === 2) {
        // Pinch-to-zoom multi-touch gesture start
        const pts = Array.from(activePointers.values());
        initialPinchDist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
        dragRef.current.isDragging = false;
        setGestureFeedback('Pinch to Zoom Active');
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      if (activePointers.has(e.pointerId)) {
        activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      }

      // Handle 2-finger pinch-to-zoom gesture
      if (activePointers.size === 2 && initialPinchDist && initialPinchDist > 5) {
        const pts = Array.from(activePointers.values());
        const currentPinchDist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
        const pinchDelta = currentPinchDist - initialPinchDist;

        if (Math.abs(pinchDelta) > 2) {
          dragRef.current.targetDistance -= pinchDelta * 0.05;
          dragRef.current.targetDistance = Math.max(13, Math.min(38, dragRef.current.targetDistance));
          initialPinchDist = currentPinchDist;
          dragRef.current.lastInteraction = performance.now();
          const zoomMultiplier = (23 / dragRef.current.targetDistance).toFixed(2);
          setGestureFeedback(`Pinch Zoom: ${zoomMultiplier}x`);
        }
        return;
      }

      // Handle 1-finger orbit drag
      if (dragRef.current.isDragging && activePointers.size <= 1) {
        const deltaX = e.clientX - dragRef.current.prevX;
        const deltaY = e.clientY - dragRef.current.prevY;

        dragRef.current.velY = deltaX * 0.005;
        dragRef.current.velX = deltaY * 0.005;

        dragRef.current.targetRotY += dragRef.current.velY;
        dragRef.current.targetRotX += dragRef.current.velX;

        // Clamp pitch so the earth doesn't flip upside down
        dragRef.current.targetRotX = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, dragRef.current.targetRotX));

        dragRef.current.prevX = e.clientX;
        dragRef.current.prevY = e.clientY;
        dragRef.current.lastInteraction = performance.now();
      } else if (!dragRef.current.isDragging) {
        // Raycast for hover states
        raycaster.setFromCamera(mouse, camera);
        const nodeIntersects = raycaster.intersectObjects(nodeMeshes);
        if (nodeIntersects.length > 0) {
          const hovered = nodeIntersects[0].object.userData.nodeData as ThreatNodeData;
          setHoveredNode(hovered);
          setHoveredVector(null);
          container.style.cursor = 'pointer';
        } else {
          setHoveredNode(null);
          // Check vector lines hover
          const vectorIntersects = raycaster.intersectObjects(vectorLines);
          if (vectorIntersects.length > 0) {
            const vec = vectorIntersects[0].object.userData.vectorData as AttackVectorFlow;
            setHoveredVector(vec);
            container.style.cursor = 'pointer';
          } else {
            setHoveredVector(null);
            container.style.cursor = dragRef.current.isDragging ? 'grabbing' : 'grab';
          }
        }
      }
    };

    const onPointerUp = (e: PointerEvent) => {
      // Check for Double-Tap gesture to zoom into clicked earth point
      const now = performance.now();
      const distFromLastTap = Math.hypot(e.clientX - lastTapX, e.clientY - lastTapY);

      if (now - lastTapTime < 320 && distFromLastTap < 30) {
        // Double Tap Detected! Raycast to 3D Globe surface
        raycaster.setFromCamera(mouse, camera);
        const hitIntersects = raycaster.intersectObject(globeMesh);
        if (hitIntersects.length > 0) {
          const pt = hitIntersects[0].point;
          const norm = pt.clone().normalize();
          const hitLat = 90 - Math.acos(norm.y) * (180 / Math.PI);
          const hitLon = (((Math.atan2(norm.z, -norm.x) * (180 / Math.PI)) - 180 + 540) % 360) - 180;
          focusOnCoordinates(hitLat, hitLon, 16);
          setGestureFeedback(`Double-Tap: Target Acquired [${hitLat.toFixed(1)}°, ${hitLon.toFixed(1)}°]`);
          setTimeout(() => setGestureFeedback(null), 2500);
        }
        lastTapTime = 0;
      } else {
        lastTapTime = now;
        lastTapX = e.clientX;
        lastTapY = e.clientY;
      }

      activePointers.delete(e.pointerId);
      if (activePointers.size === 0) {
        dragRef.current.isDragging = false;
        initialPinchDist = null;
        dragRef.current.lastInteraction = performance.now();
      }
    };

    const onPointerCancel = (e: PointerEvent) => {
      activePointers.delete(e.pointerId);
      if (activePointers.size === 0) {
        dragRef.current.isDragging = false;
        initialPinchDist = null;
      }
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      dragRef.current.targetDistance += e.deltaY * 0.025;
      dragRef.current.targetDistance = Math.max(13, Math.min(38, dragRef.current.targetDistance));
      dragRef.current.lastInteraction = performance.now();
    };

    const onClick = (e: MouseEvent) => {
      raycaster.setFromCamera(mouse, camera);

      // 1. Check if clicked node
      const nodeIntersects = raycaster.intersectObjects(nodeMeshes);
      if (nodeIntersects.length > 0) {
        const clicked = nodeIntersects[0].object.userData.nodeData as ThreatNodeData;
        setSelectedNode(clicked);
        focusOnCoordinates(clicked.lat, clicked.lon, 17);
        return;
      }

      // 2. Check if clicked attack vector flow
      const vecIntersects = raycaster.intersectObjects(vectorLines);
      if (vecIntersects.length > 0) {
        const vec = vecIntersects[0].object.userData.vectorData as AttackVectorFlow;
        setSelectedVectorForLatency(vec);
        setLatencyPanelOpen(true);
        setGestureFeedback(`Vector Selected: ${vec.name.split(':')[0]}`);
        setTimeout(() => setGestureFeedback(null), 2000);
        return;
      }

      // 3. Check if clicked heatmap point
      if (heatmapGroup.visible) {
        const heatIntersects = raycaster.intersectObjects(heatmapMeshes);
        if (heatIntersects.length > 0) {
          const pt = heatIntersects[0].object.userData.heatmapPoint as ThreatHeatmapPoint;
          setSelectedHeatmapPoint(pt);
          focusOnCoordinates(pt.lat, pt.lon, 18);
          setGestureFeedback(`Hotspot: ${pt.city} (${Math.round(pt.intensity * 100)}% Threat Index)`);
          setTimeout(() => setGestureFeedback(null), 2500);
        }
      }
    };

    container.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerCancel);
    container.addEventListener('wheel', onWheel, { passive: false });
    container.addEventListener('click', onClick);

    // 8. Main Render & Animation Loop
    let animationFrameId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const elapsedTime = clock.getElapsedTime();

      // Inertia Damping & Rotation Physics
      if (!dragRef.current.isDragging) {
        dragRef.current.velX *= 0.92;
        dragRef.current.velY *= 0.92;

        dragRef.current.targetRotX += dragRef.current.velX;
        dragRef.current.targetRotY += dragRef.current.velY;
        dragRef.current.targetRotX = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, dragRef.current.targetRotX));

        // Auto-Rotate if enabled and idle for > 3.5s
        if (isAutoRotating && performance.now() - dragRef.current.lastInteraction > 3500) {
          dragRef.current.targetRotY += 0.0018;
        }
      }

      // Smooth Lerp towards target rotation angles
      dragRef.current.rotX += (dragRef.current.targetRotX - dragRef.current.rotX) * 0.08;
      dragRef.current.rotY += (dragRef.current.targetRotY - dragRef.current.rotY) * 0.08;

      globeGroup.rotation.x = dragRef.current.rotX;
      globeGroup.rotation.y = dragRef.current.rotY;

      // Smooth Camera Zoom Lerp
      dragRef.current.distance += (dragRef.current.targetDistance - dragRef.current.distance) * 0.08;
      camera.position.z = dragRef.current.distance;

      // Update zoom HUD metric
      setCameraZoomLevel(Number((23 / dragRef.current.distance).toFixed(2)));

      // Calculate approximate latitude/longitude facing the camera
      const latDeg = Number((dragRef.current.rotX * (180 / Math.PI)).toFixed(1));
      const lonDeg = Number(((-dragRef.current.rotY - Math.PI / 2) * (180 / Math.PI) % 360).toFixed(1));
      setCurrentCoordsTelemetry({
        lat: latDeg,
        lon: lonDeg > 180 ? lonDeg - 360 : lonDeg < -180 ? lonDeg + 360 : lonDeg,
        altKm: Math.round(dragRef.current.distance * 540),
      });

      // Subtle differential atmospheric cloud rotation
      if (cloudsMesh) {
        cloudsMesh.rotation.y = elapsedTime * 0.015;
      }

      // Animate Concentric Shockwave Pulse Rings
      pulseRings.forEach((ring) => {
        const data = ring.userData;
        const cycle = (elapsedTime * (data.speed * 60) + data.scaleOffset) % 1.0;
        const scale = 1.0 + cycle * 1.8;
        ring.scale.set(scale, scale, scale);
        (ring.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 0.85 * (1.0 - cycle));
      });

      // Animate Flowing Laser Packets along Arcs
      flowPackets.forEach((packet) => {
        const progress = (packet.offset + elapsedTime * packet.speed) % 1.0;
        const point = packet.curve.getPoint(progress);
        packet.mesh.position.copy(point);

        // Comet pulse sizing & glow
        const pulse = 0.16 + 0.04 * Math.sin(elapsedTime * 8 + packet.offset * 10);
        packet.mesh.scale.set(pulse, pulse, pulse);
      });

      // Animate Global Threat Density Heatmap Blooms
      if (heatmapGroup.visible) {
        heatmapItems.forEach((item) => {
          const osc = 1.0 + 0.14 * Math.sin(elapsedTime * 2.8 + item.index * 1.3);
          item.mesh.scale.set(osc, osc, osc);
        });
      }

      // Slow Deep Space Starfield drift
      stars.rotation.y = elapsedTime * 0.002;

      renderer.render(scene, camera);
    };

    animate();

    // 9. Resize Handling
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const newWidth = entry.contentRect.width;
        const newHeight = entry.contentRect.height;
        if (newWidth > 0 && newHeight > 0) {
          camera.aspect = newWidth / newHeight;
          camera.updateProjectionMatrix();
          renderer.setSize(newWidth, newHeight);
        }
      }
    });
    resizeObserver.observe(container);

    return () => {
      cancelAnimationFrame(animationFrameId);
      container.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerCancel);
      container.removeEventListener('wheel', onWheel);
      container.removeEventListener('click', onClick);
      resizeObserver.disconnect();
      renderer.dispose();
      globeGeo.dispose();
      globeMat.dispose();
      cloudsGeo.dispose();
      cloudsMat.dispose();
      atmosphereGeo.dispose();
      atmosphereMat.dispose();
      gridGeo.dispose();
      gridMat.dispose();
      equatorGeo.dispose();
      equatorMat.dispose();
      starGeometry.dispose();
      starMaterial.dispose();
      heatmapRadialTex.dispose();
      container.innerHTML = '';
    };
  }, [latLonToVector3, focusOnCoordinates, isAutoRotating]);

  // Update Map Layer Style (Satellite vs Night Lights vs Tactical)
  useEffect(() => {
    if (!globeMeshRef.current) return;
    const mat = globeMeshRef.current.material as THREE.MeshStandardMaterial;

    if (mapStyle === 'NIGHT_LIGHTS') {
      const nightTex = createNightLightsTexture(2048, 1024);
      mat.map = nightTex;
      mat.roughness = 0.8;
      mat.needsUpdate = true;
    } else if (mapStyle === 'REAL_SATELLITE') {
      const textureLoader = new THREE.TextureLoader();
      textureLoader.load('/textures/earth_real_map.jpg', (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        mat.map = tex;
        mat.roughness = 0.55;
        mat.needsUpdate = true;
      });
    } else if (mapStyle === 'TACTICAL_CYBER') {
      const textureLoader = new THREE.TextureLoader();
      textureLoader.load('/textures/earth_real_map.jpg', (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        mat.map = tex;
        mat.roughness = 0.4;
        mat.metalness = 0.3;
        mat.needsUpdate = true;
      });
    }
  }, [mapStyle]);

  return (
    <div
      id="three-threat-globe-card"
      className={`relative w-full rounded-2xl border border-slate-800 bg-slate-950/90 shadow-2xl backdrop-blur-xl overflow-hidden transition-all duration-300 ${
        isFullScreen ? 'fixed inset-4 z-50 h-[calc(100vh-2rem)]' : ''
      }`}
    >
      {/* 1. TOP HEADER & TELEMETRY STATUS HUD */}
      <div className="p-3 sm:p-4 border-b border-slate-800/80 bg-slate-900/60 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-500/10 text-red-400 border border-red-500/30 shadow-lg shadow-red-500/10 animate-pulse">
            <Radio className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-100 font-mono">
                3D Threat & Evidence Correlation Sphere
              </h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-red-500/20 text-red-400 border border-red-500/30">
                ACTIVE C2 ORIGIN TRACKED
              </span>
            </div>
            <p className="text-[11px] font-mono text-slate-400 mt-0.5">
              Multi-Vector Infiltration & Exfiltration: Zurich C2 (Origin) ➔ London Gateway ➔ Austin Endpoint (Victim) ➔ S3 Vault
            </p>
          </div>
        </div>

        {/* Global Layer, Overlays & View Mode Switcher */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Heatmap Toggle */}
          <button
            onClick={() => setHeatmapEnabled(!heatmapEnabled)}
            className={`px-2.5 py-1 rounded text-xs font-mono font-medium transition cursor-pointer flex items-center gap-1.5 ${
              heatmapEnabled
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold'
                : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200'
            }`}
            title="Toggle Global Threat Density Heatmap Blooms"
          >
            <Flame className={`h-3.5 w-3.5 ${heatmapEnabled ? 'text-rose-400 animate-pulse' : 'text-slate-500'}`} />
            <span>Heatmap {heatmapEnabled ? 'ON' : 'OFF'}</span>
          </button>

          {/* Threat Actors Overlay Toggle */}
          <button
            onClick={() => setThreatActorOverlayOpen(!threatActorOverlayOpen)}
            className={`px-2.5 py-1 rounded text-xs font-mono font-medium transition cursor-pointer flex items-center gap-1.5 ${
              threatActorOverlayOpen
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 font-bold'
                : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200'
            }`}
            title="Toggle Automated Threat Actor Overlay HUD"
          >
            <ShieldAlert className="h-3.5 w-3.5 text-purple-400" />
            <span>Threat Actors ({WORLDWIDE_THREAT_ACTORS.length})</span>
          </button>

          {/* Latency Stats Panel Toggle */}
          <button
            onClick={() => setLatencyPanelOpen(!latencyPanelOpen)}
            className={`px-2.5 py-1 rounded text-xs font-mono font-medium transition cursor-pointer flex items-center gap-1.5 ${
              latencyPanelOpen
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold'
                : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200'
            }`}
            title="Toggle Threat Connection Latency Stats & Vector Diagnostics"
          >
            <Activity className="h-3.5 w-3.5 text-emerald-400" />
            <span>Latency Telemetry</span>
          </button>

          {/* Hotspots Density Legend Toggle */}
          <button
            onClick={() => setHeatmapLegendOpen(!heatmapLegendOpen)}
            className={`px-2.5 py-1 rounded text-xs font-mono font-medium transition cursor-pointer flex items-center gap-1.5 ${
              heatmapLegendOpen
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold'
                : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200'
            }`}
            title="Toggle Threat Density Clusters & Top Hotspots List"
          >
            <Globe className="h-3.5 w-3.5 text-amber-400" />
            <span>Hotspots ({REAL_WORLD_HEATMAP_POINTS.length})</span>
          </button>

          {/* Gestures Guide Button */}
          <button
            onClick={() => setGestureGuideOpen(!gestureGuideOpen)}
            className={`px-2.5 py-1 rounded text-xs font-mono font-medium transition cursor-pointer flex items-center gap-1.5 ${
              gestureGuideOpen
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
                : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200'
            }`}
            title="View Gesture-Based Multi-Touch & Pointer Controls"
          >
            <Layers className="h-3.5 w-3.5 text-cyan-400" />
            <span>Gestures</span>
          </button>

          <div className="flex items-center p-1 rounded-lg bg-slate-950 border border-slate-800">
            <button
              onClick={() => setMapStyle('REAL_SATELLITE')}
              className={`px-2.5 py-1 rounded text-xs font-mono font-medium transition cursor-pointer ${
                mapStyle === 'REAL_SATELLITE'
                  ? 'bg-cyan-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Photorealistic NASA Satellite Earth with Clouds"
            >
              NASA Satellite
            </button>
            <button
              onClick={() => setMapStyle('NIGHT_LIGHTS')}
              className={`px-2.5 py-1 rounded text-xs font-mono font-medium transition cursor-pointer ${
                mapStyle === 'NIGHT_LIGHTS'
                  ? 'bg-cyan-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Night Satellite City Lights"
            >
              Night Lights
            </button>
            <button
              onClick={() => setMapStyle('TACTICAL_CYBER')}
              className={`px-2.5 py-1 rounded text-xs font-mono font-medium transition cursor-pointer ${
                mapStyle === 'TACTICAL_CYBER'
                  ? 'bg-cyan-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Tactical Cyber Grid Overlay"
            >
              Tactical HUD
            </button>
          </div>

          <button
            onClick={() => setIsFullScreen(!isFullScreen)}
            className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 transition cursor-pointer"
            title={isFullScreen ? 'Exit Full Screen' : 'Full Screen View'}
          >
            {isFullScreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* 2. REGION & TARGET FOCUS TOOLBAR */}
      <div className="px-3 sm:px-4 py-2 border-b border-slate-800/60 bg-slate-950/70 flex items-center justify-between gap-2 overflow-x-auto scrollbar-none text-xs font-mono">
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-slate-500 uppercase text-[10px] font-bold mr-1 flex items-center gap-1">
            <Crosshair className="h-3 w-3 text-cyan-400" /> Focus Target:
          </span>
          <button
            onClick={handleFocusOrigin}
            className="px-2.5 py-1 rounded-md bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40 font-bold flex items-center gap-1 transition cursor-pointer"
          >
            <Flame className="h-3 w-3 text-red-400 animate-pulse" />
            <span>Zurich C2 (Origin)</span>
          </button>
          <button
            onClick={handleFocusVictim}
            className="px-2.5 py-1 rounded-md bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-semibold flex items-center gap-1 transition cursor-pointer"
          >
            <Laptop className="h-3 w-3 text-amber-400" />
            <span>Austin Endpoint (Victim)</span>
          </button>
          <button
            onClick={() => {
              const gw = INITIAL_THREAT_NODES.find((n) => n.id === 'node-gateway-london');
              if (gw) {
                focusOnCoordinates(gw.lat, gw.lon, 17);
                setSelectedNode(gw);
              }
            }}
            className="px-2.5 py-1 rounded-md bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 transition cursor-pointer"
          >
            <Server className="h-3 w-3 text-cyan-400" />
            <span>London Gateway</span>
          </button>
          <button
            onClick={() => {
              const mob = INITIAL_THREAT_NODES.find((n) => n.id === 'node-mobile-dc');
              if (mob) {
                focusOnCoordinates(mob.lat, mob.lon, 17);
                setSelectedNode(mob);
              }
            }}
            className="px-2.5 py-1 rounded-md bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition cursor-pointer"
          >
            <Smartphone className="h-3 w-3 text-slate-400" />
            <span>DC Mobile</span>
          </button>
          <button
            onClick={() => {
              const sat = INITIAL_THREAT_NODES.find((n) => n.id === 'node-satellite-tokyo');
              if (sat) {
                focusOnCoordinates(sat.lat, sat.lon, 17);
                setSelectedNode(sat);
              }
            }}
            className="px-2.5 py-1 rounded-md bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition cursor-pointer"
          >
            <Satellite className="h-3 w-3 text-slate-400" />
            <span>Tokyo Satellite</span>
          </button>
        </div>

        {/* Geographic Presets (Including User Reference Image angle) */}
        <div className="flex items-center gap-1 shrink-0">
          <span className="text-slate-500 text-[10px] uppercase font-bold mr-1">Regions:</span>
          <button
            onClick={handleFocusEMEA}
            className="px-2 py-0.8 rounded text-[11px] bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-cyan-500/30 font-medium transition cursor-pointer"
            title="Exact Reference View: Africa, Europe, Middle East"
          >
            EMEA (Reference View)
          </button>
          <button
            onClick={handleFocusAmericas}
            className="px-2 py-0.8 rounded text-[11px] bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition cursor-pointer"
          >
            Americas
          </button>
          <button
            onClick={handleFocusAPAC}
            className="px-2 py-0.8 rounded text-[11px] bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition cursor-pointer"
          >
            Asia-Pacific
          </button>
        </div>
      </div>

      {/* 3. 3D WEBGL CANVAS STAGE */}
      <div className="relative w-full">
        <div
          ref={mountRef}
          className={`w-full ${isFullScreen ? 'h-[calc(100vh-12rem)]' : interactiveHeight} select-none cursor-grab active:cursor-grabbing`}
        />

        {/* VIRTUAL COMPASS & ORIENTATION D-PAD (TOP LEFT) */}
        <div className="absolute top-3 left-3 z-10 flex flex-col items-center bg-slate-950/80 p-1.5 rounded-xl border border-slate-800 backdrop-blur-md shadow-xl">
          <button
            onClick={() => handleNudge('UP')}
            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-cyan-300 transition cursor-pointer"
            title="Pitch Up"
          >
            <ChevronUp className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-1">
            <button
              onClick={() => handleNudge('LEFT')}
              className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-cyan-300 transition cursor-pointer"
              title="Rotate West (Left)"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={handleResetView}
              className="p-1 rounded bg-slate-900 hover:bg-slate-800 text-cyan-400 border border-slate-700/80 transition cursor-pointer text-[10px] font-mono font-bold"
              title="Reset Horizon"
            >
              <Compass className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => handleNudge('RIGHT')}
              className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-cyan-300 transition cursor-pointer"
              title="Rotate East (Right)"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <button
            onClick={() => handleNudge('DOWN')}
            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-cyan-300 transition cursor-pointer"
            title="Pitch Down"
          >
            <ChevronDown className="h-4 w-4" />
          </button>
        </div>

        {/* FLOATING CONTROLS HUD (TOP RIGHT) */}
        <div className="absolute top-3 right-3 flex flex-col gap-1.5 z-10">
          <button
            onClick={() => setIsAutoRotating(!isAutoRotating)}
            className={`p-2 rounded-lg border backdrop-blur-md shadow-lg transition cursor-pointer ${
              isAutoRotating
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
            title={isAutoRotating ? 'Pause Orbital Auto-Rotation' : 'Resume Orbital Auto-Rotation'}
          >
            {isAutoRotating ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </button>

          <button
            onClick={handleZoomIn}
            className="p-2 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-800 backdrop-blur-md shadow-lg transition cursor-pointer"
            title="Zoom In (or use 2-finger pinch / mouse wheel)"
          >
            <ZoomIn className="h-4 w-4" />
          </button>

          <button
            onClick={handleZoomOut}
            className="p-2 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-800 backdrop-blur-md shadow-lg transition cursor-pointer"
            title="Zoom Out (or use 2-finger pinch / mouse wheel)"
          >
            <ZoomOut className="h-4 w-4" />
          </button>

          <button
            onClick={handleResetView}
            className="p-2 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-800 backdrop-blur-md shadow-lg transition cursor-pointer"
            title="Reset Orbit & Rotation"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>

        {/* GESTURE TOAST NOTIFICATION */}
        {gestureFeedback && (
          <div className="absolute bottom-14 left-1/2 -translate-x-1/2 z-20 px-4 py-1.5 rounded-full bg-slate-950/95 border border-cyan-500/60 text-cyan-300 text-xs font-mono font-bold shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 pointer-events-none flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
            <span>{gestureFeedback}</span>
          </div>
        )}

        {/* THREAT ACTOR OVERLAY HUD */}
        {threatActorOverlayOpen && (
          <div className="absolute top-16 left-3 z-20 max-w-sm sm:max-w-md w-full">
            <ThreatActorOverlayHUD
              actors={WORLDWIDE_THREAT_ACTORS}
              selectedActor={selectedActor}
              onSelectActor={(actor) => {
                setSelectedActor(actor);
                if (actor.operationalNodes.length > 0) {
                  const node = INITIAL_THREAT_NODES.find((n) => n.id === actor.operationalNodes[0]);
                  if (node) {
                    focusOnCoordinates(node.lat, node.lon, 17);
                    setSelectedNode(node);
                  }
                }
              }}
              onFocusActorOrigin={(actor) => {
                setSelectedActor(actor);
                if (actor.operationalNodes.length > 0) {
                  const node = INITIAL_THREAT_NODES.find((n) => n.id === actor.operationalNodes[0]);
                  if (node) {
                    focusOnCoordinates(node.lat, node.lon, 17);
                    setSelectedNode(node);
                  }
                }
              }}
              isAutoTracking={isAutoTrackingActor}
              onToggleAutoTracking={() => setIsAutoTrackingActor(!isAutoTrackingActor)}
              onClose={() => setThreatActorOverlayOpen(false)}
            />
          </div>
        )}

        {/* HEATMAP LEGEND & DENSITY CLUSTERS */}
        {heatmapLegendOpen && (
          <div className="absolute top-16 right-3 z-20 max-w-sm w-full">
            <ThreatHeatmapLegend
              heatmapPoints={REAL_WORLD_HEATMAP_POINTS}
              selectedPoint={selectedHeatmapPoint}
              onSelectPoint={(pt) => {
                setSelectedHeatmapPoint(pt);
                focusOnCoordinates(pt.lat, pt.lon, 18);
              }}
              onClose={() => setHeatmapLegendOpen(false)}
            />
          </div>
        )}

        {/* LATENCY STATS PANEL */}
        {latencyPanelOpen && (
          <div className="absolute inset-x-3 bottom-14 z-30 flex justify-center pointer-events-auto">
            <div className="w-full max-w-2xl max-h-[70vh] overflow-y-auto rounded-2xl shadow-2xl border border-slate-700 bg-slate-950/95 backdrop-blur-xl">
              <ThreatLatencyStatsPanel
                selectedVector={selectedVectorForLatency}
                onClose={() => setLatencyPanelOpen(false)}
              />
            </div>
          </div>
        )}

        {/* ORBITAL COORDINATES & TELEMETRY BADGE (BOTTOM RIGHT) */}
        <div className="absolute bottom-3 right-3 px-3 py-1.5 rounded-lg bg-slate-950/85 border border-slate-800/80 backdrop-blur-md text-[10px] font-mono text-slate-400 space-y-0.5 shadow-xl pointer-events-none">
          <div className="flex items-center gap-2">
            <span className="text-slate-500">ORBIT:</span>
            <span className="text-cyan-300 font-bold">
              {currentCoordsTelemetry.lat >= 0 ? `${currentCoordsTelemetry.lat}°N` : `${Math.abs(currentCoordsTelemetry.lat)}°S`},{' '}
              {currentCoordsTelemetry.lon >= 0 ? `${currentCoordsTelemetry.lon}°E` : `${Math.abs(currentCoordsTelemetry.lon)}°W`}
            </span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span>ALT: <span className="text-slate-200">{currentCoordsTelemetry.altKm.toLocaleString()} KM</span></span>
            <span>ZOOM: <span className="text-emerald-400 font-bold">{cameraZoomLevel}x</span></span>
          </div>
        </div>

        {/* HOVER TOOLTIP CARD (FLOATING OVER MOUSE HOVER) */}
        {hoveredNode && !selectedNode && (
          <div className="absolute top-4 left-24 p-3 rounded-xl bg-slate-950/90 border border-slate-700 shadow-2xl backdrop-blur-lg font-mono text-xs max-w-xs pointer-events-none animate-in fade-in duration-150 z-20">
            <div className="flex items-center justify-between gap-2 pb-1 border-b border-slate-800">
              <span className="font-bold text-slate-100 flex items-center gap-1.5">
                <Crosshair className="h-3.5 w-3.5 text-cyan-400" />
                {hoveredNode.name}
              </span>
              <span
                className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                  hoveredNode.status === 'C2_ORIGIN'
                    ? 'bg-red-500/20 text-red-400'
                    : hoveredNode.status === 'COMPROMISED'
                    ? 'bg-amber-500/20 text-amber-300'
                    : 'bg-cyan-500/20 text-cyan-300'
                }`}
              >
                {hoveredNode.status}
              </span>
            </div>
            <div className="mt-2 space-y-1 text-[11px] text-slate-300">
              <div><span className="text-slate-500">IP:</span> {hoveredNode.ip} ({hoveredNode.country})</div>
              <div><span className="text-slate-500">ASN:</span> {hoveredNode.asn}</div>
              <div><span className="text-slate-500">Rate:</span> <span className="text-emerald-400 font-bold">{hoveredNode.exfiltrationRate}</span></div>
            </div>
            <div className="mt-2 pt-1.5 border-t border-slate-800 text-[10px] text-cyan-400 flex items-center gap-1 font-sans font-semibold">
              Click node to open Deep Research & Dossier <ChevronRight className="h-3 w-3" />
            </div>
          </div>
        )}

        {/* HOVER VECTOR TOOLTIP */}
        {hoveredVector && !hoveredNode && !selectedNode && (
          <div className="absolute top-4 left-24 p-3 rounded-xl bg-slate-950/90 border border-cyan-500/50 shadow-2xl backdrop-blur-lg font-mono text-xs max-w-xs pointer-events-none animate-in fade-in duration-150 z-20">
            <div className="flex items-center justify-between gap-2 pb-1 border-b border-slate-800">
              <span className="font-bold text-cyan-300 flex items-center gap-1.5">
                <Activity className="h-3.5 w-3.5 text-cyan-400" />
                {hoveredVector.name.split(':')[0]}
              </span>
              <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-300">
                {hoveredVector.protocol}
              </span>
            </div>
            <div className="mt-2 space-y-1 text-[11px] text-slate-300">
              <div><span className="text-slate-500">Bandwidth:</span> {hoveredVector.bandwidth}</div>
              <div><span className="text-slate-500">Flow Rate:</span> <span className="text-emerald-400 font-bold">{hoveredVector.flowRate}</span></div>
              <div><span className="text-slate-500">State:</span> <span className="text-red-400 font-bold">{hoveredVector.status}</span></div>
            </div>
            <div className="mt-2 pt-1.5 border-t border-slate-800 text-[10px] text-cyan-400 flex items-center gap-1 font-sans font-semibold">
              Click vector to view Connection Latency Telemetry <ChevronRight className="h-3 w-3" />
            </div>
          </div>
        )}

        {/* SELECTED NODE INSPECTOR PANEL (BOTTOM LEFT) */}
        {selectedNode && (
          <div className="absolute bottom-3 left-3 right-3 sm:right-auto sm:max-w-md rounded-xl border border-slate-700 bg-slate-950/95 p-4 text-xs font-mono shadow-2xl backdrop-blur-xl animate-in slide-in-from-bottom-2 duration-200 z-20">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div
                  className={`p-1.5 rounded-lg ${
                    selectedNode.status === 'C2_ORIGIN'
                      ? 'bg-red-500/20 text-red-400 animate-pulse'
                      : selectedNode.status === 'COMPROMISED'
                      ? 'bg-amber-500/20 text-amber-400'
                      : 'bg-cyan-500/20 text-cyan-400'
                  }`}
                >
                  <ShieldAlert className="h-4 w-4" />
                </div>
                <div>
                  <span className="font-bold text-slate-100 block">{selectedNode.name}</span>
                  <span className="text-[10px] text-slate-400">{selectedNode.type}</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedNode(null)}
                className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300">
              <div className="p-2 rounded bg-slate-900 border border-slate-800">
                <span className="text-slate-500 block text-[10px]">IP / Geolocation:</span>
                <span className="text-cyan-300 font-bold">{selectedNode.ip}</span>
                <span className="text-slate-400 block text-[10px]">{selectedNode.country}</span>
              </div>
              <div className="p-2 rounded bg-slate-900 border border-slate-800">
                <span className="text-slate-500 block text-[10px]">Threat Level:</span>
                <span
                  className={`font-bold ${
                    selectedNode.threatLevel === 'CRITICAL' ? 'text-red-400' : 'text-amber-300'
                  }`}
                >
                  {selectedNode.threatLevel} (Score: {selectedNode.threatScore}/100)
                </span>
                <span className="text-slate-400 block text-[10px]">{selectedNode.attributionActor}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-3 pt-2 border-t border-slate-800 flex items-center justify-between gap-2">
              <button
                onClick={() => setDeepResearchOpen(true)}
                className="flex-1 py-1.5 px-3 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40 text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-lg shadow-red-500/10"
              >
                <Search className="h-3.5 w-3.5" />
                <span>Deep Research & Dossier</span>
              </button>
              <button
                onClick={() => focusOnCoordinates(selectedNode.lat, selectedNode.lon, 16)}
                className="py-1.5 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <Crosshair className="h-3.5 w-3.5 text-cyan-400" />
                <span>Recenter</span>
              </button>
            </div>
          </div>
        )}

        {/* DEFAULT INSTRUCTION PILL (IF NO NODE SELECTED) */}
        {!selectedNode && (
          <div className="absolute bottom-3 left-3 px-3 py-1.5 rounded-lg bg-slate-950/80 border border-slate-800/80 backdrop-blur-md text-[11px] font-mono text-slate-400 flex items-center gap-2 pointer-events-none shadow-xl z-10">
            <Eye className="h-3.5 w-3.5 text-cyan-400 animate-pulse" />
            <span>
              1-Finger drag to rotate • 2-Finger pinch to zoom • Double-tap to focus coordinates • Tap laser vectors for latency telemetry
            </span>
          </div>
        )}
      </div>

      {/* 4. ACTIVE FLOWING ATTACK VECTORS STATUS STRIP */}
      <div className="p-3 bg-slate-950 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-slate-400 font-bold uppercase text-[10px] flex items-center gap-1.5">
            <Zap className="h-3.5 w-3.5 text-amber-400" />
            Live Flowing Vectors ({INITIAL_ATTACK_VECTORS.length}):
          </span>
          <div className="flex items-center gap-1.5 flex-wrap">
            {INITIAL_ATTACK_VECTORS.map((v) => (
              <button
                key={v.id}
                onClick={() => {
                  setSelectedVectorForLatency(v);
                  setLatencyPanelOpen(true);
                }}
                className={`px-2 py-0.5 rounded text-[10px] font-bold border transition cursor-pointer flex items-center gap-1 ${
                  selectedVectorForLatency?.id === v.id
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow'
                    : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
                title="Click to view real-time latency diagnostics for this vector"
              >
                <span
                  className="h-1.5 w-1.5 rounded-full animate-ping"
                  style={{ backgroundColor: v.color === 0xef4444 ? '#ef4444' : v.color === 0xf59e0b ? '#f59e0b' : '#06b6d4' }}
                />
                <span>{v.name.split(':')[0]} ({v.bandwidth.split(' ')[0]} MB/s)</span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 text-[11px] text-slate-400">
          <span>Global Attack Throughput: <strong className="text-red-400 font-bold">125.1 MB/s</strong></span>
          <span>•</span>
          <button
            onClick={() => {
              const origin = INITIAL_THREAT_NODES.find((n) => n.status === 'C2_ORIGIN');
              if (origin) {
                setSelectedNode(origin);
                setDeepResearchOpen(true);
              }
            }}
            className="text-cyan-400 hover:text-cyan-300 underline font-bold transition cursor-pointer"
          >
            Launch C2 Deep Research
          </button>
        </div>
      </div>

      {/* 5. GESTURES GUIDE MODAL */}
      {gestureGuideOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900/95 p-5 shadow-2xl font-mono text-xs text-slate-300 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                  <Layers className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-100 uppercase">Gesture-Based Globe Controls</h4>
                  <p className="text-[10px] text-slate-400">Multi-Touch & Pointer Telemetry Directives</p>
                </div>
              </div>
              <button
                onClick={() => setGestureGuideOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2.5">
              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-start gap-3">
                <span className="px-2 py-1 rounded bg-cyan-500/20 text-cyan-300 font-bold text-[10px] shrink-0">1-Finger / Drag</span>
                <div>
                  <span className="font-bold text-slate-200 block">Orbit & Free Rotation</span>
                  <span className="text-[11px] text-slate-400">Swipe or drag across any ocean or continent to rotate the 3D globe with natural spherical inertia and momentum.</span>
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-start gap-3">
                <span className="px-2 py-1 rounded bg-emerald-500/20 text-emerald-300 font-bold text-[10px] shrink-0">2-Finger / Pinch</span>
                <div>
                  <span className="font-bold text-slate-200 block">Pinch to Zoom</span>
                  <span className="text-[11px] text-slate-400">Pinch in or spread out two fingers (or use mouse scroll wheel) to transition seamlessly from low earth orbit to deep regional zoom.</span>
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-start gap-3">
                <span className="px-2 py-1 rounded bg-amber-500/20 text-amber-300 font-bold text-[10px] shrink-0">Double Tap</span>
                <div>
                  <span className="font-bold text-slate-200 block">Precision Raycast Target Focus</span>
                  <span className="text-[11px] text-slate-400">Double-tap anywhere on the sphere surface to calculate 3D Cartesian coordinates and smoothly center the horizon.</span>
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-start gap-3">
                <span className="px-2 py-1 rounded bg-rose-500/20 text-rose-300 font-bold text-[10px] shrink-0">Vector Tap</span>
                <div>
                  <span className="font-bold text-slate-200 block">Connection Latency & Telemetry</span>
                  <span className="text-[11px] text-slate-400">Click or tap any flowing laser attack vector or hotspot bloom to inspect round-trip latency, jitter, packet loss, and MTU.</span>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setGestureGuideOpen(false)}
                className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition cursor-pointer"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. DEEP RESEARCH THREAT INTELLIGENCE MODAL */}
      {deepResearchOpen && (
        <ThreatGlobeDeepResearch
          node={selectedNode || INITIAL_THREAT_NODES[0]}
          activeVectors={INITIAL_ATTACK_VECTORS}
          onClose={() => setDeepResearchOpen(false)}
          onFocusNode={(n) => {
            setDeepResearchOpen(false);
            focusOnCoordinates(n.lat, n.lon, 17);
            setSelectedNode(n);
          }}
        />
      )}
    </div>
  );
};
