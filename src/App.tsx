import { useEffect, useMemo, useRef, useState } from 'react';
import { DimensionsPanel } from './components/DimensionsPanel';
import { TrayControls } from './components/TrayControls';
import { TrayPreviewSvg } from './components/TrayPreviewSvg';
import { downloadStl } from './geometry/exportStl';
import { calculateBuildPlateFit, calculateTrayDimensions, validateTraySettings } from './geometry/trayMath';
import type { SavedTray, ThemeName, TraySettings, TrayTemplate } from './types';

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

const defaultSettingsByTemplate: Record<TrayTemplate, TraySettings> = {
  standard: standardDefaults,
  lanceWedge: lanceWedgeDefaults,
};

const savedTraysStorageKey = 'tray-workshop.saved-trays.v1';

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
    return stored ? (JSON.parse(stored) as SavedTray[]) : [];
  } catch {
    return [];
  }
}

export default function App() {
  const [activeTemplate, setActiveTemplate] = useState<TrayTemplate>('standard');
  const [settingsByTemplate, setSettingsByTemplate] =
    useState<Record<TrayTemplate, TraySettings>>(defaultSettingsByTemplate);
  const [savedTrays, setSavedTrays] = useState<SavedTray[]>(() => readSavedTrays());
  const [theme, setTheme] = useState<ThemeName>('darkGrey');
  const settings = settingsByTemplate[activeTemplate];
  const dimensions = useMemo(() => calculateTrayDimensions(settings), [settings]);
  const buildPlateFit = useMemo(() => calculateBuildPlateFit(settings, dimensions), [settings, dimensions]);
  const validation = useMemo(() => validateTraySettings(settings), [settings]);

  useEffect(() => {
    window.localStorage.setItem(savedTraysStorageKey, JSON.stringify(savedTrays));
  }, [savedTrays]);

  const updateSettings = (nextSettings: TraySettings) => {
    setSettingsByTemplate((current) => ({
      ...current,
      [nextSettings.template]: nextSettings,
    }));
  };

  const resetCurrentTemplate = () => {
    updateSettings({
      ...defaultSettingsByTemplate[activeTemplate],
      buildPlateSize: settings.buildPlateSize,
    });
  };

  const saveCurrentTray = () => {
    const defaultName =
      settings.template === 'lanceWedge'
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
      [savedTray.settings.template]: savedTray.settings,
    }));
    setActiveTemplate(savedTray.settings.template);
  };

  const deleteSavedTray = (id: string) => {
    setSavedTrays((current) => current.filter((tray) => tray.id !== id));
  };

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
        <SupportButton />
      </header>

      <div className="feedback-strip" aria-label="Feedback and support contact">
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

      <main className="app-main">
        <TrayControls
          settings={settings}
          theme={theme}
          savedTrays={savedTrays}
          onChange={updateSettings}
          onTemplateChange={setActiveTemplate}
          onThemeChange={setTheme}
          onResetTemplate={resetCurrentTemplate}
          onSaveTray={saveCurrentTray}
          onLoadTray={loadSavedTray}
          onDeleteSavedTray={deleteSavedTray}
          validationMessages={validation.messages}
          onDownload={() => downloadStl(settings)}
        />

        <section className="preview-panel" aria-label="Tray preview and dimensions">
          <TrayPreviewSvg settings={settings} dimensions={dimensions} />
          <DimensionsPanel
            settings={settings}
            dimensions={dimensions}
            buildPlateFit={buildPlateFit}
            onSettingsChange={updateSettings}
          />
        </section>
      </main>

      <footer>Unofficial fan-made utility. Not affiliated with or endorsed by any tabletop wargame publisher.</footer>
    </div>
  );
}
