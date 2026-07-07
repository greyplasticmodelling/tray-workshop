import type { SavedTray, ThemeName, TraySettings } from '../types';
import { trayTemplates } from '../geometry/trayMath';

type Props = {
  settings: TraySettings;
  theme: ThemeName;
  savedTrays: SavedTray[];
  onChange: (settings: TraySettings) => void;
  onTemplateChange: (template: TraySettings['template']) => void;
  onThemeChange: (theme: ThemeName) => void;
  onResetTemplate: () => void;
  onSaveTray: () => void;
  onLoadTray: (id: string) => void;
  onDeleteSavedTray: (id: string) => void;
  validationMessages: string[];
  onDownload: () => void;
};

const numberFields: Array<{
  key: keyof Omit<TraySettings, 'buildPlateSize' | 'template'>;
  label: string;
  step: number;
  tooltip: string;
}> = [
  { key: 'baseWidthMm', label: 'Base width (mm)', step: 1, tooltip: 'Width of each model base from left to right.' },
  { key: 'baseDepthMm', label: 'Base depth (mm)', step: 1, tooltip: 'Depth of each model base from front to back.' },
  { key: 'columns', label: 'Columns', step: 1, tooltip: 'Number of bases across the tray frontage.' },
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

export function TrayControls({
  settings,
  theme,
  savedTrays,
  onChange,
  onTemplateChange,
  onThemeChange,
  onResetTemplate,
  onSaveTray,
  onLoadTray,
  onDeleteSavedTray,
  validationMessages,
  onDownload,
}: Props) {
  const updateNumber = (key: keyof TraySettings, value: string) => {
    const nextValue = value === '' ? 0 : Number(value);
    onChange({ ...settings, [key]: nextValue });
  };

  const updateToggle = (key: keyof TraySettings, checked: boolean) => {
    onChange({ ...settings, [key]: checked });
  };
  const isAdapter = settings.template === 'adapter';

  return (
    <aside className="controls" aria-label="Tray settings">
      <div>
        <p className="eyebrow">Tray Workshop</p>
        <h1>Build a square-base tray</h1>
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

      <div className="field-grid">
        {numberFields.map((field) => {
          if (settings.template === 'lanceWedge' && field.key === 'columns') {
            return null;
          }

          if (isAdapter && (field.key === 'railThicknessMm' || field.key === 'railHeightMm')) {
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
            isAdapter && adapterTooltips[field.key]
              ? adapterTooltips[field.key]
              : settings.template === 'lanceWedge' && field.key === 'rows'
              ? 'Number of wedge ranks. The rear rank will contain the same number of models as the row count.'
              : field.tooltip;
          const label = isAdapter && adapterLabels[field.key] ? adapterLabels[field.key] : field.label;

          return (
          <label className="field" key={field.key} title={tooltip}>
            <span>{label}</span>
            <input
              type="number"
              min="0"
              step={field.step}
              title={tooltip}
              value={settings[field.key] as number}
              onChange={(event) => updateNumber(field.key, event.target.value)}
            />
          </label>
          );
        })}
      </div>

      {isAdapter && (
        <fieldset className="character-options">
          <legend>Adapter cutouts</legend>
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
              <span>Adapter block height (mm)</span>
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

      {!isAdapter && (
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

      <fieldset className="magnet-options">
        <legend>Magnet cutouts</legend>
        <label className="toggle" title="Add circular top-side magnet recesses centred in each base space.">
          <input
            type="checkbox"
            title="Add circular top-side magnet recesses centred in each base space."
            checked={settings.magnetCutoutsEnabled}
            onChange={(event) => updateToggle('magnetCutoutsEnabled', event.target.checked)}
          />
          <span>Enable cutouts</span>
        </label>

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
              onChange={(event) => updateNumber('magnetDiameterMm', event.target.value)}
            />
          </label>

          <label className="field" title="Depth of the recess from the top surface. Set equal to floor thickness for a through-hole.">
            <span>Cutout depth (mm)</span>
            <input
              type="number"
              min="0"
              step="0.1"
              title="Depth of the recess from the top surface. Set equal to floor thickness for a through-hole."
              value={settings.magnetCutoutDepthMm}
              onChange={(event) => updateNumber('magnetCutoutDepthMm', event.target.value)}
            />
          </label>
        </div>

        {settings.template === 'lanceWedge' && (
          <>
            <label className="toggle" title="Use two magnet recesses per base space in the Lance Wedge template.">
              <input
                type="checkbox"
                title="Use two magnet recesses per base space in the Lance Wedge template."
                checked={settings.lanceDoubleMagnetsEnabled}
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

      <section className="saved-trays" aria-label="Saved trays">
        <div className="saved-trays-header">
          <span>Saved trays</span>
          <button type="button" className="small-button" title="Save the current tray in this browser." onClick={onSaveTray}>
            Save
          </button>
        </div>

        {savedTrays.length === 0 ? (
          <p>No saved trays yet.</p>
        ) : (
          <div className="saved-tray-list">
            {savedTrays.map((savedTray) => (
              <div className="saved-tray-row" key={savedTray.id}>
                <button
                  type="button"
                  title="Load this saved tray."
                  onClick={() => onLoadTray(savedTray.id)}
                >
                  {savedTray.name}
                </button>
                <button
                  type="button"
                  className="delete-button"
                  title="Delete this saved tray from this browser."
                  onClick={() => onDeleteSavedTray(savedTray.id)}
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <button
        className="download-button"
        type="button"
        title="Download the current tray as an STL file."
        disabled={validationMessages.length > 0}
        onClick={onDownload}
      >
        Download STL
      </button>
    </aside>
  );
}
