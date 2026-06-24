import { useEffect, useRef } from 'react';
import * as THREE from 'three';

/** Soft ambient particles for portal backgrounds — low intensity, soothing motion. */
export function PortalAmbientScene() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
    camera.position.z = 8;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    const count = 800;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    for (let i = 0; i < count; i += 1) {
      positions[i * 3] = (Math.random() - 0.5) * 28;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 18;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 12;
      colors[i * 3] = 0.0;
      colors[i * 3 + 1] = 0.35 + Math.random() * 0.35;
      colors[i * 3 + 2] = 0.85 + Math.random() * 0.15;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const particles = new THREE.Points(
      geometry,
      new THREE.PointsMaterial({
        vertexColors: true,
        size: 0.03,
        transparent: true,
        opacity: 0.28,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    scene.add(particles);

    const orbitRings: THREE.Mesh[] = [];
    [4, 6].forEach((radius, index) => {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(radius, 0.018, 6, 80),
        new THREE.MeshBasicMaterial({
          color: 0x0044ff,
          transparent: true,
          opacity: 0.08 - index * 0.02,
        }),
      );
      ring.rotation.x = Math.PI / 2.2;
      orbitRings.push(ring);
      scene.add(ring);
    });

    const waveGeometry = new THREE.PlaneGeometry(18, 12, 32, 24);
    const waveMaterial = new THREE.MeshBasicMaterial({
      color: 0x0044ff,
      wireframe: true,
      transparent: true,
      opacity: 0.04,
    });
    const wave = new THREE.Mesh(waveGeometry, waveMaterial);
    wave.rotation.x = -Math.PI / 2.8;
    wave.position.y = -2;
    scene.add(wave);

    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;

    const handlePointerMove = (event: PointerEvent) => {
      targetX = (event.clientX / window.innerWidth - 0.5) * 2;
      targetY = (event.clientY / window.innerHeight - 0.5) * 2;
    };

    const handleResize = () => {
      const width = container.clientWidth;
      const height = container.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('resize', handleResize);
    handleResize();

    const clock = new THREE.Clock();
    let frame = 0;

    const animate = () => {
      frame = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      currentX += (targetX - currentX) * 0.03;
      currentY += (targetY - currentY) * 0.03;

      particles.rotation.y = elapsed * 0.018 + currentX * 0.1;
      particles.rotation.x = elapsed * 0.01 + currentY * 0.06;

      orbitRings.forEach((ring, index) => {
        ring.rotation.z = elapsed * (0.06 + index * 0.02);
      });

      const positionsAttr = waveGeometry.attributes.position;
      for (let i = 0; i < positionsAttr.count; i += 1) {
        const x = positionsAttr.getX(i);
        const y = positionsAttr.getY(i);
        positionsAttr.setZ(
          i,
          Math.sin(x * 0.45 + elapsed * 0.6) * 0.25 + Math.cos(y * 0.35 + elapsed * 0.4) * 0.2,
        );
      }
      positionsAttr.needsUpdate = true;

      camera.position.x = currentX * 0.25;
      camera.position.y = -currentY * 0.15;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      geometry.dispose();
      (particles.material as THREE.Material).dispose();
      waveGeometry.dispose();
      waveMaterial.dispose();
      orbitRings.forEach((ring) => {
        ring.geometry.dispose();
        (ring.material as THREE.Material).dispose();
      });
      container.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={containerRef} className="portal-ambient-scene" aria-hidden="true" />;
}
