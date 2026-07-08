import { Suspense, lazy, useEffect, useMemo, useRef, useState } from 'react';
import { DimensionsPanel } from './components/DimensionsPanel';
import { TrayControls } from './components/TrayControls';
import { TrayPreviewSvg } from './components/TrayPreviewSvg';
import { calculateBuildPlateFit, calculateTrayDimensions, validateTraySettings } from './geometry/trayMath';
import type { SavedTray, ThemeName, TraySettings, TrayTemplate } from './types';

const TrayPreview3d = lazy(() =>
  import('./components/TrayPreview3d').then((module) => ({ default: module.TrayPreview3d })),
);

const standardDefaults: TraySettings = {
  template: 'standard',
  baseWidthMm: 25,
  baseDepthMm: 25,
  columns: 5,
  rows: 4,
  toleranceMm: 0.2,
  floorThicknessMm: 1.6,
  railThicknessMm: 2,
  railHeightMm: 2,
  adapterCutoutWidthMm: 20,
  adapterCutoutDepthMm: 20,
  adapterFlankCutoutWidthMm: 20,
  adapterFlankCutoutDepthMm: 20,
  adapterBaseHeightMm: 3,
  adapterBorderUniformMm: 0,
  adapterBorderCustomEnabled: false,
  adapterBorderFrontMm: 0,
  adapterBorderRearMm: 0,
  adapterBorderLeftMm: 0,
  adapterBorderRightMm: 0,
  adapterRemoveFloorEnabled: false,
  adapterFloorCutoutEnabled: false,
  adapterFloorCutoutBufferMm: 2,
  trayEdgeSlopeMm: 0,
  trayRoundedCornersEnabled: false,
  trayCornerRadiusMm: 2,
  skirmishBaseShape: 'circle',
  skirmishBaseSizeMm: 25,
  skirmishSeed: 12025,
  skirmishMaxRotationDeg: 6,
  skirmishMaxOffsetMm: 2,
  skirmishDistributionChancePercent: 100,
  skirmishTrayHeightMm: 4,
  magnetCutoutsEnabled: false,
  magnetDiameterMm: 5,
  magnetCutoutDepthMm: 1,
  lanceDoubleMagnetsEnabled: false,
  lanceMagnetOffsetMm: 12,
  characterBayEnabled: false,
  characterBaySide: 'right',
  characterBaseWidthMm: 30,
  characterBaseDepthMm: 60,
  frontRailEnabled: true,
  rearRailEnabled: false,
  leftRailEnabled: true,
  rightRailEnabled: true,
  buildPlateSize: '256x256',
};

const lanceWedgeDefaults: TraySettings = {
  ...standardDefaults,
  template: 'lanceWedge',
  baseWidthMm: 30,
  baseDepthMm: 60,
  columns: 5,
  rows: 3,
};

const adapterDefaults: TraySettings = {
  ...standardDefaults,
  template: 'adapter',
  baseWidthMm: 30,
  baseDepthMm: 30,
  columns: 5,
  rows: 4,
  toleranceMm: 0.2,
  adapterCutoutWidthMm: 20,
  adapterCutoutDepthMm: 20,
  adapterFlankCutoutWidthMm: 20,
  adapterFlankCutoutDepthMm: 20,
  adapterBaseHeightMm: 3,
  magnetCutoutsEnabled: false,
  characterBayEnabled: false,
  frontRailEnabled: false,
  rearRailEnabled: false,
  leftRailEnabled: false,
  rightRailEnabled: false,
};

const adapterLanceDefaults: TraySettings = {
  ...adapterDefaults,
  template: 'adapterLance',
  baseWidthMm: 30,
  baseDepthMm: 60,
  columns: 5,
  rows: 3,
  adapterCutoutWidthMm: 25,
  adapterCutoutDepthMm: 50,
  characterBayEnabled: false,
};

const skirmishDefaults: TraySettings = {
  ...standardDefaults,
  template: 'skirmish',
  baseWidthMm: 31,
  baseDepthMm: 31,
  columns: 5,
  rows: 4,
  toleranceMm: 0.2,
  skirmishBaseShape: 'circle',
  skirmishBaseSizeMm: 25,
  skirmishSeed: 12025,
  skirmishMaxRotationDeg: 6,
  skirmishMaxOffsetMm: 2,
  skirmishDistributionChancePercent: 100,
  skirmishTrayHeightMm: 4,
  frontRailEnabled: true,
  rearRailEnabled: false,
  leftRailEnabled: true,
  rightRailEnabled: true,
};

