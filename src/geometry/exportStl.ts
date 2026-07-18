import type * as THREE from 'three';
import { STLExporter } from 'three/examples/jsm/exporters/STLExporter.js';
import type { TraySettings } from '../types';
import { generateBaseMesh, getGeneratedBaseSpecs } from './generateBaseMesh';
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
      ? `adapter-lance-wedge-${settings.rows}-ranks`
      : settings.template === 'adapterCircle'
        ? `adapter-circle-${settings.columns}-files-${settings.rows}-ranks-${settings.adapterCircleDiameterMm}mm`
      : settings.template === 'adapterOval'
        ? `adapter-oval-${settings.columns}-files-${settings.rows}-ranks-${settings.adapterOvalSize}mm`
      : settings.template === 'skirmish'
        ? `skirmish-${settings.columns}-files-${settings.rows}-ranks-${settings.skirmishBaseShape}-seed-${settings.skirmishSeed}`
      : settings.template === 'adapter'
      ? `adapter-${settings.columns}-files-${settings.rows}-ranks`
      : settings.template === 'lanceWedge'
        ? `lance-wedge-${settings.rows}-ranks`
        : `${settings.columns}-files-${settings.rows}-ranks`;
  const name = `movement-tray-${baseSize}-${formation}`;
  downloadTextFile(`${name}.stl`, exportAsciiStl(generateTrayMesh(settings), name));

  if (settings.generatedBaseEnabled) {
    getGeneratedBaseSpecs(settings).forEach((baseSpec, index) => {
      const baseName = `matching-base-${baseSpec.label}-${formation}`;
      window.setTimeout(() => {
        downloadTextFile(`${baseName}.stl`, exportAsciiStl(generateBaseMesh(settings, baseSpec), baseName));
      }, 250 * (index + 1));
    });
  }
}

function downloadTextFile(filename: string, content: string) {
  const blob = new Blob([content], { type: 'model/stl;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
