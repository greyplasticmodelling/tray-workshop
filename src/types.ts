export type TraySettings = {
  baseWidthMm: number;
  baseDepthMm: number;
  columns: number;
  rows: number;
  toleranceMm: number;
  floorThicknessMm: number;
  railThicknessMm: number;
  railHeightMm: number;
  frontRailEnabled: boolean;
  rearRailEnabled: boolean;
  leftRailEnabled: boolean;
  rightRailEnabled: boolean;
  buildPlateSize: BuildPlateSize;
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

export type ThemeName = 'workshop' | 'forest' | 'slate' | 'parchment';

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
