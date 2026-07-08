import * as THREE from 'three';
import type { TraySettings } from '../types';
import { calculateTrayDimensions, getMagnetCutoutCenters, getRankCounts, getSkirmishPlacements } from './trayMath';

type Rect = { left: number; right: number; front: number; back: number };
type PerimeterSegment = { start: THREE.Vector2; end: THREE.Vector2; normal: THREE.Vector2 };

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

function createRectCutoutLayer(
  name: string,
  width: number,
  depth: number,
  height: number,
  holes: Array<{ x: number; y: number; width: number; depth: number }>,
  x: number,
  y: number,
  z: number,
) {
  if (holes.length === 0) {
    return createBox(name, width, depth, height, x, y, z + height / 2);
  }

  const shape = new THREE.Shape();
  shape.moveTo(-width / 2, -depth / 2);
  shape.lineTo(width / 2, -depth / 2);
  shape.lineTo(width / 2, depth / 2);
  shape.lineTo(-width / 2, depth / 2);
  shape.lineTo(-width / 2, -depth / 2);

  holes.forEach((hole) => {
    const halfWidth = hole.width / 2;
    const halfDepth = hole.depth / 2;

    if (
      hole.x - halfWidth >= -width / 2 &&
      hole.x + halfWidth <= width / 2 &&
      hole.y - halfDepth >= -depth / 2 &&
      hole.y + halfDepth <= depth / 2
    ) {
      const path = new THREE.Path();
      path.moveTo(hole.x - halfWidth, hole.y - halfDepth);
      path.lineTo(hole.x - halfWidth, hole.y + halfDepth);
      path.lineTo(hole.x + halfWidth, hole.y + halfDepth);
      path.lineTo(hole.x + halfWidth, hole.y - halfDepth);
      path.lineTo(hole.x - halfWidth, hole.y - halfDepth);
      shape.holes.push(path);
    }
  });

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: height,
    bevelEnabled: false,
  });
  const material = new THREE.MeshStandardMaterial({ color: 0x8f9f88 });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = name;
  mesh.position.set(x, y, z);
  return mesh;
}

function getUnionPerimeterSegments(rects: Rect[]): PerimeterSegment[] {
  const outerRects = rects.filter((rect) => rect.right > rect.left && rect.back > rect.front);
  const xEdges = new Set<number>();
  const yEdges = new Set<number>();

  outerRects.forEach((rect) => {
    xEdges.add(rect.left);
    xEdges.add(rect.right);
    yEdges.add(rect.front);
    yEdges.add(rect.back);
  });

  const sortedXEdges = Array.from(xEdges).sort((a, b) => a - b);
  const sortedYEdges = Array.from(yEdges).sort((a, b) => a - b);
  const containsPoint = (pointX: number, pointY: number) =>
    outerRects.some((rect) => pointX > rect.left && pointX < rect.right && pointY > rect.front && pointY < rect.back);
  const segments: PerimeterSegment[] = [];

  for (let xIndex = 0; xIndex < sortedXEdges.length - 1; xIndex += 1) {
    for (let yIndex = 0; yIndex < sortedYEdges.length - 1; yIndex += 1) {
      const left = sortedXEdges[xIndex];
      const right = sortedXEdges[xIndex + 1];
      const front = sortedYEdges[yIndex];
      const back = sortedYEdges[yIndex + 1];
      const centerX = (left + right) / 2;
      const centerY = (front + back) / 2;

      if (!containsPoint(centerX, centerY)) {
        continue;
      }

      if (!containsPoint(left - 0.001, centerY)) {
        segments.push({ start: new THREE.Vector2(left, front), end: new THREE.Vector2(left, back), normal: new THREE.Vector2(-1, 0) });
      }

      if (!containsPoint(right + 0.001, centerY)) {
        segments.push({ start: new THREE.Vector2(right, back), end: new THREE.Vector2(right, front), normal: new THREE.Vector2(1, 0) });
      }

      if (!containsPoint(centerX, front - 0.001)) {
        segments.push({ start: new THREE.Vector2(right, front), end: new THREE.Vector2(left, front), normal: new THREE.Vector2(0, -1) });
      }

      if (!containsPoint(centerX, back + 0.001)) {
        segments.push({ start: new THREE.Vector2(left, back), end: new THREE.Vector2(right, back), normal: new THREE.Vector2(0, 1) });
      }
    }
  }

  return segments.filter((segment) => segment.start.distanceTo(segment.end) > 0);
}

