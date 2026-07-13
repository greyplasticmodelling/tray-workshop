import * as THREE from 'three';
import type { TraySettings } from '../types';
import { calculateTrayDimensions, getRankInsertSlot } from './trayMath';

export type GeneratedBaseSpec =
  | { shape: 'rect'; width: number; depth: number; label: string }
  | { shape: 'circle'; diameter: number; label: string }
  | { shape: 'ellipse'; width: number; depth: number; label: string };

function createRectShape(width: number, depth: number) {
  const shape = new THREE.Shape();
  shape.moveTo(-width / 2, -depth / 2);
  shape.lineTo(width / 2, -depth / 2);
  shape.lineTo(width / 2, depth / 2);
  shape.lineTo(-width / 2, depth / 2);
  shape.lineTo(-width / 2, -depth / 2);
  return shape;
}

function createEllipseShape(width: number, depth: number) {
  const shape = new THREE.Shape();
  shape.absellipse(0, 0, width / 2, depth / 2, 0, Math.PI * 2, false);
  return shape;
}

function createShape(spec: GeneratedBaseSpec) {
  if (spec.shape === 'circle') {
    return createEllipseShape(spec.diameter, spec.diameter);
  }

  if (spec.shape === 'ellipse') {
    return createEllipseShape(spec.width, spec.depth);
  }

  return createRectShape(spec.width, spec.depth);
}

function addInsetHole(shape: THREE.Shape, spec: GeneratedBaseSpec, wallThickness: number) {
  const path = new THREE.Path();

  if (spec.shape === 'circle') {
    const diameter = spec.diameter - wallThickness * 2;
    if (diameter <= 0) {
      return;
    }
    path.absellipse(0, 0, diameter / 2, diameter / 2, 0, Math.PI * 2, true);
  } else if (spec.shape === 'ellipse') {
    const width = spec.width - wallThickness * 2;
    const depth = spec.depth - wallThickness * 2;
    if (width <= 0 || depth <= 0) {
      return;
    }
    path.absellipse(0, 0, width / 2, depth / 2, 0, Math.PI * 2, true);
  } else {
    const width = spec.width - wallThickness * 2;
    const depth = spec.depth - wallThickness * 2;
    if (width <= 0 || depth <= 0) {
      return;
    }
    path.moveTo(-width / 2, -depth / 2);
    path.lineTo(-width / 2, depth / 2);
    path.lineTo(width / 2, depth / 2);
    path.lineTo(width / 2, -depth / 2);
    path.lineTo(-width / 2, -depth / 2);
  }

  shape.holes.push(path);
}

function addMagnetHole(shape: THREE.Shape, diameter: number) {
  const path = new THREE.Path();
  path.absellipse(0, 0, diameter / 2, diameter / 2, 0, Math.PI * 2, true);
  shape.holes.push(path);
}

function createExtrudedMesh(name: string, shape: THREE.Shape, height: number, z: number) {
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: height,
    bevelEnabled: false,
    curveSegments: 48,
  });
  const material = new THREE.MeshStandardMaterial({ color: 0x8f9f88 });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = name;
  mesh.position.z = z;
  return mesh;
}

function specsMatch(a: GeneratedBaseSpec, b: GeneratedBaseSpec) {
  if (a.shape !== b.shape) {
    return false;
  }

  if (a.shape === 'circle' && b.shape === 'circle') {
    return Math.abs(a.diameter - b.diameter) < 0.001;
  }

  if (a.shape !== 'circle' && b.shape !== 'circle') {
    return Math.abs(a.width - b.width) < 0.001 && Math.abs(a.depth - b.depth) < 0.001;
  }

  return false;
}

function uniqueSpecs(specs: GeneratedBaseSpec[]) {
  return specs.reduce<GeneratedBaseSpec[]>((unique, spec) => {
    if (!unique.some((existing) => specsMatch(existing, spec))) {
      unique.push(spec);
    }
    return unique;
  }, []);
}

