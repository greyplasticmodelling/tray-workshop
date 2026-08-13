import type { TrayDimensions, TraySettings } from '../types';
import {
  getCircleAdapterCenters,
  getMagnetCutoutCenters,
  getOvalAdapterCenters,
  getRankInsertSlot,
  getRankCounts,
  getSkirmishPlacements,
} from '../geometry/trayMath';

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
  const depthLabel = `${dimensions.outerDepthMm.toFixed(1)} mm exterior length`;
  const innerCenterScreenX = innerX + dimensions.innerWidthMm / 2;
  const innerCenterScreenY = innerY + dimensions.innerDepthMm / 2;

  const rankCounts = getRankCounts(settings);
  const isLanceWedge = settings.template === 'lanceWedge';
  const isAdapter = settings.template === 'adapter';
  const isAdapterCircle = settings.template === 'adapterCircle';
  const isAdapterOval = settings.template === 'adapterOval';
  const isAdapterLance = settings.template === 'adapterLance';
  const isAdapterTray = isAdapter || isAdapterCircle || isAdapterOval || isAdapterLance;
  const isLanceFormation = isLanceWedge || isAdapterLance;
  const isSkirmish = settings.template === 'skirmish';
  const hasCharacterBay =
    settings.characterBayEnabled && (settings.template === 'standard' || settings.template === 'adapter');
  const hasLeftCharacterBay = hasCharacterBay && (settings.characterBaySide === 'left' || settings.characterBaySide === 'both');
  const hasRightCharacterBay = hasCharacterBay && (settings.characterBaySide === 'right' || settings.characterBaySide === 'both');
  const characterBayY = innerY;
  const characterSlotY = characterBayY;
  const mainAreaX = innerX + (hasLeftCharacterBay ? dimensions.characterLeftSlotWidthMm : 0);
  const mainAreaY = innerY;
  const mainFloorX = hasLeftCharacterBay ? innerX + dimensions.characterLeftSlotWidthMm : innerX;
  const leftCharacterBayX = innerX;
  const rightCharacterBayX = innerX + dimensions.characterLeftSlotWidthMm + dimensions.mainInnerWidthMm;
  const characterBays = [
    ...(hasLeftCharacterBay
      ? [
          {
            side: 'left' as const,
            slotX: leftCharacterBayX,
            slotWidth: dimensions.characterLeftSlotWidthMm,
            slotDepth: dimensions.characterLeftSlotDepthMm,
            cellDepth:
              isAdapter && settings.characterBaySide === 'both' ? settings.characterLeftBaseDepthMm : settings.characterBaseDepthMm,
            slotCount: isAdapter && settings.characterBaySide === 'both' ? settings.characterLeftBaseCount : settings.characterBaseCount,
            railEnabled: settings.leftRailEnabled,
            railMm: dimensions.leftRailMm,
            floorX: outerX,
            sideRailX: outerX,
            stepRailX: outerX,
            mainSideRailX: outerX + dimensions.characterLeftSlotWidthMm,
          },
        ]
      : []),
    ...(hasRightCharacterBay
      ? [
          {
            side: 'right' as const,
            slotX: rightCharacterBayX,
            slotWidth: dimensions.characterRightSlotWidthMm,
            slotDepth: dimensions.characterRightSlotDepthMm,
            cellDepth:
              isAdapter && settings.characterBaySide === 'both' ? settings.characterRightBaseDepthMm : settings.characterBaseDepthMm,
            slotCount: isAdapter && settings.characterBaySide === 'both' ? settings.characterRightBaseCount : settings.characterBaseCount,
            railEnabled: settings.rightRailEnabled,
            railMm: dimensions.rightRailMm,
            floorX: innerX + dimensions.characterLeftSlotWidthMm + dimensions.mainInnerWidthMm,
            sideRailX: outerX + dimensions.outerWidthMm - dimensions.rightRailMm,
            stepRailX: innerX + dimensions.characterLeftSlotWidthMm + dimensions.mainInnerWidthMm,
            mainSideRailX: innerX + dimensions.characterLeftSlotWidthMm + dimensions.mainInnerWidthMm,
          },
        ]
      : []),
  ].map((bay) => {
    const hasReturnRail = bay.railEnabled && bay.railMm > 0 && bay.slotDepth < dimensions.mainInnerDepthMm;
    const floorWidth = bay.slotWidth + bay.railMm;
    const floorHeight = dimensions.frontRailMm + bay.slotDepth + (hasReturnRail ? settings.railThicknessMm : 0);
    const stepRailWidth = bay.slotWidth + bay.railMm;
    const stepRailY = innerY + bay.slotDepth;
    const mainSideRailHeight = dimensions.outerDepthMm - dimensions.frontRailMm - bay.slotDepth;

    return {
      ...bay,
      hasReturnRail,
      floorWidth,
      floorHeight,
      stepRailWidth,
      stepRailY,
      mainSideRailHeight,
    };
  });
  const magnetCenters = getMagnetCutoutCenters(settings, dimensions);
  const skirmishPlacements = isSkirmish ? getSkirmishPlacements(settings, dimensions) : [];
  const circleAdapterCenters = isAdapterCircle ? getCircleAdapterCenters(settings, dimensions) : [];
  const ovalAdapterCenters = isAdapterOval ? getOvalAdapterCenters(settings, dimensions) : [];
  const rankInsert = getRankInsertSlot(settings, dimensions);
  const isInsideRankInsertGrid = (columnIndex: number, rowIndex: number) =>
    Boolean(
      rankInsert &&
        columnIndex >= rankInsert.columnIndex &&
        columnIndex < rankInsert.columnIndex + rankInsert.columnSpan &&
        rowIndex >= rankInsert.rowIndex &&
        rowIndex < rankInsert.rowIndex + rankInsert.rowSpan,
    );
  const isInsideRankInsert = (x: number, y: number) =>
    Boolean(rankInsert && x >= rankInsert.left && x <= rankInsert.right && y >= rankInsert.front && y <= rankInsert.back);
  const finishExpansion = settings.trayEdgeSlopeMm;
  const finishCornerRadius = settings.template === 'skirmish' && settings.trayRoundedCornersEnabled ? settings.trayCornerRadiusMm : 0;
  const finishRects: Array<{ key: string; x: number; y: number; width: number; height: number }> = [];
  const finishLines: Array<{ key: string; x1: number; y1: number; x2: number; y2: number }> = [];

  if (finishExpansion > 0) {
    if (isSkirmish || isAdapter || isAdapterCircle || isAdapterOval) {
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
          ...characterBays.map((bay) => ({
            key: `finish-adapter-flank-${bay.side}`,
            x: bay.slotX,
            y: outerY,
            width: bay.slotWidth,
            height: bay.slotDepth,
          })),
        );
      }
    } else if (!isLanceFormation) {
      if (settings.leftRailEnabled && !hasLeftCharacterBay) {
        finishLines.push({ key: 'finish-left-rail', x1: outerX, y1: outerY, x2: outerX, y2: outerY + dimensions.outerDepthMm });
      }

      if (settings.rightRailEnabled && !hasRightCharacterBay) {
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

      characterBays.filter((bay) => bay.railEnabled).forEach((bay) => {
        const bayOuterX = bay.side === 'left' ? outerX : outerX + dimensions.outerWidthMm;
        finishLines.push({
          key: `finish-bay-side-rail-${bay.side}`,
          x1: bayOuterX,
          y1: outerY,
          x2: bayOuterX,
          y2: outerY + bay.floorHeight,
        });

        if (bay.hasReturnRail) {
          const mainSideOuterX = bay.side === 'left' ? outerX + bay.slotWidth : bay.mainSideRailX + settings.railThicknessMm;
          finishLines.push(
            {
              key: `finish-character-return-rail-${bay.side}`,
              x1: bay.stepRailX,
              y1: bay.stepRailY + settings.railThicknessMm,
              x2: bay.stepRailX + bay.stepRailWidth,
              y2: bay.stepRailY + settings.railThicknessMm,
            },
            {
              key: `finish-main-side-rail-${bay.side}`,
              x1: mainSideOuterX,
              y1: bay.stepRailY,
              x2: mainSideOuterX,
              y2: bay.stepRailY + bay.mainSideRailHeight,
            },
          );
        }
      });
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
  characterBays.forEach((bay) => {
    footprints.push(
      <rect
        key={`character-bay-${bay.side}`}
        x={bay.slotX}
        y={characterSlotY}
        width={bay.slotWidth}
        height={bay.slotDepth}
        className="footprint"
      />,
    );
  });

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

        {!isLanceFormation && !isSkirmish && !hasCharacterBay && !isAdapterCircle && !isAdapterOval && (
          <rect x={outerX} y={outerY} width={dimensions.outerWidthMm} height={dimensions.outerDepthMm} className="floor" />
        )}
        {(isAdapterCircle || isAdapterOval) && (
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
            {characterBays.map((bay) => (
              <rect
                key={`character-floor-${bay.side}`}
                x={bay.floorX}
                y={innerY}
                width={bay.floorWidth}
                height={bay.floorHeight}
                className="floor"
              />
            ))}
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
              if (isInsideRankInsertGrid(columnIndex, rowIndex)) {
                return null;
              }

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
          circleAdapterCenters
            .filter((placement) => !isInsideRankInsert(placement.x, placement.y))
            .map((placement, index) => {
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

        {isAdapterOval &&
          ovalAdapterCenters.map((placement, index) => {
            const x = innerCenterScreenX + placement.x;
            const y = innerCenterScreenY + placement.y;

            return (
              <ellipse
                key={`oval-adapter-cutout-${index}`}
                cx={x}
                cy={y}
                rx={dimensions.adapterCutoutWidthMm / 2}
                ry={dimensions.adapterCutoutDepthMm / 2}
                className="adapter-cutout"
              />
            );
          })}

        {rankInsert &&
          (isAdapter || isAdapterCircle || isSkirmish) &&
          (rankInsert.shape === 'circle' ? (
            <circle
              cx={innerCenterScreenX + rankInsert.x}
              cy={innerCenterScreenY + rankInsert.y}
              r={rankInsert.width / 2}
              className="adapter-cutout"
            />
          ) : (
            <rect
              x={innerCenterScreenX + rankInsert.x - rankInsert.width / 2}
              y={innerCenterScreenY + rankInsert.y - rankInsert.depth / 2}
              width={rankInsert.width}
              height={rankInsert.depth}
              className="adapter-cutout"
            />
          ))}

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

        {isAdapter &&
          characterBays.map((bay) => (
            <g key={`adapter-flank-${bay.side}`}>
              <rect
                x={bay.slotX}
                y={characterSlotY}
                width={bay.slotWidth}
                height={bay.slotDepth}
                className="inner-area"
              />
              {Array.from({ length: Math.max(1, Math.floor(bay.slotCount)) }, (_, slotIndex) => {
                const cellCenterY = characterSlotY + slotIndex * bay.cellDepth + bay.cellDepth / 2;

                return (
                  <rect
                    key={`adapter-flank-cutout-${bay.side}-${slotIndex}`}
                    x={bay.slotX + bay.slotWidth / 2 - dimensions.adapterFlankCutoutWidthMm / 2}
                    y={cellCenterY - dimensions.adapterFlankCutoutDepthMm / 2}
                    width={dimensions.adapterFlankCutoutWidthMm}
                    height={dimensions.adapterFlankCutoutDepthMm}
                    className="adapter-cutout"
                  />
                );
              })}
            </g>
          ))}

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
        {settings.leftRailEnabled && !isLanceFormation && !isAdapterTray && !isSkirmish && !hasLeftCharacterBay && hasCharacterBay && (
          <rect x={outerX} y={outerY} width={settings.railThicknessMm} height={dimensions.outerDepthMm} className="rail" />
        )}
        {settings.rightRailEnabled && !isLanceFormation && !isAdapterTray && !isSkirmish && !hasRightCharacterBay && hasCharacterBay && (
          <rect
            x={outerX + dimensions.outerWidthMm - settings.railThicknessMm}
            y={outerY}
            width={settings.railThicknessMm}
            height={dimensions.outerDepthMm}
            className="rail"
          />
        )}
        {characterBays
          .filter((bay) => bay.railEnabled)
          .map((bay) => (
          <g key={`bay-rails-${bay.side}`}>
            <rect
              x={bay.sideRailX}
              y={outerY}
              width={bay.railMm}
              height={bay.floorHeight}
              className="rail"
            />
            {bay.hasReturnRail && (
              <>
                <rect
                  x={bay.stepRailX}
                  y={bay.stepRailY}
                  width={bay.stepRailWidth}
                  height={settings.railThicknessMm}
                  className="rail"
                />
                <rect
                  x={bay.mainSideRailX}
                  y={bay.stepRailY}
                  width={settings.railThicknessMm}
                  height={bay.mainSideRailHeight}
                  className="rail"
                />
              </>
            )}
          </g>
          ))}

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
        {characterBays.map((bay) => (
          <rect
            key={`character-inner-${bay.side}`}
            x={bay.slotX}
            y={characterSlotY}
            width={bay.slotWidth}
            height={bay.slotDepth}
            className="inner-area"
          />
        ))}
        {isSkirmish &&
          skirmishPlacements.filter((placement) => !isInsideRankInsert(placement.x, placement.y)).map((placement) => {
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
        {rankInsert && (isAdapter || isAdapterCircle || isSkirmish) && settings.rankInsertEnabled && (
          <g className="coordinate-labels" style={{ fontSize: Math.max(3, fontSize * 0.8) }}>
            {Array.from({ length: settings.rows }, (_, rowIndex) =>
              Array.from({ length: settings.columns }, (_, columnIndex) => {
                const cellX = innerCenterScreenX - dimensions.mainInnerWidthMm / 2 + columnIndex * dimensions.slotWidthMm;
                const cellY = innerCenterScreenY - dimensions.mainInnerDepthMm / 2 + rowIndex * dimensions.slotDepthMm;

                return (
                  <text
                    key={`coord-${columnIndex}-${rowIndex}`}
                    x={cellX + dimensions.slotWidthMm / 2}
                    y={cellY + Math.min(5, dimensions.slotDepthMm * 0.22)}
                    textAnchor="middle"
                    className="dimension-label"
                  >
                    F{columnIndex + 1}/R{rowIndex + 1}
                  </text>
                );
              }),
            )}
          </g>
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
