import { useEffect, useRef } from 'react';
import * as THREE from 'three';

/** Ambient Three.js background for the Manager Portal — orbital rings + soft particles. */
export function ManagerPortalScene() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(48, 1, 0.1, 100);
    camera.position.set(0, 1.5, 10);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    const particleCount = 700;
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i += 1) {
      positions[i * 3] = (Math.random() - 0.5) * 28;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 18;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 12;
    }

    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const particles = new THREE.Points(
      particleGeometry,
      new THREE.PointsMaterial({
        color: 0x0ea5e9,
        size: 0.035,
        transparent: true,
        opacity: 0.28,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    scene.add(particles);

    const rings: THREE.Mesh[] = [];
    [3.8, 5.2, 6.6].forEach((radius, index) => {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(radius, 0.025, 8, 96),
        new THREE.MeshBasicMaterial({
          color: index === 1 ? 0x0044ff : 0x0ea5e9,
          transparent: true,
          opacity: 0.14 - index * 0.02,
        }),
      );
      ring.rotation.x = Math.PI / 2 + index * 0.15;
      rings.push(ring);
      scene.add(ring);
    });

    const core = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.9, 0),
      new THREE.MeshStandardMaterial({
        color: 0x0044ff,
        emissive: 0x002266,
        emissiveIntensity: 0.7,
        metalness: 0.35,
        roughness: 0.3,
        wireframe: true,
      }),
    );
    scene.add(core);

    const ambient = new THREE.AmbientLight(0xffffff, 0.45);
    const point = new THREE.PointLight(0x66a3ff, 1.8, 30);
    point.position.set(3, 4, 5);
    scene.add(ambient, point);

    const handleResize = () => {
      const width = container.clientWidth;
      const height = container.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    const clock = new THREE.Clock();
    let frame = 0;

    const animate = () => {
      frame = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      core.rotation.x = elapsed * 0.4;
      core.rotation.y = elapsed * 0.55;
      core.position.y = Math.sin(elapsed * 0.8) * 0.25;

      rings.forEach((ring, index) => {
        ring.rotation.z = elapsed * (0.08 + index * 0.03) * (index % 2 === 0 ? 1 : -1);
      });

      particles.rotation.y = elapsed * 0.02;
      particles.rotation.x = Math.sin(elapsed * 0.15) * 0.08;

      camera.position.x = Math.sin(elapsed * 0.12) * 0.6;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      particleGeometry.dispose();
      (particles.material as THREE.Material).dispose();
      core.geometry.dispose();
      (core.material as THREE.Material).dispose();
      rings.forEach((ring) => {
        ring.geometry.dispose();
        (ring.material as THREE.Material).dispose();
      });
      container.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={containerRef} className="manager-portal-scene" aria-hidden="true" />;
}
