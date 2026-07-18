import type { AdapterOvalSize, BuildPlate, BuildPlateFit, BuildPlateSize, TrayDimensions, TraySettings, ValidationResult } from '../types';

const bounds: Partial<Record<keyof TraySettings, { min: number; max: number; label: string; unit?: string }>> = {
  baseWidthMm: { min: 10, max: 150, label: 'Base width', unit: 'mm' },
  baseDepthMm: { min: 10, max: 150, label: 'Base depth', unit: 'mm' },
  columns: { min: 1, max: 20, label: 'Files' },
  rows: { min: 1, max: 12, label: 'Ranks' },
  toleranceMm: { min: 0.1, max: 3, label: 'Tolerance', unit: 'mm' },
  floorThicknessMm: { min: 0.6, max: 8, label: 'Floor thickness', unit: 'mm' },
  railThicknessMm: { min: 0.6, max: 8, label: 'Rail thickness', unit: 'mm' },
  railHeightMm: { min: 0.5, max: 12, label: 'Rail height', unit: 'mm' },
  adapterCutoutWidthMm: { min: 10, max: 150, label: 'Adapter cutout width', unit: 'mm' },
  adapterCutoutDepthMm: { min: 10, max: 150, label: 'Adapter cutout depth', unit: 'mm' },
  adapterCircleDiameterMm: { min: 10, max: 150, label: 'Circle adapter base diameter', unit: 'mm' },
  adapterCircleGapMm: { min: 1, max: 30, label: 'Circle adapter gap', unit: 'mm' },
  adapterOvalGapMm: { min: 1, max: 30, label: 'Oval adapter gap', unit: 'mm' },
  adapterFlankCutoutWidthMm: { min: 10, max: 150, label: 'Flank adapter cutout width', unit: 'mm' },
  adapterFlankCutoutDepthMm: { min: 10, max: 150, label: 'Flank adapter cutout depth', unit: 'mm' },
  adapterBaseHeightMm: { min: 0.5, max: 12, label: 'Adapter base height', unit: 'mm' },
  adapterBorderUniformMm: { min: -20, max: 60, label: 'Adapter perimeter border', unit: 'mm' },
  adapterBorderFrontMm: { min: -20, max: 60, label: 'Adapter front border adjustment', unit: 'mm' },
  adapterBorderRearMm: { min: -20, max: 60, label: 'Adapter rear border adjustment', unit: 'mm' },
  adapterBorderLeftMm: { min: -20, max: 60, label: 'Adapter left border adjustment', unit: 'mm' },
  adapterBorderRightMm: { min: -20, max: 60, label: 'Adapter right border adjustment', unit: 'mm' },
  adapterFloorCutoutBufferMm: { min: 0, max: 20, label: 'Magnetic sheet border width', unit: 'mm' },
  rankInsertColumn: { min: 1, max: 20, label: 'Rank insert origin file' },
  rankInsertRow: { min: 1, max: 12, label: 'Rank insert origin rank' },
  rankInsertColumnSpan: { min: 1, max: 20, label: 'Rank insert file span' },
  rankInsertRowSpan: { min: 1, max: 12, label: 'Rank insert rank span' },
  rankInsertCircleDiameterMm: { min: 10, max: 160, label: 'Rank insert circle diameter', unit: 'mm' },
  rankInsertCustomWidthMm: { min: 1, max: 320, label: 'Custom rank insert width', unit: 'mm' },
  rankInsertCustomDepthMm: { min: 1, max: 320, label: 'Custom rank insert depth', unit: 'mm' },
  trayEdgeSlopeMm: { min: 0, max: 6, label: 'Tray edge slope', unit: 'mm' },
  trayCornerRadiusMm: { min: 0.5, max: 12, label: 'Corner roundness', unit: 'mm' },
  generatedBaseHeightMm: { min: 1.5, max: 8, label: 'Generated base height', unit: 'mm' },
  generatedBaseWallThicknessMm: { min: 1, max: 6, label: 'Generated base wall thickness', unit: 'mm' },
  generatedBaseTopThicknessMm: { min: 1, max: 6, label: 'Generated base top thickness', unit: 'mm' },
  skirmishBaseSizeMm: { min: 10, max: 150, label: 'Skirmish base size', unit: 'mm' },
  skirmishSeed: { min: 1, max: 999999, label: 'Skirmish seed' },
  skirmishMaxRotationDeg: { min: 0, max: 10, label: 'Skirmish max rotation', unit: 'degrees' },
  skirmishMaxOffsetMm: { min: 0, max: 3, label: 'Skirmish max offset', unit: 'mm' },
  skirmishDistributionChancePercent: { min: 0, max: 100, label: 'Skirmish distribution chance', unit: '%' },
  skirmishTrayHeightMm: { min: 1, max: 12, label: 'Skirmish tray height', unit: 'mm' },
  magnetDiameterMm: { min: 1, max: 15, label: 'Magnet diameter', unit: 'mm' },
  magnetCutoutDepthMm: { min: 0.1, max: 8, label: 'Magnet cutout depth', unit: 'mm' },
  lanceMagnetOffsetMm: { min: 0, max: 40, label: 'Lance magnet offset', unit: 'mm' },
  characterBaseWidthMm: { min: 10, max: 150, label: 'Character base width', unit: 'mm' },
  characterBaseDepthMm: { min: 10, max: 150, label: 'Character base depth', unit: 'mm' },
  frontRailEnabled: { min: 0, max: 1, label: 'Front rail' },
  rearRailEnabled: { min: 0, max: 1, label: 'Rear rail' },
  leftRailEnabled: { min: 0, max: 1, label: 'Left rail' },
  rightRailEnabled: { min: 0, max: 1, label: 'Right rail' },
};

