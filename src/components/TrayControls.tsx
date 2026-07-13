import type { ThemeName, TraySettings } from '../types';
import {
  adapterOvalBaseSizes,
  adapterOvalGwBaseLengthAllowanceMm,
  adapterOvalGwBaseWidthAllowanceMm,
  trayTemplates,
} from '../geometry/trayMath';

type Props = {
  settings: TraySettings;
  theme: ThemeName;
  onChange: (settings: TraySettings) => void;
  onTemplateChange: (template: TraySettings['template']) => void;
  onThemeChange: (theme: ThemeName) => void;
  onResetTemplate: () => void;
  validationMessages: string[];
};

const numberFields: Array<{
  key: keyof Omit<TraySettings, 'buildPlateSize' | 'template'>;
  label: string;
  step: number;
  tooltip: string;
  max?: number;
}> = [
  { key: 'baseWidthMm', label: 'Base width (mm)', step: 1, tooltip: 'Width of each model base from left to right.' },
  { key: 'baseDepthMm', label: 'Base depth (mm)', step: 1, tooltip: 'Depth of each model base from front to back.' },
  { key: 'columns', label: 'Columns', step: 1, max: 20, tooltip: 'Number of bases across the tray frontage. Maximum 20.' },
  { key: 'rows', label: 'Rows', step: 1, tooltip: 'Number of ranks from front to back.' },
  { key: 'toleranceMm', label: 'Tolerance (mm)', step: 0.1, tooltip: 'Extra clearance added to each base slot.' },
  { key: 'floorThicknessMm', label: 'Floor thickness (mm)', step: 0.1, tooltip: 'Thickness of the flat bottom plate.' },
  { key: 'railThicknessMm', label: 'Rail thickness (mm)', step: 0.1, tooltip: 'Horizontal thickness of enabled edge rails.' },
  { key: 'railHeightMm', label: 'Rail height (mm)', step: 0.1, tooltip: 'Height of rails above the floor.' },
];

const railToggles: Array<{ key: keyof TraySettings; label: string; tooltip: string }> = [
  { key: 'frontRailEnabled', label: 'Front rail', tooltip: 'Add or remove the front edge rail.' },
  { key: 'rearRailEnabled', label: 'Rear rail', tooltip: 'Add or remove the rear edge rail.' },
  { key: 'leftRailEnabled', label: 'Left rail', tooltip: 'Add or remove the left side rail.' },
  { key: 'rightRailEnabled', label: 'Right rail', tooltip: 'Add or remove the right side rail.' },
];

const themes: Array<{ value: ThemeName; label: string }> = [
  { value: 'darkGrey', label: 'Dark Grey' },
  { value: 'workshop', label: 'Workshop' },
  { value: 'forest', label: 'Forest' },
  { value: 'slate', label: 'Slate' },
  { value: 'parchment', label: 'Parchment' },
];

const adapterBorderFields: Array<{ key: keyof TraySettings; label: string; tooltip: string }> = [
  { key: 'adapterBorderFrontMm', label: 'Front border adjustment (mm)', tooltip: 'Extra adjustment for the front tray edge.' },
  { key: 'adapterBorderRearMm', label: 'Rear border adjustment (mm)', tooltip: 'Extra adjustment for the rear tray edge.' },
  { key: 'adapterBorderLeftMm', label: 'Left border adjustment (mm)', tooltip: 'Extra adjustment for the left tray edge.' },
  { key: 'adapterBorderRightMm', label: 'Right border adjustment (mm)', tooltip: 'Extra adjustment for the right tray edge.' },
];

