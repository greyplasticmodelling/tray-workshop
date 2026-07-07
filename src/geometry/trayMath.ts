import type { BuildPlate, BuildPlateFit, BuildPlateSize, TrayDimensions, TraySettings, ValidationResult } from '../types';

const bounds: Partial<Record<keyof TraySettings, { min: number; max: number; label: string; unit?: string }>> = {
  baseWidthMm: { min: 10, max: 60, label: 'Base width', unit: 'mm' },
  baseDepthMm: { min: 10, max: 80, label: 'Base depth', unit: 'mm' },
  columns: { min: 1, max: 20, label: 'Columns' },
  rows: { min: 1, max: 12, label: 'Rows' },
  toleranceMm: { min: 0.1, max: 3, label: 'Tolerance', unit: 'mm' },
  floorThicknessMm: { min: 0.6, max: 8, label: 'Floor thickness', unit: 'mm' },
  railThicknessMm: { min: 0.6, max: 8, label: 'Rail thickness', unit: 'mm' },
  railHeightMm: { min: 0.5, max: 12, label: 'Rail height', unit: 'mm' },
  magnetDiameterMm: { min: 1, max: 15, label: 'Magnet diameter', unit: 'mm' },
  magnetCutoutDepthMm: { min: 0.1, max: 8, label: 'Magnet cutout depth', unit: 'mm' },
  lanceMagnetOffsetMm: { min: 0, max: 40, label: 'Lance magnet offset', unit: 'mm' },
  characterBaseWidthMm: { min: 10, max: 80, label: 'Character base width', unit: 'mm' },
  characterBaseDepthMm: { min: 10, max: 100, label: 'Character base depth', unit: 'mm' },
  frontRailEnabled: { min: 0, max: 1, label: 'Front rail' },
  rearRailEnabled: { min: 0, max: 1, label: 'Rear rail' },
  leftRailEnabled: { min: 0, max: 1, label: 'Left rail' },
  rightRailEnabled: { min: 0, max: 1, label: 'Right rail' },
};

export const buildPlates: BuildPlate[] = [
  { value: '180x180', widthMm: 180, depthMm: 180 },
  { value: '235x235', widthMm: 235, depthMm: 235 },
  { value: '256x256', widthMm: 256, depthMm: 256 },
  { value: '300x300', widthMm: 300, depthMm: 300 },
  { value: '350x350', widthMm: 350, depthMm: 350 },
];

export const trayTemplates: Array<{ value: TraySettings['template']; label: string; description: string }> = [
  {
    value: 'standard',
    label: 'Standard Movement Tray',
    description: 'A regular rectangular rank-and-file movement tray.',
  },
  {
    value: 'lanceWedge',
    label: 'Lance Wedge Movement Tray',
    description: 'A wedge formation starting at one model and widening by one model for each row.',
  },
];

export function getRankCounts(settings: TraySettings): number[] {
  if (settings.template === 'lanceWedge') {
    const rankCount = Math.max(1, Math.floor(settings.rows));
    return Array.from({ length: rankCount }, (_, index) => index + 1);
  }

  return Array.from({ length: settings.rows }, () => settings.columns);
}

export function getBuildPlate(size: BuildPlateSize): BuildPlate {
  return buildPlates.find((plate) => plate.value === size) ?? buildPlates[2];
}

export function calculateTrayDimensions(settings: TraySettings): TrayDimensions {
  const rankCounts = getRankCounts(settings);
  const slotWidthMm = settings.baseWidthMm + settings.toleranceMm;
  const slotDepthMm = settings.baseDepthMm + settings.toleranceMm;
  const mainInnerWidthMm = Math.max(...rankCounts) * slotWidthMm;
  const mainInnerDepthMm = rankCounts.length * slotDepthMm;
  const hasCharacterBay = settings.template === 'standard' && settings.characterBayEnabled;
  const characterSlotWidthMm = hasCharacterBay ? settings.characterBaseWidthMm + settings.toleranceMm : 0;
  const characterSlotDepthMm = hasCharacterBay ? settings.characterBaseDepthMm + settings.toleranceMm : 0;
  const characterDividerMm = 0;
  const innerWidthMm = mainInnerWidthMm + characterSlotWidthMm;
  const innerDepthMm = Math.max(mainInnerDepthMm, characterSlotDepthMm);
  const leftRailMm = settings.leftRailEnabled ? settings.railThicknessMm : 0;
  const rightRailMm = settings.rightRailEnabled ? settings.railThicknessMm : 0;
  const frontRailMm = settings.frontRailEnabled ? settings.railThicknessMm : 0;
  const rearRailMm = settings.rearRailEnabled ? settings.railThicknessMm : 0;

  return {
    slotWidthMm,
    slotDepthMm,
    mainInnerWidthMm,
    mainInnerDepthMm,
    characterSlotWidthMm,
    characterSlotDepthMm,
    characterDividerMm,
    innerWidthMm,
    innerDepthMm,
    outerWidthMm: innerWidthMm + leftRailMm + rightRailMm,
    outerDepthMm: innerDepthMm + frontRailMm + rearRailMm,
    leftRailMm,
    rightRailMm,
    frontRailMm,
    rearRailMm,
  };
}

export type MagnetCutoutCenter = {
  x: number;
  y: number;
  rowIndex: number;
};

