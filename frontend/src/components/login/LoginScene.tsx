import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export function LoginScene() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 100);
    camera.position.z = 6;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    const particleCount = 1200;
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i += 1) {
      positions[i * 3] = (Math.random() - 0.5) * 14;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 10;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 8;
    }

    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const particles = new THREE.Points(
      particleGeometry,
      new THREE.PointsMaterial({
        color: 0x0055ff,
        size: 0.035,
        transparent: true,
        opacity: 0.55,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    scene.add(particles);

    const rings: THREE.Mesh[] = [];
    const ringMaterials: THREE.MeshBasicMaterial[] = [];
    for (let i = 0; i < 4; i += 1) {
      const ringGeometry = new THREE.TorusGeometry(0.65 + i * 0.35, 0.018, 12, 80);
      const ringMaterial = new THREE.MeshBasicMaterial({
        color: 0x0055ff,
        transparent: true,
        opacity: 0.12 + i * 0.04,
      });
      const ring = new THREE.Mesh(ringGeometry, ringMaterial);
      ring.rotation.x = Math.PI / 2 + i * 0.25;
      ring.rotation.y = i * 0.45;
      scene.add(ring);
      rings.push(ring);
      ringMaterials.push(ringMaterial);
    }

    const coreGeometry = new THREE.IcosahedronGeometry(0.35, 1);
    const coreMaterial = new THREE.MeshBasicMaterial({
      color: 0x0033cc,
      wireframe: true,
      transparent: true,
      opacity: 0.35,
    });
    const core = new THREE.Mesh(coreGeometry, coreMaterial);
    scene.add(core);

    let mouseX = 0;
    let mouseY = 0;
    let targetMouseX = 0;
    let targetMouseY = 0;

    const handlePointerMove = (event: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      targetMouseX = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
      targetMouseY = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
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

    let animationFrame = 0;
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrame = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      mouseX += (targetMouseX - mouseX) * 0.06;
      mouseY += (targetMouseY - mouseY) * 0.06;

      particles.rotation.y = elapsed * 0.04 + mouseX * 0.15;
      particles.rotation.x = elapsed * 0.02 + mouseY * 0.1;

      rings.forEach((ring, index) => {
        ring.rotation.z = elapsed * (0.15 + index * 0.05);
        ring.rotation.x = Math.PI / 2 + index * 0.25 + mouseY * 0.25;
        ring.rotation.y = index * 0.45 + mouseX * 0.25;
      });

      core.rotation.x = elapsed * 0.25;
      core.rotation.y = elapsed * 0.35 + mouseX * 0.2;

      camera.position.x += (mouseX * 0.45 - camera.position.x) * 0.04;
      camera.position.y += (-mouseY * 0.35 - camera.position.y) * 0.04;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrame);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      particleGeometry.dispose();
      (particles.material as THREE.Material).dispose();
      coreGeometry.dispose();
      coreMaterial.dispose();
      rings.forEach((ring, index) => {
        ring.geometry.dispose();
        ringMaterials[index].dispose();
      });
      container.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={containerRef} className="login-scene" aria-hidden="true" />;
}