function createTrayFinishShell(name: string, rects: Rect[], height: number, settings: TraySettings) {
  const slope = Math.max(0, settings.trayEdgeSlopeMm);

  if (slope <= 0) {
    return null;
  }

  const segments = getUnionPerimeterSegments(rects);
  const geometry = new THREE.BufferGeometry();
  const vertices: number[] = [];
  const indices: number[] = [];
  const cornerGroups = new Map<string, PerimeterSegment[]>();
  const roundKey = (value: number) => value.toFixed(4);
  const cornerKey = (point: THREE.Vector2) => `${roundKey(point.x)},${roundKey(point.y)}`;
  const addVertex = (point: THREE.Vector2, z: number) => {
    vertices.push(point.x, point.y, z);
    return vertices.length / 3 - 1;
  };
  const addQuad = (a: THREE.Vector2, b: THREE.Vector2, c: THREE.Vector2, d: THREE.Vector2) => {
    const index = vertices.length / 3;
    vertices.push(a.x, a.y, height, b.x, b.y, height, c.x, c.y, 0, d.x, d.y, 0);
    indices.push(index, index + 2, index + 1, index + 1, index + 2, index + 3);
  };

  segments.forEach((segment) => {
    const topStart = segment.start;
    const topEnd = segment.end;
    const bottomStart = topStart.clone().addScaledVector(segment.normal, slope);
    const bottomEnd = topEnd.clone().addScaledVector(segment.normal, slope);
    addQuad(topStart, topEnd, bottomStart, bottomEnd);

    [segment.start, segment.end].forEach((point) => {
      const key = cornerKey(point);
      cornerGroups.set(key, [...(cornerGroups.get(key) ?? []), segment]);
    });
  });

  if (slope > 0) {
    cornerGroups.forEach((cornerSegments, key) => {
      const normals = Array.from(
        new Map(cornerSegments.map((segment) => [`${segment.normal.x},${segment.normal.y}`, segment.normal])).values(),
      );

      if (normals.length < 2) {
        return;
      }

      const [x, y] = key.split(',').map(Number);
      const corner = new THREE.Vector2(x, y);
      const topIndex = addVertex(corner, height);
      const anglePairs = normals
        .map((normal) => {
          const bottomPoint = corner.clone().addScaledVector(normal, slope);
          return { angle: Math.atan2(normal.y, normal.x), point: bottomPoint };
        })
        .sort((a, b) => a.angle - b.angle);
      const first = anglePairs[0];
      const last = anglePairs[anglePairs.length - 1];
      const span = last.angle - first.angle > Math.PI ? [last, first] : [first, last];
      let startAngle = span[0].angle;
      let endAngle = span[1].angle;

      if (endAngle < startAngle) {
        endAngle += Math.PI * 2;
      }

      const steps = 4;
      const bottomIndices = Array.from({ length: steps + 1 }, (_, step) => {
        const angle = startAngle + ((endAngle - startAngle) * step) / steps;
        const point = corner.clone().add(new THREE.Vector2(Math.cos(angle), Math.sin(angle)).multiplyScalar(slope));
        return addVertex(point, 0);
      });

      for (let index = 0; index < bottomIndices.length - 1; index += 1) {
        indices.push(topIndex, bottomIndices[index], bottomIndices[index + 1]);
      }
    });
  }

  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  const material = new THREE.MeshStandardMaterial({ color: 0x8f9f88 });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = name;
  return mesh;
}

function addTrayFinishShell(group: THREE.Group, name: string, rects: Rect[], height: number, settings: TraySettings) {
  const shell = createTrayFinishShell(name, rects, height, settings);
  if (shell) {
    group.add(shell);
  }
}

function createRectGridLayer(
  name: string,
  width: number,
  depth: number,
  height: number,
  holes: Array<{ x: number; y: number; width: number; depth: number }>,
  x: number,
  y: number,
  z: number,
) {
  if (holes.length === 0) {
    return createBox(name, width, depth, height, x, y, z + height / 2);
  }

  const group = new THREE.Group();
  group.name = name;
  const xEdges = new Set([-width / 2, width / 2]);
  const yEdges = new Set([-depth / 2, depth / 2]);

  holes.forEach((hole) => {
    const halfWidth = hole.width / 2;
    const halfDepth = hole.depth / 2;

    if (
      hole.x - halfWidth >= -width / 2 &&
      hole.x + halfWidth <= width / 2 &&
      hole.y - halfDepth >= -depth / 2 &&
      hole.y + halfDepth <= depth / 2
    ) {
      xEdges.add(hole.x - halfWidth);
      xEdges.add(hole.x + halfWidth);
      yEdges.add(hole.y - halfDepth);
      yEdges.add(hole.y + halfDepth);
    }
  });

  const sortedXEdges = Array.from(xEdges).sort((a, b) => a - b);
  const sortedYEdges = Array.from(yEdges).sort((a, b) => a - b);

  for (let xIndex = 0; xIndex < sortedXEdges.length - 1; xIndex += 1) {
    for (let yIndex = 0; yIndex < sortedYEdges.length - 1; yIndex += 1) {
      const left = sortedXEdges[xIndex];
      const right = sortedXEdges[xIndex + 1];
      const front = sortedYEdges[yIndex];
      const back = sortedYEdges[yIndex + 1];
      const cellWidth = right - left;
      const cellDepth = back - front;
      const cellCenterX = left + cellWidth / 2;
      const cellCenterY = front + cellDepth / 2;
      const isInsideHole = holes.some((hole) => {
        const halfWidth = hole.width / 2;
        const halfDepth = hole.depth / 2;
        return (
          cellCenterX > hole.x - halfWidth &&
          cellCenterX < hole.x + halfWidth &&
          cellCenterY > hole.y - halfDepth &&
          cellCenterY < hole.y + halfDepth
        );
      });

      if (!isInsideHole && cellWidth > 0 && cellDepth > 0) {
        group.add(
          createBox(
            `${name}-cell-${xIndex}-${yIndex}`,
            cellWidth,
            cellDepth,
            height,
            x + cellCenterX,
            y + cellCenterY,
            z + height / 2,
          ),
        );
      }
    }
  }

  return group;
}

