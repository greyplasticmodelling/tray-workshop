import * as THREE from 'three';
import type { TraySettings } from '../types';
import { calculateTrayDimensions } from './trayMath';

function createBox(name: string, width: number, depth: number, height: number, x: number, y: number, z: number) {
  const geometry = new THREE.BoxGeometry(width, height, depth);
  const material = new THREE.MeshStandardMaterial({ color: 0x8f9f88 });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = name;
  mesh.position.set(x, z, y);
  return mesh;
}

export function generateTrayMesh(settings: TraySettings): THREE.Group {
  const dimensions = calculateTrayDimensions(settings);
  const group = new THREE.Group();
  group.name = 'movement-tray';

  group.add(
    createBox(
      'floor',
      dimensions.outerWidthMm,
      dimensions.outerDepthMm,
      settings.floorThicknessMm,
      0,
      0,
      settings.floorThicknessMm / 2,
    ),
  );

  const railHeight = settings.floorThicknessMm + settings.railHeightMm;
  const leftX = -dimensions.outerWidthMm / 2 + settings.railThicknessMm / 2;
  const rightX = dimensions.outerWidthMm / 2 - settings.railThicknessMm / 2;
  const frontY = -dimensions.outerDepthMm / 2 + settings.railThicknessMm / 2;
  const rearY = dimensions.outerDepthMm / 2 - settings.railThicknessMm / 2;

  if (settings.leftRailEnabled) {
    group.add(createBox('left-rail', settings.railThicknessMm, dimensions.outerDepthMm, railHeight, leftX, 0, railHeight / 2));
  }

  if (settings.rightRailEnabled) {
    group.add(createBox('right-rail', settings.railThicknessMm, dimensions.outerDepthMm, railHeight, rightX, 0, railHeight / 2));
  }

  if (settings.frontRailEnabled) {
    group.add(createBox('front-rail', dimensions.innerWidthMm, settings.railThicknessMm, railHeight, 0, frontY, railHeight / 2));
  }

  if (settings.rearRailEnabled) {
    group.add(createBox('rear-rail', dimensions.innerWidthMm, settings.railThicknessMm, railHeight, 0, rearY, railHeight / 2));
  }

  return group;
}
