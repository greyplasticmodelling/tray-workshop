import type { TrayDimensions, TraySettings, ValidationResult } from '../types';

const bounds: Record<keyof TraySettings, { min: number; max: number; label: string; unit?: string }> = {
  baseWidthMm: { min: 10, max: 60, label: 'Base width', unit: 'mm' },
  baseDepthMm: { min: 10, max: 80, label: 'Base depth', unit: 'mm' },
  columns: { min: 1, max: 20, label: 'Columns' },
  rows: { min: 1, max: 12, label: 'Rows' },
  toleranceMm: { min: 0.1, max: 3, label: 'Tolerance', unit: 'mm' },
  floorThicknessMm: { min: 0.6, max: 8, label: 'Floor thickness', unit: 'mm' },
  railThicknessMm: { min: 0.6, max: 8, label: 'Rail thickness', unit: 'mm' },
  railHeightMm: { min: 0.5, max: 12, label: 'Rail height', unit: 'mm' },
  frontRailEnabled: { min: 0, max: 1, label: 'Front rail' },
  rearRailEnabled: { min: 0, max: 1, label: 'Rear rail' },
  leftRailEnabled: { min: 0, max: 1, label: 'Left rail' },
  rightRailEnabled: { min: 0, max: 1, label: 'Right rail' },
};

export function calculateTrayDimensions(settings: TraySettings): TrayDimensions {
  const slotWidthMm = settings.baseWidthMm + settings.toleranceMm;
  const slotDepthMm = settings.baseDepthMm + settings.toleranceMm;
  const innerWidthMm = settings.columns * slotWidthMm;
  const innerDepthMm = settings.rows * slotDepthMm;
  const leftRailMm = settings.leftRailEnabled ? settings.railThicknessMm : 0;
  const rightRailMm = settings.rightRailEnabled ? settings.railThicknessMm : 0;
  const frontRailMm = settings.frontRailEnabled ? settings.railThicknessMm : 0;
  const rearRailMm = settings.rearRailEnabled ? settings.railThicknessMm : 0;

  return {
    slotWidthMm,
    slotDepthMm,
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

export function validateTraySettings(settings: TraySettings): ValidationResult {
  const messages: string[] = [];

  Object.entries(bounds).forEach(([key, rule]) => {
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

  if (!Number.isInteger(settings.columns)) {
    messages.push('Columns must be a positive whole number.');
  }

  if (!Number.isInteger(settings.rows)) {
    messages.push('Rows must be a positive whole number.');
  }

  const dimensions = calculateTrayDimensions(settings);
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