function createUnionRectGridLayer(
  name: string,
  rects: Array<{ left: number; right: number; front: number; back: number }>,
  height: number,
  holes: Array<{ x: number; y: number; width: number; depth: number }>,
  z: number,
) {
  const outerRects = rects.filter((rect) => rect.right > rect.left && rect.back > rect.front);
  const group = new THREE.Group();
  group.name = name;

  if (outerRects.length === 0) {
    return group;
  }

  const xEdges = new Set<number>();
  const yEdges = new Set<number>();

  outerRects.forEach((rect) => {
    xEdges.add(rect.left);
    xEdges.add(rect.right);
    yEdges.add(rect.front);
    yEdges.add(rect.back);
  });

  holes.forEach((hole) => {
    const halfWidth = hole.width / 2;
    const halfDepth = hole.depth / 2;
    xEdges.add(hole.x - halfWidth);
    xEdges.add(hole.x + halfWidth);
    yEdges.add(hole.y - halfDepth);
    yEdges.add(hole.y + halfDepth);
  });

  const sortedXEdges = Array.from(xEdges).sort((a, b) => a - b);
  const sortedYEdges = Array.from(yEdges).sort((a, b) => a - b);
  const containsPoint = (pointX: number, pointY: number) =>
    outerRects.some((rect) => pointX > rect.left && pointX < rect.right && pointY > rect.front && pointY < rect.back);

  for (let xIndex = 0; xIndex < sortedXEdges.length - 1; xIndex += 1) {
    for (let yIndex = 0; yIndex < sortedYEdges.length - 1; yIndex += 1) {
      const left = sortedXEdges[xIndex];
      const right = sortedXEdges[xIndex + 1];
      const front = sortedYEdges[yIndex];
      const back = sortedYEdges[yIndex + 1];
      const width = right - left;
      const depth = back - front;
      const centerX = left + width / 2;
      const centerY = front + depth / 2;
      const isInsideHole = holes.some((hole) => {
        const halfWidth = hole.width / 2;
        const halfDepth = hole.depth / 2;
        return (
          centerX > hole.x - halfWidth &&
          centerX < hole.x + halfWidth &&
          centerY > hole.y - halfDepth &&
          centerY < hole.y + halfDepth
        );
      });

      if (containsPoint(centerX, centerY) && !isInsideHole && width > 0 && depth > 0) {
        group.add(createBox(`${name}-cell-${xIndex}-${yIndex}`, width, depth, height, centerX, centerY, z + height / 2));
      }
    }
  }

  return group;
}

function createSkirmishFloorLayer(
  name: string,
  width: number,
  depth: number,
  height: number,
  holes: Array<{ x: number; y: number; rotationDeg: number }>,
  settings: TraySettings,
  z = 0,
) {
  if (holes.length === 0) {
    return createBox(name, width, depth, height, 0, 0, z + height / 2);
  }

  const shape = new THREE.Shape();
  shape.moveTo(-width / 2, -depth / 2);
  shape.lineTo(width / 2, -depth / 2);
  shape.lineTo(width / 2, depth / 2);
  shape.lineTo(-width / 2, depth / 2);
  shape.lineTo(-width / 2, -depth / 2);

  holes.forEach((hole) => {
    const size = settings.skirmishBaseSizeMm + settings.toleranceMm;
    const halfSize = size / 2;

    if (settings.skirmishBaseShape === 'circle') {
      const path = new THREE.Path();
      path.absellipse(hole.x, hole.y, halfSize, halfSize, 0, Math.PI * 2, true);
      shape.holes.push(path);
      return;
    }

    const angle = (hole.rotationDeg * Math.PI) / 180;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const corners = [
      { x: -halfSize, y: -halfSize },
      { x: -halfSize, y: halfSize },
      { x: halfSize, y: halfSize },
      { x: halfSize, y: -halfSize },
    ].map((corner) => ({
      x: hole.x + corner.x * cos - corner.y * sin,
      y: hole.y + corner.x * sin + corner.y * cos,
    }));

    const path = new THREE.Path();
    path.moveTo(corners[0].x, corners[0].y);
    corners.slice(1).forEach((corner) => path.lineTo(corner.x, corner.y));
    path.lineTo(corners[0].x, corners[0].y);
    shape.holes.push(path);
  });

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: height,
    bevelEnabled: false,
    curveSegments: 32,
  });
  const material = new THREE.MeshStandardMaterial({ color: 0x8f9f88 });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = name;
  mesh.position.set(0, 0, z);
  return mesh;
}

