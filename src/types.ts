export type TraySettings = {
  template: TrayTemplate;
  baseWidthMm: number;
  baseDepthMm: number;
  columns: number;
  rows: number;
  toleranceMm: number;
  floorThicknessMm: number;
  railThicknessMm: number;
  railHeightMm: number;
  adapterCutoutWidthMm: number;
  adapterCutoutDepthMm: number;
  adapterCircleDiameterMm: number;
  adapterCircleGapMm: number;
  adapterFlankCutoutWidthMm: number;
  adapterFlankCutoutDepthMm: number;
  adapterBaseHeightMm: number;
  adapterBorderUniformMm: number;
  adapterBorderCustomEnabled: boolean;
  adapterBorderFrontMm: number;
  adapterBorderRearMm: number;
  adapterBorderLeftMm: number;
  adapterBorderRightMm: number;
  adapterRemoveFloorEnabled: boolean;
  adapterFloorCutoutEnabled: boolean;
  adapterFloorCutoutBufferMm: number;
  trayEdgeSlopeMm: number;
  trayRoundedCornersEnabled: boolean;
  trayCornerRadiusMm: number;
  skirmishBaseShape: 'square' | 'circle';
  skirmishBaseSizeMm: number;
  skirmishSeed: number;
  skirmishMaxRotationDeg: number;
  skirmishMaxOffsetMm: number;
  skirmishDistributionChancePercent: number;
  skirmishTrayHeightMm: number;
  magnetCutoutsEnabled: boolean;
  magnetCutoutsFromBottom: boolean;
  magnetDiameterMm: number;
  magnetCutoutDepthMm: number;
  lanceDoubleMagnetsEnabled: boolean;
  lanceMagnetOffsetMm: number;
  characterBayEnabled: boolean;
  characterBaySide: 'left' | 'right';
  characterBaseWidthMm: number;
  characterBaseDepthMm: number;
  frontRailEnabled: boolean;
  rearRailEnabled: boolean;
  leftRailEnabled: boolean;
  rightRailEnabled: boolean;
  buildPlateSize: BuildPlateSize;
};

export type TrayTemplate = 'standard' | 'lanceWedge' | 'adapter' | 'adapterCircle' | 'adapterLance' | 'skirmish';

export type SavedTray = {
  id: string;
  name: string;
  settings: TraySettings;
};

export type BuildPlateSize = '180x180' | '235x235' | '256x256' | '300x300' | '350x350';

export type BuildPlate = {
  value: BuildPlateSize;
  widthMm: number;
  depthMm: number;
};

export type BuildPlateFit = {
  plate: BuildPlate;
  fits: boolean;
  fitsRotated: boolean;
  overWidthMm: number;
  overDepthMm: number;
};

export type ThemeName = 'darkGrey' | 'workshop' | 'forest' | 'slate' | 'parchment';

export type TrayDimensions = {
  slotWidthMm: number;
  slotDepthMm: number;
  adapterCutoutWidthMm: number;
  adapterCutoutDepthMm: number;
  adapterFlankCutoutWidthMm: number;
  adapterFlankCutoutDepthMm: number;
  mainInnerWidthMm: number;
  mainInnerDepthMm: number;
  characterSlotWidthMm: number;
  characterSlotDepthMm: number;
  characterDividerMm: number;
  innerWidthMm: number;
  innerDepthMm: number;
  outerWidthMm: number;
  outerDepthMm: number;
  leftRailMm: number;
  rightRailMm: number;
  frontRailMm: number;
  rearRailMm: number;
};

export type ValidationResult = {
  isValid: boolean;
  messages: string[];
};