const skirmishMinimumGapMm = 4;
export const adapterOvalGwBaseWidthAllowanceMm = 2.5;
export const adapterOvalGwBaseLengthAllowanceMm = 1;

export const buildPlates: BuildPlate[] = [
  { value: '180x180', widthMm: 180, depthMm: 180 },
  { value: '235x235', widthMm: 235, depthMm: 235 },
  { value: '256x256', widthMm: 256, depthMm: 256 },
  { value: '300x300', widthMm: 300, depthMm: 300 },
  { value: '350x350', widthMm: 350, depthMm: 350 },
];

export const adapterOvalBaseSizes: Array<{ value: AdapterOvalSize; label: string; widthMm: number; depthMm: number }> = [
  { value: '60x35', label: '60 x 35 mm', widthMm: 60, depthMm: 35 },
  { value: '75x42', label: '75 x 42 mm', widthMm: 75, depthMm: 42 },
  { value: '90x52', label: '90 x 52 mm', widthMm: 90, depthMm: 52 },
  { value: '105x70', label: '105 x 70 mm', widthMm: 105, depthMm: 70 },
  { value: '120x92', label: '120 x 92 mm', widthMm: 120, depthMm: 92 },
  { value: '170x105', label: '170 x 105 mm', widthMm: 170, depthMm: 105 },
];

export function getAdapterOvalBaseSize(value: AdapterOvalSize) {
  return adapterOvalBaseSizes.find((size) => size.value === value) ?? adapterOvalBaseSizes[0];
}

export const trayTemplates: Array<{ value: TraySettings['template']; label: string; description: string }> = [
  {
    value: 'standard',
    label: 'Standard Movement Tray',
    description: 'A regular rectangular rank-and-file movement tray.',
  },
  {
    value: 'lanceWedge',
    label: 'Lance Wedge Movement Tray',
    description: 'A wedge formation starting at one model and widening by one model for each rank.',
  },
  {
    value: 'adapter',
    label: 'Adapter Movement Tray',
    description: 'A solid larger-base tray with smaller centred base cutouts.',
  },
  {
    value: 'adapterCircle',
    label: 'Adapter Circle Tray',
    description: 'A solid rank-and-file adapter tray with circular base cutouts, fixed gaps, and adjustable borders.',
  },
  {
    value: 'adapterOval',
    label: 'Adapter Oval Tray',
    description: 'A solid rank-and-file adapter tray using fixed oval base presets.',
  },
  {
    value: 'adapterLance',
    label: 'Adapter Lance Wedge Movement Tray',
    description: 'A solid lance wedge adapter tray with smaller centred base cutouts.',
  },
  {
    value: 'skirmish',
    label: 'Skirmish Movement Tray',
    description: 'A rectangular tray with seeded randomised base placement.',
  },
];

