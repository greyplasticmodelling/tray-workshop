import { useMemo, useState } from 'react';
import { DimensionsPanel } from './components/DimensionsPanel';
import { TrayControls } from './components/TrayControls';
import { TrayPreviewSvg } from './components/TrayPreviewSvg';
import { downloadStl } from './geometry/exportStl';
import { calculateBuildPlateFit, calculateTrayDimensions, validateTraySettings } from './geometry/trayMath';
import type { ThemeName, TraySettings } from './types';

const defaultSettings: TraySettings = {
  baseWidthMm: 25,
  baseDepthMm: 25,
  columns: 5,
  rows: 4,
  toleranceMm: 0.5,
  floorThicknessMm: 1.6,
  railThicknessMm: 2,
  railHeightMm: 2,
  frontRailEnabled: false,
  rearRailEnabled: true,
  leftRailEnabled: true,
  rightRailEnabled: true,
  buildPlateSize: '256x256',
};

export default function App() {
  const [settings, setSettings] = useState<TraySettings>(defaultSettings);
  const [theme, setTheme] = useState<ThemeName>('workshop');
  const dimensions = useMemo(() => calculateTrayDimensions(settings), [settings]);
  const buildPlateFit = useMemo(() => calculateBuildPlateFit(settings, dimensions), [settings, dimensions]);
  const validation = useMemo(() => validateTraySettings(settings), [settings]);

  return (
    <div className="app-shell" data-theme={theme}>
      <main className="app-main">
        <TrayControls
          settings={settings}
          theme={theme}
          onChange={setSettings}
          onThemeChange={setTheme}
          validationMessages={validation.messages}
          onDownload={() => downloadStl(settings)}
        />

        <section className="preview-panel" aria-label="Tray preview and dimensions">
          <TrayPreviewSvg settings={settings} dimensions={dimensions} />
          <DimensionsPanel settings={settings} dimensions={dimensions} buildPlateFit={buildPlateFit} />
        </section>
      </main>

      <footer>Unofficial fan-made utility. Not affiliated with or endorsed by any tabletop wargame publisher.</footer>
    </div>
  );
}