const defaultSettingsByTemplate: Record<TrayTemplate, TraySettings> = {
  standard: standardDefaults,
  lanceWedge: lanceWedgeDefaults,
  adapter: adapterDefaults,
  adapterLance: adapterLanceDefaults,
  skirmish: skirmishDefaults,
};

const savedTraysStorageKey = 'tray-workshop.saved-trays.v1';
const sharedSettingsParam = 'settings';

function isTrayTemplate(value: unknown): value is TrayTemplate {
  return typeof value === 'string' && value in defaultSettingsByTemplate;
}

function encodeSettings(settings: TraySettings): string {
  const json = JSON.stringify(settings);
  return btoa(unescape(encodeURIComponent(json))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function decodeSettings(value: string): TraySettings | null {
  try {
    const normalised = value.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalised.padEnd(Math.ceil(normalised.length / 4) * 4, '=');
    const parsed = JSON.parse(decodeURIComponent(escape(atob(padded)))) as Partial<TraySettings>;

    if (!isTrayTemplate(parsed.template)) {
      return null;
    }

    return {
      ...defaultSettingsByTemplate[parsed.template],
      ...parsed,
      template: parsed.template,
    };
  } catch {
    return null;
  }
}

function readSharedSettings(): TraySettings | null {
  const sharedSettings = new URLSearchParams(window.location.search).get(sharedSettingsParam);
  return sharedSettings ? decodeSettings(sharedSettings) : null;
}

function createShareUrl(settings: TraySettings): string {
  const url = new URL(import.meta.env.BASE_URL, window.location.origin);
  url.searchParams.set(sharedSettingsParam, encodeSettings(settings));
  return url.toString();
}

function SupportButton() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;

    if (!container) {
      return;
    }

    Array.from(container.children).forEach((child) => {
      if (!child.classList.contains('support-button-fallback')) {
        child.remove();
      }
    });

    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = 'https://cdnjs.buymeacoffee.com/1.0.0/button.prod.min.js';
    script.dataset.name = 'bmc-button';
    script.dataset.slug = 'greyplasticmodelling';
    script.dataset.color = '#110836';
    script.dataset.emoji = '🐲';
    script.dataset.font = 'Lato';
    script.dataset.text = 'Buy me a dragon';
    script.dataset.outlineColor = '#ffffff';
    script.dataset.fontColor = '#ffffff';
    script.dataset.coffeeColor = '#FFDD00';
    container.appendChild(script);

    return () => {
      script.remove();
      Array.from(container.children).forEach((child) => {
        if (!child.classList.contains('support-button-fallback')) {
          child.remove();
        }
      });
    };
  }, []);

  return (
    <div className="support-button-slot" ref={containerRef} aria-label="Support Tray Workshop">
      <a
        className="support-button-fallback"
        href="https://www.buymeacoffee.com/greyplasticmodelling"
        target="_blank"
        rel="noreferrer"
        title="Support Tray Workshop on Buy Me a Coffee."
      >
        <span aria-hidden="true">&#128009;</span>
        <span>Buy me a dragon</span>
      </a>
    </div>
  );
}

function readSavedTrays(): SavedTray[] {
  try {
    const stored = window.localStorage.getItem(savedTraysStorageKey);
    const trays = stored ? (JSON.parse(stored) as SavedTray[]) : [];

    return trays
      .filter((tray) => isTrayTemplate(tray.settings.template))
      .map((tray) => ({
        ...tray,
        settings: {
          ...defaultSettingsByTemplate[tray.settings.template],
          ...tray.settings,
        },
      }));
  } catch {
    return [];
  }
}

type TrayLibraryProps = {
  savedTrays: SavedTray[];
  shareStatus: string;
  onSaveTray: () => void;
  onLoadTray: (id: string) => void;
  onDeleteSavedTray: (id: string) => void;
  onCopyShareLink: () => void;
};

