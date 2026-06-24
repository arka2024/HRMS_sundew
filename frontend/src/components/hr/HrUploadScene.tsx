import { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface HrUploadSceneProps {
  isUploading?: boolean;
  uploadProgress?: number;
}

/** Animated data-flow scene for HR employee upload — orbiting nodes + pulse on upload. */
export function HrUploadScene({ isUploading = false, uploadProgress = 0 }: HrUploadSceneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const uploadStateRef = useRef({ isUploading, uploadProgress });
  uploadStateRef.current = { isUploading, uploadProgress };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.set(0, 0, 12);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    const coreGeometry = new THREE.IcosahedronGeometry(1.2, 1);
    const coreMaterial = new THREE.MeshStandardMaterial({
      color: 0x0044ff,
      emissive: 0x001a66,
      emissiveIntensity: 0.6,
      metalness: 0.4,
      roughness: 0.25,
      wireframe: true,
    });
    const core = new THREE.Mesh(coreGeometry, coreMaterial);
    scene.add(core);

    const innerCore = new THREE.Mesh(
      new THREE.SphereGeometry(0.55, 24, 24),
      new THREE.MeshStandardMaterial({
        color: 0x66a3ff,
        emissive: 0x0044ff,
        emissiveIntensity: 0.8,
        transparent: true,
        opacity: 0.85,
      }),
    );
    scene.add(innerCore);

    const nodeCount = 8;
    const orbitNodes: THREE.Mesh[] = [];
    const orbitData: Array<{ radius: number; speed: number; offset: number; y: number }> = [];

    for (let i = 0; i < nodeCount; i += 1) {
      const node = new THREE.Mesh(
        new THREE.BoxGeometry(0.35, 0.35, 0.35),
        new THREE.MeshStandardMaterial({
          color: i % 2 === 0 ? 0x0044ff : 0x00c2ff,
          emissive: 0x002266,
          emissiveIntensity: 0.5,
        }),
      );
      orbitData.push({
        radius: 3.2 + (i % 3) * 0.6,
        speed: 0.25 + i * 0.04,
        offset: (i / nodeCount) * Math.PI * 2,
        y: (i % 4 - 1.5) * 0.8,
      });
      orbitNodes.push(node);
      scene.add(node);
    }

    const particleCount = 1200;
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i += 1) {
      positions[i * 3] = (Math.random() - 0.5) * 30;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 20;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 16;
    }
    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const particles = new THREE.Points(
      particleGeometry,
      new THREE.PointsMaterial({
        color: 0x0044ff,
        size: 0.04,
        transparent: true,
        opacity: 0.35,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    scene.add(particles);

    const ambient = new THREE.AmbientLight(0xffffff, 0.5);
    const pointLight = new THREE.PointLight(0x66a3ff, 2, 40);
    pointLight.position.set(4, 4, 6);
    scene.add(ambient, pointLight);

    const ringGeometry = new THREE.TorusGeometry(4.5, 0.02, 8, 64);
    const ring = new THREE.Mesh(
      ringGeometry,
      new THREE.MeshBasicMaterial({ color: 0x0044ff, transparent: true, opacity: 0.2 }),
    );
    ring.rotation.x = Math.PI / 2.5;
    scene.add(ring);

    const streamCount = 24;
    const streams: THREE.Mesh[] = [];
    for (let i = 0; i < streamCount; i += 1) {
      const stream = new THREE.Mesh(
        new THREE.CylinderGeometry(0.015, 0.015, 2.2, 6),
        new THREE.MeshBasicMaterial({
          color: 0x00c2ff,
          transparent: true,
          opacity: 0.35,
        }),
      );
      const angle = (i / streamCount) * Math.PI * 2;
      stream.position.set(Math.cos(angle) * 5.5, (Math.random() - 0.5) * 2, Math.sin(angle) * 5.5);
      stream.lookAt(0, 0, 0);
      streams.push(stream);
      scene.add(stream);
    }

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
      const { isUploading: uploading, uploadProgress: progress } = uploadStateRef.current;
      const pulse = uploading ? 1 + Math.sin(elapsed * 8) * 0.15 : 1 + Math.sin(elapsed * 1.5) * 0.05;

      core.rotation.x = elapsed * 0.35;
      core.rotation.y = elapsed * 0.5;
      core.scale.setScalar(pulse);
      innerCore.scale.setScalar(0.9 + (uploading ? progress / 200 : Math.sin(elapsed) * 0.05));

      orbitNodes.forEach((node, index) => {
        const data = orbitData[index];
        const angle = elapsed * data.speed + data.offset;
        node.position.x = Math.cos(angle) * data.radius;
        node.position.z = Math.sin(angle) * data.radius;
        node.position.y = data.y + Math.sin(elapsed * 2 + index) * 0.3;
        node.rotation.x = elapsed * 1.2;
        node.rotation.y = elapsed * 0.8;

        if (uploading) {
          const targetAngle = (progress / 100) * Math.PI * 2 + data.offset;
          node.position.x = Math.cos(targetAngle) * (data.radius - 0.5);
          node.position.z = Math.sin(targetAngle) * (data.radius - 0.5);
        }
      });

      particles.rotation.y = elapsed * 0.03;
      ring.rotation.z = elapsed * 0.12;
      pointLight.intensity = uploading ? 2.5 + progress / 50 : 2;

      streams.forEach((stream, index) => {
        const angle = (index / streamCount) * Math.PI * 2 + elapsed * (uploading ? 1.2 : 0.3);
        const radius = uploading ? 5.5 - (progress / 100) * 3 : 5.5;
        stream.position.x = Math.cos(angle) * radius;
        stream.position.z = Math.sin(angle) * radius;
        stream.position.y = Math.sin(elapsed * 2 + index) * 0.4;
        stream.lookAt(0, 0, 0);
        (stream.material as THREE.MeshBasicMaterial).opacity = uploading
          ? 0.25 + (progress / 100) * 0.5
          : 0.15 + Math.sin(elapsed + index) * 0.05;
      });

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      coreGeometry.dispose();
      coreMaterial.dispose();
      particleGeometry.dispose();
      (particles.material as THREE.Material).dispose();
      ringGeometry.dispose();
      (ring.material as THREE.Material).dispose();
      orbitNodes.forEach((node) => {
        node.geometry.dispose();
        (node.material as THREE.Material).dispose();
      });
      streams.forEach((stream) => {
        stream.geometry.dispose();
        (stream.material as THREE.Material).dispose();
      });
      container.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={containerRef} className="hr-upload-scene" aria-hidden="true" />;
}
