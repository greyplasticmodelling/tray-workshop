import { getMaxTrayBevelWidthMm } from '../geometry/trayMath';
import type { TraySettings } from '../types';

type Props = {
  enabled: boolean;
  settings: TraySettings;
  onChange: (settings: TraySettings) => void;
};

export function TrayBevelControl({ enabled, settings, onChange }: Props) {
  const isRailTray = settings.template === 'standard' || settings.template === 'lanceWedge';
  const hasEdge = !isRailTray || settings.frontRailEnabled || settings.rearRailEnabled || settings.leftRailEnabled || settings.rightRailEnabled;
  const maxWidthMm = getMaxTrayBevelWidthMm(settings);
  const effectiveWidthMm = Math.min(settings.trayBevelWidthMm, Math.max(0.25, maxWidthMm));
  const bevelPixels = effectiveWidthMm * 24;
  const cornerOffset = 12 + bevelPixels;
  const cornerPath =
    settings.trayBevelCornerStyle === 'mitred'
      ? `M 34 88 V ${cornerOffset + 14} L ${cornerOffset + 14} 34 H 116`
      : `M 34 88 V ${cornerOffset + 14} Q 34 34 ${cornerOffset + 14} 34 H 116`;
  const crossSectionCut = settings.trayBevelProfile === 'rounded'
    ? `M 18 ${34 + bevelPixels} C 18 ${34 + bevelPixels * (1 - 0.5523)} ${18 + bevelPixels * (1 - 0.5523)} 34 ${18 + bevelPixels} 34`
    : settings.trayBevelProfile === 'double'
      ? `M 18 ${34 + bevelPixels} L ${18 + bevelPixels * 0.35} ${34 + bevelPixels * 0.35} L ${18 + bevelPixels} 34`
      : `M 18 ${34 + bevelPixels} L ${18 + bevelPixels} 34`;
  const crossSectionOutline = `${crossSectionCut} H 112 V 94 H 18 Z`;

  return (
    <section className="rail-bevel-mockup" aria-label="Top outside edge profile">
      <div className="rail-bevel-heading">
        <label className="finish-toggle" title={!hasEdge ? 'Enable at least one rail to shape its top outside edge.' : maxWidthMm < 0.25 ? 'Increase the outer border or wall thickness to make room for an edge profile.' : 'Shape the top outside edge without enlarging the tray footprint.'}>
          <input
            type="checkbox"
            checked={settings.trayBevelEnabled}
            disabled={!enabled || !hasEdge || maxWidthMm < 0.25}
            onChange={(event) => onChange({
              ...settings,
              trayBevelEnabled: event.target.checked,
              trayBevelWidthMm: Math.min(settings.trayBevelWidthMm, maxWidthMm),
              ...(event.target.checked ? { trayEdgeSlopeMm: 0, trayRoundedCornersEnabled: false } : {}),
            })}
          />
          <span>Top outside edge profile</span>
        </label>
      </div>
      {enabled && maxWidthMm < 0.25 && (
        <p className="rail-bevel-status">{hasEdge ? 'Increase the outside border to make room for an edge profile.' : 'Enable an outside rail to shape its edge.'}</p>
      )}
      {enabled && settings.trayBevelEnabled && hasEdge && (
        <div className="rail-bevel-details">
          <label className="finish-slider" title="How far the profile cuts inward and downward from the top outside edge.">
            <span>Profile size</span>
            <output>{effectiveWidthMm.toFixed(2)} mm</output>
            <input
              type="range"
              min="0.25"
              max={maxWidthMm}
              step="0.25"
              value={effectiveWidthMm}
              onChange={(event) => onChange({ ...settings, trayBevelWidthMm: Number(event.target.value) })}
            />
          </label>
          <label className="rail-bevel-profile" title="Choose a straight chamfer, smooth round-over, or two angled bevel faces.">
            <span>Edge profile</span>
            <select
              value={settings.trayBevelProfile}
              onChange={(event) => onChange({ ...settings, trayBevelProfile: event.target.value as TraySettings['trayBevelProfile'] })}
            >
              <option value="single">Single bevel</option>
              <option value="rounded">Rounded edge</option>
              <option value="double">Double bevel</option>
            </select>
          </label>
          <div className="rail-bevel-style">
            <span>Corner join</span>
            <div className="rail-bevel-segments" role="group" aria-label="Bevel corner join">
              <button
                type="button"
                aria-pressed={settings.trayBevelCornerStyle === 'mitred'}
                title="Join bevels with a sharp 45-degree diagonal at the corner."
                onClick={() => onChange({ ...settings, trayBevelCornerStyle: 'mitred' })}
              >
                Mitred
              </button>
              <button
                type="button"
                aria-pressed={settings.trayBevelCornerStyle === 'curved'}
                title="Turn the bevel around the corner with a smooth curve."
                onClick={() => onChange({
                  ...settings,
                  trayBevelCornerStyle: 'curved',
                  trayBevelWidthMm: Math.min(settings.trayBevelWidthMm, getMaxTrayBevelWidthMm({ ...settings, trayBevelCornerStyle: 'curved' })),
                })}
              >
                Curved
              </button>
            </div>
          </div>
          <div className="rail-bevel-diagrams">
            <figure>
              <svg viewBox="0 0 130 110" role="img" aria-label={`${settings.trayBevelProfile} top outside edge profile in cross-section`}>
                <path d={crossSectionOutline} className="rail-bevel-solid" />
                <path d={crossSectionCut} className="rail-bevel-cut" />
              </svg>
              <figcaption>Edge cross-section</figcaption>
            </figure>
            <figure>
              <svg viewBox="0 0 130 110" role="img" aria-label={`${settings.trayBevelCornerStyle} bevel join viewed from above`}>
                <path d="M 18 88 V 18 H 116" className="rail-bevel-outline" />
                <path d={cornerPath} className="rail-bevel-cut" />
              </svg>
              <figcaption>Corner from above</figcaption>
            </figure>
          </div>
          <p className="rail-bevel-status">Shapes the outside top edge. The bottom footprint stays the same.</p>
        </div>
      )}
    </section>
  );
}
