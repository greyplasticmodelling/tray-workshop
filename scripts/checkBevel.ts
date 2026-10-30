import * as THREE from 'three';
import { generateTrayMesh } from '../src/geometry/generateTrayMesh';
import { calculateTrayDimensions, getMaxTrayBevelWidthMm, validateTraySettings } from '../src/geometry/trayMath';
import type { TraySettings } from '../src/types';

const defaults: TraySettings = {
  template: 'standard', baseWidthMm: 25, baseDepthMm: 25, columns: 5, rows: 4,
  toleranceMm: 0.2, floorThicknessMm: 1.6, railThicknessMm: 2, railHeightMm: 2,
  adapterCutoutWidthMm: 20, adapterCutoutDepthMm: 20, adapterCircleDiameterMm: 25,
  adapterCircleGapMm: 4, adapterOvalSize: '60x35', adapterOvalGapMm: 4,
  adapterFlankCutoutWidthMm: 20, adapterFlankCutoutDepthMm: 20, adapterBaseHeightMm: 3,
  adapterBorderUniformMm: 0, adapterBorderCustomEnabled: false,
  adapterBorderFrontMm: 0, adapterBorderRearMm: 0, adapterBorderLeftMm: 0, adapterBorderRightMm: 0,
  adapterRemoveFloorEnabled: false, adapterFloorCutoutEnabled: false, adapterFloorCutoutBufferMm: 2,
  rankInsertEnabled: false, rankInsertColumn: 1, rankInsertRow: 1,
  rankInsertColumnSpan: 1, rankInsertRowSpan: 2, rankInsertAlignment: 'front',
  rankInsertCircleDiameterMm: 50, rankInsertCustomSizeEnabled: false,
  rankInsertCustomWidthMm: 30, rankInsertCustomDepthMm: 60,
  trayEdgeSlopeMm: 0, trayRoundedCornersEnabled: false, trayCornerRadiusMm: 2,
  trayBevelEnabled: true, trayBevelWidthMm: 0.75, trayBevelCornerStyle: 'mitred',
  trayBevelProfile: 'single',
  generatedBaseEnabled: false, generatedBaseHollow: false, generatedBaseHeightMm: 3,
  generatedBaseWallThicknessMm: 1, generatedBaseTopThicknessMm: 1,
  skirmishBaseShape: 'circle', skirmishBaseSizeMm: 25, skirmishSeed: 12025,
  skirmishMaxRotationDeg: 6, skirmishMaxOffsetMm: 2, skirmishDistributionChancePercent: 100,
  skirmishTrayHeightMm: 4, magnetCutoutsEnabled: false, magnetCutoutsFromBottom: false,
  magnetDiameterMm: 5, magnetCutoutDepthMm: 1, lanceDoubleMagnetsEnabled: false,
  lanceMagnetOffsetMm: 12, characterBayEnabled: false, characterBaySide: 'right',
  characterBaseWidthMm: 30, characterBaseDepthMm: 60, characterBaseCount: 1,
  characterLeftBaseWidthMm: 30, characterLeftBaseDepthMm: 60, characterLeftBaseCount: 1,
  characterRightBaseWidthMm: 30, characterRightBaseDepthMm: 60, characterRightBaseCount: 1,
  frontRailEnabled: true, rearRailEnabled: false, leftRailEnabled: true, rightRailEnabled: true,
  buildPlateSize: '256x256',
};

function openEdges(mesh: THREE.Mesh) {
  const geometry = mesh.geometry;
  const position = geometry.getAttribute('position');
  const index = geometry.getIndex();
  const counts = new Map<string, number>();
  const key = (vertexIndex: number) => {
    const point = new THREE.Vector3().fromBufferAttribute(position, vertexIndex).applyMatrix4(mesh.matrixWorld);
    return `${point.x.toFixed(3)},${point.y.toFixed(3)},${point.z.toFixed(3)}`;
  };
  for (let offset = 0; offset < (index?.count ?? position.count); offset += 3) {
    const vertices = [0, 1, 2].map((corner) => key(index ? index.getX(offset + corner) : offset + corner));
    for (let edge = 0; edge < 3; edge += 1) {
      const a = vertices[edge];
      const b = vertices[(edge + 1) % 3];
      const edgeKey = a < b ? `${a}|${b}` : `${b}|${a}`;
      counts.set(edgeKey, (counts.get(edgeKey) ?? 0) + 1);
    }
  }
  return Array.from(counts.values()).filter((count) => count !== 2).length;
}