export function getMagnetCutoutCenters(settings: TraySettings, dimensions = calculateTrayDimensions(settings)): MagnetCutoutCenter[] {
  if (!settings.magnetCutoutsEnabled) {
    return [];
  }

  const rankCounts = getRankCounts(settings);
  const centers: MagnetCutoutCenter[] = [];
  const useDoubleMagnets = settings.template === 'lanceWedge' && settings.lanceDoubleMagnetsEnabled;
  const yOffsets = useDoubleMagnets ? [-settings.lanceMagnetOffsetMm, settings.lanceMagnetOffsetMm] : [0];

  rankCounts.forEach((rankCount, rowIndex) => {
    const rowWidth = rankCount * dimensions.slotWidthMm;
    const standardMainOffsetX =
      settings.characterBayEnabled && settings.characterBaySide === 'left'
        ? dimensions.characterSlotWidthMm
        : 0;
    const rowStartX =
      settings.template === 'lanceWedge'
        ? -rowWidth / 2
        : -dimensions.innerWidthMm / 2 + standardMainOffsetX;
    const standardMainOffsetY = 0;
    const rowY =
      -dimensions.innerDepthMm / 2 + standardMainOffsetY + rowIndex * dimensions.slotDepthMm + dimensions.slotDepthMm / 2;

    for (let columnIndex = 0; columnIndex < rankCount; columnIndex += 1) {
      const x = rowStartX + columnIndex * dimensions.slotWidthMm + dimensions.slotWidthMm / 2;
      yOffsets.forEach((yOffset) => {
        centers.push({
          x,
          y: rowY + yOffset,
          rowIndex,
        });
      });
    }
  });

  if (settings.template === 'standard' && settings.characterBayEnabled) {
    const characterX =
      settings.characterBaySide === 'left'
        ? -dimensions.innerWidthMm / 2 + dimensions.characterSlotWidthMm / 2
        : dimensions.innerWidthMm / 2 - dimensions.characterSlotWidthMm / 2;

    centers.push({
      x: characterX,
      y: -dimensions.innerDepthMm / 2 + dimensions.characterSlotDepthMm / 2,
      rowIndex: 0,
    });
  }

  return centers;
}

export function calculateBuildPlateFit(settings: TraySettings, dimensions = calculateTrayDimensions(settings)): BuildPlateFit {
  const plate = getBuildPlate(settings.buildPlateSize);
  const fits = dimensions.outerWidthMm <= plate.widthMm && dimensions.outerDepthMm <= plate.depthMm;
  const fitsRotated = dimensions.outerWidthMm <= plate.depthMm && dimensions.outerDepthMm <= plate.widthMm;

  return {
    plate,
    fits,
    fitsRotated,
    overWidthMm: Math.max(0, dimensions.outerWidthMm - plate.widthMm),
    overDepthMm: Math.max(0, dimensions.outerDepthMm - plate.depthMm),
  };
}

export function validateTraySettings(settings: TraySettings): ValidationResult {
  const messages: string[] = [];

  Object.entries(bounds).forEach(([key, rule]) => {
    if (settings.template === 'lanceWedge' && key === 'columns') {
      return;
    }

    const value = settings[key as keyof TraySettings];
    if (typeof value !== 'number') {
      return;
    }

    if (!Number.isFinite(value)) {
      messages.push(`${rule.label} must be a number.`);
    } else if (value <= 0) {
      messages.push(`${rule.label} must be greater than zero.`);
    } else if (value < rule.min || value > rule.max) {
      const unit = rule.unit ? ` ${rule.unit}` : '';
      messages.push(`${rule.label} must be between ${rule.min} and ${rule.max}${unit}.`);
    }
  });

  if (settings.template === 'standard' && !Number.isInteger(settings.columns)) {
    messages.push('Columns must be a positive whole number.');
  }

  if (!Number.isInteger(settings.rows)) {
    messages.push('Rows must be a positive whole number.');
  }

  const dimensions = calculateTrayDimensions(settings);
  if (settings.magnetCutoutsEnabled) {
    if (settings.magnetCutoutDepthMm > settings.floorThicknessMm) {
      messages.push('Magnet cutout depth cannot be greater than floor thickness.');
    }

    if (settings.magnetDiameterMm > Math.min(dimensions.slotWidthMm, dimensions.slotDepthMm)) {
      messages.push('Magnet diameter must fit inside each base space.');
    }

    if (
      settings.template === 'standard' &&
      settings.characterBayEnabled &&
      settings.magnetDiameterMm > Math.min(dimensions.characterSlotWidthMm, dimensions.characterSlotDepthMm)
    ) {
      messages.push('Magnet diameter must fit inside the character bay.');
    }

    if (
      settings.template === 'lanceWedge' &&
      settings.lanceDoubleMagnetsEnabled &&
      settings.lanceMagnetOffsetMm * 2 + settings.magnetDiameterMm > dimensions.slotDepthMm
    ) {
      messages.push('Lance double magnets must fit within the base depth.');
    }
  }

  if (dimensions.outerWidthMm > 320 || dimensions.outerDepthMm > 320) {
    messages.push('Overall tray dimensions must stay under 320 mm in each direction.');
  }

  return {
    isValid: messages.length === 0,
    messages,
  };
}

export function formatMm(value: number): string {
  return `${value.toFixed(1)} mm`;
}
