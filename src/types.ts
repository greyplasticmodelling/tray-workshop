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
  magnetCutoutsEnabled: boolean;
  magnetDiameterMm: number;
  magnetCutoutDepthMm: number;
  lanceDoubleMagnetsEnabled: boolean;
  lanceMagnetOffsetMm: number;
  frontRailEnabled: boolean;
  rearRailEnabled: boolean;
  leftRailEnabled: boolean;
  rightRailEnabled: boolean;
  buildPlateSize: BuildPlateSize;
};

export type TrayTemplate = 'standard' | 'lanceWedge';

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