function degenerateTriangles(mesh: THREE.Mesh) {
  const positions = mesh.geometry.getAttribute('position');
  const indices = mesh.geometry.getIndex();
  let count = 0;
  for (let offset = 0; offset < (indices?.count ?? positions.count); offset += 3) {
    const [a, b, c] = [0, 1, 2].map((corner) =>
      new THREE.Vector3().fromBufferAttribute(positions, indices ? indices.getX(offset + corner) : offset + corner),
    );
    if (b.sub(a).cross(c.sub(a)).lengthSq() < 1e-12) count += 1;
  }
  return count;
}

function lanceStepHasBevel(tray: THREE.Group, settings: TraySettings) {
  const dimensions = calculateTrayDimensions(settings);
  const topZ = settings.floorThicknessMm + settings.railHeightMm;
  const firstRowY = -dimensions.outerDepthMm / 2 + dimensions.frontRailMm;
  const raycaster = new THREE.Raycaster();
  const surfaceZ = (x: number, y: number) => {
    raycaster.set(new THREE.Vector3(x, y, topZ + 5), new THREE.Vector3(0, 0, -1));
    return raycaster.intersectObject(tray, true)[0]?.point.z ?? -Infinity;
  };
  const hasProfileAt = (x: number, y: number) => {
    const z = surfaceZ(x, y);
    return z > topZ - settings.trayBevelWidthMm - 0.05 && z < topZ - 0.05;
  };

  for (let rowIndex = 0; rowIndex < settings.rows; rowIndex += 1) {
    const rowWidth = (rowIndex + 1) * dimensions.slotWidthMm;
    const outerX = rowWidth / 2 + settings.railThicknessMm;
    const rowY = firstRowY + (rowIndex + 0.5) * dimensions.slotDepthMm;
    if (!hasProfileAt(outerX - settings.trayBevelWidthMm / 2, rowY)) return false;
    if (!hasProfileAt(-outerX + settings.trayBevelWidthMm / 2, rowY)) return false;
    if (rowIndex === settings.rows - 1) continue;
    const stepY = firstRowY + (rowIndex + 1) * dimensions.slotDepthMm - settings.railThicknessMm;
    const stepX = outerX + dimensions.slotWidthMm / 4;
    if (!hasProfileAt(stepX, stepY + settings.trayBevelWidthMm / 2)) return false;
    if (!hasProfileAt(-stepX, stepY + settings.trayBevelWidthMm / 2)) return false;
  }
  return true;
}

const scenarios: Array<[string, Partial<TraySettings>]> = [
  ['standard', {}],
  ['standard-wide-profile', { trayBevelWidthMm: 1.5 }],
  ['standard-all-rails', { rearRailEnabled: true }],
  ['standard-left-flank', { characterBayEnabled: true, characterBaySide: 'left' }],
  ['standard-right-flank', { characterBayEnabled: true, characterBaySide: 'right' }],
  ['standard-both-flanks', { characterBayEnabled: true, characterBaySide: 'both' }],
  ['standard-magnets', { magnetCutoutsEnabled: true }],
  ['lance', { template: 'lanceWedge', baseWidthMm: 30, baseDepthMm: 60, rows: 3 }],
  ['lance-five-ranks', { template: 'lanceWedge', baseWidthMm: 30, baseDepthMm: 60, rows: 5 }],
  ['lance-five-ranks-magnets', { template: 'lanceWedge', baseWidthMm: 30, baseDepthMm: 60, rows: 5, magnetCutoutsEnabled: true }],
  ['lance-rear-rail', { template: 'lanceWedge', baseWidthMm: 30, baseDepthMm: 60, rows: 3, rearRailEnabled: true }],
  ['lance-wide-profile', { template: 'lanceWedge', baseWidthMm: 30, baseDepthMm: 60, rows: 3, trayBevelWidthMm: 1.5 }],
  ['lance-magnets', { template: 'lanceWedge', baseWidthMm: 30, baseDepthMm: 60, rows: 3, magnetCutoutsEnabled: true }],
  ['adapter', { template: 'adapter', baseWidthMm: 30, baseDepthMm: 30, adapterCutoutWidthMm: 20, adapterCutoutDepthMm: 20 }],
  ['adapter-wide-profile', { template: 'adapter', baseWidthMm: 30, baseDepthMm: 30, adapterCutoutWidthMm: 20, adapterCutoutDepthMm: 20, trayBevelWidthMm: 2.5 }],
  ['adapter-flank', { template: 'adapter', baseWidthMm: 30, baseDepthMm: 30, characterBayEnabled: true, adapterCutoutWidthMm: 20, adapterCutoutDepthMm: 20 }],
  ['adapter-rank-insert', { template: 'adapter', baseWidthMm: 30, baseDepthMm: 30, rankInsertEnabled: true }],
  ['adapter-magnets', { template: 'adapter', baseWidthMm: 30, baseDepthMm: 30, magnetCutoutsEnabled: true }],
  ['circle', { template: 'adapterCircle', adapterBorderUniformMm: 2 }],
  ['oval', { template: 'adapterOval', adapterBorderUniformMm: 2 }],
  ['adapter-lance', { template: 'adapterLance', baseWidthMm: 30, baseDepthMm: 60, rows: 3 }],
  ['skirmish', { template: 'skirmish' }],
  ['skirmish-magnets', { template: 'skirmish', magnetCutoutsEnabled: true }],
  ['adapter-open-floor', { template: 'adapter', baseWidthMm: 30, baseDepthMm: 30, adapterRemoveFloorEnabled: true }],
  ['adapter-sheet-border', { template: 'adapter', baseWidthMm: 30, baseDepthMm: 30, adapterRemoveFloorEnabled: true, adapterFloorCutoutEnabled: true }],
  ['adapter-flank-sheet-border', { template: 'adapter', baseWidthMm: 30, baseDepthMm: 30, characterBayEnabled: true, adapterRemoveFloorEnabled: true, adapterFloorCutoutEnabled: true }],
  ['skirmish-open-floor', { template: 'skirmish', adapterRemoveFloorEnabled: true }],
  ['skirmish-sheet-border', { template: 'skirmish', adapterRemoveFloorEnabled: true, adapterFloorCutoutEnabled: true }],
];