export function getPrimaryGeneratedBaseSpec(settings: TraySettings): GeneratedBaseSpec {
  const dimensions = calculateTrayDimensions(settings);

  if (settings.template === 'adapterCircle') {
    return { shape: 'circle', diameter: settings.adapterCircleDiameterMm, label: 'circle-adapter' };
  }

  if (settings.template === 'adapterOval') {
    return {
      shape: 'ellipse',
      width: Math.max(1, dimensions.adapterCutoutWidthMm - settings.toleranceMm),
      depth: Math.max(1, dimensions.adapterCutoutDepthMm - settings.toleranceMm),
      label: 'oval-adapter',
    };
  }

  if (settings.template === 'adapter' || settings.template === 'adapterLance') {
    return {
      shape: 'rect',
      width: settings.adapterCutoutWidthMm,
      depth: settings.adapterCutoutDepthMm,
      label: settings.template === 'adapterLance' ? 'adapter-lance' : 'adapter',
    };
  }

  if (settings.template === 'skirmish') {
    return settings.skirmishBaseShape === 'circle'
      ? { shape: 'circle', diameter: settings.skirmishBaseSizeMm, label: 'skirmish-circle' }
      : { shape: 'rect', width: settings.skirmishBaseSizeMm, depth: settings.skirmishBaseSizeMm, label: 'skirmish-square' };
  }

  return {
    shape: 'rect',
    width: settings.baseWidthMm,
    depth: settings.baseDepthMm,
    label: settings.template === 'lanceWedge' ? 'lance-base' : 'standard-base',
  };
}

export function getGeneratedBaseSpecs(settings: TraySettings): GeneratedBaseSpec[] {
  const dimensions = calculateTrayDimensions(settings);
  const specs: GeneratedBaseSpec[] = [getPrimaryGeneratedBaseSpec(settings)];
  const rankInsert = getRankInsertSlot(settings, dimensions);

  if (rankInsert) {
    const width = Math.max(1, rankInsert.width - settings.toleranceMm);
    const depth = Math.max(1, rankInsert.depth - settings.toleranceMm);
    specs.push(
      rankInsert.shape === 'circle'
        ? { shape: 'circle', diameter: Math.min(width, depth), label: 'rank-insert' }
        : { shape: 'rect', width, depth, label: 'rank-insert' },
    );
  }

  if (settings.characterBayEnabled && settings.template === 'adapter') {
    specs.push({
      shape: 'rect',
      width: settings.adapterFlankCutoutWidthMm,
      depth: settings.adapterFlankCutoutDepthMm,
      label: 'flank-adapter',
    });
  }

  if (settings.characterBayEnabled && settings.template === 'standard') {
    specs.push({
      shape: 'rect',
      width: settings.characterBaseWidthMm,
      depth: settings.characterBaseDepthMm,
      label: 'character-flank-slot',
    });
  }

  return uniqueSpecs(specs);
}

export function generateBaseMesh(settings: TraySettings, spec = getPrimaryGeneratedBaseSpec(settings)): THREE.Group {
  const group = new THREE.Group();
  group.name = 'matching-base';
  const height = Math.max(1.5, settings.generatedBaseHeightMm);
  const magnetEnabled = settings.magnetCutoutsEnabled;
  const magnetDepth = magnetEnabled ? Math.min(settings.magnetCutoutDepthMm, height) : 0;
  const magnetDiameter = Math.max(1, settings.magnetDiameterMm);

  if (!settings.generatedBaseHollow) {
    const solidHeight = Math.max(0, height - magnetDepth);
    if (solidHeight > 0) {
      group.add(createExtrudedMesh('base-solid', createShape(spec), solidHeight, 0));
    }

    if (magnetDepth > 0) {
      const magnetLayer = createShape(spec);
      addMagnetHole(magnetLayer, magnetDiameter);
      group.add(createExtrudedMesh('base-magnet-recess-layer', magnetLayer, magnetDepth, solidHeight));
    }

    return group;
  }

  const wallThickness = Math.max(1, settings.generatedBaseWallThicknessMm);
  const topThickness = Math.min(Math.max(1, settings.generatedBaseTopThicknessMm), Math.max(1, height - 0.1));
  group.add(createExtrudedMesh('base-top-skin', createShape(spec), topThickness, 0));

  const wallHeight = Math.max(0, height - topThickness);
  if (wallHeight > 0) {
    const wallShape = createShape(spec);
    addInsetHole(wallShape, spec, wallThickness);
    group.add(createExtrudedMesh('base-hollow-walls', wallShape, wallHeight, topThickness));
  }

  if (magnetEnabled && wallHeight > 0) {
    const collarDiameter = magnetDiameter + wallThickness * 2;
    const collarShape = createEllipseShape(collarDiameter, collarDiameter);
    addMagnetHole(collarShape, magnetDiameter);
    group.add(createExtrudedMesh('base-magnet-collar', collarShape, wallHeight, topThickness));
  }

  return group;
}
