import type { ThemeName, TraySettings } from '../types';
import { trayTemplates } from '../geometry/trayMath';

type Props = {
  settings: TraySettings;
  theme: ThemeName;
  onChange: (settings: TraySettings) => void;
  onThemeChange: (theme: ThemeName) => void;
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
  { value: 'workshop', label: 'Workshop' },
  { value: 'forest', label: 'Forest' },
  { value: 'slate', label: 'Slate' },
  { value: 'parchment', label: 'Parchment' },
];

function getTemplateDefaults(template: TraySettings['template'], current: TraySettings): TraySettings {
  const shared = {
    toleranceMm: 0.2,
    floorThicknessMm: 1.6,
    railThicknessMm: 2,
    railHeightMm: 2,
    frontRailEnabled: true,
    rearRailEnabled: false,
    leftRailEnabled: true,
    rightRailEnabled: true,
    buildPlateSize: current.buildPlateSize,
  };

  if (template === 'lanceWedge') {
    return {
      ...current,
      ...shared,
      template,
      baseWidthMm: 30,
      baseDepthMm: 60,
      columns: 5,
      rows: 3,
    };
  }

  return {
    ...current,
    ...shared,
    template,
    baseWidthMm: 25,
    baseDepthMm: 25,
    columns: 5,
    rows: 4,
  };
}

export function TrayControls({ settings, theme, onChange, onThemeChange, validationMessages, onDownload }: Props) {
  const updateTemplate = (template: TraySettings['template']) => {
    if (template === 'lanceWedge') {
      onChange({
        ...settings,
        template,
        baseWidthMm: 30,
        baseDepthMm: 60,
        columns: 5,
        rows: 3,
        frontRailEnabled: true,
        rearRailEnabled: false,
        leftRailEnabled: true,
        rightRailEnabled: true,
      });
      return;
    }

    onChange({ ...settings, template });
  };

  const updateNumber = (key: keyof TraySettings, value: string) => {
    const nextValue = value === '' ? 0 : Number(value);
    onChange({ ...settings, [key]: nextValue });
  };

  const updateToggle = (key: keyof TraySettings, checked: boolean) => {
    onChange({ ...settings, [key]: checked });
  };

  const resetCurrentTemplate = () => {
    onChange(getTemplateDefaults(settings.template, settings));
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
          onChange={(event) => updateTemplate(event.target.value as TraySettings['template'])}
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

          const tooltip =
            settings.template === 'lanceWedge' && field.key === 'rows'
              ? 'Number of wedge ranks. The rear rank will contain the same number of models as the row count.'
              : field.tooltip;

          return (
          <label className="field" key={field.key} title={tooltip}>
            <span>{field.label}</span>
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
        onClick={resetCurrentTemplate}
      >
        Reset template defaults
      </button>

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
