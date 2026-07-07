import type { TrayDimensions, TraySettings } from '../types';
import { getRankCounts } from '../geometry/trayMath';

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
  const centerX = outerX + dimensions.outerWidthMm / 2;
  const widthLineY = outerY + dimensions.outerDepthMm + dimensionGap;
  const depthLineX = outerX + dimensions.outerWidthMm + dimensionGap;
  const widthLabel = `${dimensions.outerWidthMm.toFixed(1)} mm exterior width`;
  const depthLabel = `${dimensions.outerDepthMm.toFixed(1)} mm exterior depth`;

  const rankCounts = getRankCounts(settings);
  const isLanceWedge = settings.template === 'lanceWedge';
  const footprints = [];
  for (let row = 0; row < rankCounts.length; row += 1) {
    const rankCount = rankCounts[row];
    const rowWidth = rankCount * dimensions.slotWidthMm;
    const rowX = isLanceWedge ? centerX - rowWidth / 2 : innerX;

    for (let column = 0; column < rankCount; column += 1) {
      footprints.push(
        <rect
          key={`${column}-${row}`}
          x={rowX + column * dimensions.slotWidthMm}
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

        {!isLanceWedge && (
          <rect x={outerX} y={outerY} width={dimensions.outerWidthMm} height={dimensions.outerDepthMm} className="floor" />
        )}

        {isLanceWedge &&
          rankCounts.map((rankCount, rowIndex) => {
            const rowWidth = rankCount * dimensions.slotWidthMm;
            return (
              <rect
                key={`floor-rank-${rowIndex}`}
                x={centerX - rowWidth / 2 - dimensions.leftRailMm}
                y={innerY + rowIndex * dimensions.slotDepthMm}
                width={rowWidth + dimensions.leftRailMm + dimensions.rightRailMm}
                height={dimensions.slotDepthMm}
                className="floor"
              />
            );
          })}

        {isLanceWedge && settings.frontRailEnabled && (
          <rect
            x={centerX - dimensions.slotWidthMm / 2 - dimensions.leftRailMm}
            y={outerY}
            width={dimensions.slotWidthMm + dimensions.leftRailMm + dimensions.rightRailMm}
            height={settings.railThicknessMm}
            className="floor"
          />
        )}

        {isLanceWedge && settings.rearRailEnabled && (
          <rect
            x={innerX - dimensions.leftRailMm}
            y={outerY + dimensions.outerDepthMm - settings.railThicknessMm}
            width={dimensions.innerWidthMm + dimensions.leftRailMm + dimensions.rightRailMm}
            height={settings.railThicknessMm}
            className="floor"
          />
        )}

        {settings.frontRailEnabled && !isLanceWedge && (
          <rect x={innerX} y={outerY} width={dimensions.innerWidthMm} height={settings.railThicknessMm} className="rail" />
        )}
        {settings.rearRailEnabled && !isLanceWedge && (
          <rect
            x={innerX}
            y={outerY + dimensions.outerDepthMm - settings.railThicknessMm}
            width={dimensions.innerWidthMm}
            height={settings.railThicknessMm}
            className="rail"
          />
        )}
        {settings.leftRailEnabled && !isLanceWedge && (
          <rect x={outerX} y={outerY} width={settings.railThicknessMm} height={dimensions.outerDepthMm} className="rail" />
        )}
        {settings.rightRailEnabled && !isLanceWedge && (
          <rect
            x={outerX + dimensions.outerWidthMm - settings.railThicknessMm}
            y={outerY}
            width={settings.railThicknessMm}
            height={dimensions.outerDepthMm}
            className="rail"
          />
        )}

        {isLanceWedge &&
          rankCounts.map((rankCount, rowIndex) => {
            const rowWidth = rankCount * dimensions.slotWidthMm;
            const rowY = innerY + rowIndex * dimensions.slotDepthMm;
            return (
              <g key={`wedge-rails-${rowIndex}`}>
                {settings.leftRailEnabled && (
                  <rect
                    x={centerX - rowWidth / 2 - settings.railThicknessMm}
                    y={rowY}
                    width={settings.railThicknessMm}
                    height={dimensions.slotDepthMm}
                    className="rail"
                  />
                )}
                {settings.rightRailEnabled && (
                  <rect
                    x={centerX + rowWidth / 2}
                    y={rowY}
                    width={settings.railThicknessMm}
                    height={dimensions.slotDepthMm}
                    className="rail"
                  />
                )}
              </g>
            );
          })}

        {isLanceWedge &&
          rankCounts.slice(0, -1).map((rankCount, rowIndex) => {
            const currentWidth = rankCount * dimensions.slotWidthMm;
            const nextWidth = rankCounts[rowIndex + 1] * dimensions.slotWidthMm;
            const stepWidth = (nextWidth - currentWidth) / 2;
            const stepY = innerY + (rowIndex + 1) * dimensions.slotDepthMm - settings.railThicknessMm;
            const leftStepX = centerX - currentWidth / 2 - dimensions.leftRailMm - stepWidth;
            const rightStepX = centerX + currentWidth / 2 + dimensions.rightRailMm;

            if (stepWidth <= 0) {
              return null;
            }

            return (
              <g key={`step-rails-${rowIndex}`}>
                {settings.leftRailEnabled && (
                  <rect
                    x={leftStepX}
                    y={stepY}
                    width={stepWidth}
                    height={settings.railThicknessMm}
                    className="floor"
                  />
                )}
                {settings.leftRailEnabled && (
                  <rect
                    x={leftStepX}
                    y={stepY}
                    width={stepWidth}
                    height={settings.railThicknessMm}
                    className="rail"
                  />
                )}
                {settings.rightRailEnabled && (
                  <rect
                    x={rightStepX}
                    y={stepY}
                    width={stepWidth}
                    height={settings.railThicknessMm}
                    className="floor"
                  />
                )}
                {settings.rightRailEnabled && (
                  <rect
                    x={rightStepX}
                    y={stepY}
                    width={stepWidth}
                    height={settings.railThicknessMm}
                    className="rail"
                  />
                )}
              </g>
            );
          })}

        {isLanceWedge && settings.frontRailEnabled && (
          <rect
            x={centerX - dimensions.slotWidthMm / 2 - dimensions.leftRailMm}
            y={outerY}
            width={dimensions.slotWidthMm + dimensions.leftRailMm + dimensions.rightRailMm}
            height={settings.railThicknessMm}
            className="rail"
          />
        )}

        {isLanceWedge && settings.rearRailEnabled && (
          <rect
            x={innerX - dimensions.leftRailMm}
            y={outerY + dimensions.outerDepthMm - settings.railThicknessMm}
            width={dimensions.innerWidthMm + dimensions.leftRailMm + dimensions.rightRailMm}
            height={settings.railThicknessMm}
            className="rail"
          />
        )}

        {!isLanceWedge && (
          <rect x={innerX} y={innerY} width={dimensions.innerWidthMm} height={dimensions.innerDepthMm} className="inner-area" />
        )}
        {isLanceWedge &&
          rankCounts.map((rankCount, rowIndex) => {
            const rowWidth = rankCount * dimensions.slotWidthMm;
            return (
              <rect
                key={`inner-rank-${rowIndex}`}
                x={centerX - rowWidth / 2}
                y={innerY + rowIndex * dimensions.slotDepthMm}
                width={rowWidth}
                height={dimensions.slotDepthMm}
                className="inner-area"
              />
            );
          })}
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
