import * as THREE from 'three';
import type { TraySettings } from '../types';
import { generateTrayMesh } from './generateTrayMesh';
import { validateTraySettings } from './trayMath';

type ZipEntry = { name: string; data: Uint8Array };

const encoder = new TextEncoder();

function crc32(data: Uint8Array) {
  let crc = 0xffffffff;
  for (const byte of data) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function writeU16(view: DataView, offset: number, value: number) {
  view.setUint16(offset, value, true);
}

function writeU32(view: DataView, offset: number, value: number) {
  view.setUint32(offset, value, true);
}

// 3MF is a ZIP package. Stored (uncompressed) entries keep this browser-only exporter dependency-free.
function createZip(entries: ZipEntry[]) {
  const localParts: Uint8Array[] = [];
  const centralParts: Uint8Array[] = [];
  let localOffset = 0;

  for (const entry of entries) {
    const name = encoder.encode(entry.name);
    const checksum = crc32(entry.data);
    const local = new Uint8Array(30 + name.length + entry.data.length);
    const localView = new DataView(local.buffer);
    writeU32(localView, 0, 0x04034b50);
    writeU16(localView, 4, 20);
    writeU16(localView, 8, 0);
    writeU32(localView, 14, checksum);
    writeU32(localView, 18, entry.data.length);
    writeU32(localView, 22, entry.data.length);
    writeU16(localView, 26, name.length);
    local.set(name, 30);
    local.set(entry.data, 30 + name.length);
    localParts.push(local);

    const central = new Uint8Array(46 + name.length);
    const centralView = new DataView(central.buffer);
    writeU32(centralView, 0, 0x02014b50);
    writeU16(centralView, 4, 20);
    writeU16(centralView, 6, 20);
    writeU32(centralView, 16, checksum);
    writeU32(centralView, 20, entry.data.length);
    writeU32(centralView, 24, entry.data.length);
    writeU16(centralView, 28, name.length);
    writeU32(centralView, 42, localOffset);
    central.set(name, 46);
    centralParts.push(central);
    localOffset += local.length;
  }

  const centralSize = centralParts.reduce((total, part) => total + part.length, 0);
  const end = new Uint8Array(22);
  const endView = new DataView(end.buffer);
  writeU32(endView, 0, 0x06054b50);
  writeU16(endView, 8, entries.length);
  writeU16(endView, 10, entries.length);
  writeU32(endView, 12, centralSize);
  writeU32(endView, 16, localOffset);
  const parts = [...localParts, ...centralParts, end];
  const output = new Uint8Array(parts.reduce((total, part) => total + part.length, 0));
  let offset = 0;
  for (const part of parts) {
    output.set(part, offset);
    offset += part.length;
  }
  return new Blob([output.buffer], { type: 'model/3mf' });
}

function number(value: number) {
  return Number.isFinite(value) ? value.toFixed(5).replace(/\.?0+$/, '') : '0';
}

function createModelXml(root: THREE.Object3D) {
  root.updateMatrixWorld(true);
  const objects: string[] = [];
  const buildItems: string[] = [];
  let objectId = 1;

  root.traverse((child) => {
    if (!(child instanceof THREE.Mesh) || !(child.geometry instanceof THREE.BufferGeometry)) return;
    const position = child.geometry.getAttribute('position');
    if (!position) return;

    const vertices: string[] = [];
    const vertex = new THREE.Vector3();
    for (let index = 0; index < position.count; index += 1) {
      vertex.fromBufferAttribute(position, index).applyMatrix4(child.matrixWorld);
      vertices.push(`<vertex x="${number(vertex.x)}" y="${number(vertex.y)}" z="${number(vertex.z)}"/>`);
    }

    const triangles: string[] = [];
    const geometryIndex = child.geometry.getIndex();
    const count = geometryIndex ? geometryIndex.count : position.count;
    for (let index = 0; index + 2 < count; index += 3) {
      const a = geometryIndex ? geometryIndex.getX(index) : index;
      const b = geometryIndex ? geometryIndex.getX(index + 1) : index + 1;
      const c = geometryIndex ? geometryIndex.getX(index + 2) : index + 2;
      triangles.push(`<triangle v1="${a}" v2="${b}" v3="${c}"/>`);
    }

    objects.push(`<object id="${objectId}" type="model"><mesh><vertices>${vertices.join('')}</vertices><triangles>${triangles.join('')}</triangles></mesh></object>`);
    buildItems.push(`<item objectid="${objectId}"/>`);
    objectId += 1;
  });

  return `<?xml version="1.0" encoding="UTF-8"?><model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02"><metadata name="Title">Tray Workshop movement tray</metadata><metadata name="Application">Tray Workshop</metadata><resources>${objects.join('')}</resources><build>${buildItems.join('')}</build></model>`;
}

export function downloadBambu3mf(settings: TraySettings) {
  const validation = validateTraySettings(settings);
  if (!validation.isValid) throw new Error(validation.messages.join('\n'));

  const model = createModelXml(generateTrayMesh(settings));
  const blob = createZip([
    {
      name: '[Content_Types].xml',
      data: encoder.encode('<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml"/></Types>'),
    },
    {
      name: '_rels/.rels',
      data: encoder.encode('<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Target="/3D/3dmodel.model" Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel"/></Relationships>'),
    },
    { name: '3D/3dmodel.model', data: encoder.encode(model) },
  ]);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `tray-workshop-${settings.columns}x${settings.rows}-bambu.3mf`;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
