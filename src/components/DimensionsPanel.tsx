import type { TrayDimensions, TraySettings } from '../types';
import { formatMm } from '../geometry/trayMath';

type Props = {
  dimensions: TrayDimensions;
  settings: TraySettings;
};

export function DimensionsPanel({ dimensions, settings }: Props) {
  const items = [
    ['Inner width', formatMm(dimensions.innerWidthMm)],
    ['Inner depth', formatMm(dimensions.innerDepthMm)],
    ['Outer width', formatMm(dimensions.outerWidthMm)],
    ['Outer depth', formatMm(dimensions.outerDepthMm)],
    ['Floor thickness', formatMm(settings.floorThicknessMm)],
    ['Rail height', formatMm(settings.railHeightMm)],
    ['Rail thickness', formatMm(settings.railThicknessMm)],
  ];

  return (
    <section className="dimensions" aria-label="Calculated dimensions">
      {items.map(([label, value]) => (
        <div className="dimension-row" key={label}>
          <span>{label}</span>
          <strong>{value}</strong>
        </div>
      ))}
    </section>
  );
}
