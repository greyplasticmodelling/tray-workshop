import type { BuildPlateFit, TrayDimensions, TraySettings } from '../types';
import { buildPlates, formatMm } from '../geometry/trayMath';

type Props = {
  dimensions: TrayDimensions;
  settings: TraySettings;
  buildPlateFit: BuildPlateFit;
  onSettingsChange: (settings: TraySettings) => void;
};

export function DimensionsPanel({ dimensions, settings, buildPlateFit, onSettingsChange }: Props) {
  const items = [
    ['Inner width (mm)', formatMm(dimensions.innerWidthMm)],
    ['Inner depth (mm)', formatMm(dimensions.innerDepthMm)],
    ['Outer width (mm)', formatMm(dimensions.outerWidthMm)],
    ['Outer depth (mm)', formatMm(dimensions.outerDepthMm)],
    ['Floor thickness (mm)', formatMm(settings.floorThicknessMm)],
    ...(settings.template === 'adapter' || settings.template === 'adapterLance'
      ? [
          ['Adapter block height (mm)', formatMm(settings.adapterBaseHeightMm)],
          ['Adapter cutout width (mm)', formatMm(dimensions.adapterCutoutWidthMm)],
          ['Adapter cutout depth (mm)', formatMm(dimensions.adapterCutoutDepthMm)],
          ...(settings.characterBayEnabled
            ? [
                ['Flank cutout width (mm)', formatMm(dimensions.adapterFlankCutoutWidthMm)],
                ['Flank cutout depth (mm)', formatMm(dimensions.adapterFlankCutoutDepthMm)],
              ]
            : []),
        ]
      : settings.template === 'skirmish'
        ? [
            ['Skirmish base size (mm)', formatMm(settings.skirmishBaseSizeMm)],
            ['Max offset (mm)', formatMm(settings.skirmishMaxOffsetMm)],
            ['Max rotation (degrees)', `${settings.skirmishMaxRotationDeg.toFixed(1)} degrees`],
          ]
      : [
          ['Rail height (mm)', formatMm(settings.railHeightMm)],
          ['Rail thickness (mm)', formatMm(settings.railThicknessMm)],
        ]),
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
      <div className="plate-summary">
        <label className="field plate-select" title="Choose the printer build plate size used for the fit check.">
          <span>Build plate size (mm)</span>
          <select
            value={settings.buildPlateSize}
            title="Choose the printer build plate size used for the fit check."
            onChange={(event) =>
              onSettingsChange({ ...settings, buildPlateSize: event.target.value as TraySettings['buildPlateSize'] })
            }
          >
            {buildPlates.map((plate) => (
              <option value={plate.value} key={plate.value}>
                {plate.widthMm} x {plate.depthMm}
              </option>
            ))}
          </select>
        </label>

        <section className="plate-fit" data-fit={fitsOnPlate ? 'yes' : 'no'} aria-label="Build plate fit">
          <span>Build plate check</span>
          <strong>{fitText}</strong>
          <p>{fitDetail}</p>
        </section>
      </div>

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
