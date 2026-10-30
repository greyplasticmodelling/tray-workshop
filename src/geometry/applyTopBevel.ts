import * as THREE from 'three';
import type { TraySettings } from '../types';

export type BevelSegment = { start: THREE.Vector2; end: THREE.Vector2; normal: THREE.Vector2 };
type BevelProfile = TraySettings['trayBevelProfile'];

type Triangle = [THREE.Vector3, THREE.Vector3, THREE.Vector3];
type BoundaryEdge = { start: THREE.Vector2; end: THREE.Vector2; count: number };
type Loop = { points: THREE.Vector2[]; area: number };
type BeveledLoop = Loop & {
  edgeSegments: Array<BevelSegment | undefined>;
  topAtVertex: THREE.Vector2[][];
  topPoints: THREE.Vector2[];
};

const epsilon = 0.001;

function pointKey(point: THREE.Vector2) {
  return `${point.x.toFixed(4)},${point.y.toFixed(4)}`;
}

function edgeKey(start: THREE.Vector2, end: THREE.Vector2) {
  const a = pointKey(start);
  const b = pointKey(end);
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}

function signedArea(points: THREE.Vector2[]) {
  return points.reduce((area, point, index) => {
    const next = points[(index + 1) % points.length];
    return area + point.x * next.y - next.x * point.y;
  }, 0) / 2;
}

function matchingSegment(start: THREE.Vector2, end: THREE.Vector2, segments: BevelSegment[]) {
  const edge = end.clone().sub(start);
  const length = edge.length();
  if (length < epsilon) return;
  const direction = edge.multiplyScalar(1 / length);
  const outward = new THREE.Vector2(edge.y, -edge.x).normalize();
  const matches = segments
    .filter((segment) => {
      const from = segment.start.clone().sub(start);
      const to = segment.end.clone().sub(start);
      return outward.dot(segment.normal) > 0.9 &&
        Math.abs(direction.x * from.y - direction.y * from.x) < epsilon &&
        Math.abs(direction.x * to.y - direction.y * to.x) < epsilon;
    })
    .map((segment) => {
      const from = segment.start.clone().sub(start).dot(direction);
      const to = segment.end.clone().sub(start).dot(direction);
      return { segment, start: Math.max(0, Math.min(from, to)), end: Math.min(length, Math.max(from, to)) };
    })
    .filter((match) => match.end > match.start + epsilon)
    .sort((a, b) => a.start - b.start);

  if (matches.length === 0 || matches[0].start > epsilon) return;
  let covered = matches[0].end;
  for (let index = 1; index < matches.length && covered < length - epsilon; index += 1) {
    if (matches[index].start > covered + epsilon) return;
    covered = Math.max(covered, matches[index].end);
  }
  return covered >= length - epsilon ? matches[0].segment : undefined;
}

function topBoundaryLoops(triangles: Triangle[]): Loop[] {
  const edgeMap = new Map<string, BoundaryEdge>();

  triangles.forEach((triangle) => {
    for (let index = 0; index < 3; index += 1) {
      const from = triangle[index];
      const to = triangle[(index + 1) % 3];
      const start = new THREE.Vector2(from.x, from.y);
      const end = new THREE.Vector2(to.x, to.y);
      const key = edgeKey(start, end);
      const previous = edgeMap.get(key);
      edgeMap.set(key, previous ? { ...previous, count: previous.count + 1 } : { start, end, count: 1 });
    }
  });

  const remaining = Array.from(edgeMap.values()).filter((edge) => edge.count === 1);
  const loops: Loop[] = [];

  while (remaining.length > 0) {
    const first = remaining.pop()!;
    const points = [first.start, first.end];
    const firstKey = pointKey(first.start);

    while (pointKey(points[points.length - 1]) !== firstKey && remaining.length > 0) {
      const currentKey = pointKey(points[points.length - 1]);
      const nextIndex = remaining.findIndex((edge) => pointKey(edge.start) === currentKey);
      if (nextIndex < 0) break;
      const [next] = remaining.splice(nextIndex, 1);
      points.push(next.end);
    }

    if (pointKey(points[points.length - 1]) === firstKey) points.pop();
    if (points.length >= 3) loops.push({ points, area: signedArea(points) });
  }

  return loops;
}

