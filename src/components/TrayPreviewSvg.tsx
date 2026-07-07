import type { TrayDimensions, TraySettings } from '../types';

type Props = {
  dimensions: TrayDimensions;
  settings: TraySettings;
};

export function TrayPreviewSvg({ dimensions, settings }: Props) {
  const fontSize = Math.min(6, Math.max(3.2, Math.min(dimensions.outerWidthMm, dimensions.outerDepthMm) * 0.045));
  const dimensionGap = fontSize * 3;
  const tickSize = fontSize;
  const padding = Math.max(22, Math.min(dimensions.outerWidthMm, dimensions.outerDepthMm) * 0.12, fontSize * 5);
  const viewWidth = dimensions.outerWidthMm + padding * 2;
  const viewHeight = dimensions.outerDepthMm + padding * 2;
  const outerX = padding;
  const outerY = padding;
  const innerX = outerX + dimensions.leftRailMm;
  const innerY = outerY + dimensions.frontRailMm;
  const widthLineY = outerY + dimensions.outerDepthMm + dimensionGap;
  const depthLineX = outerX + dimensions.outerWidthMm + dimensionGap;
  const widthLabel = `${dimensions.outerWidthMm.toFixed(1)} mm exterior width`;
  const depthLabel = `${dimensions.outerDepthMm.toFixed(1)} mm exterior depth`;

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
        <defs>
          <marker id="dimension-arrow" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto-start-reverse">
            <path d="M 0 0 L 6 3 L 0 6 z" className="dimension-arrow" />
          </marker>
        </defs>

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

        <g className="dimension-annotations" style={{ fontSize }}>
          <line
            x1={outerX}
            y1={widthLineY}
            x2={outerX + dimensions.outerWidthMm}
            y2={widthLineY}
            className="dimension-line"
            markerStart="url(#dimension-arrow)"
            markerEnd="url(#dimension-arrow)"
          />
          <line x1={outerX} y1={outerY + dimensions.outerDepthMm} x2={outerX} y2={widthLineY + tickSize} className="dimension-tick" />
          <line
            x1={outerX + dimensions.outerWidthMm}
            y1={outerY + dimensions.outerDepthMm}
            x2={outerX + dimensions.outerWidthMm}
            y2={widthLineY + tickSize}
            className="dimension-tick"
          />
          <text
            x={outerX + dimensions.outerWidthMm / 2}
            y={widthLineY + fontSize * 1.65}
            className="dimension-label"
            textAnchor="middle"
          >
            {widthLabel}
          </text>

          <line
            x1={depthLineX}
            y1={outerY}
            x2={depthLineX}
            y2={outerY + dimensions.outerDepthMm}
            className="dimension-line"
            markerStart="url(#dimension-arrow)"
            markerEnd="url(#dimension-arrow)"
          />
          <line x1={outerX + dimensions.outerWidthMm} y1={outerY} x2={depthLineX + tickSize} y2={outerY} className="dimension-tick" />
          <line
            x1={outerX + dimensions.outerWidthMm}
            y1={outerY + dimensions.outerDepthMm}
            x2={depthLineX + tickSize}
            y2={outerY + dimensions.outerDepthMm}
            className="dimension-tick"
          />
          <text
            x={depthLineX + fontSize * 1.65}
            y={outerY + dimensions.outerDepthMm / 2}
            className="dimension-label"
            textAnchor="middle"
            transform={`rotate(90 ${depthLineX + fontSize * 1.65} ${outerY + dimensions.outerDepthMm / 2})`}
          >
            {depthLabel}
          </text>
        </g>
      </svg>
    </div>
  );
}
