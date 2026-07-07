import type { ThemeName, TraySettings } from '../types';
import { buildPlates } from '../geometry/trayMath';

type Props = {
  settings: TraySettings;
  theme: ThemeName;
  onChange: (settings: TraySettings) => void;
  onThemeChange: (theme: ThemeName) => void;
  validationMessages: string[];
  onDownload: () => void;
};

const numberFields: Array<{
  key: keyof Omit<TraySettings, 'buildPlateSize'>;
  label: string;
  step: number;
}> = [
  { key: 'baseWidthMm', label: 'Base width (mm)', step: 1 },
  { key: 'baseDepthMm', label: 'Base depth (mm)', step: 1 },
  { key: 'columns', label: 'Columns', step: 1 },
  { key: 'rows', label: 'Rows', step: 1 },
  { key: 'toleranceMm', label: 'Tolerance (mm)', step: 0.1 },
  { key: 'floorThicknessMm', label: 'Floor thickness (mm)', step: 0.1 },
  { key: 'railThicknessMm', label: 'Rail thickness (mm)', step: 0.1 },
  { key: 'railHeightMm', label: 'Rail height (mm)', step: 0.1 },
];

const railToggles: Array<{ key: keyof TraySettings; label: string }> = [
  { key: 'frontRailEnabled', label: 'Front rail' },
  { key: 'rearRailEnabled', label: 'Rear rail' },
  { key: 'leftRailEnabled', label: 'Left rail' },
  { key: 'rightRailEnabled', label: 'Right rail' },
];

const themes: Array<{ value: ThemeName; label: string }> = [
  { value: 'workshop', label: 'Workshop' },
  { value: 'forest', label: 'Forest' },
  { value: 'slate', label: 'Slate' },
  { value: 'parchment', label: 'Parchment' },
];

export function TrayControls({ settings, theme, onChange, onThemeChange, validationMessages, onDownload }: Props) {
  const updateNumber = (key: keyof TraySettings, value: string) => {
    const nextValue = value === '' ? 0 : Number(value);
    onChange({ ...settings, [key]: nextValue });
  };

  const updateToggle = (key: keyof TraySettings, checked: boolean) => {
    onChange({ ...settings, [key]: checked });
  };

  return (
    <aside className="controls" aria-label="Tray settings">
      <div>
        <p className="eyebrow">Tray Workshop</p>
        <h1>Build a square-base tray</h1>
        <p className="intro">Set the base size, formation, clearances, and rails, then download a browser-generated STL.</p>
      </div>

      <label className="field">
        <span>Colour theme</span>
        <select value={theme} onChange={(event) => onThemeChange(event.target.value as ThemeName)}>
          {themes.map((themeOption) => (
            <option value={themeOption.value} key={themeOption.value}>
              {themeOption.label}
            </option>
          ))}
        </select>
      </label>

      <label className="field">
        <span>Build plate size (mm)</span>
        <select
          value={settings.buildPlateSize}
          onChange={(event) => onChange({ ...settings, buildPlateSize: event.target.value as TraySettings['buildPlateSize'] })}
        >
          {buildPlates.map((plate) => (
            <option value={plate.value} key={plate.value}>
              {plate.widthMm} x {plate.depthMm}
            </option>
          ))}
        </select>
      </label>

      <div className="field-grid">
        {numberFields.map((field) => (
          <label className="field" key={field.key}>
            <span>{field.label}</span>
            <input
              type="number"
              min="0"
              step={field.step}
              value={settings[field.key] as number}
              onChange={(event) => updateNumber(field.key, event.target.value)}
            />
          </label>
        ))}
      </div>

      <fieldset className="rail-options">
        <legend>Rails</legend>
        {railToggles.map((toggle) => (
          <label className="toggle" key={toggle.key}>
            <input
              type="checkbox"
              checked={settings[toggle.key] as boolean}
              onChange={(event) => updateToggle(toggle.key, event.target.checked)}
            />
            <span>{toggle.label}</span>
          </label>
        ))}
      </fieldset>

      {validationMessages.length > 0 && (
        <div className="validation" role="alert">
          {validationMessages.map((message) => (
            <p key={message}>{message}</p>
          ))}
        </div>
      )}

      <button className="download-button" type="button" disabled={validationMessages.length > 0} onClick={onDownload}>
        Download STL
      </button>
    </aside>
  );
}