function curvedCornerPoints(
  corner: THREE.Vector2,
  incoming: THREE.Vector2,
  outgoing: THREE.Vector2,
  incomingNormal: THREE.Vector2,
  outgoingNormal: THREE.Vector2,
  width: number,
) {
  const inner = corner.clone().addScaledVector(incomingNormal, -width).addScaledVector(outgoingNormal, -width);
  const radius = Math.min(width, incoming.length() / 3, outgoing.length() / 3);
  const incomingDirection = incoming.clone().normalize();
  const outgoingDirection = outgoing.clone().normalize();
  const center = inner.clone().addScaledVector(incomingDirection, -radius).addScaledVector(outgoingDirection, radius);
  const start = inner.clone().addScaledVector(incomingDirection, -radius);
  const end = inner.clone().addScaledVector(outgoingDirection, radius);
  const startAngle = Math.atan2(start.y - center.y, start.x - center.x);
  let endAngle = Math.atan2(end.y - center.y, end.x - center.x);
  while (endAngle <= startAngle) endAngle += Math.PI * 2;
  return Array.from({ length: 7 }, (_, index) => {
    const angle = startAngle + (endAngle - startAngle) * index / 6;
    return new THREE.Vector2(center.x + radius * Math.cos(angle), center.y + radius * Math.sin(angle));
  });
}

function bevelLoop(loop: Loop, segments: BevelSegment[], width: number, cornerStyle: 'mitred' | 'curved'): BeveledLoop {
  const { points } = loop;
  const edgeSegments = points.map((point, index) => matchingSegment(point, points[(index + 1) % points.length], segments));
  const topAtVertex = points.map((point, index) => {
    const previousIndex = (index - 1 + points.length) % points.length;
    const incomingSegment = edgeSegments[previousIndex];
    const outgoingSegment = edgeSegments[index];
    const incoming = point.clone().sub(points[previousIndex]);
    const outgoing = points[(index + 1) % points.length].clone().sub(point);
    const cross = incoming.x * outgoing.y - incoming.y * outgoing.x;

    if (
      cornerStyle === 'curved' && loop.area > 0 && incomingSegment && outgoingSegment &&
      incomingSegment.normal.dot(outgoingSegment.normal) < 0.1 && cross > epsilon
    ) {
      return curvedCornerPoints(point, incoming, outgoing, incomingSegment.normal, outgoingSegment.normal, width);
    }

    const shifted = point.clone();
    if (incomingSegment) shifted.addScaledVector(incomingSegment.normal, -width);
    if (outgoingSegment && (!incomingSegment || outgoingSegment.normal.dot(incomingSegment.normal) < 0.99)) {
      shifted.addScaledVector(outgoingSegment.normal, -width);
    }
    return [shifted];
  });

  return { ...loop, edgeSegments, topAtVertex, topPoints: topAtVertex.flat() };
}

function pointInsidePolygon(point: THREE.Vector2, polygon: THREE.Vector2[]) {
  let inside = false;
  for (let current = 0, previous = polygon.length - 1; current < polygon.length; previous = current, current += 1) {
    const a = polygon[current];
    const b = polygon[previous];
    if ((a.y > point.y) !== (b.y > point.y) && point.x < ((b.x - a.x) * (point.y - a.y)) / (b.y - a.y) + a.x) {
      inside = !inside;
    }
  }
  return inside;
}

function profileLayers(width: number, topZ: number, profile: BevelProfile) {
  const bottom = { offset: 0, z: topZ - width };
  const top = { offset: width, z: topZ };
  if (profile === 'double') {
    return [bottom, { offset: width * 0.35, z: topZ - width * 0.35 }, top];
  }
  if (profile === 'rounded') {
    return Array.from({ length: 9 }, (_, index) => {
      const angle = (index / 8) * Math.PI / 2;
      return {
        offset: width * (1 - Math.cos(angle)),
        z: topZ - width + width * Math.sin(angle),
      };
    });
  }
  return [bottom, top];
}

