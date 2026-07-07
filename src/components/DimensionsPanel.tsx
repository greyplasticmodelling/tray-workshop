import type { BuildPlateFit, TrayDimensions, TraySettings } from '../types';
import { formatMm } from '../geometry/trayMath';

type Props = {
  dimensions: TrayDimensions;
  settings: TraySettings;
  buildPlateFit: BuildPlateFit;
};

export function DimensionsPanel({ dimensions, settings, buildPlateFit }: Props) {
  const items = [
    ['Inner width (mm)', formatMm(dimensions.innerWidthMm)],
    ['Inner depth (mm)', formatMm(dimensions.innerDepthMm)],
    ['Outer width (mm)', formatMm(dimensions.outerWidthMm)],
    ['Outer depth (mm)', formatMm(dimensions.outerDepthMm)],
    ['Floor thickness (mm)', formatMm(settings.floorThicknessMm)],
    ['Rail height (mm)', formatMm(settings.railHeightMm)],
    ['Rail thickness (mm)', formatMm(settings.railThicknessMm)],
  ];
  const fitsOnPlate = buildPlateFit.fits || buildPlateFit.fitsRotated;
  const fitText = buildPlateFit.fits
    ? 'Fits selected plate'
    : buildPlateFit.fitsRotated
      ? 'Fits if rotated'
      : 'Likely needs splitting';
  const fitDetail = fitsOnPlate
    ? `${buildPlateFit.plate.widthMm} x ${buildPlateFit.plate.depthMm} mm build plate`
    : `Over by ${formatMm(buildPlateFit.overWidthMm)} wide and ${formatMm(buildPlateFit.overDepthMm)} deep`;

  return (
    <div className="output-summary">
      <section className="plate-fit" data-fit={fitsOnPlate ? 'yes' : 'no'} aria-label="Build plate fit">
        <span>Build plate check</span>
        <strong>{fitText}</strong>
        <p>{fitDetail}</p>
      </section>

      <section className="dimensions" aria-label="Calculated dimensions">
        {items.map(([label, value]) => (
          <div className="dimension-row" key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </section>
    </div>
  );
}
