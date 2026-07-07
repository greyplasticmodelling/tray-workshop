import * as THREE from 'three';
import type { TraySettings } from '../types';
import { calculateTrayDimensions, getMagnetCutoutCenters, getRankCounts } from './trayMath';

function createBox(name: string, width: number, depth: number, height: number, x: number, y: number, z: number) {
  const geometry = new THREE.BoxGeometry(width, depth, height);
  const material = new THREE.MeshStandardMaterial({ color: 0x8f9f88 });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = name;
  mesh.position.set(x, y, z);
  return mesh;
}

function createPerforatedFloorLayer(
  name: string,
  width: number,
  depth: number,
  height: number,
  x: number,
  y: number,
  holes: Array<{ x: number; y: number }>,
  settings: TraySettings,
) {
  if (!settings.magnetCutoutsEnabled || holes.length === 0) {
    return createBox(name, width, depth, height, x, y, height / 2);
  }

  const recessDepth = Math.min(settings.magnetCutoutDepthMm, height);
  const bottomSkinHeight = height - recessDepth;
  const group = new THREE.Group();
  group.name = name;

  if (bottomSkinHeight > 0) {
    group.add(createBox(`${name}-bottom-skin`, width, depth, bottomSkinHeight, x, y, bottomSkinHeight / 2));
  }

  if (recessDepth > 0) {
    const radius = settings.magnetDiameterMm / 2;
    const shape = new THREE.Shape();
    shape.moveTo(-width / 2, -depth / 2);
    shape.lineTo(width / 2, -depth / 2);
    shape.lineTo(width / 2, depth / 2);
    shape.lineTo(-width / 2, depth / 2);
    shape.lineTo(-width / 2, -depth / 2);

    holes.forEach((hole) => {
      if (
        hole.x - radius >= -width / 2 &&
        hole.x + radius <= width / 2 &&
        hole.y - radius >= -depth / 2 &&
        hole.y + radius <= depth / 2
      ) {
        const path = new THREE.Path();
        path.absellipse(hole.x, hole.y, radius, radius, 0, Math.PI * 2, true);
        shape.holes.push(path);
      }
    });

    const geometry = new THREE.ExtrudeGeometry(shape, {
      depth: recessDepth,
      bevelEnabled: false,
      curveSegments: 32,
    });
    const material = new THREE.MeshStandardMaterial({ color: 0x8f9f88 });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = `${name}-recess-layer`;
    mesh.position.set(x, y, bottomSkinHeight);
    group.add(mesh);
  }

  return group;
}

function getHolesInRect(
  holes: Array<{ x: number; y: number }>,
  centerX: number,
  centerY: number,
  width: number,
  depth: number,
) {
  return holes
    .filter(
      (hole) =>
        hole.x >= centerX - width / 2 &&
        hole.x <= centerX + width / 2 &&
        hole.y >= centerY - depth / 2 &&
        hole.y <= centerY + depth / 2,
    )
    .map((hole) => ({
      x: hole.x - centerX,
      y: hole.y - centerY,
    }));
}