let failures = 0;
for (const [name, changes] of scenarios) {
  for (const profile of ['single', 'rounded', 'double'] as const) {
    for (const cornerStyle of ['mitred', 'curved'] as const) {
      const settings = { ...defaults, ...changes, trayBevelCornerStyle: cornerStyle, trayBevelProfile: profile };
      settings.trayBevelWidthMm = Math.min(changes.trayBevelWidthMm ?? 0.75, getMaxTrayBevelWidthMm(settings));
      const validation = validateTraySettings(settings);
      if (!validation.isValid) {
        console.log(`${name}/${profile}/${cornerStyle}: invalid ${validation.messages.join('; ')}`);
        failures += 1;
        continue;
      }
      const tray = generateTrayMesh(settings);
      tray.updateMatrixWorld(true);
      const baseline = generateTrayMesh({ ...settings, trayBevelEnabled: false });
      baseline.updateMatrixWorld(true);
      let baselineOpen = 0;
      let baselineDegenerate = 0;
      baseline.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          baselineOpen += openEdges(object);
          baselineDegenerate += degenerateTriangles(object);
        }
      });
      let totalOpen = 0;
      let totalDegenerate = 0;
      let meshes = 0;
      let triangleCount = 0;
      tray.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          meshes += 1;
          totalOpen += openEdges(object);
          totalDegenerate += degenerateTriangles(object);
          triangleCount += (object.geometry.getIndex()?.count ?? object.geometry.getAttribute('position').count) / 3;
        }
      });
      console.log(`${name}/${profile}/${cornerStyle}: ${meshes} meshes, ${triangleCount} triangles, ${totalOpen} non-paired edges (${baselineOpen} before bevel)`);
      if (totalOpen > baselineOpen || totalDegenerate > baselineDegenerate) {
        console.log(`  regression: ${totalDegenerate} degenerate triangles (${baselineDegenerate} before bevel)`);
        failures += 1;
      }
      if (name.startsWith('lance') && !lanceStepHasBevel(tray, settings)) {
        console.log(`  regression: a lance rank or step has an unfinished outside edge`);
        failures += 1;
      }
    }
  }
}

const incompatible: Array<[string, Partial<TraySettings>]> = [
  ['no-rail', { frontRailEnabled: false, rearRailEnabled: false, leftRailEnabled: false, rightRailEnabled: false }],
  ['no-circle-border', { template: 'adapterCircle' }],
  ['outside-slope', { trayEdgeSlopeMm: 1 }],
  ['rounded-corners', { trayRoundedCornersEnabled: true }],
  ['thin-flank-wall', { template: 'adapter', characterBayEnabled: true, adapterFlankCutoutWidthMm: 29.8 }],
];

for (const [name, changes] of incompatible) {
  if (validateTraySettings({ ...defaults, ...changes }).isValid) {
    console.log(`${name}: an incompatible bevel setting was accepted`);
    failures += 1;
  }
}

if (failures > 0) process.exitCode = 1;
