import type { TrayDimensions, TraySettings } from '../types';
import { getCircleAdapterCenters, getMagnetCutoutCenters, getRankCounts, getSkirmishPlacements } from '../geometry/trayMath';

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
  const innerCenterScreenX = innerX + dimensions.innerWidthMm / 2;
  const innerCenterScreenY = innerY + dimensions.innerDepthMm / 2;

  const rankCounts = getRankCounts(settings);
  const isLanceWedge = settings.template === 'lanceWedge';
  const isAdapter = settings.template === 'adapter';
  const isAdapterCircle = settings.template === 'adapterCircle';
  const isAdapterLance = settings.template === 'adapterLance';
  const isAdapterTray = isAdapter || isAdapterCircle || isAdapterLance;
  const isLanceFormation = isLanceWedge || isAdapterLance;
  const isSkirmish = settings.template === 'skirmish';
  const hasCharacterBay =
    settings.characterBayEnabled && (settings.template === 'standard' || settings.template === 'adapter');
  const characterBayX =
    settings.characterBaySide === 'left'
      ? innerX
      : innerX + dimensions.mainInnerWidthMm;
  const characterBayY = innerY;
  const characterSlotY = characterBayY;
  const mainAreaX =
    innerX + (hasCharacterBay && settings.characterBaySide === 'left' ? dimensions.characterSlotWidthMm : 0);
  const mainAreaY = innerY;
  const mainFloorX = hasCharacterBay && settings.characterBaySide === 'left' ? innerX + dimensions.characterSlotWidthMm : innerX;
  const characterFloorX =
    settings.characterBaySide === 'left' ? innerX : innerX + dimensions.mainInnerWidthMm;
  const baySideRailEnabled =
    hasCharacterBay &&
    (settings.characterBaySide === 'left' ? settings.leftRailEnabled : settings.rightRailEnabled);
  const baySideRailMm = settings.characterBaySide === 'left' ? dimensions.leftRailMm : dimensions.rightRailMm;
  const hasCharacterReturnRail = baySideRailEnabled && dimensions.characterSlotDepthMm < dimensions.mainInnerDepthMm;
  const characterFloorWidth = dimensions.characterSlotWidthMm + baySideRailMm;
  const characterFloorHeight =
    dimensions.frontRailMm + dimensions.characterSlotDepthMm + (hasCharacterReturnRail ? settings.railThicknessMm : 0);
  const baySideRailX =
    settings.characterBaySide === 'left' ? outerX : outerX + dimensions.outerWidthMm - baySideRailMm;
  const mainSideRailX =
    settings.characterBaySide === 'left'
      ? outerX + dimensions.characterSlotWidthMm
      : innerX + dimensions.mainInnerWidthMm;
  const stepRailX = settings.characterBaySide === 'left' ? outerX : innerX + dimensions.mainInnerWidthMm;
  const stepRailY = innerY + dimensions.characterSlotDepthMm;
  const stepRailWidth = dimensions.characterSlotWidthMm + baySideRailMm;
  const mainSideRailHeight = dimensions.outerDepthMm - dimensions.frontRailMm - dimensions.characterSlotDepthMm;
  const magnetCenters = getMagnetCutoutCenters(settings, dimensions);
  const skirmishPlacements = isSkirmish ? getSkirmishPlacements(settings, dimensions) : [];
  const circleAdapterCenters = isAdapterCircle ? getCircleAdapterCenters(settings, dimensions) : [];
  const finishExpansion = settings.trayEdgeSlopeMm;
  const finishCornerRadius = settings.template === 'skirmish' && settings.trayRoundedCornersEnabled ? settings.trayCornerRadiusMm : 0;
  const finishRects: Array<{ key: string; x: number; y: number; width: number; height: number }> = [];
  const finishLines: Array<{ key: string; x1: number; y1: number; x2: number; y2: number }> = [];

  if (finishExpansion > 0) {
    if (isSkirmish || isAdapter || isAdapterCircle) {
      finishRects.push({
        key: 'finish-outer',
        x: outerX,
        y: outerY,
        width: dimensions.outerWidthMm,
        height: dimensions.outerDepthMm,
      });
      if (isAdapter && hasCharacterBay) {
        finishRects.pop();
        finishRects.push(
          {
            key: 'finish-adapter-main',
            x: mainFloorX,
            y: outerY,
            width: dimensions.mainInnerWidthMm,
            height: dimensions.mainInnerDepthMm,
          },
          {
            key: 'finish-adapter-flank',
            x: characterFloorX,
            y: outerY,
            width: dimensions.characterSlotWidthMm,
            height: dimensions.characterSlotDepthMm,
          },
        );
      }
    } else if (!isLanceFormation) {
      if (settings.leftRailEnabled && (!hasCharacterBay || settings.characterBaySide === 'right')) {
        finishLines.push({ key: 'finish-left-rail', x1: outerX, y1: outerY, x2: outerX, y2: outerY + dimensions.outerDepthMm });
      }

      if (settings.rightRailEnabled && (!hasCharacterBay || settings.characterBaySide === 'left')) {
        const railX = outerX + dimensions.outerWidthMm;
        finishLines.push({ key: 'finish-right-rail', x1: railX, y1: outerY + dimensions.outerDepthMm, x2: railX, y2: outerY });
      }

      if (settings.frontRailEnabled) {
        const frontLeftX = settings.leftRailEnabled ? outerX : innerX;
        const frontRightX = settings.rightRailEnabled ? outerX + dimensions.outerWidthMm : innerX + dimensions.innerWidthMm;
        finishLines.push({ key: 'finish-front-rail', x1: frontRightX, y1: outerY, x2: frontLeftX, y2: outerY });
      }

      if (settings.rearRailEnabled) {
        const rearY = outerY + dimensions.outerDepthMm;
        const rearLeftX = !hasCharacterBay && settings.leftRailEnabled ? outerX : hasCharacterBay ? mainAreaX : innerX;
        const rearRightX =
          !hasCharacterBay && settings.rightRailEnabled
            ? outerX + dimensions.outerWidthMm
            : hasCharacterBay
              ? mainAreaX + dimensions.mainInnerWidthMm
              : innerX + dimensions.innerWidthMm;
        finishLines.push({ key: 'finish-rear-rail', x1: rearLeftX, y1: rearY, x2: rearRightX, y2: rearY });
      }

      if (hasCharacterBay && baySideRailEnabled) {
        const bayOuterX = settings.characterBaySide === 'left' ? outerX : outerX + dimensions.outerWidthMm;
        finishLines.push({
          key: 'finish-bay-side-rail',
          x1: bayOuterX,
          y1: outerY,
          x2: bayOuterX,
          y2: outerY + characterFloorHeight,
        });

        if (hasCharacterReturnRail) {
          const mainSideOuterX =
            settings.characterBaySide === 'left'
              ? outerX + dimensions.characterSlotWidthMm
              : innerX + dimensions.mainInnerWidthMm + settings.railThicknessMm;
          finishLines.push(
            {
              key: 'finish-character-return-rail',
              x1: stepRailX,
              y1: stepRailY + settings.railThicknessMm,
              x2: stepRailX + stepRailWidth,
              y2: stepRailY + settings.railThicknessMm,
            },
            {
              key: 'finish-main-side-rail',
              x1: mainSideOuterX,
              y1: stepRailY,
              x2: mainSideOuterX,
              y2: stepRailY + mainSideRailHeight,
            },
          );
        }
      }
    } else if (isLanceFormation) {
      rankCounts.forEach((rankCount, rowIndex) => {
        const rowWidth = rankCount * dimensions.slotWidthMm;
        const rowY = (isAdapterLance ? outerY : innerY) + rowIndex * dimensions.slotDepthMm;

        if (isAdapterLance) {
          finishRects.push({
            key: `finish-adapter-lance-rank-${rowIndex}`,
            x: centerX - rowWidth / 2,
            y: rowY,
            width: rowWidth,
            height: dimensions.slotDepthMm,
          });
          return;
        }

        const nextWidth = rankCounts[rowIndex + 1] ? rankCounts[rowIndex + 1] * dimensions.slotWidthMm : rowWidth;
        const rowBackY =
          rowIndex === rankCounts.length - 1 && settings.rearRailEnabled ? outerY + dimensions.outerDepthMm : rowY + dimensions.slotDepthMm;
        const sideStartY = rowIndex === 0 && settings.frontRailEnabled ? outerY : rowY;
        const stepDepth = nextWidth > rowWidth ? settings.railThicknessMm : 0;
        const sideEndY = stepDepth > 0 ? rowY + dimensions.slotDepthMm - stepDepth : rowBackY;

        if (settings.leftRailEnabled) {
          const rowOuterX = centerX - rowWidth / 2 - settings.railThicknessMm;
          const nextOuterX = centerX - nextWidth / 2 - settings.railThicknessMm;
          finishLines.push({ key: `finish-left-rank-${rowIndex}`, x1: rowOuterX, y1: sideStartY, x2: rowOuterX, y2: sideEndY });
          if (stepDepth > 0) {
            finishLines.push(
              { key: `finish-left-step-${rowIndex}`, x1: rowOuterX, y1: sideEndY, x2: nextOuterX, y2: sideEndY },
              { key: `finish-left-step-side-${rowIndex}`, x1: nextOuterX, y1: sideEndY, x2: nextOuterX, y2: rowY + dimensions.slotDepthMm },
            );
          }
        }

        if (settings.rightRailEnabled) {
          const rowOuterX = centerX + rowWidth / 2 + settings.railThicknessMm;
          const nextOuterX = centerX + nextWidth / 2 + settings.railThicknessMm;
          finishLines.push({ key: `finish-right-rank-${rowIndex}`, x1: rowOuterX, y1: sideEndY, x2: rowOuterX, y2: sideStartY });
          if (stepDepth > 0) {
            finishLines.push(
              { key: `finish-right-step-${rowIndex}`, x1: nextOuterX, y1: sideEndY, x2: rowOuterX, y2: sideEndY },
              { key: `finish-right-step-side-${rowIndex}`, x1: nextOuterX, y1: rowY + dimensions.slotDepthMm, x2: nextOuterX, y2: sideEndY },
            );
          }
        }
      });

      if (isLanceWedge && settings.frontRailEnabled) {
        const frontWidth = dimensions.slotWidthMm + dimensions.leftRailMm + dimensions.rightRailMm;
        finishLines.push({
          key: 'finish-front-rail',
          x1: centerX + frontWidth / 2,
          y1: outerY,
          x2: centerX - frontWidth / 2,
          y2: outerY,
        });
      }

      if (isLanceWedge && settings.rearRailEnabled) {
        const rearWidth = dimensions.innerWidthMm + dimensions.leftRailMm + dimensions.rightRailMm;
        finishLines.push({
          key: 'finish-rear-rail',
          x1: centerX - rearWidth / 2,
          y1: outerY + dimensions.outerDepthMm,
          x2: centerX + rearWidth / 2,
          y2: outerY + dimensions.outerDepthMm,
        });
      }
    }
  }
  const footprints = [];
  if (!isSkirmish) for (let row = 0; row < rankCounts.length; row += 1) {
    const rankCount = rankCounts[row];
    const rowWidth = rankCount * dimensions.slotWidthMm;
    const rowX = isLanceFormation ? centerX - rowWidth / 2 : mainAreaX;
    const rowY = (isLanceFormation ? innerY : isAdapter ? outerY : mainAreaY) + row * dimensions.slotDepthMm;

    for (let column = 0; column < rankCount; column += 1) {
      footprints.push(
        <rect
          key={`${column}-${row}`}
          x={rowX + column * dimensions.slotWidthMm}
          y={rowY}
          width={dimensions.slotWidthMm}
          height={dimensions.slotDepthMm}
          className="footprint"
        />,
      );
    }
  }
  if (hasCharacterBay) {
    footprints.push(
      <rect
        key="character-bay"
        x={characterBayX}
        y={characterSlotY}
        width={dimensions.characterSlotWidthMm}
        height={dimensions.characterSlotDepthMm}
        className="footprint"
      />,
    );
  }

  return (
    <div className="preview-frame">
      <svg viewBox={`0 0 ${viewWidth} ${viewHeight}`} role="img" aria-label="Top-down movement tray preview">
        <defs>
          <marker id="dimension-arrow" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto-start-reverse">
            <path d="M 0 0 L 6 3 L 0 6 z" className="dimension-arrow" />
          </marker>
        </defs>

        {finishRects.map((rect) => (
          <rect
            key={rect.key}
            x={rect.x - finishExpansion}
            y={rect.y - finishExpansion}
            width={rect.width + finishExpansion * 2}
            height={rect.height + finishExpansion * 2}
            rx={finishCornerRadius}
            ry={finishCornerRadius}
            className="finish-footprint"
          />
        ))}
        {finishLines.map((line) => (
          <line
            key={line.key}
            x1={line.x1}
            y1={line.y1}
            x2={line.x2}
            y2={line.y2}
            className="finish-edge"
            strokeWidth={Math.max(1, finishExpansion * 2)}
          />
        ))}

        {isSkirmish && (
          <rect x={outerX} y={outerY} width={dimensions.outerWidthMm} height={dimensions.outerDepthMm} className="skirmish-floor" />
        )}

        {!isLanceFormation && !isSkirmish && !hasCharacterBay && !isAdapterCircle && (
          <rect x={outerX} y={outerY} width={dimensions.outerWidthMm} height={dimensions.outerDepthMm} className="floor" />
        )}
        {isAdapterCircle && (
          <rect x={outerX} y={outerY} width={dimensions.outerWidthMm} height={dimensions.outerDepthMm} className="floor" />
        )}
        {!isLanceWedge && hasCharacterBay && (
          <>
            <rect
              x={mainFloorX}
              y={innerY}
              width={dimensions.mainInnerWidthMm + dimensions.leftRailMm + dimensions.rightRailMm}
              height={dimensions.outerDepthMm}
              className="floor"
            />
            <rect
              x={characterFloorX}
              y={innerY}
              width={characterFloorWidth}
              height={characterFloorHeight}
              className="floor"
            />
          </>
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

        {isAdapter &&
          rankCounts.map((rankCount, rowIndex) => {
            const rowY = innerY + rowIndex * dimensions.slotDepthMm;

            return Array.from({ length: rankCount }, (_, columnIndex) => {
              const cellX = mainAreaX + columnIndex * dimensions.slotWidthMm;
              const cellCenterX = cellX + dimensions.slotWidthMm / 2;
              const cellCenterY = rowY + dimensions.slotDepthMm / 2;

              return (
                <g key={`adapter-cell-${columnIndex}-${rowIndex}`}>
                  <rect
                    x={cellX}
                    y={rowY}
                    width={dimensions.slotWidthMm}
                    height={dimensions.slotDepthMm}
                    className="inner-area"
                  />
                  <rect
                    x={cellCenterX - dimensions.adapterCutoutWidthMm / 2}
                    y={cellCenterY - dimensions.adapterCutoutDepthMm / 2}
                    width={dimensions.adapterCutoutWidthMm}
                    height={dimensions.adapterCutoutDepthMm}
                    className="adapter-cutout"
                  />
                </g>
              );
            });
          })}

        {isAdapterCircle &&
          circleAdapterCenters.map((placement, index) => {
            const x = innerCenterScreenX + placement.x;
            const y = innerCenterScreenY + placement.y;

            return (
              <circle
                key={`circle-adapter-cutout-${index}`}
                cx={x}
                cy={y}
                r={dimensions.adapterCutoutWidthMm / 2}
                className="adapter-cutout"
              />
            );
          })}

        {isAdapterLance &&
          rankCounts.map((rankCount, rowIndex) => {
            const rowWidth = rankCount * dimensions.slotWidthMm;
            return (
              <rect
                key={`adapter-lance-floor-${rowIndex}`}
                x={innerCenterScreenX - rowWidth / 2}
                y={innerY + rowIndex * dimensions.slotDepthMm}
                width={rowWidth}
                height={dimensions.slotDepthMm}
                className="floor"
              />
            );
          })}

        {isAdapterLance &&
          rankCounts.map((rankCount, rowIndex) => {
            const rowWidth = rankCount * dimensions.slotWidthMm;
            const rowX = innerCenterScreenX - rowWidth / 2;
            const rowY = innerY + rowIndex * dimensions.slotDepthMm;

            return Array.from({ length: rankCount }, (_, columnIndex) => {
              const cellX = rowX + columnIndex * dimensions.slotWidthMm;
              const cellCenterX = cellX + dimensions.slotWidthMm / 2;
              const cellCenterY = rowY + dimensions.slotDepthMm / 2;

              return (
                <g key={`adapter-lance-cell-${columnIndex}-${rowIndex}`}>
                  <rect
                    x={cellX}
                    y={rowY}
                    width={dimensions.slotWidthMm}
                    height={dimensions.slotDepthMm}
                    className="inner-area"
                  />
                  <rect
                    x={cellCenterX - dimensions.adapterCutoutWidthMm / 2}
                    y={cellCenterY - dimensions.adapterCutoutDepthMm / 2}
                    width={dimensions.adapterCutoutWidthMm}
                    height={dimensions.adapterCutoutDepthMm}
                    className="adapter-cutout"
                  />
                </g>
              );
            });
          })}

        {isAdapter && hasCharacterBay && (
          <g>
            <rect
              x={characterBayX}
              y={characterSlotY}
              width={dimensions.characterSlotWidthMm}
              height={dimensions.characterSlotDepthMm}
              className="inner-area"
            />
            <rect
              x={characterBayX + dimensions.characterSlotWidthMm / 2 - dimensions.adapterFlankCutoutWidthMm / 2}
              y={characterSlotY + dimensions.characterSlotDepthMm / 2 - dimensions.adapterFlankCutoutDepthMm / 2}
              width={dimensions.adapterFlankCutoutWidthMm}
              height={dimensions.adapterFlankCutoutDepthMm}
              className="adapter-cutout"
            />
          </g>
        )}

        {settings.frontRailEnabled && !isLanceFormation && !isAdapterTray && !isSkirmish && (
          <rect x={innerX} y={outerY} width={dimensions.innerWidthMm} height={settings.railThicknessMm} className="rail" />
        )}
        {settings.rearRailEnabled && !isLanceFormation && !isAdapterTray && !isSkirmish && !hasCharacterBay && (
          <rect
            x={innerX}
            y={outerY + dimensions.outerDepthMm - settings.railThicknessMm}
            width={dimensions.innerWidthMm}
            height={settings.railThicknessMm}
            className="rail"
          />
        )}
        {settings.rearRailEnabled && !isLanceFormation && !isAdapterTray && !isSkirmish && hasCharacterBay && (
          <rect
            x={mainAreaX}
            y={outerY + dimensions.outerDepthMm - settings.railThicknessMm}
            width={dimensions.mainInnerWidthMm}
            height={settings.railThicknessMm}
            className="rail"
          />
        )}
        {settings.leftRailEnabled && !isLanceFormation && !isAdapterTray && !isSkirmish && !hasCharacterBay && (
          <rect x={outerX} y={outerY} width={settings.railThicknessMm} height={dimensions.outerDepthMm} className="rail" />
        )}
        {settings.rightRailEnabled && !isLanceFormation && !isAdapterTray && !isSkirmish && !hasCharacterBay && (
          <rect
            x={outerX + dimensions.outerWidthMm - settings.railThicknessMm}
            y={outerY}
            width={settings.railThicknessMm}
            height={dimensions.outerDepthMm}
            className="rail"
          />
        )}
        {hasCharacterBay && settings.leftRailEnabled && settings.characterBaySide === 'right' && (
          <rect x={outerX} y={outerY} width={settings.railThicknessMm} height={dimensions.outerDepthMm} className="rail" />
        )}
        {hasCharacterBay && settings.rightRailEnabled && settings.characterBaySide === 'left' && (
          <rect
            x={outerX + dimensions.outerWidthMm - settings.railThicknessMm}
            y={outerY}
            width={settings.railThicknessMm}
            height={dimensions.outerDepthMm}
            className="rail"
          />
        )}
        {baySideRailEnabled && (
          <>
            <rect
              x={baySideRailX}
              y={outerY}
              width={baySideRailMm}
              height={characterFloorHeight}
              className="rail"
            />
            {hasCharacterReturnRail && (
              <>
                <rect
                  x={stepRailX}
                  y={stepRailY}
                  width={stepRailWidth}
                  height={settings.railThicknessMm}
                  className="rail"
                />
                <rect
                  x={mainSideRailX}
                  y={stepRailY}
                  width={settings.railThicknessMm}
                  height={mainSideRailHeight}
                  className="rail"
                />
              </>
            )}
          </>
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

        {!isLanceFormation && !isAdapterTray && !isSkirmish && (
          <rect x={mainAreaX} y={mainAreaY} width={dimensions.mainInnerWidthMm} height={dimensions.mainInnerDepthMm} className="inner-area" />
        )}
        {hasCharacterBay && (
          <rect
            x={characterBayX}
            y={characterSlotY}
            width={dimensions.characterSlotWidthMm}
            height={dimensions.characterSlotDepthMm}
            className="inner-area"
          />
        )}
        {isSkirmish &&
          skirmishPlacements.map((placement) => {
            const x = innerCenterScreenX + placement.x;
            const y = innerCenterScreenY + placement.y;
            const size = settings.skirmishBaseSizeMm + settings.toleranceMm;

            if (settings.skirmishBaseShape === 'circle') {
              return <circle key={`${placement.columnIndex}-${placement.rowIndex}`} cx={x} cy={y} r={size / 2} className="footprint" />;
            }

            return (
              <rect
                key={`${placement.columnIndex}-${placement.rowIndex}`}
                x={x - size / 2}
                y={y - size / 2}
                width={size}
                height={size}
                className="footprint"
                transform={`rotate(${placement.rotationDeg} ${x} ${y})`}
              />
            );
          })}
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
        {!isAdapterTray && footprints}

        {settings.magnetCutoutsEnabled &&
          magnetCenters.map((center, index) => (
            <circle
              key={`magnet-${index}`}
              cx={innerCenterScreenX + center.x}
              cy={innerCenterScreenY + center.y}
              r={settings.magnetDiameterMm / 2}
              className="magnet-cutout"
            />
          ))}

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
