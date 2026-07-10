import type * as THREE from 'three';
import { STLExporter } from 'three/examples/jsm/exporters/STLExporter.js';
import type { TraySettings } from '../types';
import { generateTrayMesh } from './generateTrayMesh';
import { validateTraySettings } from './trayMath';

export function exportAsciiStl(meshOrGroup: THREE.Object3D, name: string): string {
  const exporter = new STLExporter();
  meshOrGroup.updateMatrixWorld(true);
  const output = exporter.parse(meshOrGroup, { binary: false });
  return typeof output === 'string'
    ? output.replace(/^solid exported/, `solid ${name}`).replace(/endsolid exported\s*$/, `endsolid ${name}`)
    : '';
}

export function downloadStl(settings: TraySettings): void {
  const validation = validateTraySettings(settings);
  if (!validation.isValid) {
    throw new Error(validation.messages.join('\n'));
  }

  const baseSize =
    settings.baseWidthMm === settings.baseDepthMm
      ? `${settings.baseWidthMm}mm`
      : `${settings.baseWidthMm}x${settings.baseDepthMm}mm`;
  const formation =
    settings.template === 'adapterLance'
      ? `adapter-lance-wedge-${settings.rows}-rows`
      : settings.template === 'adapterCircle'
        ? `adapter-circle-${settings.columns}x${settings.rows}-${settings.adapterCircleDiameterMm}mm`
      : settings.template === 'skirmish'
        ? `skirmish-${settings.columns}x${settings.rows}-${settings.skirmishBaseShape}-seed-${settings.skirmishSeed}`
      : settings.template === 'adapter'
      ? `adapter-${settings.columns}x${settings.rows}`
      : settings.template === 'lanceWedge'
        ? `lance-wedge-${settings.rows}-rows`
        : `${settings.columns}x${settings.rows}`;
  const name = `movement-tray-${baseSize}-${formation}`;
  const stl = exportAsciiStl(generateTrayMesh(settings), name);
  const blob = new Blob([stl], { type: 'model/stl;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${name}.stl`;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
