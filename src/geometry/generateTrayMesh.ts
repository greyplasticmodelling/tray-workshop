import * as THREE from 'three';
import type { TraySettings } from '../types';
import { calculateTrayDimensions, getRankCounts } from './trayMath';

function createBox(name: string, width: number, depth: number, height: number, x: number, y: number, z: number) {
  const geometry = new THREE.BoxGeometry(width, depth, height);
  const material = new THREE.MeshStandardMaterial({ color: 0x8f9f88 });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = name;
  mesh.position.set(x, y, z);
  return mesh;
}

export function generateTrayMesh(settings: TraySettings): THREE.Group {
  const dimensions = calculateTrayDimensions(settings);
  const group = new THREE.Group();
  group.name = 'movement-tray';
  const rankCounts = getRankCounts(settings);

  if (settings.template === 'lanceWedge') {
    const railHeight = settings.railHeightMm;
    const railCenterZ = settings.floorThicknessMm + railHeight / 2;
    const innerFrontY = -dimensions.outerDepthMm / 2 + dimensions.frontRailMm;
    const centerX = 0;

    rankCounts.forEach((rankCount, rowIndex) => {
      const rowWidth = rankCount * dimensions.slotWidthMm;
      const rowCenterY = innerFrontY + rowIndex * dimensions.slotDepthMm + dimensions.slotDepthMm / 2;

      group.add(
        createBox(
          `floor-rank-${rowIndex + 1}`,
          rowWidth + dimensions.leftRailMm + dimensions.rightRailMm,
          dimensions.slotDepthMm,
          settings.floorThicknessMm,
          centerX,
          rowCenterY,
          settings.floorThicknessMm / 2,
        ),
      );

      if (settings.leftRailEnabled) {
        group.add(
          createBox(
            `left-rail-rank-${rowIndex + 1}`,
            settings.railThicknessMm,
            dimensions.slotDepthMm,
            railHeight,
            -rowWidth / 2 - settings.railThicknessMm / 2,
            rowCenterY,
            railCenterZ,
          ),
        );
      }

      if (settings.rightRailEnabled) {
        group.add(
          createBox(
            `right-rail-rank-${rowIndex + 1}`,
            settings.railThicknessMm,
            dimensions.slotDepthMm,
            railHeight,
            rowWidth / 2 + settings.railThicknessMm / 2,
            rowCenterY,
            railCenterZ,
          ),
        );
      }
    });

    if (settings.frontRailEnabled) {
      const frontFloorWidth = rankCounts[0] * dimensions.slotWidthMm + dimensions.leftRailMm + dimensions.rightRailMm;
      group.add(
        createBox(
          'front-floor',
          frontFloorWidth,
          settings.railThicknessMm,
          settings.floorThicknessMm,
          centerX,
          -dimensions.outerDepthMm / 2 + settings.railThicknessMm / 2,
          settings.floorThicknessMm / 2,
        ),
      );
    }

    if (settings.rearRailEnabled) {
      group.add(
        createBox(
          'rear-floor',
          dimensions.innerWidthMm + dimensions.leftRailMm + dimensions.rightRailMm,
          settings.railThicknessMm,
          settings.floorThicknessMm,
          centerX,
          dimensions.outerDepthMm / 2 - settings.railThicknessMm / 2,
          settings.floorThicknessMm / 2,
        ),
      );
    }

    if (settings.frontRailEnabled) {
      group.add(
        createBox(
          'front-rail',
          rankCounts[0] * dimensions.slotWidthMm,
          settings.railThicknessMm,
          railHeight,
          centerX,
          -dimensions.outerDepthMm / 2 + settings.railThicknessMm / 2,
          railCenterZ,
        ),
      );
    }

    if (settings.rearRailEnabled) {
      group.add(
        createBox(
          'rear-rail',
          dimensions.innerWidthMm,
          settings.railThicknessMm,
          railHeight,
          centerX,
          dimensions.outerDepthMm / 2 - settings.railThicknessMm / 2,
          railCenterZ,
        ),
      );
    }

    for (let rowIndex = 0; rowIndex < rankCounts.length - 1; rowIndex += 1) {
      const currentWidth = rankCounts[rowIndex] * dimensions.slotWidthMm;
      const nextWidth = rankCounts[rowIndex + 1] * dimensions.slotWidthMm;
      const stepWidth = (nextWidth - currentWidth) / 2;
      const stepY = innerFrontY + (rowIndex + 1) * dimensions.slotDepthMm + settings.railThicknessMm / 2;

      if (stepWidth > 0 && settings.leftRailEnabled) {
        group.add(
          createBox(
            `left-step-rail-${rowIndex + 1}`,
            stepWidth,
            settings.railThicknessMm,
            railHeight,
            -currentWidth / 2 - stepWidth / 2,
            stepY,
            railCenterZ,
          ),
        );
      }

      if (stepWidth > 0 && settings.rightRailEnabled) {
        group.add(
          createBox(
            `right-step-rail-${rowIndex + 1}`,
            stepWidth,
            settings.railThicknessMm,
            railHeight,
            currentWidth / 2 + stepWidth / 2,
            stepY,
            railCenterZ,
          ),
        );
      }
    }

    return group;
  }

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

  const railHeight = settings.railHeightMm;
  const railCenterZ = settings.floorThicknessMm + railHeight / 2;
  const leftX = -dimensions.outerWidthMm / 2 + settings.railThicknessMm / 2;
  const rightX = dimensions.outerWidthMm / 2 - settings.railThicknessMm / 2;
  const frontY = -dimensions.outerDepthMm / 2 + settings.railThicknessMm / 2;
  const rearY = dimensions.outerDepthMm / 2 - settings.railThicknessMm / 2;

  if (settings.leftRailEnabled) {
    group.add(
      createBox('left-rail', settings.railThicknessMm, dimensions.outerDepthMm, railHeight, leftX, 0, railCenterZ),
    );
  }

  if (settings.rightRailEnabled) {
    group.add(
      createBox('right-rail', settings.railThicknessMm, dimensions.outerDepthMm, railHeight, rightX, 0, railCenterZ),
    );
  }

  if (settings.frontRailEnabled) {
    group.add(createBox('front-rail', dimensions.innerWidthMm, settings.railThicknessMm, railHeight, 0, frontY, railCenterZ));
  }

  if (settings.rearRailEnabled) {
    group.add(createBox('rear-rail', dimensions.innerWidthMm, settings.railThicknessMm, railHeight, 0, rearY, railCenterZ));
  }

  return group;
}