function getRectHolesInRect(
  holes: Array<{ x: number; y: number; width: number; depth: number }>,
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
      ...hole,
      x: hole.x - centerX,
      y: hole.y - centerY,
    }));
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

function createPerimeterBorderLayer(
  name: string,
  width: number,
  depth: number,
  height: number,
  x: number,
  y: number,
  borderWidth: number,
) {
  const inset = Math.max(0, borderWidth);
  const innerWidth = width - inset * 2;
  const innerDepth = depth - inset * 2;

  if (innerWidth <= 0 || innerDepth <= 0) {
    return createBox(name, width, depth, height, x, y, height / 2);
  }

  return createRectGridLayer(
    name,
    width,
    depth,
    height,
    [{ x: 0, y: 0, width: innerWidth, depth: innerDepth }],
    x,
    y,
    0,
  );
}

function createUnionPerimeterBorderLayer(
  name: string,
  rects: Array<{ left: number; right: number; front: number; back: number }>,
  height: number,
  z: number,
  borderWidth: number,
) {
  const inset = Math.max(0, borderWidth);
  const outerRects = rects.filter((rect) => rect.right > rect.left && rect.back > rect.front);
  const xEdges = new Set<number>();
  const yEdges = new Set<number>();

  outerRects.forEach((rect) => {
    xEdges.add(rect.left);
    xEdges.add(rect.right);
    xEdges.add(rect.left + inset);
    xEdges.add(rect.right - inset);
    yEdges.add(rect.front);
    yEdges.add(rect.back);
    yEdges.add(rect.front + inset);
    yEdges.add(rect.back - inset);
  });

  const sortedXEdges = Array.from(xEdges).sort((a, b) => a - b);
  const sortedYEdges = Array.from(yEdges).sort((a, b) => a - b);
  const group = new THREE.Group();
  group.name = name;
  const containsPoint = (pointX: number, pointY: number) =>
    outerRects.some((rect) => pointX > rect.left && pointX < rect.right && pointY > rect.front && pointY < rect.back);
  const distanceToHorizontalUnionEdge = (pointX: number, pointY: number) => {
    const intervals = outerRects
      .filter((rect) => pointY > rect.front && pointY < rect.back)
      .map((rect) => ({ start: rect.left, end: rect.right }))
      .sort((a, b) => a.start - b.start);
    const merged: Array<{ start: number; end: number }> = [];

    intervals.forEach((interval) => {
      const previous = merged[merged.length - 1];

      if (previous && interval.start <= previous.end) {
        previous.end = Math.max(previous.end, interval.end);
      } else {
        merged.push({ ...interval });
      }
    });

    const containingInterval = merged.find((interval) => pointX > interval.start && pointX < interval.end);
    return containingInterval ? Math.min(pointX - containingInterval.start, containingInterval.end - pointX) : 0;
  };
  const distanceToVerticalUnionEdge = (pointX: number, pointY: number) => {
    const intervals = outerRects
      .filter((rect) => pointX > rect.left && pointX < rect.right)
      .map((rect) => ({ start: rect.front, end: rect.back }))
      .sort((a, b) => a.start - b.start);
    const merged: Array<{ start: number; end: number }> = [];

    intervals.forEach((interval) => {
      const previous = merged[merged.length - 1];

      if (previous && interval.start <= previous.end) {
        previous.end = Math.max(previous.end, interval.end);
      } else {
        merged.push({ ...interval });
      }
    });

    const containingInterval = merged.find((interval) => pointY > interval.start && pointY < interval.end);
    return containingInterval ? Math.min(pointY - containingInterval.start, containingInterval.end - pointY) : 0;
  };

  for (let xIndex = 0; xIndex < sortedXEdges.length - 1; xIndex += 1) {
    for (let yIndex = 0; yIndex < sortedYEdges.length - 1; yIndex += 1) {
      const left = sortedXEdges[xIndex];
      const right = sortedXEdges[xIndex + 1];
      const front = sortedYEdges[yIndex];
      const back = sortedYEdges[yIndex + 1];
      const width = right - left;
      const depth = back - front;
      const centerX = left + width / 2;
      const centerY = front + depth / 2;
      const isInOuter = containsPoint(centerX, centerY);
      const distanceToPerimeter = Math.min(
        distanceToHorizontalUnionEdge(centerX, centerY),
        distanceToVerticalUnionEdge(centerX, centerY),
      );

      if (isInOuter && distanceToPerimeter <= inset && width > 0 && depth > 0) {
        group.add(createBox(`${name}-cell-${xIndex}-${yIndex}`, width, depth, height, centerX, centerY, z + height / 2));
      }
    }
  }

  return group;
}