export function getRankCounts(settings: TraySettings): number[] {
  if (settings.template === 'lanceWedge' || settings.template === 'adapterLance') {
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
  const isAdapter = settings.template === 'adapter' || settings.template === 'adapterLance';
  const isCircleAdapter = settings.template === 'adapterCircle';
  const isOvalAdapter = settings.template === 'adapterOval';
  const isSkirmish = settings.template === 'skirmish';
  const maxSkirmishRotationRad =
    settings.skirmishBaseShape === 'square' ? (Math.min(10, Math.max(0, settings.skirmishMaxRotationDeg)) * Math.PI) / 180 : 0;
  const skirmishCutoutSizeMm = settings.skirmishBaseSizeMm + settings.toleranceMm;
  const skirmishBaseFootprintMm =
    settings.skirmishBaseShape === 'square'
      ? skirmishCutoutSizeMm * (Math.cos(maxSkirmishRotationRad) + Math.sin(maxSkirmishRotationRad))
      : skirmishCutoutSizeMm;
  const skirmishCellSizeMm = skirmishBaseFootprintMm + settings.skirmishMaxOffsetMm * 2 + skirmishMinimumGapMm;
  const adapterCircleCutoutDiameterMm = settings.adapterCircleDiameterMm + settings.toleranceMm;
  const adapterCirclePitchMm = adapterCircleCutoutDiameterMm + settings.adapterCircleGapMm;
  const adapterOvalBaseSize = getAdapterOvalBaseSize(settings.adapterOvalSize);
  const adapterOvalCutoutWidthMm = adapterOvalBaseSize.depthMm + adapterOvalGwBaseWidthAllowanceMm + settings.toleranceMm;
  const adapterOvalCutoutDepthMm = adapterOvalBaseSize.widthMm + adapterOvalGwBaseLengthAllowanceMm + settings.toleranceMm;
  const adapterOvalPitchWidthMm = adapterOvalCutoutWidthMm + settings.adapterOvalGapMm;
  const adapterOvalPitchDepthMm = adapterOvalCutoutDepthMm + settings.adapterOvalGapMm;
  const slotWidthMm = isCircleAdapter
    ? adapterCirclePitchMm
    : isOvalAdapter
    ? adapterOvalPitchWidthMm
    : isAdapter
    ? settings.baseWidthMm
    : isSkirmish
    ? skirmishCellSizeMm
    : settings.baseWidthMm + settings.toleranceMm;
  const slotDepthMm = isCircleAdapter
    ? adapterCirclePitchMm
    : isOvalAdapter
    ? adapterOvalPitchDepthMm
    : isAdapter
    ? settings.baseDepthMm
    : isSkirmish
    ? skirmishCellSizeMm
    : settings.baseDepthMm + settings.toleranceMm;
  const adapterCutoutWidthMm = isCircleAdapter
    ? adapterCircleCutoutDiameterMm
    : isOvalAdapter
    ? adapterOvalCutoutWidthMm
    : settings.adapterCutoutWidthMm + settings.toleranceMm;
  const adapterCutoutDepthMm = isCircleAdapter
    ? adapterCircleCutoutDiameterMm
    : isOvalAdapter
    ? adapterOvalCutoutDepthMm
    : settings.adapterCutoutDepthMm + settings.toleranceMm;
  const adapterFlankCutoutWidthMm = settings.adapterFlankCutoutWidthMm + settings.toleranceMm;
  const adapterFlankCutoutDepthMm = settings.adapterFlankCutoutDepthMm + settings.toleranceMm;
  const mainInnerWidthMm = isCircleAdapter
    ? Math.max(...rankCounts) * adapterCircleCutoutDiameterMm + (Math.max(...rankCounts) - 1) * settings.adapterCircleGapMm
    : isOvalAdapter
    ? Math.max(...rankCounts) * adapterOvalCutoutWidthMm + (Math.max(...rankCounts) - 1) * settings.adapterOvalGapMm
    : Math.max(...rankCounts) * slotWidthMm + (isSkirmish ? skirmishMinimumGapMm : 0);
  const mainInnerDepthMm = isCircleAdapter
    ? rankCounts.length * adapterCircleCutoutDiameterMm + (rankCounts.length - 1) * settings.adapterCircleGapMm
    : isOvalAdapter
    ? rankCounts.length * adapterOvalCutoutDepthMm + (rankCounts.length - 1) * settings.adapterOvalGapMm
    : rankCounts.length * slotDepthMm + (isSkirmish ? skirmishMinimumGapMm : 0);
  const hasCharacterBay =
    settings.characterBayEnabled && (settings.template === 'standard' || settings.template === 'adapter');
  const characterSlotWidthMm = hasCharacterBay
    ? isAdapter
      ? settings.characterBaseWidthMm
      : settings.characterBaseWidthMm + settings.toleranceMm
    : 0;
  const characterSlotDepthMm = hasCharacterBay
    ? isAdapter
      ? settings.characterBaseDepthMm
      : settings.characterBaseDepthMm + settings.toleranceMm
    : 0;
  const characterDividerMm = 0;
  const innerWidthMm = mainInnerWidthMm + characterSlotWidthMm;
  const innerDepthMm = Math.max(mainInnerDepthMm, characterSlotDepthMm);
  const supportsAdapterBorder = settings.template === 'adapter' || settings.template === 'adapterCircle' || settings.template === 'adapterOval';
  const useCustomAdapterBorder = supportsAdapterBorder && settings.adapterBorderCustomEnabled;
  const adapterBorderLeftMm = supportsAdapterBorder
    ? settings.adapterBorderUniformMm + (useCustomAdapterBorder ? settings.adapterBorderLeftMm : 0)
    : 0;
  const adapterBorderRightMm = supportsAdapterBorder
    ? settings.adapterBorderUniformMm + (useCustomAdapterBorder ? settings.adapterBorderRightMm : 0)
    : 0;
  const adapterBorderFrontMm = supportsAdapterBorder
    ? settings.adapterBorderUniformMm + (useCustomAdapterBorder ? settings.adapterBorderFrontMm : 0)
    : 0;
  const adapterBorderRearMm = supportsAdapterBorder
    ? settings.adapterBorderUniformMm + (useCustomAdapterBorder ? settings.adapterBorderRearMm : 0)
    : 0;
  const leftRailMm = isAdapter || isCircleAdapter || isOvalAdapter ? adapterBorderLeftMm : !isSkirmish && settings.leftRailEnabled ? settings.railThicknessMm : 0;
  const rightRailMm = isAdapter || isCircleAdapter || isOvalAdapter ? adapterBorderRightMm : !isSkirmish && settings.rightRailEnabled ? settings.railThicknessMm : 0;
  const frontRailMm = isAdapter || isCircleAdapter || isOvalAdapter ? adapterBorderFrontMm : !isSkirmish && settings.frontRailEnabled ? settings.railThicknessMm : 0;
  const rearRailMm = isAdapter || isCircleAdapter || isOvalAdapter ? adapterBorderRearMm : !isSkirmish && settings.rearRailEnabled ? settings.railThicknessMm : 0;

  return {
    slotWidthMm,
    slotDepthMm,
    adapterCutoutWidthMm,
    adapterCutoutDepthMm,
    adapterFlankCutoutWidthMm,
    adapterFlankCutoutDepthMm,
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

export type RankInsertSlot = {
  shape: 'rect' | 'circle';
  columnIndex: number;
  rowIndex: number;
  columnSpan: number;
  rowSpan: number;
  x: number;
  y: number;
  width: number;
  depth: number;
  left: number;
  right: number;
  front: number;
  back: number;
  diameter?: number;
};

export type SkirmishBasePlacement = {
  x: number;
  y: number;
  rotationDeg: number;
  rowIndex: number;
  columnIndex: number;
};

export function supportsRankInsert(settings: TraySettings) {
  if (settings.template === 'adapter' && settings.characterBayEnabled) {
    return false;
  }

  return settings.template === 'adapter' || settings.template === 'adapterCircle' || settings.template === 'skirmish';
}

export function getRankInsertSlot(settings: TraySettings, dimensions = calculateTrayDimensions(settings)): RankInsertSlot | null {
  if (!settings.rankInsertEnabled || !supportsRankInsert(settings)) {
    return null;
  }

  const columnIndex = Math.max(0, Math.floor(settings.rankInsertColumn) - 1);
  const rowIndex = Math.max(0, Math.floor(settings.rankInsertRow) - 1);
  const columnSpan = Math.max(1, Math.floor(settings.rankInsertColumnSpan));
  const rowSpan = Math.max(1, Math.floor(settings.rankInsertRowSpan));

  if (
    columnIndex + columnSpan > settings.columns ||
    rowIndex + rowSpan > settings.rows ||
    settings.rows <= 1
  ) {
    return null;
  }

  const gridLeft = -dimensions.mainInnerWidthMm / 2;
  const gridFront = -dimensions.mainInnerDepthMm / 2;
  const occupiedLeft = gridLeft + columnIndex * dimensions.slotWidthMm;
  const occupiedFront = gridFront + rowIndex * dimensions.slotDepthMm;
  const occupiedWidth = columnSpan * dimensions.slotWidthMm;
  const occupiedDepth = rowSpan * dimensions.slotDepthMm;
  const skirmishCutoutSizeMm = settings.skirmishBaseSizeMm + settings.toleranceMm;
  const isCircleInsert = settings.template === 'adapterCircle' || (settings.template === 'skirmish' && settings.skirmishBaseShape === 'circle');
  const isCustomAdapterInsert = settings.template === 'adapter' && settings.rankInsertCustomSizeEnabled;
  const circleInsertDiameterMm = settings.rankInsertCircleDiameterMm + settings.toleranceMm;
  const width =
    isCircleInsert
      ? circleInsertDiameterMm
      : isCustomAdapterInsert
      ? settings.rankInsertCustomWidthMm
      : settings.template === 'adapter'
      ? columnSpan * dimensions.adapterCutoutWidthMm
      : settings.template === 'skirmish'
      ? columnSpan * skirmishCutoutSizeMm
      : occupiedWidth;
  const depth =
    isCircleInsert
      ? circleInsertDiameterMm
      : isCustomAdapterInsert
      ? settings.rankInsertCustomDepthMm
      : settings.template === 'adapter'
      ? rowSpan * dimensions.adapterCutoutDepthMm
      : settings.template === 'skirmish'
      ? rowSpan * skirmishCutoutSizeMm
      : occupiedDepth;
  const firstColumnCenter = occupiedLeft + dimensions.slotWidthMm / 2;
  const lastColumnCenter = firstColumnCenter + (columnSpan - 1) * dimensions.slotWidthMm;
  const x = isCircleInsert ? (firstColumnCenter + lastColumnCenter) / 2 : occupiedLeft + occupiedWidth / 2;
  const firstAdapterCutoutFront = occupiedFront + dimensions.slotDepthMm / 2 - dimensions.adapterCutoutDepthMm / 2;
  const lastAdapterCutoutBack =
    occupiedFront + (rowSpan - 1) * dimensions.slotDepthMm + dimensions.slotDepthMm / 2 + dimensions.adapterCutoutDepthMm / 2;
  const firstSkirmishCutoutFront = occupiedFront + dimensions.slotDepthMm / 2 - skirmishCutoutSizeMm / 2;
  const lastSkirmishCutoutBack =
    occupiedFront + (rowSpan - 1) * dimensions.slotDepthMm + dimensions.slotDepthMm / 2 + skirmishCutoutSizeMm / 2;
  const alignment = settings.rankInsertAlignment ?? (settings.rankInsertAlignRear ? 'rear' : 'front');
  const alignFront =
    isCustomAdapterInsert
      ? occupiedFront
      : settings.template === 'adapter'
      ? firstAdapterCutoutFront
      : settings.template === 'skirmish'
      ? firstSkirmishCutoutFront
      : occupiedFront;
  const alignBack =
    isCustomAdapterInsert
      ? occupiedFront + occupiedDepth
      : settings.template === 'adapter'
      ? lastAdapterCutoutBack
      : settings.template === 'skirmish'
      ? lastSkirmishCutoutBack
      : occupiedFront + occupiedDepth;
  const y =
    alignment === 'rear'
      ? alignBack - depth / 2
      : alignment === 'center'
      ? (alignFront + alignBack) / 2
      : alignFront + depth / 2;
  const left = x - width / 2;
  const right = x + width / 2;
  const front = y - depth / 2;
  const back = y + depth / 2;

  return {
    shape: isCircleInsert ? 'circle' : 'rect',
    columnIndex,
    rowIndex,
    columnSpan,
    rowSpan,
    x,
    y,
    width,
    depth,
    left,
    right,
    front,
    back,
    diameter: isCircleInsert ? circleInsertDiameterMm : undefined,
  };
}

function getRankInsertCircleMaxDiameter(settings: TraySettings, dimensions = calculateTrayDimensions(settings)) {
  const columnSpan = Math.max(1, Math.floor(settings.rankInsertColumnSpan));
  const rowSpan = Math.max(1, Math.floor(settings.rankInsertRowSpan));

  if (settings.template === 'adapterCircle') {
    const baseDiameter = dimensions.adapterCutoutWidthMm;
    const maxWidth = columnSpan * baseDiameter + Math.max(0, columnSpan - 1) * settings.adapterCircleGapMm;
    const maxDepth = rowSpan * baseDiameter + Math.max(0, rowSpan - 1) * settings.adapterCircleGapMm;
    return Math.min(maxWidth, maxDepth);
  }

  if (settings.template === 'skirmish' && settings.skirmishBaseShape === 'circle') {
    const baseDiameter = settings.skirmishBaseSizeMm + settings.toleranceMm;
    const gapAllowance = settings.skirmishMaxOffsetMm * 2 + skirmishMinimumGapMm;
    const maxWidth = columnSpan * baseDiameter + Math.max(0, columnSpan - 1) * gapAllowance;
    const maxDepth = rowSpan * baseDiameter + Math.max(0, rowSpan - 1) * gapAllowance;
    return Math.min(maxWidth, maxDepth);
  }

  return Infinity;
}

export function getCircleAdapterCenters(settings: TraySettings, dimensions = calculateTrayDimensions(settings)): MagnetCutoutCenter[] {
  const diameter = dimensions.adapterCutoutWidthMm;
  const pitch = diameter + settings.adapterCircleGapMm;
  const centers: MagnetCutoutCenter[] = [];
  const startX = -dimensions.mainInnerWidthMm / 2 + diameter / 2;
  const startY = -dimensions.mainInnerDepthMm / 2 + diameter / 2;

  for (let rowIndex = 0; rowIndex < settings.rows; rowIndex += 1) {
    for (let columnIndex = 0; columnIndex < settings.columns; columnIndex += 1) {
      centers.push({
        x: startX + columnIndex * pitch,
        y: startY + rowIndex * pitch,
        rowIndex,
      });
    }
  }

  return centers;
}

export function getOvalAdapterCenters(settings: TraySettings, dimensions = calculateTrayDimensions(settings)): MagnetCutoutCenter[] {
  const pitchX = dimensions.adapterCutoutWidthMm + settings.adapterOvalGapMm;
  const pitchY = dimensions.adapterCutoutDepthMm + settings.adapterOvalGapMm;
  const centers: MagnetCutoutCenter[] = [];
  const startX = -dimensions.mainInnerWidthMm / 2 + dimensions.adapterCutoutWidthMm / 2;
  const startY = -dimensions.mainInnerDepthMm / 2 + dimensions.adapterCutoutDepthMm / 2;

  for (let rowIndex = 0; rowIndex < settings.rows; rowIndex += 1) {
    for (let columnIndex = 0; columnIndex < settings.columns; columnIndex += 1) {
      centers.push({
        x: startX + columnIndex * pitchX,
        y: startY + rowIndex * pitchY,
        rowIndex,
      });
    }
  }

  return centers;
}

function seededRandom(seed: number) {
  let state = Math.max(1, Math.floor(seed)) % 2147483647;
  return () => {
    state = (state * 16807) % 2147483647;
    return (state - 1) / 2147483646;
  };
}

export function getSkirmishPlacements(
  settings: TraySettings,
  dimensions = calculateTrayDimensions(settings),
): SkirmishBasePlacement[] {
  const random = seededRandom(settings.skirmishSeed);
  const maxOffset = Math.min(3, Math.max(0, settings.skirmishMaxOffsetMm));
  const maxRotation = settings.skirmishBaseShape === 'square' ? Math.min(10, Math.max(0, settings.skirmishMaxRotationDeg)) : 0;
  const chance = Math.min(100, Math.max(0, settings.skirmishDistributionChancePercent)) / 100;
  const placements: SkirmishBasePlacement[] = [];
  const startX = -dimensions.innerWidthMm / 2 + skirmishMinimumGapMm / 2;
  const startY = -dimensions.innerDepthMm / 2 + skirmishMinimumGapMm / 2;

  for (let rowIndex = 0; rowIndex < settings.rows; rowIndex += 1) {
    for (let columnIndex = 0; columnIndex < settings.columns; columnIndex += 1) {
      const centreX = startX + columnIndex * dimensions.slotWidthMm + dimensions.slotWidthMm / 2;
      const centreY = startY + rowIndex * dimensions.slotDepthMm + dimensions.slotDepthMm / 2;
      const shouldRandomise = random() <= chance;
      const offsetX = shouldRandomise ? (random() * 2 - 1) * maxOffset : 0;
      const offsetY = shouldRandomise ? (random() * 2 - 1) * maxOffset : 0;
      const rotationDeg = shouldRandomise ? (random() * 2 - 1) * maxRotation : 0;

      placements.push({
        x: centreX + offsetX,
        y: centreY + offsetY,
        rotationDeg,
        rowIndex,
        columnIndex,
      });
    }
  }

  return placements;
}

export function getMagnetCutoutCenters(settings: TraySettings, dimensions = calculateTrayDimensions(settings)): MagnetCutoutCenter[] {
  if (!settings.magnetCutoutsEnabled) {
    return [];
  }

  const rankInsert = getRankInsertSlot(settings, dimensions);
  const isInRankInsert = (x: number, y: number) =>
    Boolean(rankInsert && x >= rankInsert.left && x <= rankInsert.right && y >= rankInsert.front && y <= rankInsert.back);
  const withRankInsertCenter = (centers: MagnetCutoutCenter[]) =>
    rankInsert
      ? [
          ...centers.filter((center) => !isInRankInsert(center.x, center.y)),
          { x: rankInsert.x, y: rankInsert.y, rowIndex: rankInsert.rowIndex },
        ]
      : centers;

  if (settings.template === 'skirmish') {
    return withRankInsertCenter(getSkirmishPlacements(settings, dimensions).map((placement) => ({
      x: placement.x,
      y: placement.y,
      rowIndex: placement.rowIndex,
    })));
  }

  if (settings.template === 'adapterCircle') {
    return withRankInsertCenter(getCircleAdapterCenters(settings, dimensions));
  }

  if (settings.template === 'adapterOval') {
    return getOvalAdapterCenters(settings, dimensions);
  }

  const rankCounts = getRankCounts(settings);
  const centers: MagnetCutoutCenter[] = [];
  const useDoubleMagnets =
    (settings.template === 'lanceWedge' || settings.template === 'adapterLance') && settings.lanceDoubleMagnetsEnabled;
  const yOffsets = useDoubleMagnets ? [-settings.lanceMagnetOffsetMm, settings.lanceMagnetOffsetMm] : [0];

  rankCounts.forEach((rankCount, rowIndex) => {
    const rowWidth = rankCount * dimensions.slotWidthMm;
    const standardMainOffsetX =
      settings.characterBayEnabled &&
      (settings.template === 'standard' || settings.template === 'adapter') &&
      settings.characterBaySide === 'left'
        ? dimensions.characterSlotWidthMm
        : 0;
    const rowStartX =
      settings.template === 'lanceWedge' || settings.template === 'adapterLance'
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

  if ((settings.template === 'standard' || settings.template === 'adapter') && settings.characterBayEnabled) {
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

  return withRankInsertCenter(centers);
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
  const hasOpenFloorOption =
    settings.template === 'adapter' ||
    settings.template === 'adapterCircle' ||
    settings.template === 'adapterOval' ||
    settings.template === 'adapterLance' ||
    settings.template === 'skirmish';

  Object.entries(bounds).forEach(([key, rule]) => {
    const isAdapterBorderSide =
      key === 'adapterBorderFrontMm' ||
      key === 'adapterBorderRearMm' ||
      key === 'adapterBorderLeftMm' ||
      key === 'adapterBorderRightMm';
    const supportsAdapterBorder = settings.template === 'adapter' || settings.template === 'adapterCircle' || settings.template === 'adapterOval';

    if ((settings.template === 'lanceWedge' || settings.template === 'adapterLance') && key === 'columns') {
      return;
    }

    if (
      (settings.template === 'adapter' || settings.template === 'adapterCircle' || settings.template === 'adapterOval' || settings.template === 'adapterLance') &&
      (key === 'railThicknessMm' || key === 'railHeightMm')
    ) {
      return;
    }

    if (
      (settings.template === 'adapterCircle' || settings.template === 'adapterOval') &&
      (key === 'baseWidthMm' ||
        key === 'baseDepthMm' ||
        key === 'adapterCutoutWidthMm' ||
        key === 'adapterCutoutDepthMm' ||
        key === 'adapterFlankCutoutWidthMm' ||
        key === 'adapterFlankCutoutDepthMm')
    ) {
      return;
    }

    if (
      settings.template !== 'adapterCircle' &&
      (key === 'adapterCircleDiameterMm' || key === 'adapterCircleGapMm')
    ) {
      return;
    }

    if (settings.template !== 'adapterOval' && key === 'adapterOvalGapMm') {
      return;
    }

    if (settings.template === 'skirmish' && (key === 'railThicknessMm' || key === 'railHeightMm')) {
      return;
    }

    if (
      key === 'adapterFloorCutoutBufferMm' &&
      !(hasOpenFloorOption && settings.adapterRemoveFloorEnabled && settings.adapterFloorCutoutEnabled)
    ) {
      return;
    }

    if (
      (key === 'rankInsertColumn' ||
        key === 'rankInsertRow' ||
        key === 'rankInsertColumnSpan' ||
        key === 'rankInsertRowSpan' ||
        key === 'rankInsertCircleDiameterMm' ||
        key === 'rankInsertCustomWidthMm' ||
        key === 'rankInsertCustomDepthMm') &&
      !settings.rankInsertEnabled
    ) {
      return;
    }

    if (
      key === 'rankInsertCircleDiameterMm' &&
      !(settings.template === 'adapterCircle' || (settings.template === 'skirmish' && settings.skirmishBaseShape === 'circle'))
    ) {
      return;
    }

    if (
      (key === 'rankInsertCustomWidthMm' || key === 'rankInsertCustomDepthMm') &&
      !(settings.template === 'adapter' && settings.rankInsertCustomSizeEnabled)
    ) {
      return;
    }

    if (isAdapterBorderSide && (!supportsAdapterBorder || !settings.adapterBorderCustomEnabled)) {
      return;
    }

    if (key === 'adapterBorderUniformMm' && !supportsAdapterBorder) {
      return;
    }

    if (key === 'trayCornerRadiusMm' && !settings.trayRoundedCornersEnabled) {
      return;
    }

    if (
      (key === 'generatedBaseHeightMm' ||
        key === 'generatedBaseWallThicknessMm' ||
        key === 'generatedBaseTopThicknessMm') &&
      !settings.generatedBaseEnabled
    ) {
      return;
    }

    if (
      (key === 'generatedBaseWallThicknessMm' || key === 'generatedBaseTopThicknessMm') &&
      !settings.generatedBaseHollow
    ) {
      return;
    }

    const value = settings[key as keyof TraySettings];
    if (typeof value !== 'number') {
      return;
    }

    const allowsZero =
      key === 'skirmishMaxRotationDeg' ||
      key === 'skirmishMaxOffsetMm' ||
      key === 'skirmishDistributionChancePercent' ||
      key === 'adapterFloorCutoutBufferMm' ||
      key === 'trayEdgeSlopeMm' ||
      key === 'adapterBorderUniformMm' ||
      key === 'adapterBorderFrontMm' ||
      key === 'adapterBorderRearMm' ||
      key === 'adapterBorderLeftMm' ||
      key === 'adapterBorderRightMm';

    if (!Number.isFinite(value)) {
      messages.push(`${rule.label} must be a number.`);
    } else if (allowsZero ? value < 0 : value <= 0) {
      messages.push(`${rule.label} must be greater than zero.`);
    } else if (value < rule.min || value > rule.max) {
      const unit = rule.unit ? ` ${rule.unit}` : '';
      messages.push(`${rule.label} must be between ${rule.min} and ${rule.max}${unit}.`);
    }
  });

  if (settings.template !== 'lanceWedge' && settings.template !== 'adapterLance' && !Number.isInteger(settings.columns)) {
    messages.push('Files must be a positive whole number.');
  }

  if (!Number.isInteger(settings.rows)) {
    messages.push('Ranks must be a positive whole number.');
  }

  const dimensions = calculateTrayDimensions(settings);
  const rankInsertSupported = supportsRankInsert(settings);

  if (settings.rankInsertEnabled) {
    if (!rankInsertSupported) {
      messages.push('Rank insert slot is only available for adapter, circle adapter, and skirmish trays without an irregular flank adapter.');
    }

    if (settings.rows <= 1) {
      messages.push('Rank insert slot needs at least two ranks.');
    }

    if (!Number.isInteger(settings.rankInsertColumn) || !Number.isInteger(settings.rankInsertRow)) {
      messages.push('Rank insert origin must use whole-number coordinates.');
    }

    if (!Number.isInteger(settings.rankInsertColumnSpan) || !Number.isInteger(settings.rankInsertRowSpan)) {
      messages.push('Rank insert span must use whole numbers.');
    }

    if (settings.rankInsertColumn + settings.rankInsertColumnSpan - 1 > settings.columns) {
      messages.push('Rank insert file span must stay inside the tray files.');
    }

    if (settings.rankInsertRow + settings.rankInsertRowSpan - 1 > settings.rows) {
      messages.push('Rank insert rank span must stay inside the tray ranks.');
    }

    if (settings.template === 'adapterCircle' || (settings.template === 'skirmish' && settings.skirmishBaseShape === 'circle')) {
      const maxDiameter = getRankInsertCircleMaxDiameter(settings, dimensions);
      const requestedDiameter = settings.rankInsertCircleDiameterMm + settings.toleranceMm;

      if (requestedDiameter > maxDiameter) {
        messages.push(`Rank insert circle diameter must be ${formatMm(Math.max(0, maxDiameter - settings.toleranceMm))} or smaller for the selected coordinate span.`);
      }
    }

    if (settings.template === 'adapter' && settings.rankInsertCustomSizeEnabled) {
      const maxWidth = settings.rankInsertColumnSpan * dimensions.slotWidthMm;
      const maxDepth = settings.rankInsertRowSpan * dimensions.slotDepthMm;

      if (settings.rankInsertCustomWidthMm > maxWidth) {
        messages.push(`Custom rank insert width must be ${formatMm(maxWidth)} or smaller for the selected file span.`);
      }

      if (settings.rankInsertCustomDepthMm > maxDepth) {
        messages.push(`Custom rank insert depth must be ${formatMm(maxDepth)} or smaller for the selected rank span.`);
      }
    }
  }

  if (settings.template === 'adapter' || settings.template === 'adapterLance') {
    const minimumWallMm = 1;
    const mainSideWallMm = (dimensions.slotWidthMm - dimensions.adapterCutoutWidthMm) / 2;
    const mainFrontBackWallMm = (dimensions.slotDepthMm - dimensions.adapterCutoutDepthMm) / 2;
    const wallChecks = [
      { label: 'left', value: dimensions.leftRailMm + mainSideWallMm },
      { label: 'right', value: dimensions.rightRailMm + mainSideWallMm },
      { label: 'front', value: dimensions.frontRailMm + mainFrontBackWallMm },
      { label: 'rear', value: dimensions.rearRailMm + mainFrontBackWallMm },
    ];

    wallChecks.forEach((check) => {
      if (check.value < minimumWallMm) {
        messages.push(`Adapter ${check.label} edge must leave at least ${minimumWallMm} mm around the cutouts.`);
      }
    });

    if (settings.template === 'adapter' && settings.characterBayEnabled) {
      const flankSideWallMm = (dimensions.characterSlotWidthMm - dimensions.adapterFlankCutoutWidthMm) / 2;
      const flankFrontBackWallMm = (dimensions.characterSlotDepthMm - dimensions.adapterFlankCutoutDepthMm) / 2;

      if (dimensions.frontRailMm + flankFrontBackWallMm < minimumWallMm) {
        messages.push(`Adapter front edge must leave at least ${minimumWallMm} mm around the flank cutout.`);
      }

      if (dimensions.rearRailMm + flankFrontBackWallMm < minimumWallMm) {
        messages.push(`Adapter rear edge must leave at least ${minimumWallMm} mm around the flank cutout.`);
      }

      if (
        (settings.characterBaySide === 'left' ? dimensions.leftRailMm : dimensions.rightRailMm) + flankSideWallMm <
        minimumWallMm
      ) {
        messages.push(`Adapter flank edge must leave at least ${minimumWallMm} mm around the flank cutout.`);
      }
    }
  }

  if (settings.template === 'adapterCircle' || settings.template === 'adapterOval') {
    const minimumWallMm = 1;
    const borderChecks = [
      { label: 'left', value: dimensions.leftRailMm },
      { label: 'right', value: dimensions.rightRailMm },
      { label: 'front', value: dimensions.frontRailMm },
      { label: 'rear', value: dimensions.rearRailMm },
    ];

    borderChecks.forEach((check) => {
      if (check.value < minimumWallMm) {
        messages.push(`${settings.template === 'adapterOval' ? 'Oval' : 'Circle'} adapter ${check.label} border must leave at least ${minimumWallMm} mm around the cutouts.`);
      }
    });
  }

  if (
    settings.template === 'skirmish' &&
    !settings.adapterRemoveFloorEnabled &&
    settings.skirmishTrayHeightMm <= settings.floorThicknessMm
  ) {
    messages.push('Skirmish tray height must be greater than floor thickness.');
  }

  if (hasOpenFloorOption && settings.adapterRemoveFloorEnabled && settings.magnetCutoutsEnabled) {
    messages.push('Magnet cutouts are not available when the floor is removed.');
  }

  if (settings.template === 'adapter' || settings.template === 'adapterLance') {
    if (dimensions.adapterCutoutWidthMm > dimensions.slotWidthMm) {
      messages.push('Adapter cutout width must fit inside the target base width.');
    }

    if (dimensions.adapterCutoutDepthMm > dimensions.slotDepthMm) {
      messages.push('Adapter cutout depth must fit inside the target base depth.');
    }

    if (settings.template === 'adapter' && settings.characterBayEnabled) {
      if (dimensions.adapterFlankCutoutWidthMm > dimensions.characterSlotWidthMm) {
        messages.push('Flank adapter cutout width must fit inside the irregular flank base width.');
      }

      if (dimensions.adapterFlankCutoutDepthMm > dimensions.characterSlotDepthMm) {
        messages.push('Flank adapter cutout depth must fit inside the irregular flank base depth.');
      }
    }

    if (settings.adapterFloorCutoutEnabled && settings.adapterRemoveFloorEnabled) {
      const minimumOpeningWidthMm = settings.adapterFloorCutoutBufferMm * 2;

      if (minimumOpeningWidthMm >= dimensions.mainInnerWidthMm) {
        messages.push('Magnetic sheet border width must leave an opening inside the adapter width.');
      }

      if (minimumOpeningWidthMm >= dimensions.mainInnerDepthMm) {
        messages.push('Magnetic sheet border width must leave an opening inside the adapter depth.');
      }

      if (settings.template === 'adapter' && settings.characterBayEnabled) {
        if (minimumOpeningWidthMm >= dimensions.characterSlotWidthMm) {
          messages.push('Magnetic sheet border width must leave an opening inside the irregular flank width.');
        }

        if (minimumOpeningWidthMm >= dimensions.characterSlotDepthMm) {
          messages.push('Magnetic sheet border width must leave an opening inside the irregular flank depth.');
        }
      }
    }
  }

  if ((settings.template === 'adapterCircle' || settings.template === 'adapterOval') && settings.adapterFloorCutoutEnabled && settings.adapterRemoveFloorEnabled) {
    const minimumOpeningWidthMm = settings.adapterFloorCutoutBufferMm * 2;

    if (minimumOpeningWidthMm >= dimensions.outerWidthMm) {
      messages.push(`Magnetic sheet border width must leave an opening inside the ${settings.template === 'adapterOval' ? 'oval' : 'circle'} adapter width.`);
    }

    if (minimumOpeningWidthMm >= dimensions.outerDepthMm) {
      messages.push(`Magnetic sheet border width must leave an opening inside the ${settings.template === 'adapterOval' ? 'oval' : 'circle'} adapter depth.`);
    }
  }

  if (settings.template === 'skirmish' && settings.adapterFloorCutoutEnabled && settings.adapterRemoveFloorEnabled) {
    const minimumOpeningWidthMm = settings.adapterFloorCutoutBufferMm * 2;

    if (minimumOpeningWidthMm >= dimensions.outerWidthMm) {
      messages.push('Magnetic sheet border width must leave an opening inside the skirmish tray width.');
    }

    if (minimumOpeningWidthMm >= dimensions.outerDepthMm) {
      messages.push('Magnetic sheet border width must leave an opening inside the skirmish tray depth.');
    }
  }

  const hasMagnetCutoutLayer = !(hasOpenFloorOption && settings.adapterRemoveFloorEnabled);

  if (settings.magnetCutoutsEnabled && hasMagnetCutoutLayer) {
    if (settings.magnetCutoutDepthMm > settings.floorThicknessMm) {
      messages.push('Magnet cutout depth cannot be greater than floor thickness.');
    }

    const magnetLimit =
      settings.template === 'skirmish'
        ? settings.skirmishBaseSizeMm + settings.toleranceMm
        : settings.template === 'adapter' || settings.template === 'adapterCircle' || settings.template === 'adapterOval' || settings.template === 'adapterLance'
        ? Math.min(dimensions.adapterCutoutWidthMm, dimensions.adapterCutoutDepthMm)
        : Math.min(dimensions.slotWidthMm, dimensions.slotDepthMm);

    if (settings.magnetDiameterMm > magnetLimit) {
      messages.push('Magnet diameter must fit inside each base space.');
    }

    if (
      (settings.template === 'standard' || settings.template === 'adapter') &&
      settings.characterBayEnabled &&
      settings.magnetDiameterMm >
        (settings.template === 'adapter'
          ? Math.min(dimensions.adapterFlankCutoutWidthMm, dimensions.adapterFlankCutoutDepthMm)
          : Math.min(dimensions.characterSlotWidthMm, dimensions.characterSlotDepthMm))
    ) {
      messages.push('Magnet diameter must fit inside the character flank slot.');
    }

    if (
      (settings.template === 'lanceWedge' || settings.template === 'adapterLance') &&
      settings.lanceDoubleMagnetsEnabled &&
      settings.lanceMagnetOffsetMm * 2 + settings.magnetDiameterMm > dimensions.slotDepthMm
    ) {
      messages.push('Lance double magnets must fit within the base depth.');
    }
  }

  if (dimensions.outerWidthMm > 320 || dimensions.outerDepthMm > 320) {
    messages.push('Overall tray dimensions must stay under 320 mm in each direction.');
  }

  if (settings.generatedBaseEnabled && settings.generatedBaseHollow) {
    const smallestBaseSpan = Math.min(dimensions.adapterCutoutWidthMm, dimensions.adapterCutoutDepthMm, dimensions.slotWidthMm, dimensions.slotDepthMm);

    if (settings.generatedBaseTopThicknessMm >= settings.generatedBaseHeightMm) {
      messages.push('Generated base top thickness must be less than the base height.');
    }

    if (settings.generatedBaseWallThicknessMm * 2 >= smallestBaseSpan) {
      messages.push('Generated base wall thickness must leave a hollow interior for the selected base size.');
    }
  }

  return {
    isValid: messages.length === 0,
    messages,
  };
}

export function formatMm(value: number): string {
  return `${value.toFixed(1)} mm`;
}