function TrayLibrary({
  savedTrays,
  shareStatus,
  onSaveTray,
  onLoadTray,
  onDeleteSavedTray,
  onCopyShareLink,
}: TrayLibraryProps) {
  return (
    <section className="tray-library" aria-label="Saved and shared trays">
      <div className="tray-library-actions">
        <button
          className="secondary-button"
          type="button"
          title="Save the current tray in this browser."
          onClick={onSaveTray}
        >
          Save tray
        </button>
        <button
          className="secondary-button"
          type="button"
          title="Copy a link that opens this exact tray setup."
          onClick={onCopyShareLink}
        >
          Copy share link
        </button>
      </div>
      {shareStatus && <p className="share-status">{shareStatus}</p>}

      <div className="saved-trays">
        <div className="saved-trays-header">
          <span>Saved trays</span>
        </div>

        {savedTrays.length === 0 ? (
          <p>No saved trays yet.</p>
        ) : (
          <div className="saved-tray-list">
            {savedTrays.map((savedTray) => (
              <div className="saved-tray-row" key={savedTray.id}>
                <button type="button" title="Load this saved tray." onClick={() => onLoadTray(savedTray.id)}>
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
      </div>
    </section>
  );
}

function roundedCornersConflictWithMagnetCutouts(settings: TraySettings) {
  return (
    settings.template === 'lanceWedge' ||
    settings.template === 'adapterLance' ||
    (settings.template === 'adapter' && settings.characterBayEnabled)
  );
}

function normaliseCompatibleSettings(settings: TraySettings): TraySettings {
  let nextSettings = settings;

  if (
    settings.template === 'adapterLance' &&
    (settings.adapterBorderUniformMm !== 0 ||
      settings.adapterBorderCustomEnabled ||
      settings.adapterBorderFrontMm !== 0 ||
      settings.adapterBorderRearMm !== 0 ||
      settings.adapterBorderLeftMm !== 0 ||
      settings.adapterBorderRightMm !== 0)
  ) {
    nextSettings = {
      ...nextSettings,
      adapterBorderUniformMm: 0,
      adapterBorderCustomEnabled: false,
      adapterBorderFrontMm: 0,
      adapterBorderRearMm: 0,
      adapterBorderLeftMm: 0,
      adapterBorderRightMm: 0,
    };
  }

  if (nextSettings.adapterRemoveFloorEnabled && nextSettings.magnetCutoutsEnabled) {
    nextSettings = {
      ...nextSettings,
      magnetCutoutsEnabled: false,
    };
  }

  return nextSettings;
}

export default function App() {
  const [activeTemplate, setActiveTemplate] = useState<TrayTemplate>(() => readSharedSettings()?.template ?? 'standard');
  const [settingsByTemplate, setSettingsByTemplate] = useState<Record<TrayTemplate, TraySettings>>(() => {
    const sharedSettings = readSharedSettings();
    return sharedSettings
      ? {
          ...defaultSettingsByTemplate,
          [sharedSettings.template]: normaliseCompatibleSettings(sharedSettings),
        }
      : defaultSettingsByTemplate;
  });
  const [savedTrays, setSavedTrays] = useState<SavedTray[]>(() => readSavedTrays());
  const [theme, setTheme] = useState<ThemeName>('darkGrey');
  const [shareStatus, setShareStatus] = useState('');
  const [is3dPreviewEnabled, setIs3dPreviewEnabled] = useState(false);
  const [isAdvancedFinishEnabled, setIsAdvancedFinishEnabled] = useState(() => {
    const sharedSettings = readSharedSettings();
    return Boolean(sharedSettings?.trayRoundedCornersEnabled || (sharedSettings?.trayEdgeSlopeMm ?? 0) > 0);
  });
  const settings = settingsByTemplate[activeTemplate];
  const dimensions = useMemo(() => calculateTrayDimensions(settings), [settings]);
  const buildPlateFit = useMemo(() => calculateBuildPlateFit(settings, dimensions), [settings, dimensions]);
  const validation = useMemo(() => validateTraySettings(settings), [settings]);

  useEffect(() => {
    window.localStorage.setItem(savedTraysStorageKey, JSON.stringify(savedTrays));
  }, [savedTrays]);

  useEffect(() => {
    if (settings.trayRoundedCornersEnabled || settings.trayEdgeSlopeMm > 0) {
      setIsAdvancedFinishEnabled(true);
    }
  }, [settings.trayEdgeSlopeMm, settings.trayRoundedCornersEnabled]);

  const updateSettings = (nextSettings: TraySettings) => {
    const compatibleSettings = normaliseCompatibleSettings(nextSettings);

    setSettingsByTemplate((current) => ({
      ...current,
      [compatibleSettings.template]: compatibleSettings,
    }));
  };

  const resetCurrentTemplate = () => {
    updateSettings({
      ...defaultSettingsByTemplate[activeTemplate],
      buildPlateSize: settings.buildPlateSize,
    });
  };

  const updateFinishSetting = (key: 'trayEdgeSlopeMm' | 'trayCornerRadiusMm', value: string) => {
    const numericValue = Number(value);
    updateSettings({
      ...settings,
      [key]: numericValue,
      ...(key === 'trayEdgeSlopeMm' && numericValue > 0 ? { trayRoundedCornersEnabled: false } : {}),
    });
  };

  const updateFinishToggle = (key: 'trayRoundedCornersEnabled', checked: boolean) => {
    updateSettings({
      ...settings,
      [key]: checked,
      ...(checked ? { trayEdgeSlopeMm: 0 } : {}),
      ...(checked && roundedCornersConflictWithMagnetCutouts(settings) ? { magnetCutoutsEnabled: false } : {}),
    });
  };

  const toggleAdvancedFinish = (checked: boolean) => {
    setIsAdvancedFinishEnabled(checked);

    if (!checked) {
      updateSettings({
        ...settings,
        trayEdgeSlopeMm: 0,
        trayRoundedCornersEnabled: false,
      });
    }
  };

  const saveCurrentTray = () => {
    const defaultName =
      settings.template === 'adapterLance'
        ? `Adapter Lance ${settings.rows} rows`
        : settings.template === 'skirmish'
        ? `Skirmish ${settings.columns} x ${settings.rows}`
        : settings.template === 'adapter'
        ? `Adapter ${settings.columns} x ${settings.rows}`
        : settings.template === 'lanceWedge'
        ? `Lance Wedge ${settings.rows} rows`
        : `Standard ${settings.columns} x ${settings.rows}`;
    const name = window.prompt('Save tray as:', defaultName);

    if (!name?.trim()) {
      return;
    }

    setSavedTrays((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        name: name.trim(),
        settings,
      },
    ]);
  };

  const loadSavedTray = (id: string) => {
    const savedTray = savedTrays.find((tray) => tray.id === id);
    if (!savedTray) {
      return;
    }

    setSettingsByTemplate((current) => ({
      ...current,
      [savedTray.settings.template]: {
        ...defaultSettingsByTemplate[savedTray.settings.template],
        ...normaliseCompatibleSettings(savedTray.settings),
      },
    }));
    setActiveTemplate(savedTray.settings.template);
  };

  const deleteSavedTray = (id: string) => {
    setSavedTrays((current) => current.filter((tray) => tray.id !== id));
  };

  const copyShareLink = async () => {
    const shareUrl = createShareUrl(settings);

    try {
      await navigator.clipboard.writeText(shareUrl);
      setShareStatus('Share link copied');
      window.setTimeout(() => setShareStatus(''), 2600);
    } catch {
      window.prompt('Copy this share link:', shareUrl);
    }
  };

  const handleDownload = async () => {
    try {
      const { downloadStl } = await import('./geometry/exportStl');
      downloadStl(settings);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Unable to export this tray as an STL.');
    }
  };
  const roundedCornersTooltip =
    'Rounds eligible outside tray corners. On rail trays this applies where enabled rails meet; on solid trays it applies to the outside perimeter.';

  return (
    <div className="app-shell" data-theme={theme}>
      <header className="site-banner" aria-label="Tray Workshop">
        <div className="brand-lockup">
          <img
            className="brand-mascot"
            src={`${import.meta.env.BASE_URL}tray-workshop-mascot.png`}
            alt=""
            aria-hidden="true"
          />
          <div className="brand-text">
            <p>STL movement tray generator</p>
            <strong>Tray Workshop</strong>
          </div>
        </div>
        <div className="banner-actions" aria-label="Support and feedback">
          <SupportButton />
          <a
            className="feedback-link"
            href="https://formsubmit.co/el/jukupe"
            target="_blank"
            rel="noreferrer"
            title="Send feedback or a support message through FormSubmit."
          >
            Feedback / support contact
          </a>
        </div>
      </header>

      <main className="app-main">
        <TrayControls
          settings={settings}
          theme={theme}
          onChange={updateSettings}
          onTemplateChange={setActiveTemplate}
          onThemeChange={setTheme}
          onResetTemplate={resetCurrentTemplate}
          validationMessages={validation.messages}
        />

        <section className="preview-panel" aria-label="Tray preview">
          <TrayPreviewSvg settings={settings} dimensions={dimensions} />
          <fieldset className={`tray-finish-panel ${isAdvancedFinishEnabled ? '' : 'is-collapsed'}`}>
            <legend>Advanced Tray Finish</legend>
            <label
              className="finish-toggle finish-master-toggle"
              title="Enable advanced finishing options such as mitred edge slope or flat rounded corners."
            >
              <input
                type="checkbox"
                checked={isAdvancedFinishEnabled}
                onChange={(event) => toggleAdvancedFinish(event.target.checked)}
              />
              <span>Enable advanced finish</span>
            </label>
            <div className="finish-controls" aria-hidden={!isAdvancedFinishEnabled}>
            <label
              className="finish-toggle"
              title={roundedCornersTooltip}
            >
              <input
                type="checkbox"
                checked={settings.trayRoundedCornersEnabled}
                disabled={!isAdvancedFinishEnabled}
                onChange={(event) => updateFinishToggle('trayRoundedCornersEnabled', event.target.checked)}
              />
              <span>Rounded corners</span>
            </label>
            <label
              className="finish-slider"
              title="Controls how far each eligible outer corner is rounded inward."
            >
              <span>Corner roundness</span>
              <input
                type="range"
                min="0.5"
                max="12"
                step="0.25"
                value={settings.trayCornerRadiusMm}
                disabled={!isAdvancedFinishEnabled || !settings.trayRoundedCornersEnabled}
                onChange={(event) => updateFinishSetting('trayCornerRadiusMm', event.target.value)}
              />
              <output>{settings.trayCornerRadiusMm.toFixed(2)} mm</output>
            </label>
            <label
              className="finish-slider"
              title="Slopes only the outside perimeter edges outward. Internal slots and magnet holes are left untouched."
            >
              <span>Outside edge slope</span>
              <input
                type="range"
                min="0"
                max="6"
                step="0.25"
                value={settings.trayEdgeSlopeMm}
                disabled={!isAdvancedFinishEnabled || settings.trayRoundedCornersEnabled}
                onChange={(event) => updateFinishSetting('trayEdgeSlopeMm', event.target.value)}
              />
              <output>{settings.trayEdgeSlopeMm.toFixed(2)} mm</output>
            </label>
            </div>
          </fieldset>
          <button
            className="download-button"
            type="button"
            title="Download the current tray as an STL file."
            disabled={validation.messages.length > 0}
            onClick={handleDownload}
          >
            Download STL
          </button>
          <TrayLibrary
            savedTrays={savedTrays}
            shareStatus={shareStatus}
            onSaveTray={saveCurrentTray}
            onLoadTray={loadSavedTray}
            onDeleteSavedTray={deleteSavedTray}
            onCopyShareLink={copyShareLink}
          />
          <label className="preview-toggle" title="Render an interactive 3D preview. Leave this off on slower devices.">
            <input
              type="checkbox"
              checked={is3dPreviewEnabled}
              onChange={(event) => setIs3dPreviewEnabled(event.target.checked)}
            />
            <span>3D preview</span>
          </label>
          {is3dPreviewEnabled && (settings.trayRoundedCornersEnabled || settings.trayEdgeSlopeMm > 0) && (
            <p className="preview-warning">
              Advanced tray finish may not render correctly in 3D preview but will appear correct in the download STL.
            </p>
          )}
          {is3dPreviewEnabled && (
            <Suspense fallback={<div className="preview-3d-loading">Loading 3D preview...</div>}>
              <TrayPreview3d settings={settings} />
            </Suspense>
          )}
        </section>

        <section className="output-panel" aria-label="Build plate and dimensions">
          <DimensionsPanel
            settings={settings}
            dimensions={dimensions}
            buildPlateFit={buildPlateFit}
            onSettingsChange={updateSettings}
          />
        </section>
      </main>

      <footer>
        <span>Tray Workshop v1.0</span>
        <span>Unofficial fan-made utility. Not affiliated with or endorsed by any tabletop wargame publisher.</span>
      </footer>
    </div>
  );
}