export function TrayControls({
  settings,
  theme,
  onChange,
  onTemplateChange,
  onThemeChange,
  onResetTemplate,
  validationMessages,
}: Props) {
  const updateNumber = (key: keyof TraySettings, value: string) => {
    const nextValue = value === '' ? 0 : Number(value);
    onChange({ ...settings, [key]: nextValue });
  };

  const updateToggle = (key: keyof TraySettings, checked: boolean) => {
    const usesCircularRankInsert =
      settings.template === 'adapterCircle' || (settings.template === 'skirmish' && settings.skirmishBaseShape === 'circle');
    const customRankInsertDefaults =
      key === 'rankInsertCustomSizeEnabled' && checked && settings.template === 'adapter'
        ? {
            rankInsertCustomWidthMm: Math.min(
              settings.rankInsertCustomWidthMm,
              Math.max(1, settings.rankInsertColumnSpan * settings.baseWidthMm),
            ),
            rankInsertCustomDepthMm: Math.min(
              settings.rankInsertCustomDepthMm,
              Math.max(1, settings.rankInsertRowSpan * settings.baseDepthMm),
            ),
          }
        : {};
    const circularRankInsertDefaults =
      key === 'rankInsertEnabled' && checked && usesCircularRankInsert
        ? {
            rankInsertColumnSpan: Math.min(settings.columns, Math.max(2, settings.rankInsertColumnSpan)),
            rankInsertRowSpan: Math.min(settings.rows, Math.max(2, settings.rankInsertRowSpan)),
            rankInsertCircleDiameterMm:
              settings.template === 'adapterCircle'
                ? settings.adapterCircleDiameterMm * 2
                : settings.skirmishBaseSizeMm * 2,
          }
        : {};

    onChange({
      ...settings,
      [key]: checked,
      ...(key === 'adapterRemoveFloorEnabled' && checked ? { magnetCutoutsEnabled: false } : {}),
      ...customRankInsertDefaults,
      ...circularRankInsertDefaults,
    });
  };
  const isAdapter = settings.template === 'adapter';
  const isAdapterCircle = settings.template === 'adapterCircle';
  const isAdapterOval = settings.template === 'adapterOval';
  const isAdapterTray =
    settings.template === 'adapter' ||
    settings.template === 'adapterCircle' ||
    settings.template === 'adapterOval' ||
    settings.template === 'adapterLance';
  const isRectAdapterTray = settings.template === 'adapter' || settings.template === 'adapterLance';
  const isLanceFormation = settings.template === 'lanceWedge' || settings.template === 'adapterLance';
  const isSkirmish = settings.template === 'skirmish';
  const supportsRankInsert = (isAdapter && !settings.characterBayEnabled) || isAdapterCircle || isSkirmish;
  const rankInsertUnavailable = !supportsRankInsert || settings.rows <= 1;
  const usesCircularRankInsert = isAdapterCircle || (isSkirmish && settings.skirmishBaseShape === 'circle');
  const supportsOpenFloor = isAdapterTray || isSkirmish;
  const magnetCutoutsDisabledByRemovedFloor = supportsOpenFloor && settings.adapterRemoveFloorEnabled;
  const magnetCutoutsDisabled = magnetCutoutsDisabledByRemovedFloor;
  const magneticSheetBorderTooltip =
    'This feature adds a border round the perimeter of the underside of the tray to fit your magnetic sheet into. Rounded corners are applied when advanced rounded corners are enabled.';
  const selectedTemplate = trayTemplates.find((template) => template.value === settings.template);

  return (
    <aside className="controls" aria-label="Tray settings">
      <div>
        <p className="eyebrow">Tray Workshop</p>
        <h1>Build a wargaming movement tray</h1>
        <p className="intro">Set the base size, formation, clearances, and tray style, then download a browser-generated STL.</p>
      </div>

      <label className="field">
        <span>Colour theme</span>
        <select
          value={theme}
          title="Change the page colour palette."
          onChange={(event) => onThemeChange(event.target.value as ThemeName)}
        >
          {themes.map((themeOption) => (
            <option value={themeOption.value} key={themeOption.value}>
              {themeOption.label}
            </option>
          ))}
        </select>
      </label>

      <label className="field">
        <span>Tray template</span>
        <select
          value={settings.template}
          title="Choose the movement tray layout to generate."
          onChange={(event) => onTemplateChange(event.target.value as TraySettings['template'])}
        >
          {trayTemplates.map((template) => (
            <option value={template.value} key={template.value}>
              {template.label}
            </option>
          ))}
        </select>
      </label>
      {selectedTemplate && <p className="template-description">{selectedTemplate.description}</p>}

      <div className="field-grid">
        {numberFields.map((field) => {
          if (isLanceFormation && field.key === 'columns') {
            return null;
          }

          if (isSkirmish && (field.key === 'baseWidthMm' || field.key === 'baseDepthMm')) {
            return null;
          }

          if ((isAdapterCircle || isAdapterOval) && (field.key === 'baseWidthMm' || field.key === 'baseDepthMm')) {
            return null;
          }

          if ((isAdapterTray || isSkirmish) && (field.key === 'railThicknessMm' || field.key === 'railHeightMm')) {
            return null;
          }

          const adapterLabels: Partial<Record<typeof field.key, string>> = {
            baseWidthMm: 'Target base width (mm)',
            baseDepthMm: 'Target base depth (mm)',
            toleranceMm: 'Cutout tolerance (mm)',
          };
          const adapterTooltips: Partial<Record<typeof field.key, string>> = {
            baseWidthMm: 'Width of the larger base footprint this adapter represents.',
            baseDepthMm: 'Depth of the larger base footprint this adapter represents.',
            toleranceMm: 'Extra clearance added to the smaller adapter cutout.',
          };
          const tooltip =
            isAdapterTray && adapterTooltips[field.key]
              ? adapterTooltips[field.key]
              : isLanceFormation && field.key === 'rows'
              ? 'Number of wedge ranks. The rear rank will contain the same number of models as the row count.'
              : field.tooltip;
          const label = isAdapterTray && adapterLabels[field.key] ? adapterLabels[field.key] : field.label;

          return (
          <label className="field" key={field.key} title={tooltip}>
            <span>{label}</span>
            <input
              type="number"
              min="0"
              max={field.max}
              step={field.step}
              title={tooltip}
              value={settings[field.key] as number}
              onChange={(event) => updateNumber(field.key, event.target.value)}
            />
          </label>
          );
        })}
      </div>

      {isSkirmish && (
        <fieldset className="character-options">
          <legend>Skirmish distribution</legend>
          <label className="field" title="Choose whether each skirmish base is represented as a circle or square.">
            <span>Base shape</span>
            <select
              value={settings.skirmishBaseShape}
              title="Choose whether each skirmish base is represented as a circle or square."
              onChange={(event) =>
                onChange({ ...settings, skirmishBaseShape: event.target.value as TraySettings['skirmishBaseShape'] })
              }
            >
              <option value="circle">Circle</option>
              <option value="square">Square</option>
            </select>
          </label>

          <div className="field-grid">
            <label className="field" title="Side length for square bases or diameter for circular bases.">
              <span>Base size (mm)</span>
              <input
                type="number"
                min="0"
                step="1"
                title="Side length for square bases or diameter for circular bases."
                value={settings.skirmishBaseSizeMm}
                onChange={(event) => updateNumber('skirmishBaseSizeMm', event.target.value)}
              />
            </label>

            <label className="field" title="Seed used to generate the skirmish distribution. Same seed gives the same layout.">
              <span>Random seed</span>
              <input
                type="number"
                min="1"
                step="1"
                title="Seed used to generate the skirmish distribution. Same seed gives the same layout."
                value={settings.skirmishSeed}
                onChange={(event) => updateNumber('skirmishSeed', event.target.value)}
              />
            </label>

            <label className="field" title="Maximum random offset from each cell centre. Capped at 3 mm.">
              <span>Max offset (mm)</span>
              <input
                type="number"
                min="0"
                max="3"
                step="0.1"
                title="Maximum random offset from each cell centre. Capped at 3 mm."
                value={settings.skirmishMaxOffsetMm}
                onChange={(event) => updateNumber('skirmishMaxOffsetMm', event.target.value)}
              />
            </label>

            <label className="field" title="Maximum random square rotation. Circular bases ignore rotation. Capped at 10 degrees.">
              <span>Max square rotation (degrees)</span>
              <input
                type="number"
                min="0"
                max="10"
                step="0.5"
                title="Maximum random square rotation. Circular bases ignore rotation. Capped at 10 degrees."
                value={settings.skirmishMaxRotationDeg}
                onChange={(event) => updateNumber('skirmishMaxRotationDeg', event.target.value)}
              />
            </label>

            <label className="field" title="Chance each base uses the random offset and rotation generated by the seed.">
              <span>Distribution chance (%)</span>
              <input
                type="number"
                min="0"
                max="100"
                step="1"
                title="Chance each base uses the random offset and rotation generated by the seed."
                value={settings.skirmishDistributionChancePercent}
                onChange={(event) => updateNumber('skirmishDistributionChancePercent', event.target.value)}
              />
            </label>

            <label className="field" title="Overall height of the solid skirmish tray, including the bottom floor.">
              <span>Overall tray height (mm)</span>
              <input
                type="number"
                min="0"
                step="0.1"
                title="Overall height of the solid skirmish tray, including the bottom floor."
                value={settings.skirmishTrayHeightMm}
                onChange={(event) => updateNumber('skirmishTrayHeightMm', event.target.value)}
              />
            </label>
          </div>

          <button
            className="secondary-button"
            type="button"
            title="Generate a new skirmish distribution seed."
            onClick={() => onChange({ ...settings, skirmishSeed: Math.floor(Math.random() * 999999) + 1 })}
          >
            Randomise distribution
          </button>
        </fieldset>
      )}

      {isAdapterCircle && (
        <fieldset className="character-options">
          <legend>Circle adapter cutouts</legend>
          <div className="field-grid">
            <label className="field" title="Diameter of each round base cutout before tolerance is added.">
              <span>Circle base diameter (mm)</span>
              <input
                type="number"
                min="0"
                step="1"
                title="Diameter of each round base cutout before tolerance is added."
                value={settings.adapterCircleDiameterMm}
                onChange={(event) => updateNumber('adapterCircleDiameterMm', event.target.value)}
              />
            </label>

            <label className="field" title="Solid gap between neighbouring circular cutout edges.">
              <span>Gap between circles (mm)</span>
              <input
                type="number"
                min="0"
                step="0.5"
                title="Solid gap between neighbouring circular cutout edges."
                value={settings.adapterCircleGapMm}
                onChange={(event) => updateNumber('adapterCircleGapMm', event.target.value)}
              />
            </label>

            <label className="field" title="Height of the solid adapter block above the floor.">
              <span>{settings.adapterRemoveFloorEnabled ? 'Adapter block height (mm)' : 'Adapter block height above floor (mm)'}</span>
              <input
                type="number"
                min="0"
                step="0.1"
                title="Height of the solid adapter block above the floor."
                value={settings.adapterBaseHeightMm}
                onChange={(event) => updateNumber('adapterBaseHeightMm', event.target.value)}
              />
            </label>
          </div>
        </fieldset>
      )}

      {isAdapterOval && (
        <fieldset className="character-options">
          <legend>Oval adapter cutouts</legend>
          <label
            className="field"
            title={`Choose the oval base preset. Cutouts are rotated with the long edge front to rear, and include automatic ${adapterOvalGwBaseWidthAllowanceMm} mm width and ${adapterOvalGwBaseLengthAllowanceMm} mm length allowances for Games Workshop base shape.`}
          >
            <span>Oval base size</span>
            <select
              value={settings.adapterOvalSize}
              title={`Choose the oval base preset. Cutouts are rotated with the long edge front to rear, and include automatic ${adapterOvalGwBaseWidthAllowanceMm} mm width and ${adapterOvalGwBaseLengthAllowanceMm} mm length allowances for Games Workshop base shape.`}
              onChange={(event) =>
                onChange({ ...settings, adapterOvalSize: event.target.value as TraySettings['adapterOvalSize'] })
              }
            >
              {adapterOvalBaseSizes.map((size) => (
                <option value={size.value} key={size.value}>
                  {size.label}
                </option>
              ))}
            </select>
          </label>
          <p className="compatibility-note">
            Adds automatic {adapterOvalGwBaseWidthAllowanceMm} mm width and {adapterOvalGwBaseLengthAllowanceMm} mm length
            allowances for Games Workshop base shape.
          </p>

          <div className="field-grid">
            <label className="field" title="Solid gap between neighbouring oval cutout edges.">
              <span>Gap between ovals (mm)</span>
              <input
                type="number"
                min="0"
                step="0.5"
                title="Solid gap between neighbouring oval cutout edges."
                value={settings.adapterOvalGapMm}
                onChange={(event) => updateNumber('adapterOvalGapMm', event.target.value)}
              />
            </label>

            <label className="field" title="Height of the solid adapter block above the floor.">
              <span>{settings.adapterRemoveFloorEnabled ? 'Adapter block height (mm)' : 'Adapter block height above floor (mm)'}</span>
              <input
                type="number"
                min="0"
                step="0.1"
                title="Height of the solid adapter block above the floor."
                value={settings.adapterBaseHeightMm}
                onChange={(event) => updateNumber('adapterBaseHeightMm', event.target.value)}
              />
            </label>
          </div>
        </fieldset>
      )}

      {isRectAdapterTray && (
        <fieldset className="character-options">
          <legend>{settings.template === 'adapterLance' ? 'Lance adapter cutouts' : 'Adapter cutouts'}</legend>
          <div className="field-grid">
            <label className="field" title="Width of the smaller base recess centred inside each target base footprint.">
              <span>Cutout base width (mm)</span>
              <input
                type="number"
                min="0"
                step="1"
                title="Width of the smaller base recess centred inside each target base footprint."
                value={settings.adapterCutoutWidthMm}
                onChange={(event) => updateNumber('adapterCutoutWidthMm', event.target.value)}
              />
            </label>

            <label className="field" title="Depth of the smaller base recess centred inside each target base footprint.">
              <span>Cutout base depth (mm)</span>
              <input
                type="number"
                min="0"
                step="1"
                title="Depth of the smaller base recess centred inside each target base footprint."
                value={settings.adapterCutoutDepthMm}
                onChange={(event) => updateNumber('adapterCutoutDepthMm', event.target.value)}
              />
            </label>

            <label className="field" title="Height of the solid adapter block above the floor.">
              <span>{settings.adapterRemoveFloorEnabled ? 'Adapter block height (mm)' : 'Adapter block height above floor (mm)'}</span>
              <input
                type="number"
                min="0"
                step="0.1"
                title="Height of the solid adapter block above the floor."
                value={settings.adapterBaseHeightMm}
                onChange={(event) => updateNumber('adapterBaseHeightMm', event.target.value)}
              />
            </label>
          </div>

        </fieldset>
      )}

      {(isAdapter || isAdapterCircle || isAdapterOval) && (
        <fieldset className="character-options">
          <legend>Adapter border</legend>
          <label
            className="field"
            title="Uniform perimeter border added outside the adapter cutouts. Negative values shrink the edge, but must leave at least 1 mm around cutouts."
          >
            <span>Perimeter border (mm)</span>
            <input
              type="number"
              min="-20"
              max="60"
              step="0.5"
              title="Uniform perimeter border added outside the adapter cutouts. Negative values shrink the edge, but must leave at least 1 mm around cutouts."
              value={settings.adapterBorderUniformMm}
              onChange={(event) => updateNumber('adapterBorderUniformMm', event.target.value)}
            />
          </label>

          <label className="toggle" title="Adjust front, rear, left, and right adapter borders independently.">
            <input
              type="checkbox"
              title="Adjust front, rear, left, and right adapter borders independently."
              checked={settings.adapterBorderCustomEnabled}
              onChange={(event) => updateToggle('adapterBorderCustomEnabled', event.target.checked)}
            />
            <span>Custom side borders</span>
          </label>

          {settings.adapterBorderCustomEnabled && (
            <div className="field-grid">
              {adapterBorderFields.map((field) => (
                <label className="field" key={field.key} title={field.tooltip}>
                  <span>{field.label}</span>
                  <input
                    type="number"
                    min="-20"
                    max="60"
                    step="0.5"
                    title={field.tooltip}
                    value={settings[field.key] as number}
                    onChange={(event) => updateNumber(field.key, event.target.value)}
                  />
                </label>
              ))}
            </div>
          )}
        </fieldset>
      )}

      {supportsOpenFloor && (
        <fieldset className="character-options">
          <legend>{isSkirmish ? 'Skirmish floor options' : 'Adapter floor options'}</legend>
          <label
            className="toggle"
            title={
              isSkirmish
                ? 'Remove the bottom floor completely so the skirmish tray prints as an open cutout grid.'
                : 'Remove the bottom floor completely so the adapter prints as an open grid.'
            }
          >
            <input
              type="checkbox"
              title={
                isSkirmish
                  ? 'Remove the bottom floor completely so the skirmish tray prints as an open cutout grid.'
                  : 'Remove the bottom floor completely so the adapter prints as an open grid.'
              }
              checked={settings.adapterRemoveFloorEnabled}
              onChange={(event) => updateToggle('adapterRemoveFloorEnabled', event.target.checked)}
            />
            <span>Remove floor</span>
          </label>

          {settings.adapterRemoveFloorEnabled && (
            <>
              <label className="toggle" title={magneticSheetBorderTooltip}>
                <input
                  type="checkbox"
                  title={magneticSheetBorderTooltip}
                  checked={settings.adapterFloorCutoutEnabled}
                  onChange={(event) => updateToggle('adapterFloorCutoutEnabled', event.target.checked)}
                />
                <span>Magnetic sheet border</span>
              </label>

              {settings.adapterFloorCutoutEnabled && (
                <label className="field" title={magneticSheetBorderTooltip}>
                  <span>Border width (mm)</span>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    title={magneticSheetBorderTooltip}
                    value={settings.adapterFloorCutoutBufferMm}
                    onChange={(event) => updateNumber('adapterFloorCutoutBufferMm', event.target.value)}
                  />
                </label>
              )}
            </>
          )}
        </fieldset>
      )}

      {!isAdapterTray && !isSkirmish && (
      <fieldset className="rail-options">
        <legend>Rails</legend>
        {railToggles.map((toggle) => (
          <label className="toggle" key={toggle.key} title={toggle.tooltip}>
            <input
              type="checkbox"
              title={toggle.tooltip}
              checked={settings[toggle.key] as boolean}
              onChange={(event) => updateToggle(toggle.key, event.target.checked)}
            />
            <span>{toggle.label}</span>
          </label>
        ))}
      </fieldset>
      )}

      {(settings.template === 'standard' || isAdapter) && (
        <fieldset className="character-options">
          <legend>{isAdapter ? 'Irregular Flank Adapter' : 'Character Flank Slot'}</legend>
          <label
            className="toggle"
            title={
              isAdapter
                ? 'Add one irregular larger-base adapter space on a flank.'
                : 'Add one custom character flank slot to the standard tray.'
            }
          >
            <input
              type="checkbox"
              title={
                isAdapter
                  ? 'Add one irregular larger-base adapter space on a flank.'
                  : 'Add one custom character flank slot to the standard tray.'
              }
              checked={settings.characterBayEnabled}
              onChange={(event) => updateToggle('characterBayEnabled', event.target.checked)}
            />
            <span>{isAdapter ? 'Enable irregular flank adapter' : 'Enable character flank slot'}</span>
          </label>

          <label
            className="field"
            title={
              isAdapter
                ? 'Choose which side of the adapter tray gets the irregular base space.'
                : 'Choose which side of the movement tray gets the character flank slot.'
            }
          >
            <span>Flank side</span>
            <select
              value={settings.characterBaySide}
              title={
                isAdapter
                  ? 'Choose which side of the adapter tray gets the irregular base space.'
                  : 'Choose which side of the movement tray gets the character flank slot.'
              }
              onChange={(event) => onChange({ ...settings, characterBaySide: event.target.value as TraySettings['characterBaySide'] })}
            >
              <option value="left">Left flank</option>
              <option value="right">Right flank</option>
            </select>
          </label>

          <div className="field-grid">
            <label
              className="field"
              title={
                isAdapter
                  ? 'Width of the larger irregular base footprint on the flank.'
                  : 'Width of the character flank slot from left to right.'
              }
            >
              <span>{isAdapter ? 'Irregular target width (mm)' : 'Flank slot width (mm)'}</span>
              <input
                type="number"
                min="0"
                step="1"
                title={
                  isAdapter
                    ? 'Width of the larger irregular base footprint on the flank.'
                    : 'Width of the character flank slot from left to right.'
                }
                value={settings.characterBaseWidthMm}
                onChange={(event) => updateNumber('characterBaseWidthMm', event.target.value)}
              />
            </label>

            <label
              className="field"
              title={
                isAdapter
                  ? 'Depth of the larger irregular base footprint on the flank.'
                  : 'Depth of the character flank slot from front to back.'
              }
            >
              <span>{isAdapter ? 'Irregular target depth (mm)' : 'Flank slot depth (mm)'}</span>
              <input
                type="number"
                min="0"
                step="1"
                title={
                  isAdapter
                    ? 'Depth of the larger irregular base footprint on the flank.'
                    : 'Depth of the character flank slot from front to back.'
                }
                value={settings.characterBaseDepthMm}
                onChange={(event) => updateNumber('characterBaseDepthMm', event.target.value)}
              />
            </label>

            {isAdapter && (
              <>
                <label className="field" title="Width of the smaller base recess centred inside the irregular flank target.">
                  <span>Flank cutout width (mm)</span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    title="Width of the smaller base recess centred inside the irregular flank target."
                    value={settings.adapterFlankCutoutWidthMm}
                    onChange={(event) => updateNumber('adapterFlankCutoutWidthMm', event.target.value)}
                  />
                </label>

                <label className="field" title="Depth of the smaller base recess centred inside the irregular flank target.">
                  <span>Flank cutout depth (mm)</span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    title="Depth of the smaller base recess centred inside the irregular flank target."
                    value={settings.adapterFlankCutoutDepthMm}
                    onChange={(event) => updateNumber('adapterFlankCutoutDepthMm', event.target.value)}
                  />
                </label>
              </>
            )}
          </div>
        </fieldset>
      )}

      {supportsRankInsert && (
        <fieldset className="character-options">
          <legend>Rank insert slot</legend>
          <label
            className="toggle"
            title={
              settings.rows <= 1
                ? 'Rank insert slot needs at least two ranks.'
                : 'Replace a block of normal cutouts with one larger compatible base slot derived from the selected coordinates and span.'
            }
          >
            <input
              type="checkbox"
              title={
                settings.rows <= 1
                  ? 'Rank insert slot needs at least two ranks.'
                  : 'Replace a block of normal cutouts with one larger compatible base slot derived from the selected coordinates and span.'
              }
              checked={settings.rankInsertEnabled && !rankInsertUnavailable}
              disabled={rankInsertUnavailable}
              onChange={(event) => updateToggle('rankInsertEnabled', event.target.checked)}
            />
            <span>Enable rank insert slot</span>
          </label>

          {settings.rankInsertEnabled && !rankInsertUnavailable && (
            <>
              <div className="field-grid">
                <label className="field" title="Column coordinate where the insert starts, counted from the left of the tray.">
                  <span>Origin column</span>
                  <input
                    type="number"
                    min="1"
                    max={settings.columns}
                    step="1"
                    title="Column coordinate where the insert starts, counted from the left of the tray."
                    value={settings.rankInsertColumn}
                    onChange={(event) => updateNumber('rankInsertColumn', event.target.value)}
                  />
                </label>

                <label className="field" title="Rank coordinate where the insert starts, counted from the front of the tray.">
                  <span>Origin rank</span>
                  <input
                    type="number"
                    min="1"
                    max={settings.rows}
                    step="1"
                    title="Rank coordinate where the insert starts, counted from the front of the tray."
                    value={settings.rankInsertRow}
                    onChange={(event) => updateNumber('rankInsertRow', event.target.value)}
                  />
                </label>

                <label className="field" title="How many columns the insert occupies.">
                  <span>Columns occupied</span>
                  <input
                    type="number"
                    min="1"
                    max={settings.columns}
                    step="1"
                    title="How many columns the insert occupies."
                    value={settings.rankInsertColumnSpan}
                    onChange={(event) => updateNumber('rankInsertColumnSpan', event.target.value)}
                  />
                </label>

                <label className="field" title="How many ranks the insert occupies.">
                  <span>Ranks occupied</span>
                  <input
                    type="number"
                    min="1"
                    max={settings.rows}
                    step="1"
                    title="How many ranks the insert occupies."
                    value={settings.rankInsertRowSpan}
                    onChange={(event) => updateNumber('rankInsertRowSpan', event.target.value)}
                  />
                </label>
              </div>

              <label className="field" title="Choose how the merged insert slot aligns within the occupied rank block.">
                <span>Insert alignment</span>
                <select
                  value={settings.rankInsertAlignment}
                  title="Choose how the merged insert slot aligns within the occupied rank block."
                  onChange={(event) =>
                    onChange({
                      ...settings,
                      rankInsertAlignment: event.target.value as TraySettings['rankInsertAlignment'],
                    })
                  }
                >
                  <option value="front">Front align</option>
                  <option value="center">Center align</option>
                  <option value="rear">Rear align</option>
                </select>
              </label>

              {usesCircularRankInsert && (
                <label
                  className="field"
                  title="Diameter of the circular insert slot before tolerance is added. It must fit inside the selected coordinate span with the required gap to neighbouring circles."
                >
                  <span>Insert circle diameter (mm)</span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    title="Diameter of the circular insert slot before tolerance is added. It must fit inside the selected coordinate span with the required gap to neighbouring circles."
                    value={settings.rankInsertCircleDiameterMm}
                    onChange={(event) => updateNumber('rankInsertCircleDiameterMm', event.target.value)}
                  />
                </label>
              )}

              {isAdapter && (
                <>
                  <label
                    className="toggle"
                    title="Define the final rectangular insert cutout size manually instead of deriving it from the adapter cutout size."
                  >
                    <input
                      type="checkbox"
                      title="Define the final rectangular insert cutout size manually instead of deriving it from the adapter cutout size."
                      checked={settings.rankInsertCustomSizeEnabled}
                      onChange={(event) => updateToggle('rankInsertCustomSizeEnabled', event.target.checked)}
                    />
                    <span>Custom insert dimensions</span>
                  </label>

                  {settings.rankInsertCustomSizeEnabled && (
                    <div className="field-grid">
                      <label
                        className="field"
                        title="Final left-to-right width of the custom insert cutout. It must fit inside the selected column span."
                      >
                        <span>Custom insert width (mm)</span>
                        <input
                          type="number"
                          min="1"
                          max={settings.rankInsertColumnSpan * settings.baseWidthMm}
                          step="0.1"
                          title="Final left-to-right width of the custom insert cutout. It must fit inside the selected column span."
                          value={settings.rankInsertCustomWidthMm}
                          onChange={(event) => updateNumber('rankInsertCustomWidthMm', event.target.value)}
                        />
                      </label>

                      <label
                        className="field"
                        title="Final front-to-back depth of the custom insert cutout. It must fit inside the selected rank span."
                      >
                        <span>Custom insert depth (mm)</span>
                        <input
                          type="number"
                          min="1"
                          max={settings.rankInsertRowSpan * settings.baseDepthMm}
                          step="0.1"
                          title="Final front-to-back depth of the custom insert cutout. It must fit inside the selected rank span."
                          value={settings.rankInsertCustomDepthMm}
                          onChange={(event) => updateNumber('rankInsertCustomDepthMm', event.target.value)}
                        />
                      </label>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </fieldset>
      )}

      <fieldset className="magnet-options">
        <legend>Magnet cutouts</legend>
        <label
          className="toggle"
          title={
            magnetCutoutsDisabledByRemovedFloor
              ? 'Magnet cutouts are not available when the floor is removed.'
              : 'Add circular magnet recesses centred in each base space.'
          }
        >
          <input
            type="checkbox"
            title={
              magnetCutoutsDisabledByRemovedFloor
                ? 'Magnet cutouts are not available when the floor is removed.'
                : 'Add circular magnet recesses centred in each base space.'
            }
            checked={settings.magnetCutoutsEnabled && !magnetCutoutsDisabled}
            disabled={magnetCutoutsDisabled}
            onChange={(event) => updateToggle('magnetCutoutsEnabled', event.target.checked)}
          />
          <span>Enable cutouts</span>
        </label>
        {magnetCutoutsDisabledByRemovedFloor && (
          <p className="compatibility-note">Magnet cutouts are disabled while the floor is removed.</p>
        )}

        <div className="field-grid">
          <label className="field" title="Diameter of each magnet recess.">
            <span>Magnet diameter (mm)</span>
            <input
              type="number"
              min="1"
              max="15"
              step="0.1"
              title="Diameter of each magnet recess."
              value={settings.magnetDiameterMm}
              disabled={magnetCutoutsDisabled}
              onChange={(event) => updateNumber('magnetDiameterMm', event.target.value)}
            />
          </label>

          <label
            className="field"
            title={
              settings.magnetCutoutsFromBottom
                ? 'Depth of the recess from the underside of the tray floor. Set equal to floor thickness for a through-hole.'
                : 'Depth of the recess from the top surface. Set equal to floor thickness for a through-hole.'
            }
          >
            <span>Cutout depth (mm)</span>
            <input
              type="number"
              min="0"
              step="0.1"
              title={
                settings.magnetCutoutsFromBottom
                  ? 'Depth of the recess from the underside of the tray floor. Set equal to floor thickness for a through-hole.'
                  : 'Depth of the recess from the top surface. Set equal to floor thickness for a through-hole.'
              }
              value={settings.magnetCutoutDepthMm}
              disabled={magnetCutoutsDisabled}
              onChange={(event) => updateNumber('magnetCutoutDepthMm', event.target.value)}
            />
          </label>
        </div>

        <label
          className="toggle"
          title="Place the same magnet recesses on the underside of the tray floor instead of the top surface."
        >
          <input
            type="checkbox"
            title="Place the same magnet recesses on the underside of the tray floor instead of the top surface."
            checked={settings.magnetCutoutsFromBottom}
            disabled={magnetCutoutsDisabled}
            onChange={(event) => updateToggle('magnetCutoutsFromBottom', event.target.checked)}
          />
          <span>Cut from underside</span>
        </label>

        {isLanceFormation && (
          <>
            <label className="toggle" title="Use two magnet recesses per base space in the lance wedge templates.">
              <input
                type="checkbox"
                title="Use two magnet recesses per base space in the lance wedge templates."
                checked={settings.lanceDoubleMagnetsEnabled}
                disabled={magnetCutoutsDisabled}
                onChange={(event) => updateToggle('lanceDoubleMagnetsEnabled', event.target.checked)}
              />
              <span>Two magnets per space</span>
            </label>

            <label className="field" title="Distance from the base centre to each magnet along the front-to-back centre line.">
              <span>Magnet offset (mm)</span>
              <input
                type="number"
                min="0"
                step="0.1"
                title="Distance from the base centre to each magnet along the front-to-back centre line."
                value={settings.lanceMagnetOffsetMm}
                disabled={magnetCutoutsDisabled}
                onChange={(event) => updateNumber('lanceMagnetOffsetMm', event.target.value)}
              />
            </label>
          </>
        )}
      </fieldset>

      {validationMessages.length > 0 && (
        <div className="validation" role="alert">
          {validationMessages.map((message) => (
            <p key={message}>{message}</p>
          ))}
        </div>
      )}

      <button
        className="secondary-button"
        type="button"
        title="Reset the current tray template to its default parameters."
        onClick={onResetTemplate}
      >
        Reset template defaults
      </button>

    </aside>
  );
}