function createAdapterFloorLayer(
  name: string,
  width: number,
  depth: number,
  x: number,
  y: number,
  magnetHoles: Array<{ x: number; y: number }>,
  settings: TraySettings,
) {
  return createPerforatedFloorLayer(name, width, depth, settings.floorThicknessMm, x, y, magnetHoles, settings);
}

function createAdapterBlockLayer(
  name: string,
  width: number,
  depth: number,
  height: number,
  holes: Array<{ x: number; y: number; width: number; depth: number }>,
  x: number,
  y: number,
  z: number,
) {
  return createRectGridLayer(name, width, depth, height, holes, x, y, z);
}

function createAdapterTopBorderLayer(
  name: string,
  width: number,
  depth: number,
  x: number,
  y: number,
  settings: TraySettings,
) {
  return createPerimeterBorderLayer(
    name,
    width,
    depth,
    settings.floorThicknessMm,
    x,
    y,
    settings.adapterFloorCutoutBufferMm,
  );
}

export function generateTrayMesh(settings: TraySettings): THREE.Group {
  const dimensions = calculateTrayDimensions(settings);
  const group = new THREE.Group();
  group.name = 'movement-tray';
  const rankCounts = getRankCounts(settings);
  const magnetCenters = getMagnetCutoutCenters(settings, dimensions);
  const adapterBlockZ = settings.adapterRemoveFloorEnabled ? 0 : settings.floorThicknessMm;

  if (settings.template === 'skirmish') {
    const innerCenterOffsetX = -dimensions.outerWidthMm / 2 + dimensions.leftRailMm + dimensions.innerWidthMm / 2;
    const innerCenterOffsetY = -dimensions.outerDepthMm / 2 + dimensions.frontRailMm + dimensions.innerDepthMm / 2;
    const skirmishHoles = getSkirmishPlacements(settings, dimensions).map((placement) => ({
      x: placement.x + innerCenterOffsetX,
      y: placement.y + innerCenterOffsetY,
      rotationDeg: placement.rotationDeg,
    }));
    const skirmishMagnetCenters = magnetCenters.map((center) => ({
      x: center.x + innerCenterOffsetX,
      y: center.y + innerCenterOffsetY,
    }));
    const skirmishCutoutZ = settings.adapterRemoveFloorEnabled ? 0 : settings.floorThicknessMm;
    const cutoutLayerHeight = Math.max(
      0,
      settings.skirmishTrayHeightMm - (settings.adapterRemoveFloorEnabled ? 0 : settings.floorThicknessMm),
    );

    if (!settings.adapterRemoveFloorEnabled) {
      group.add(
        createPerforatedFloorLayer(
          'skirmish-floor',
          dimensions.outerWidthMm,
          dimensions.outerDepthMm,
          settings.floorThicknessMm,
          0,
          0,
          getHolesInRect(skirmishMagnetCenters, 0, 0, dimensions.outerWidthMm, dimensions.outerDepthMm),
          settings,
        ),
      );
    }

    if (cutoutLayerHeight > 0) {
      group.add(
        createSkirmishFloorLayer(
          'skirmish-cutout-layer',
          dimensions.outerWidthMm,
          dimensions.outerDepthMm,
          cutoutLayerHeight,
          skirmishHoles,
          settings,
          skirmishCutoutZ,
        ),
      );
    }

    if (settings.adapterRemoveFloorEnabled && settings.adapterFloorCutoutEnabled) {
      const topBorder = createAdapterTopBorderLayer(
        'skirmish-magnetic-sheet-border',
        dimensions.outerWidthMm,
        dimensions.outerDepthMm,
        0,
        0,
        settings,
      );
      topBorder.position.z += settings.skirmishTrayHeightMm;
      group.add(topBorder);
    }

    addTrayFinishShell(
      group,
      'skirmish-tray-finish',
      [{ left: -dimensions.outerWidthMm / 2, right: dimensions.outerWidthMm / 2, front: -dimensions.outerDepthMm / 2, back: dimensions.outerDepthMm / 2 }],
      settings.skirmishTrayHeightMm,
      settings,
    );

    return group;
  }

  if (settings.template === 'adapterLance') {
    const outerFrontY = -dimensions.outerDepthMm / 2;
    const adapterLanceRects: Rect[] = [];

    rankCounts.forEach((rankCount, rowIndex) => {
      const rowWidth = rankCount * dimensions.slotWidthMm;
      const rowCenterY = outerFrontY + rowIndex * dimensions.slotDepthMm + dimensions.slotDepthMm / 2;
      adapterLanceRects.push({
        left: -rowWidth / 2,
        right: rowWidth / 2,
        front: rowCenterY - dimensions.slotDepthMm / 2,
        back: rowCenterY + dimensions.slotDepthMm / 2,
      });
      const rowMagnetCenters = magnetCenters
        .filter((center) => center.rowIndex === rowIndex)
        .map((center) => ({ x: center.x, y: center.y - rowCenterY }));
      const rowHoles = Array.from({ length: rankCount }, (_, columnIndex) => ({
        x: -rowWidth / 2 + columnIndex * dimensions.slotWidthMm + dimensions.slotWidthMm / 2,
        y: rowCenterY,
        width: dimensions.adapterCutoutWidthMm,
        depth: dimensions.adapterCutoutDepthMm,
      }));

      const localRowHoles = getRectHolesInRect(rowHoles, 0, rowCenterY, rowWidth, dimensions.slotDepthMm);
      if (!settings.adapterRemoveFloorEnabled) {
        group.add(
          createAdapterFloorLayer(
            `adapter-lance-floor-rank-${rowIndex + 1}`,
            rowWidth,
            dimensions.slotDepthMm,
            0,
            rowCenterY,
            rowMagnetCenters,
            settings,
          ),
        );
      }

      group.add(
        createAdapterBlockLayer(
          `adapter-lance-block-rank-${rowIndex + 1}`,
          rowWidth,
          dimensions.slotDepthMm,
          settings.adapterBaseHeightMm,
          localRowHoles,
          0,
          rowCenterY,
          adapterBlockZ,
        ),
      );

      if (settings.adapterRemoveFloorEnabled && settings.adapterFloorCutoutEnabled) {
        const topBorder = createAdapterTopBorderLayer(
          `adapter-lance-top-border-rank-${rowIndex + 1}`,
          rowWidth,
          dimensions.slotDepthMm,
          0,
          rowCenterY,
          settings,
        );
        topBorder.position.z += settings.adapterBaseHeightMm;
        group.add(topBorder);
      }
    });

    addTrayFinishShell(group, 'adapter-lance-tray-finish', adapterLanceRects, adapterBlockZ + settings.adapterBaseHeightMm, settings);

    return group;
  }

  if (settings.template === 'adapter') {
    const adapterMagnetCenters = magnetCenters.map((center) => ({
      x: center.x,
      y: center.y,
    }));
    const hasFlankAdapter = settings.characterBayEnabled;
    const outerLeftX = -dimensions.outerWidthMm / 2;
    const outerFrontY = -dimensions.outerDepthMm / 2;
    const mainFloorX =
      hasFlankAdapter && settings.characterBaySide === 'left'
        ? outerLeftX + dimensions.characterSlotWidthMm
        : outerLeftX;
    const mainFloorCenterX = mainFloorX + dimensions.mainInnerWidthMm / 2;
    const mainFloorCenterY = outerFrontY + dimensions.mainInnerDepthMm / 2;
    const characterFloorX =
      settings.characterBaySide === 'left' ? outerLeftX : outerLeftX + dimensions.mainInnerWidthMm;
    const characterFloorCenterX = characterFloorX + dimensions.characterSlotWidthMm / 2;
    const characterFloorCenterY = outerFrontY + dimensions.characterSlotDepthMm / 2;
    const adapterHoles: Array<{ x: number; y: number; width: number; depth: number }> = [];

    rankCounts.forEach((rankCount, rowIndex) => {
      for (let columnIndex = 0; columnIndex < rankCount; columnIndex += 1) {
        adapterHoles.push({
          x: mainFloorX + columnIndex * dimensions.slotWidthMm + dimensions.slotWidthMm / 2,
          y: outerFrontY + rowIndex * dimensions.slotDepthMm + dimensions.slotDepthMm / 2,
          width: dimensions.adapterCutoutWidthMm,
          depth: dimensions.adapterCutoutDepthMm,
        });
      }
    });

    if (hasFlankAdapter) {
      adapterHoles.push({
        x: characterFloorCenterX,
        y: characterFloorCenterY,
        width: dimensions.adapterFlankCutoutWidthMm,
        depth: dimensions.adapterFlankCutoutDepthMm,
      });
    }

    const mainAdapterHoles = getRectHolesInRect(
      adapterHoles,
      mainFloorCenterX,
      mainFloorCenterY,
      dimensions.mainInnerWidthMm,
      dimensions.mainInnerDepthMm,
    );
    const mainAdapterMagnetCenters = getHolesInRect(
      adapterMagnetCenters,
      mainFloorCenterX,
      mainFloorCenterY,
      dimensions.mainInnerWidthMm,
      dimensions.mainInnerDepthMm,
    );
    const mainAdapterRect = {
      left: mainFloorX,
      right: mainFloorX + dimensions.mainInnerWidthMm,
      front: outerFrontY,
      back: outerFrontY + dimensions.mainInnerDepthMm,
    };
    const flankAdapterRect = {
      left: characterFloorX,
      right: characterFloorX + dimensions.characterSlotWidthMm,
      front: outerFrontY,
      back: outerFrontY + dimensions.characterSlotDepthMm,
    };

    if (!settings.adapterRemoveFloorEnabled) {
      group.add(
        createAdapterFloorLayer(
          'adapter-floor',
          dimensions.mainInnerWidthMm,
          dimensions.mainInnerDepthMm,
          mainFloorCenterX,
          mainFloorCenterY,
          mainAdapterMagnetCenters,
          settings,
        ),
      );
    }

    if (hasFlankAdapter && settings.adapterRemoveFloorEnabled) {
      group.add(
        createUnionRectGridLayer(
          'adapter-open-floor-block',
          [mainAdapterRect, flankAdapterRect],
          settings.adapterBaseHeightMm,
          adapterHoles,
          adapterBlockZ,
        ),
      );
    } else {
      group.add(
        createAdapterBlockLayer(
          'adapter-block',
          dimensions.mainInnerWidthMm,
          dimensions.mainInnerDepthMm,
          settings.adapterBaseHeightMm,
          mainAdapterHoles,
          mainFloorCenterX,
          mainFloorCenterY,
          adapterBlockZ,
        ),
      );
    }

    if (settings.adapterRemoveFloorEnabled && settings.adapterFloorCutoutEnabled && !hasFlankAdapter) {
      group.add(
        createUnionPerimeterBorderLayer(
          'adapter-magnetic-sheet-border',
          [mainAdapterRect],
          settings.floorThicknessMm,
          settings.adapterBaseHeightMm,
          settings.adapterFloorCutoutBufferMm,
        ),
      );
    }

    if (hasFlankAdapter) {
      const flankAdapterHoles = getRectHolesInRect(
        adapterHoles,
        characterFloorCenterX,
        characterFloorCenterY,
        dimensions.characterSlotWidthMm,
        dimensions.characterSlotDepthMm,
      );
      const flankAdapterMagnetCenters = getHolesInRect(
        adapterMagnetCenters,
        characterFloorCenterX,
        characterFloorCenterY,
        dimensions.characterSlotWidthMm,
        dimensions.characterSlotDepthMm,
      );

      if (!settings.adapterRemoveFloorEnabled) {
        group.add(
          createAdapterFloorLayer(
            'adapter-flank-floor',
            dimensions.characterSlotWidthMm,
            dimensions.characterSlotDepthMm,
            characterFloorCenterX,
            characterFloorCenterY,
            flankAdapterMagnetCenters,
            settings,
          ),
        );
      }

      if (!settings.adapterRemoveFloorEnabled) {
        group.add(
          createAdapterBlockLayer(
            'adapter-flank-block',
            dimensions.characterSlotWidthMm,
            dimensions.characterSlotDepthMm,
            settings.adapterBaseHeightMm,
            flankAdapterHoles,
            characterFloorCenterX,
            characterFloorCenterY,
            adapterBlockZ,
          ),
        );
      }

    }

    if (hasFlankAdapter && settings.adapterRemoveFloorEnabled && settings.adapterFloorCutoutEnabled) {
      group.add(
        createUnionPerimeterBorderLayer(
          'adapter-flank-magnetic-sheet-border',
          [mainAdapterRect, flankAdapterRect],
          settings.floorThicknessMm,
          settings.adapterBaseHeightMm,
          settings.adapterFloorCutoutBufferMm,
        ),
      );
    }

    addTrayFinishShell(
      group,
      'adapter-tray-finish',
      hasFlankAdapter ? [mainAdapterRect, flankAdapterRect] : [mainAdapterRect],
      adapterBlockZ + settings.adapterBaseHeightMm,
      settings,
    );

    return group;
  }

  if (settings.template === 'lanceWedge') {
    const railHeight = settings.railHeightMm;
    const railCenterZ = settings.floorThicknessMm + railHeight / 2;
    const innerFrontY = -dimensions.outerDepthMm / 2 + dimensions.frontRailMm;
    const centerX = 0;
    const lanceRects: Rect[] = [];

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
        lanceRects.push({
          left: -rowWidth / 2 - settings.railThicknessMm,
          right: -rowWidth / 2,
          front: rowCenterY - dimensions.slotDepthMm / 2,
          back: rowCenterY + dimensions.slotDepthMm / 2,
        });
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
        lanceRects.push({
          left: rowWidth / 2,
          right: rowWidth / 2 + settings.railThicknessMm,
          front: rowCenterY - dimensions.slotDepthMm / 2,
          back: rowCenterY + dimensions.slotDepthMm / 2,
        });
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
      lanceRects.push({
        left: -frontFloorWidth / 2,
        right: frontFloorWidth / 2,
        front: -dimensions.outerDepthMm / 2,
        back: -dimensions.outerDepthMm / 2 + settings.railThicknessMm,
      });
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
      lanceRects.push({
        left: -dimensions.innerWidthMm / 2 - dimensions.leftRailMm,
        right: dimensions.innerWidthMm / 2 + dimensions.rightRailMm,
        front: dimensions.outerDepthMm / 2 - settings.railThicknessMm,
        back: dimensions.outerDepthMm / 2,
      });
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
        lanceRects.push({
          left: leftStepX - stepWidth / 2,
          right: leftStepX + stepWidth / 2,
          front: stepY - settings.railThicknessMm / 2,
          back: stepY + settings.railThicknessMm / 2,
        });
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
        lanceRects.push({
          left: rightStepX - stepWidth / 2,
          right: rightStepX + stepWidth / 2,
          front: stepY - settings.railThicknessMm / 2,
          back: stepY + settings.railThicknessMm / 2,
        });
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

    addTrayFinishShell(group, 'lance-tray-finish', lanceRects, settings.floorThicknessMm + railHeight, settings);

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

  const standardFinishRects: Rect[] = [];

  if (settings.leftRailEnabled && (!hasCharacterBay || settings.characterBaySide === 'right')) {
    standardFinishRects.push({
      left: -dimensions.outerWidthMm / 2,
      right: -dimensions.outerWidthMm / 2 + settings.railThicknessMm,
      front: -dimensions.outerDepthMm / 2,
      back: dimensions.outerDepthMm / 2,
    });
  }

  if (settings.rightRailEnabled && (!hasCharacterBay || settings.characterBaySide === 'left')) {
    standardFinishRects.push({
      left: dimensions.outerWidthMm / 2 - settings.railThicknessMm,
      right: dimensions.outerWidthMm / 2,
      front: -dimensions.outerDepthMm / 2,
      back: dimensions.outerDepthMm / 2,
    });
  }

  if (settings.frontRailEnabled) {
    standardFinishRects.push({
      left: -dimensions.innerWidthMm / 2,
      right: dimensions.innerWidthMm / 2,
      front: -dimensions.outerDepthMm / 2,
      back: -dimensions.outerDepthMm / 2 + settings.railThicknessMm,
    });
  }

  if (settings.rearRailEnabled) {
    const rearRailWidth = hasCharacterBay ? dimensions.mainInnerWidthMm : dimensions.innerWidthMm;
    const rearRailCenterX = hasCharacterBay ? mainAreaCenterX : 0;
    standardFinishRects.push({
      left: rearRailCenterX - rearRailWidth / 2,
      right: rearRailCenterX + rearRailWidth / 2,
      front: dimensions.outerDepthMm / 2 - settings.railThicknessMm,
      back: dimensions.outerDepthMm / 2,
    });
  }

  if (hasCharacterBay && characterSideRailMm > 0) {
    const baySideRailCenterX =
      settings.characterBaySide === 'left'
        ? outerLeftX + settings.railThicknessMm / 2
        : dimensions.outerWidthMm / 2 - settings.railThicknessMm / 2;
    standardFinishRects.push({
      left: baySideRailCenterX - settings.railThicknessMm / 2,
      right: baySideRailCenterX + settings.railThicknessMm / 2,
      front: characterFloorCenterY - characterFloorDepth / 2,
      back: characterFloorCenterY + characterFloorDepth / 2,
    });

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

      standardFinishRects.push(
        {
          left: stepRailCenterX - stepRailWidth / 2,
          right: stepRailCenterX + stepRailWidth / 2,
          front: stepRailCenterY - settings.railThicknessMm / 2,
          back: stepRailCenterY + settings.railThicknessMm / 2,
        },
        {
          left: mainSideRailCenterX - settings.railThicknessMm / 2,
          right: mainSideRailCenterX + settings.railThicknessMm / 2,
          front: mainSideRailCenterY - mainSideRailDepth / 2,
          back: mainSideRailCenterY + mainSideRailDepth / 2,
        },
      );
    }
  }

  addTrayFinishShell(group, 'standard-tray-finish', standardFinishRects, settings.floorThicknessMm + railHeight, settings);

  return group;
}