function bevelMesh(mesh: THREE.Mesh, segments: BevelSegment[], topZ: number, width: number, cornerStyle: 'mitred' | 'curved', profile: BevelProfile) {
  const source = mesh.geometry;
  if (!(source instanceof THREE.BufferGeometry)) return;
  const positions = source.getAttribute('position');
  if (!positions) return;
  const indices = source.getIndex();
  const triangles: Triangle[] = [];
  const vertex = (index: number) => new THREE.Vector3().fromBufferAttribute(positions, index).applyMatrix4(mesh.matrixWorld);

  for (let index = 0; index < (indices?.count ?? positions.count); index += 3) {
    triangles.push([
      vertex(indices ? indices.getX(index) : index),
      vertex(indices ? indices.getX(index + 1) : index + 1),
      vertex(indices ? indices.getX(index + 2) : index + 2),
    ]);
  }

  const topTriangles = triangles.filter((triangle) => triangle.every((point) => Math.abs(point.z - topZ) < epsilon));
  if (topTriangles.length === 0) return;
  const loops = topBoundaryLoops(topTriangles);
  const beveledLoops = loops.map((loop) => bevelLoop(loop, segments, width, cornerStyle));
  if (!beveledLoops.some((loop) => loop.edgeSegments.some(Boolean))) return;
  const bottomZ = Math.min(...triangles.flatMap((triangle) => triangle.map((point) => point.z)));
  const layers = profileLayers(width, topZ, profile);

  const output: number[] = [];
  const inverseMatrix = mesh.matrixWorld.clone().invert();
  const addTriangle = (a: THREE.Vector3, b: THREE.Vector3, c: THREE.Vector3) => {
    for (const point of [a, b, c]) {
      const local = point.clone().applyMatrix4(inverseMatrix);
      output.push(local.x, local.y, local.z);
    }
  };
  const atHeight = (point: THREE.Vector2, z: number) => new THREE.Vector3(point.x, point.y, z);

  triangles.filter((triangle) => triangle.every((point) => Math.abs(point.z - bottomZ) < epsilon))
    .forEach((triangle) => addTriangle(...triangle));

  beveledLoops.filter((loop) => loop.area > 0).forEach((outer) => {
    const holes = beveledLoops
      .filter((loop) => loop.area < 0 && pointInsidePolygon(loop.points[0], outer.points))
      .map((loop) => loop.topPoints);
    const contour = outer.topPoints;
    const vertices = [...contour, ...holes.flat()];
    const faces = THREE.ShapeUtils.triangulateShape(contour, holes);
    faces.forEach(([aIndex, bIndex, cIndex]) => {
      const a = vertices[aIndex];
      const b = vertices[bIndex];
      const c = vertices[cIndex];
      const cross = (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
      if (Math.abs(cross) < 1e-8) return;
      addTriangle(atHeight(a, topZ), atHeight(cross > 0 ? b : c, topZ), atHeight(cross > 0 ? c : b, topZ));
    });
  });

  beveledLoops.forEach((loop, loopIndex) => {
    const hasBeveledEdge = loop.edgeSegments.some(Boolean);
    const layerLoops = layers.map((layer, index) => {
      if (index === 0) return undefined;
      if (index === layers.length - 1) return loop;
      return bevelLoop(loops[loopIndex], segments, layer.offset, cornerStyle);
    });
    const count = loop.points.length;
    for (let index = 0; index < count; index += 1) {
      const nextIndex = (index + 1) % count;
      const start = loop.points[index];
      const end = loop.points[nextIndex];
      if (!hasBeveledEdge) {
        const topStart = atHeight(start, topZ);
        const topEnd = atHeight(end, topZ);
        const bottomStart = atHeight(start, bottomZ);
        const bottomEnd = atHeight(end, bottomZ);
        addTriangle(bottomStart, bottomEnd, topStart);
        addTriangle(bottomEnd, topEnd, topStart);
        continue;
      }
      const bottomStart = atHeight(start, bottomZ);
      const bottomEnd = atHeight(end, bottomZ);
      const wallStart = atHeight(start, topZ - width);
      const wallEnd = atHeight(end, topZ - width);
      addTriangle(bottomStart, bottomEnd, wallStart);
      addTriangle(bottomEnd, wallEnd, wallStart);

      if (loop.edgeSegments[index]) {
        for (let layerIndex = 0; layerIndex < layers.length - 1; layerIndex += 1) {
          const lowerLoop = layerLoops[layerIndex];
          const upperLoop = layerLoops[layerIndex + 1]!;
          const lowerStart = lowerLoop ? lowerLoop.topAtVertex[index][lowerLoop.topAtVertex[index].length - 1] : start;
          const lowerEnd = lowerLoop ? lowerLoop.topAtVertex[nextIndex][0] : end;
          const upperStart = upperLoop.topAtVertex[index][upperLoop.topAtVertex[index].length - 1];
          const upperEnd = upperLoop.topAtVertex[nextIndex][0];
          const lowStart = atHeight(lowerStart, layers[layerIndex].z);
          const lowEnd = atHeight(lowerEnd, layers[layerIndex].z);
          const highStart = atHeight(upperStart, layers[layerIndex + 1].z);
          const highEnd = atHeight(upperEnd, layers[layerIndex + 1].z);
          addTriangle(lowStart, lowEnd, highStart);
          addTriangle(lowEnd, highEnd, highStart);
        }
      } else {
        for (let layerIndex = 0; layerIndex < layers.length - 1; layerIndex += 1) {
          const lowerLoop = layerLoops[layerIndex];
          const upperLoop = layerLoops[layerIndex + 1]!;
          const lowerStart = lowerLoop ? lowerLoop.topAtVertex[index][lowerLoop.topAtVertex[index].length - 1] : start;
          const lowerEnd = lowerLoop ? lowerLoop.topAtVertex[nextIndex][0] : end;
          const upperStart = upperLoop.topAtVertex[index][upperLoop.topAtVertex[index].length - 1];
          const upperEnd = upperLoop.topAtVertex[nextIndex][0];
          const lowStart = atHeight(lowerStart, layers[layerIndex].z);
          const lowEnd = atHeight(lowerEnd, layers[layerIndex].z);
          const highStart = atHeight(upperStart, layers[layerIndex + 1].z);
          const highEnd = atHeight(upperEnd, layers[layerIndex + 1].z);
          addTriangle(lowStart, lowEnd, highStart);
          addTriangle(lowEnd, highEnd, highStart);
        }
      }

      const cornerTop = loop.topAtVertex[index];
      if (cornerTop.length > 1) {
        for (let layerIndex = 0; layerIndex < layers.length - 1; layerIndex += 1) {
          const lowerPoints = layerLoops[layerIndex]?.topAtVertex[index] ?? [loop.points[index]];
          const upperPoints = layerLoops[layerIndex + 1]!.topAtVertex[index];
          if (lowerPoints.length === 1) {
            for (let step = 0; step < upperPoints.length - 1; step += 1) {
              addTriangle(atHeight(lowerPoints[0], layers[layerIndex].z),
                atHeight(upperPoints[step + 1], layers[layerIndex + 1].z),
                atHeight(upperPoints[step], layers[layerIndex + 1].z));
            }
          } else {
            for (let step = 0; step < upperPoints.length - 1; step += 1) {
              const lowStart = atHeight(lowerPoints[step], layers[layerIndex].z);
              const lowEnd = atHeight(lowerPoints[step + 1], layers[layerIndex].z);
              const highStart = atHeight(upperPoints[step], layers[layerIndex + 1].z);
              const highEnd = atHeight(upperPoints[step + 1], layers[layerIndex + 1].z);
              addTriangle(lowStart, highEnd, highStart);
              addTriangle(lowStart, lowEnd, highEnd);
            }
          }
        }
      }
    }
  });

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(output, 3));
  geometry.computeVertexNormals();
  mesh.geometry = geometry;
}

export function applyTopBevel(group: THREE.Group, segments: BevelSegment[], width: number, cornerStyle: 'mitred' | 'curved', profile: BevelProfile) {
  if (width <= 0 || segments.length === 0) return;
  group.updateMatrixWorld(true);
  const topZ = new THREE.Box3().setFromObject(group).max.z;
  group.traverse((object) => {
    if (object instanceof THREE.Mesh) bevelMesh(object, segments, topZ, width, cornerStyle, profile);
  });
}
