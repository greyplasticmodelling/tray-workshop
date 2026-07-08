import { useEffect, useRef } from 'react';
import type { TraySettings } from '../types';

type Props = {
  settings: TraySettings;
};

export function TrayPreview3d({ settings }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    let cleanup: (() => void) | undefined;
    let isDisposed = false;

    void (async () => {
      const [THREE, controlsModule, meshModule] = await Promise.all([
        import('three'),
        import('three/examples/jsm/controls/OrbitControls.js'),
        import('../geometry/generateTrayMesh'),
      ]);

      if (isDisposed) {
        return;
      }

      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x101418);

      const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 3000);
      const renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      container.appendChild(renderer.domElement);

      const controls = new controlsModule.OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.08;
      controls.screenSpacePanning = true;

      const trayMaterial = new THREE.MeshStandardMaterial({
        color: 0x9da6a1,
        metalness: 0.08,
        roughness: 0.58,
      });
      const edgeMaterial = new THREE.LineBasicMaterial({
        color: 0x1f2529,
        transparent: true,
        opacity: 0.5,
      });

      const tray = meshModule.generateTrayMesh(settings);
      tray.traverse((object) => {
        if (!(object instanceof THREE.Mesh)) {
          return;
        }

        object.material = trayMaterial;
        object.castShadow = true;
        object.receiveShadow = true;
        object.geometry.computeVertexNormals();

        const edges = new THREE.EdgesGeometry(object.geometry, 28);
        const edgeLines = new THREE.LineSegments(edges, edgeMaterial);
        edgeLines.name = `${object.name}-definition-lines`;
        object.add(edgeLines);
      });
      scene.add(tray);

      const bounds = new THREE.Box3().setFromObject(tray);
      const center = bounds.getCenter(new THREE.Vector3());
      const size = bounds.getSize(new THREE.Vector3());
      const maxSize = Math.max(size.x, size.y, size.z, 1);
      const cameraDistance = maxSize * 1.35;

      tray.position.sub(center);
      controls.target.set(0, 0, Math.max(0, size.z * 0.15));
      camera.position.set(cameraDistance * 0.62, -cameraDistance * 0.82, cameraDistance * 0.5);
      camera.near = Math.max(0.1, maxSize / 1200);
      camera.far = maxSize * 8;
      camera.updateProjectionMatrix();
      controls.update();

      const hemisphereLight = new THREE.HemisphereLight(0xf4f7ff, 0x273039, 1.2);
      scene.add(hemisphereLight);

      const keyLight = new THREE.DirectionalLight(0xffffff, 2.3);
      keyLight.position.set(maxSize * 0.45, -maxSize * 0.55, maxSize * 1.1);
      keyLight.castShadow = true;
      keyLight.shadow.mapSize.set(1024, 1024);
      scene.add(keyLight);

      const rimLight = new THREE.DirectionalLight(0xb9d6ff, 1.15);
      rimLight.position.set(-maxSize * 0.75, maxSize * 0.6, maxSize * 0.55);
      scene.add(rimLight);

      const fillLight = new THREE.DirectionalLight(0xffead0, 0.75);
      fillLight.position.set(maxSize * 0.55, maxSize * 0.9, maxSize * 0.35);
      scene.add(fillLight);

      const ground = new THREE.Mesh(
        new THREE.PlaneGeometry(maxSize * 2.2, maxSize * 2.2),
        new THREE.ShadowMaterial({ color: 0x000000, opacity: 0.22 }),
      );
      ground.name = 'preview-shadow-plane';
      ground.position.z = -0.02;
      ground.receiveShadow = true;
      scene.add(ground);

      let animationFrame = 0;
      const resize = () => {
        const { width, height } = container.getBoundingClientRect();
        const safeWidth = Math.max(1, width);
        const safeHeight = Math.max(1, height);
        renderer.setSize(safeWidth, safeHeight, false);
        camera.aspect = safeWidth / safeHeight;
        camera.updateProjectionMatrix();
      };
      const resizeObserver = new ResizeObserver(resize);
      resizeObserver.observe(container);
      resize();

      const animate = () => {
        controls.update();
        renderer.render(scene, camera);
        animationFrame = window.requestAnimationFrame(animate);
      };
      animate();

      cleanup = () => {
        window.cancelAnimationFrame(animationFrame);
        resizeObserver.disconnect();
        controls.dispose();
        renderer.dispose();

        if (renderer.domElement.parentElement === container) {
          container.removeChild(renderer.domElement);
        }

        tray.traverse((object) => {
          if (object instanceof THREE.Mesh || object instanceof THREE.LineSegments) {
            object.geometry.dispose();
          }
        });
        trayMaterial.dispose();
        edgeMaterial.dispose();
        ground.geometry.dispose();
        ground.material.dispose();
      };
    })();

    return () => {
      isDisposed = true;
      cleanup?.();
    };
  }, [settings]);

  return <div className="preview-3d-frame" ref={containerRef} aria-label="Interactive 3D tray preview" />;
}
