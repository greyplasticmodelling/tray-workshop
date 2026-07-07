import type { TrayDimensions, TraySettings } from '../types';

type Props = {
  dimensions: TrayDimensions;
  settings: TraySettings;
};

export function TrayPreviewSvg({ dimensions, settings }: Props) {
  const padding = Math.max(8, Math.min(dimensions.outerWidthMm, dimensions.outerDepthMm) * 0.08);
  const viewWidth = dimensions.outerWidthMm + padding * 2;
  const viewHeight = dimensions.outerDepthMm + padding * 2;
  const outerX = padding;
  const outerY = padding;
  const innerX = outerX + dimensions.leftRailMm;
  const innerY = outerY + dimensions.frontRailMm;

  const footprints = [];
  for (let row = 0; row < settings.rows; row += 1) {
    for (let column = 0; column < settings.columns; column += 1) {
      footprints.push(
        <rect
          key={`${column}-${row}`}
          x={innerX + column * dimensions.slotWidthMm}
          y={innerY + row * dimensions.slotDepthMm}
          width={dimensions.slotWidthMm}
          height={dimensions.slotDepthMm}
          className="footprint"
        />,
      );
    }
  }

  return (
    <div className="preview-frame">
      <svg viewBox={`0 0 ${viewWidth} ${viewHeight}`} role="img" aria-label="Top-down movement tray preview">
        <rect x={outerX} y={outerY} width={dimensions.outerWidthMm} height={dimensions.outerDepthMm} className="floor" />

        {settings.frontRailEnabled && (
          <rect x={innerX} y={outerY} width={dimensions.innerWidthMm} height={settings.railThicknessMm} className="rail" />
        )}
        {settings.rearRailEnabled && (
          <rect
            x={innerX}
            y={outerY + dimensions.outerDepthMm - settings.railThicknessMm}
            width={dimensions.innerWidthMm}
            height={settings.railThicknessMm}
            className="rail"
          />
        )}
        {settings.leftRailEnabled && (
          <rect x={outerX} y={outerY} width={settings.railThicknessMm} height={dimensions.outerDepthMm} className="rail" />
        )}
        {settings.rightRailEnabled && (
          <rect
            x={outerX + dimensions.outerWidthMm - settings.railThicknessMm}
            y={outerY}
            width={settings.railThicknessMm}
            height={dimensions.outerDepthMm}
            className="rail"
          />
        )}

        <rect x={innerX} y={innerY} width={dimensions.innerWidthMm} height={dimensions.innerDepthMm} className="inner-area" />
        {footprints}
      </svg>
    </div>
  );
}
