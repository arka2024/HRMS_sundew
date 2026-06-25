import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export function DashboardHeroScene() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 100);
    camera.position.z = 8;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    // Create floating particles
    const particleCount = 800;
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    
    for (let i = 0; i < particleCount; i += 1) {
      positions[i * 3] = (Math.random() - 0.5) * 20;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 12;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 10;
      
      // Gradient colors from blue to purple
      const t = Math.random();
      colors[i * 3] = 0.26 + t * 0.27; // R
      colors[i * 3 + 1] = 0.09 + t * 0.09; // G
      colors[i * 3 + 2] = 1.0 - t * 0.2; // B
    }

    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const particles = new THREE.Points(
      particleGeometry,
      new THREE.PointsMaterial({
        size: 0.04,
        transparent: true,
        opacity: 0.6,
        vertexColors: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    scene.add(particles);

    // Create geometric shapes
    const shapes: THREE.Mesh[] = [];
    const geometries: THREE.BufferGeometry[] = [];
    const materials: THREE.Material[] = [];

    // Icosahedron
    const icoGeometry = new THREE.IcosahedronGeometry(1.2, 0);
    const icoMaterial = new THREE.MeshBasicMaterial({
      color: 0x4318FF,
      wireframe: true,
      transparent: true,
      opacity: 0.15,
    });
    const icosahedron = new THREE.Mesh(icoGeometry, icoMaterial);
    icosahedron.position.set(-3, 1, -2);
    scene.add(icosahedron);
    shapes.push(icosahedron);
    geometries.push(icoGeometry);
    materials.push(icoMaterial);

    // Octahedron
    const octGeometry = new THREE.OctahedronGeometry(0.8, 0);
    const octMaterial = new THREE.MeshBasicMaterial({
      color: 0x00B5D8,
      wireframe: true,
      transparent: true,
      opacity: 0.2,
    });
    const octahedron = new THREE.Mesh(octGeometry, octMaterial);
    octahedron.position.set(3, -1, -1);
    scene.add(octahedron);
    shapes.push(octahedron);
    geometries.push(octGeometry);
    materials.push(octMaterial);

    // Torus
    const torusGeometry = new THREE.TorusGeometry(0.6, 0.15, 8, 32);
    const torusMaterial = new THREE.MeshBasicMaterial({
      color: 0x05CD99,
      wireframe: true,
      transparent: true,
      opacity: 0.18,
    });
    const torus = new THREE.Mesh(torusGeometry, torusMaterial);
    torus.position.set(0, 2, -3);
    scene.add(torus);
    shapes.push(torus);
    geometries.push(torusGeometry);
    materials.push(torusMaterial);

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

    let animationFrame = 0;
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrame = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      // Animate particles
      particles.rotation.y = elapsed * 0.03;
      particles.rotation.x = Math.sin(elapsed * 0.1) * 0.05;

      // Animate shapes
      shapes.forEach((shape, index) => {
        shape.rotation.x = elapsed * (0.1 + index * 0.05);
        shape.rotation.y = elapsed * (0.15 + index * 0.03);
        shape.position.y += Math.sin(elapsed * 0.5 + index) * 0.002;
      });

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrame);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      particleGeometry.dispose();
      (particles.material as THREE.Material).dispose();
      geometries.forEach((geo) => geo.dispose());
      materials.forEach((mat) => mat.dispose());
      container.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={containerRef} className="dashboard-hero-scene" aria-hidden="true" />;
}
