import type { BuildPlateFit, TrayDimensions, TraySettings } from '../types';
import {
  buildPlates,
  formatMm,
  getAdapterOvalBaseSize,
  getRankInsertSlot,
  adapterOvalGwBaseLengthAllowanceMm,
  adapterOvalGwBaseWidthAllowanceMm,
} from '../geometry/trayMath';

type Props = {
  dimensions: TrayDimensions;
  settings: TraySettings;
  buildPlateFit: BuildPlateFit;
  onSettingsChange: (settings: TraySettings) => void;
};

export function DimensionsPanel({ dimensions, settings, buildPlateFit, onSettingsChange }: Props) {
  const rankInsert = getRankInsertSlot(settings, dimensions);
  const items = [
    ['Inner width (mm)', formatMm(dimensions.innerWidthMm)],
    ['Inner depth (mm)', formatMm(dimensions.innerDepthMm)],
    ['Outer width (mm)', formatMm(dimensions.outerWidthMm)],
    ['Outer depth (mm)', formatMm(dimensions.outerDepthMm)],
    ['Floor thickness (mm)', formatMm(settings.floorThicknessMm)],
    ...(settings.magnetCutoutsEnabled
      ? [['Magnet cutout side', settings.magnetCutoutsFromBottom ? 'Underside' : 'Top side']]
      : []),
    ...(settings.rankInsertEnabled
      ? [
          ['Rank insert origin', `C${settings.rankInsertColumn} / R${settings.rankInsertRow}`],
          ['Rank insert span', `${settings.rankInsertColumnSpan} columns x ${settings.rankInsertRowSpan} ranks`],
          ...(settings.template === 'adapter' && settings.rankInsertCustomSizeEnabled
            ? [['Rank insert sizing', 'Custom']]
            : []),
          ...(rankInsert ? [['Rank insert size (mm)', `${formatMm(rankInsert.width)} x ${formatMm(rankInsert.depth)}`]] : []),
          [
            'Rank insert alignment',
            settings.rankInsertAlignment === 'rear' ? 'Rear' : settings.rankInsertAlignment === 'center' ? 'Center' : 'Front',
          ],
        ]
      : []),
    ...(settings.template === 'adapter' || settings.template === 'adapterCircle' || settings.template === 'adapterOval' || settings.template === 'adapterLance'
      ? [
          ['Adapter block height (mm)', formatMm(settings.adapterBaseHeightMm)],
          ...(settings.template === 'adapterCircle'
            ? [
                ['Circle cutout diameter (mm)', formatMm(dimensions.adapterCutoutWidthMm)],
                ['Gap between circles (mm)', formatMm(settings.adapterCircleGapMm)],
              ]
            : settings.template === 'adapterOval'
            ? [
                ['Oval base preset', getAdapterOvalBaseSize(settings.adapterOvalSize).label],
                ['GW oval width allowance (mm)', formatMm(adapterOvalGwBaseWidthAllowanceMm)],
                ['GW oval length allowance (mm)', formatMm(adapterOvalGwBaseLengthAllowanceMm)],
                ['Oval cutout width (mm)', formatMm(dimensions.adapterCutoutWidthMm)],
                ['Oval cutout depth (mm)', formatMm(dimensions.adapterCutoutDepthMm)],
                ['Gap between ovals (mm)', formatMm(settings.adapterOvalGapMm)],
              ]
            : [
                ['Adapter cutout width (mm)', formatMm(dimensions.adapterCutoutWidthMm)],
                ['Adapter cutout depth (mm)', formatMm(dimensions.adapterCutoutDepthMm)],
              ]),
          ['Adapter floor', settings.adapterRemoveFloorEnabled ? 'Removed' : 'Solid'],
          ...(settings.adapterRemoveFloorEnabled && settings.adapterFloorCutoutEnabled
            ? [['Magnetic sheet border (mm)', formatMm(settings.adapterFloorCutoutBufferMm)]]
            : []),
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
            ['Overall tray height (mm)', formatMm(settings.skirmishTrayHeightMm)],
            ['Skirmish floor', settings.adapterRemoveFloorEnabled ? 'Removed' : 'Solid'],
            ...(settings.adapterRemoveFloorEnabled && settings.adapterFloorCutoutEnabled
              ? [['Magnetic sheet border (mm)', formatMm(settings.adapterFloorCutoutBufferMm)]]
              : []),
            ['Minimum cutout gap (mm)', formatMm(4)],
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