export function generateTrayMesh(settings: TraySettings): THREE.Group {
  const dimensions = calculateTrayDimensions(settings);
  const group = new THREE.Group();
  group.name = 'movement-tray';
  const rankCounts = getRankCounts(settings);
  const magnetCenters = getMagnetCutoutCenters(settings, dimensions);

  if (settings.template === 'lanceWedge') {
    const railHeight = settings.railHeightMm;
    const railCenterZ = settings.floorThicknessMm + railHeight / 2;
    const innerFrontY = -dimensions.outerDepthMm / 2 + dimensions.frontRailMm;
    const centerX = 0;

    rankCounts.forEach((rankCount, rowIndex) => {
      const rowWidth = rankCount * dimensions.slotWidthMm;
      const rowCenterY = innerFrontY + rowIndex * dimensions.slotDepthMm + dimensions.slotDepthMm / 2;

      const rowInnerCenterY = -dimensions.innerDepthMm / 2 + rowIndex * dimensions.slotDepthMm + dimensions.slotDepthMm / 2;
      const rowMagnetCenters = magnetCenters
        .filter((center) => center.rowIndex === rowIndex)
        .map((center) => ({ x: center.x, y: center.y - rowInnerCenterY }));

      group.add(
        createPerforatedFloorLayer(
          `floor-rank-${rowIndex + 1}`,
          rowWidth + dimensions.leftRailMm + dimensions.rightRailMm,
          dimensions.slotDepthMm,
          settings.floorThicknessMm,
          centerX,
          rowCenterY,
          rowMagnetCenters,
          settings,
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
      const frontRailWidth = rankCounts[0] * dimensions.slotWidthMm + dimensions.leftRailMm + dimensions.rightRailMm;
      group.add(
        createBox(
          'front-rail',
          frontRailWidth,
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
          dimensions.innerWidthMm + dimensions.leftRailMm + dimensions.rightRailMm,
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
      const stepY = innerFrontY + (rowIndex + 1) * dimensions.slotDepthMm - settings.railThicknessMm / 2;
      const leftStepX = -currentWidth / 2 - dimensions.leftRailMm - stepWidth / 2;
      const rightStepX = currentWidth / 2 + dimensions.rightRailMm + stepWidth / 2;

      if (stepWidth > 0 && settings.leftRailEnabled) {
        group.add(
          createBox(
            `left-step-floor-${rowIndex + 1}`,
            stepWidth,
            settings.railThicknessMm,
            settings.floorThicknessMm,
            leftStepX,
            stepY,
            settings.floorThicknessMm / 2,
          ),
        );
        group.add(
          createBox(
            `left-step-rail-${rowIndex + 1}`,
            stepWidth,
            settings.railThicknessMm,
            railHeight,
            leftStepX,
            stepY,
            railCenterZ,
          ),
        );
      }

      if (stepWidth > 0 && settings.rightRailEnabled) {
        group.add(
          createBox(
            `right-step-floor-${rowIndex + 1}`,
            stepWidth,
            settings.railThicknessMm,
            settings.floorThicknessMm,
            rightStepX,
            stepY,
            settings.floorThicknessMm / 2,
          ),
        );
        group.add(
          createBox(
            `right-step-rail-${rowIndex + 1}`,
            stepWidth,
            settings.railThicknessMm,
            railHeight,
            rightStepX,
            stepY,
            railCenterZ,
          ),
        );
      }
    }

    return group;
  }

  const innerCenterOffsetX = -dimensions.outerWidthMm / 2 + dimensions.leftRailMm + dimensions.innerWidthMm / 2;
  const innerCenterOffsetY = -dimensions.outerDepthMm / 2 + dimensions.frontRailMm + dimensions.innerDepthMm / 2;
  const standardMagnetCenters = magnetCenters.map((center) => ({
    x: center.x + innerCenterOffsetX,
    y: center.y + innerCenterOffsetY,
  }));

  const railHeight = settings.railHeightMm;
  const railCenterZ = settings.floorThicknessMm + railHeight / 2;
  const hasCharacterBay = settings.characterBayEnabled;
  const outerLeftX = -dimensions.outerWidthMm / 2;
  const outerFrontY = -dimensions.outerDepthMm / 2;
  const innerLeftX = outerLeftX + dimensions.leftRailMm;
  const innerFrontY = outerFrontY + dimensions.frontRailMm;
  const mainFloorX = settings.characterBaySide === 'left' ? outerLeftX + dimensions.characterSlotWidthMm : outerLeftX;
  const mainFloorWidth = dimensions.mainInnerWidthMm + dimensions.leftRailMm + dimensions.rightRailMm;
  const mainFloorCenterX = mainFloorX + mainFloorWidth / 2;
  const mainAreaCenterX =
    innerLeftX +
    (hasCharacterBay && settings.characterBaySide === 'left' ? dimensions.characterSlotWidthMm : 0) +
    dimensions.mainInnerWidthMm / 2;
  const characterSideRailMm =
    settings.characterBaySide === 'left' ? dimensions.leftRailMm : dimensions.rightRailMm;
  const hasCharacterReturnRail =
    hasCharacterBay && characterSideRailMm > 0 && dimensions.characterSlotDepthMm < dimensions.mainInnerDepthMm;
  const characterFloorWidth = dimensions.characterSlotWidthMm + characterSideRailMm;
  const characterFloorDepth =
    dimensions.frontRailMm + dimensions.characterSlotDepthMm + (hasCharacterReturnRail ? settings.railThicknessMm : 0);
  const characterFloorX =
    settings.characterBaySide === 'left' ? outerLeftX : innerLeftX + dimensions.mainInnerWidthMm;
  const characterFloorCenterX = characterFloorX + characterFloorWidth / 2;
  const characterFloorCenterY = outerFrontY + characterFloorDepth / 2;

  if (hasCharacterBay) {
    group.add(
      createPerforatedFloorLayer(
        'main-floor',
        mainFloorWidth,
        dimensions.outerDepthMm,
        settings.floorThicknessMm,
        mainFloorCenterX,
        0,
        getHolesInRect(standardMagnetCenters, mainFloorCenterX, 0, mainFloorWidth, dimensions.outerDepthMm),
        settings,
      ),
    );
    group.add(
      createPerforatedFloorLayer(
        'character-floor',
        characterFloorWidth,
        characterFloorDepth,
        settings.floorThicknessMm,
        characterFloorCenterX,
        characterFloorCenterY,
        getHolesInRect(
          standardMagnetCenters,
          characterFloorCenterX,
          characterFloorCenterY,
          characterFloorWidth,
          characterFloorDepth,
        ),
        settings,
      ),
    );
  } else {
    group.add(
      createPerforatedFloorLayer(
        'floor',
        dimensions.outerWidthMm,
        dimensions.outerDepthMm,
        settings.floorThicknessMm,
        0,
        0,
        standardMagnetCenters,
        settings,
      ),
    );
  }

  const leftX = -dimensions.outerWidthMm / 2 + settings.railThicknessMm / 2;
  const rightX = dimensions.outerWidthMm / 2 - settings.railThicknessMm / 2;
  const frontY = -dimensions.outerDepthMm / 2 + settings.railThicknessMm / 2;
  const rearY = dimensions.outerDepthMm / 2 - settings.railThicknessMm / 2;

  if (settings.leftRailEnabled && (!hasCharacterBay || settings.characterBaySide === 'right')) {
    group.add(
      createBox('left-rail', settings.railThicknessMm, dimensions.outerDepthMm, railHeight, leftX, 0, railCenterZ),
    );
  }

  if (settings.rightRailEnabled && (!hasCharacterBay || settings.characterBaySide === 'left')) {
    group.add(
      createBox('right-rail', settings.railThicknessMm, dimensions.outerDepthMm, railHeight, rightX, 0, railCenterZ),
    );
  }

  if (settings.frontRailEnabled) {
    group.add(createBox('front-rail', dimensions.innerWidthMm, settings.railThicknessMm, railHeight, 0, frontY, railCenterZ));
  }

  if (settings.rearRailEnabled) {
    group.add(
      createBox(
        'rear-rail',
        hasCharacterBay ? dimensions.mainInnerWidthMm : dimensions.innerWidthMm,
        settings.railThicknessMm,
        railHeight,
        hasCharacterBay ? mainAreaCenterX : 0,
        rearY,
        railCenterZ,
      ),
    );
  }

  if (hasCharacterBay && characterSideRailMm > 0) {
    const baySideRailCenterX =
      settings.characterBaySide === 'left'
        ? outerLeftX + settings.railThicknessMm / 2
        : dimensions.outerWidthMm / 2 - settings.railThicknessMm / 2;

    group.add(
      createBox(
        'character-bay-side-rail',
        settings.railThicknessMm,
        characterFloorDepth,
        railHeight,
        baySideRailCenterX,
        characterFloorCenterY,
        railCenterZ,
      ),
    );

    if (hasCharacterReturnRail) {
      const stepRailWidth = dimensions.characterSlotWidthMm + characterSideRailMm;
      const stepRailCenterX =
        settings.characterBaySide === 'left'
          ? outerLeftX + stepRailWidth / 2
          : innerLeftX + dimensions.mainInnerWidthMm + stepRailWidth / 2;
      const stepRailCenterY = innerFrontY + dimensions.characterSlotDepthMm + settings.railThicknessMm / 2;
      const mainSideRailDepth =
        dimensions.outerDepthMm - dimensions.frontRailMm - dimensions.characterSlotDepthMm;
      const mainSideRailCenterX =
        settings.characterBaySide === 'left'
          ? outerLeftX + dimensions.characterSlotWidthMm + settings.railThicknessMm / 2
          : innerLeftX + dimensions.mainInnerWidthMm + settings.railThicknessMm / 2;
      const mainSideRailCenterY =
        innerFrontY + dimensions.characterSlotDepthMm + mainSideRailDepth / 2;

      group.add(
        createBox(
          'character-bay-return-rail',
          stepRailWidth,
          settings.railThicknessMm,
          railHeight,
          stepRailCenterX,
          stepRailCenterY,
          railCenterZ,
        ),
      );
      group.add(
        createBox(
          'main-side-rail-after-character-bay',
          settings.railThicknessMm,
          mainSideRailDepth,
          railHeight,
          mainSideRailCenterX,
          mainSideRailCenterY,
          railCenterZ,
        ),
      );
    }
  }

  return group;
}
