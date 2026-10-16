import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Chess } from 'chess.js';
import type { Square } from 'chess.js';
import type { BoardTheme, PieceStyleId, MoveAnalysis } from '../../types/chess';
import { RotateCcw, ZoomIn, ZoomOut, Move } from 'lucide-react';

interface Chessboard3DProps {
  chess: Chess;
  boardTheme: BoardTheme;
  pieceStyle: PieceStyleId;
  flipped: boolean;
  onMove: (from: Square, to: Square, promotion?: string) => boolean | Promise<boolean>;
  lastAnalysis?: MoveAnalysis;
  disabled?: boolean;
}

export const Chessboard3D: React.FC<Chessboard3DProps> = ({
  chess,
  boardTheme,
  pieceStyle,
  flipped,
  onMove,
  lastAnalysis,
  disabled = false,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [legalMoves, setLegalMoves] = useState<Square[]>([]);

  // Refs for Three.js state
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const piecesGroupRef = useRef<THREE.Group | null>(null);
  const highlightsGroupRef = useRef<THREE.Group | null>(null);
  const squaresGroupRef = useRef<THREE.Group | null>(null);

  // Mouse interaction for camera orbit
  const isDraggingRef = useRef(false);
  const prevMousePosRef = useRef({ x: 0, y: 0 });
  const cameraAngleRef = useRef({ theta: flipped ? Math.PI : 0, phi: Math.PI / 4, radius: 14 });

  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  const ranks = ['1', '2', '3', '4', '5', '6', '7', '8'];

  // Helper: map chess square to 3D world coords
  // Board center is (0, 0, 0). Squares are size 1.0, ranges x: -3.5 to 3.5, z: -3.5 to 3.5
  const squareToCoords = (square: Square): { x: number; z: number } => {
    const fIdx = files.indexOf(square[0]);
    const rIdx = ranks.indexOf(square[1]);
    const x = fIdx - 3.5;
    const z = 3.5 - rIdx;
    return { x, z };
  };

  const coordsToSquare = (x: number, z: number): Square | null => {
    const fIdx = Math.round(x + 3.5);
    const rIdx = Math.round(3.5 - z);
    if (fIdx >= 0 && fIdx < 8 && rIdx >= 0 && rIdx < 8) {
      return `${files[fIdx]}${ranks[rIdx]}` as Square;
    }
    return null;
  };

  // Initialize Three.js scene
  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // 1. Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x0b0f19);

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    cameraRef.current = camera;
    updateCameraPosition();

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    rendererRef.current = renderer;
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 4. Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xfffaed, 1.8);
    dirLight.position.set(7, 14, 8);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 35;
    dirLight.shadow.camera.left = -6;
    dirLight.shadow.camera.right = 6;
    dirLight.shadow.camera.top = 6;
    dirLight.shadow.camera.bottom = -6;
    dirLight.shadow.bias = -0.0005;
    scene.add(dirLight);

    const fillLight = new THREE.DirectionalLight(0x90b0e0, 0.6);
    fillLight.position.set(-8, 6, -8);
    scene.add(fillLight);

    // 5. Board Base
    const boardGroup = new THREE.Group();
    scene.add(boardGroup);

    // Board Frame
    const frameGeo = new THREE.BoxGeometry(9.2, 0.5, 9.2);
    const frameMat = new THREE.MeshStandardMaterial({
      color: 0x1f2937,
      roughness: 0.4,
      metalness: 0.2,
    });
    const frameMesh = new THREE.Mesh(frameGeo, frameMat);
    frameMesh.position.y = -0.26;
    frameMesh.receiveShadow = true;
    boardGroup.add(frameMesh);

    // Board Squares Group
    const squaresGroup = new THREE.Group();
    squaresGroupRef.current = squaresGroup;
    boardGroup.add(squaresGroup);

    // Highlights Group
    const highlightsGroup = new THREE.Group();
    highlightsGroupRef.current = highlightsGroup;
    scene.add(highlightsGroup);

    // Pieces Group
    const piecesGroup = new THREE.Group();
    piecesGroupRef.current = piecesGroup;
    scene.add(piecesGroup);

    // Animation Loop
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

    // Resize Handler
    const handleResize = () => {
      if (!mountRef.current || !renderer || !camera) return;
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Update camera position from spherical coords
  const updateCameraPosition = () => {
    if (!cameraRef.current) return;
    const { theta, phi, radius } = cameraAngleRef.current;
    const x = radius * Math.sin(phi) * Math.sin(theta);
    const y = radius * Math.cos(phi);
    const z = radius * Math.sin(phi) * Math.cos(theta);

    cameraRef.current.position.set(x, y, z);
    cameraRef.current.lookAt(0, 0, 0);
  };

  // Re-render board tiles when theme changes
  useEffect(() => {
    if (!squaresGroupRef.current) return;
    const group = squaresGroupRef.current;
    group.clear();

    const squareGeo = new THREE.BoxGeometry(0.98, 0.2, 0.98);
    const lightMat = new THREE.MeshStandardMaterial({
      color: boardTheme.lightSquare3D,
      roughness: 0.35,
      metalness: 0.1,
    });
    const darkMat = new THREE.MeshStandardMaterial({
      color: boardTheme.darkSquare3D,
      roughness: 0.45,
      metalness: 0.1,
    });

    for (let f = 0; f < 8; f++) {
      for (let r = 0; r < 8; r++) {
        const isLight = (f + r) % 2 === 1;
        const tile = new THREE.Mesh(squareGeo, isLight ? lightMat : darkMat);
        tile.position.set(f - 3.5, 0, 3.5 - r);
        tile.receiveShadow = true;
        (tile as unknown as { squareName: Square }).squareName = `${files[f]}${ranks[r]}` as Square;
        group.add(tile);
      }
    }
  }, [boardTheme]);

  // Re-render 3D pieces when position / style changes
  useEffect(() => {
    if (!piecesGroupRef.current) return;
    const group = piecesGroupRef.current;
    group.clear();

    const whiteMat = new THREE.MeshStandardMaterial({
      color: 0xf3f4f6,
      roughness: 0.25,
      metalness: 0.15,
    });
    const blackMat = new THREE.MeshStandardMaterial({
      color: 0x1f242d,
      roughness: 0.35,
      metalness: 0.25,
    });

    const board = chess.board();
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = board[r][c];
        if (!piece) continue;

        const sq = `${files[c]}${ranks[7 - r]}` as Square;
        const coords = squareToCoords(sq);
        const mat = piece.color === 'w' ? whiteMat : blackMat;
        const piece3D = create3DPiece(piece.type, mat);

        piece3D.position.set(coords.x, 0.1, coords.z);
        (piece3D as unknown as { squareName: Square }).squareName = sq;
        group.add(piece3D);
      }
    }
  }, [chess.fen(), pieceStyle]);

  // Update Highlight overlays (selected, legal moves, last move)
  useEffect(() => {
    if (!highlightsGroupRef.current) return;
    const group = highlightsGroupRef.current;
    group.clear();

    const planeGeo = new THREE.PlaneGeometry(0.96, 0.96);
    planeGeo.rotateX(-Math.PI / 2);

    // Last move highlight
    if (lastAnalysis) {
      [lastAnalysis.from, lastAnalysis.to].forEach((sq) => {
        const coords = squareToCoords(sq);
        const mat = new THREE.MeshBasicMaterial({
          color: 0xfacc15,
          transparent: true,
          opacity: 0.38,
        });
        const mesh = new THREE.Mesh(planeGeo, mat);
        mesh.position.set(coords.x, 0.11, coords.z);
        group.add(mesh);
      });
    }

    // Selected square highlight
    if (selectedSquare) {
      const coords = squareToCoords(selectedSquare);
      const mat = new THREE.MeshBasicMaterial({
        color: 0x06b6d4,
        transparent: true,
        opacity: 0.5,
      });
      const mesh = new THREE.Mesh(planeGeo, mat);
      mesh.position.set(coords.x, 0.12, coords.z);
      group.add(mesh);
    }

    // Legal destination dots
    legalMoves.forEach((sq) => {
      const coords = squareToCoords(sq);
      const isOccupied = chess.get(sq);
      if (isOccupied) {
        // Ring for capture
        const ringGeo = new THREE.RingGeometry(0.3, 0.44, 24);
        ringGeo.rotateX(-Math.PI / 2);
        const mat = new THREE.MeshBasicMaterial({ color: 0xef4444, transparent: true, opacity: 0.8 });
        const ring = new THREE.Mesh(ringGeo, mat);
        ring.position.set(coords.x, 0.13, coords.z);
        group.add(ring);
      } else {
        // Dot for move
        const circleGeo = new THREE.CircleGeometry(0.16, 20);
        circleGeo.rotateX(-Math.PI / 2);
        const mat = new THREE.MeshBasicMaterial({ color: 0x22c55e, transparent: true, opacity: 0.75 });
        const dot = new THREE.Mesh(circleGeo, mat);
        dot.position.set(coords.x, 0.13, coords.z);
        group.add(dot);
      }
    });
  }, [selectedSquare, legalMoves, lastAnalysis, chess.fen()]);

  // Click & Drag Raycasting
  const handlePointerDown = (e: React.PointerEvent) => {
    isDraggingRef.current = false;
    prevMousePosRef.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (e.buttons === 1 || e.buttons === 2) {
      const dx = e.clientX - prevMousePosRef.current.x;
      const dy = e.clientY - prevMousePosRef.current.y;

      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
        isDraggingRef.current = true;
      }

      // Rotate camera
      cameraAngleRef.current.theta -= dx * 0.007;
      cameraAngleRef.current.phi = Math.max(0.2, Math.min(Math.PI / 2.2, cameraAngleRef.current.phi - dy * 0.007));
      updateCameraPosition();
      prevMousePosRef.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handlePointerUp = async (e: React.PointerEvent) => {
    if (isDraggingRef.current || disabled) return;
    if (!rendererRef.current || !cameraRef.current) return;

    const rect = rendererRef.current.domElement.getBoundingClientRect();
    const mouse = new THREE.Vector2(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      -((e.clientY - rect.top) / rect.height) * 2 + 1
    );

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, cameraRef.current);

    // Check intersection with squares or pieces
    const targets: THREE.Object3D[] = [];
    if (squaresGroupRef.current) targets.push(...squaresGroupRef.current.children);
    if (piecesGroupRef.current) {
      piecesGroupRef.current.children.forEach((p) => {
        p.traverse((child) => {
          if (child instanceof THREE.Mesh) targets.push(child);
        });
      });
    }

    const intersects = raycaster.intersectObjects(targets, false);
    if (intersects.length > 0) {
      const hit = intersects[0].object;
      let clickedSquare: Square | null = null;

      if ((hit as unknown as { squareName?: Square }).squareName) {
        clickedSquare = (hit as unknown as { squareName: Square }).squareName;
      } else if (hit.parent && (hit.parent as unknown as { squareName?: Square }).squareName) {
        clickedSquare = (hit.parent as unknown as { squareName: Square }).squareName;
      } else {
        clickedSquare = coordsToSquare(intersects[0].point.x, intersects[0].point.z);
      }

      if (clickedSquare) {
        await processSquareClick(clickedSquare);
      }
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    cameraAngleRef.current.radius = Math.max(7, Math.min(22, cameraAngleRef.current.radius + e.deltaY * 0.015));
    updateCameraPosition();
  };

  const processSquareClick = async (square: Square) => {
    if (selectedSquare) {
      if (selectedSquare === square) {
        setSelectedSquare(null);
        setLegalMoves([]);
        return;
      }

      if (legalMoves.includes(square)) {
        const piece = chess.get(selectedSquare);
        const isPromotion = piece && piece.type === 'p' && (square.endsWith('8') || square.endsWith('1'));
        await onMove(selectedSquare, square, isPromotion ? 'q' : undefined);
        setSelectedSquare(null);
        setLegalMoves([]);
        return;
      }
    }

    const piece = chess.get(square);
    if (piece && piece.color === chess.turn()) {
      setSelectedSquare(square);
      const moves = chess.moves({ square, verbose: true });
      setLegalMoves(moves.map((m) => m.to as Square));
    } else {
      setSelectedSquare(null);
      setLegalMoves([]);
    }
  };

  const resetCamera = () => {
    cameraAngleRef.current = { theta: flipped ? Math.PI : 0, phi: Math.PI / 4, radius: 14 };
    updateCameraPosition();
  };

  const zoom = (delta: number) => {
    cameraAngleRef.current.radius = Math.max(7, Math.min(22, cameraAngleRef.current.radius + delta));
    updateCameraPosition();
  };

  return (
    <div className="relative aspect-square w-full max-w-[620px] select-none rounded-xl overflow-hidden border border-slate-700 bg-slate-950 shadow-2xl">
      <div
        ref={mountRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onWheel={handleWheel}
        className="h-full w-full cursor-grab active:cursor-grabbing"
      />

      {/* Floating 3D Controls */}
      <div className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900/90 p-1.5 backdrop-blur-md shadow-lg">
        <button
          onClick={() => zoom(-1.5)}
          className="rounded p-1.5 text-slate-300 hover:bg-slate-800 hover:text-white transition"
          title="Приблизить"
        >
          <ZoomIn className="h-4 w-4" />
        </button>
        <button
          onClick={() => zoom(1.5)}
          className="rounded p-1.5 text-slate-300 hover:bg-slate-800 hover:text-white transition"
          title="Отдалить"
        >
          <ZoomOut className="h-4 w-4" />
        </button>
        <button
          onClick={resetCamera}
          className="flex items-center gap-1 rounded px-2 py-1 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition"
          title="Сброс ракурса камеры"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span>Сброс</span>
        </button>
      </div>

      <div className="absolute top-3 left-3 flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-950/75 px-2.5 py-1 text-xs text-slate-400 backdrop-blur-sm pointer-events-none">
        <Move className="h-3 w-3 text-cyan-400" />
        <span>ЛКМ вращение / Клик для хода</span>
      </div>
    </div>
  );
};

// Procedural 3D Chess Piece Model Generator
function create3DPiece(type: string, material: THREE.Material): THREE.Group {
  const group = new THREE.Group();

  const addMesh = (geo: THREE.BufferGeometry, y: number, castShadow = true) => {
    const mesh = new THREE.Mesh(geo, material);
    mesh.position.y = y;
    mesh.castShadow = castShadow;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  };

  // Common pedestal base
  const base = new THREE.CylinderGeometry(0.36, 0.42, 0.12, 24);
  addMesh(base, 0.06);

  switch (type.toLowerCase()) {
    case 'p': {
      // Pawn
      const body = new THREE.CylinderGeometry(0.2, 0.32, 0.45, 20);
      addMesh(body, 0.34);
      const collar = new THREE.CylinderGeometry(0.26, 0.22, 0.06, 20);
      addMesh(collar, 0.58);
      const head = new THREE.SphereGeometry(0.2, 20, 20);
      addMesh(head, 0.74);
      break;
    }
    case 'r': {
      // Rook (Castle tower with battlements)
      const tower = new THREE.CylinderGeometry(0.27, 0.34, 0.65, 20);
      addMesh(tower, 0.44);
      const crown = new THREE.CylinderGeometry(0.35, 0.28, 0.18, 20);
      addMesh(crown, 0.82);
      // Crenels
      for (let i = 0; i < 4; i++) {
        const angle = (i * Math.PI) / 2;
        const crenel = new THREE.BoxGeometry(0.12, 0.12, 0.12);
        const cMesh = new THREE.Mesh(crenel, material);
        cMesh.position.set(Math.cos(angle) * 0.27, 0.94, Math.sin(angle) * 0.27);
        cMesh.castShadow = true;
        group.add(cMesh);
      }
      break;
    }
    case 'n': {
      // Knight (Horse head profile)
      const body = new THREE.CylinderGeometry(0.24, 0.33, 0.4, 20);
      addMesh(body, 0.32);
      const horse = new THREE.BoxGeometry(0.26, 0.5, 0.42);
      const hMesh = addMesh(horse, 0.68);
      hMesh.rotation.y = Math.PI / 4;
      const muzzle = new THREE.BoxGeometry(0.2, 0.22, 0.28);
      const mMesh = addMesh(muzzle, 0.76);
      mMesh.position.z = 0.2;
      break;
    }
    case 'b': {
      // Bishop
      const stem = new THREE.CylinderGeometry(0.2, 0.33, 0.62, 20);
      addMesh(stem, 0.43);
      const collar = new THREE.CylinderGeometry(0.28, 0.22, 0.08, 20);
      addMesh(collar, 0.76);
      const mitre = new THREE.ConeGeometry(0.24, 0.45, 20);
      addMesh(mitre, 0.96);
      const ball = new THREE.SphereGeometry(0.08, 16, 16);
      addMesh(ball, 1.22);
      break;
    }
    case 'q': {
      // Queen (Fluted coronet with sphere crown)
      const body = new THREE.CylinderGeometry(0.22, 0.35, 0.8, 20);
      addMesh(body, 0.52);
      const rim = new THREE.CylinderGeometry(0.36, 0.24, 0.14, 20);
      addMesh(rim, 0.96);
      const finial = new THREE.SphereGeometry(0.12, 16, 16);
      addMesh(finial, 1.1);
      break;
    }
    case 'k': {
      // King (Tall with Maltese cross on top)
      const body = new THREE.CylinderGeometry(0.25, 0.36, 0.9, 20);
      addMesh(body, 0.57);
      const rim = new THREE.CylinderGeometry(0.38, 0.28, 0.14, 20);
      addMesh(rim, 1.05);
      // Cross vertical
      const vCross = new THREE.BoxGeometry(0.07, 0.28, 0.07);
      addMesh(vCross, 1.25);
      // Cross horizontal
      const hCross = new THREE.BoxGeometry(0.22, 0.07, 0.07);
      addMesh(hCross, 1.28);
      break;
    }
  }

  return group;
}
