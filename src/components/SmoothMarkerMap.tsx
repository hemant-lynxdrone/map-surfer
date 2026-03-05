import React, { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, Marker, Polyline, TileLayer } from "react-leaflet";
import type { LatLngTuple } from "leaflet";

export type CoordNoT = { lat: number; lng: number };
type Coord = { lat: number; lng: number; t: number };
type Mode = "A" | "B";

type Props = {
  coords: CoordNoT[];

  // map
  zoom?: number;
  tileUrl?: string;
  tileAttribution?: string;
  containerStyle?: React.CSSProperties;

  // controls
  showControls?: boolean;
  defaultMode?: Mode; // "A" or "B"
  defaultStepMs?: number; // for A
  defaultSpeedMps?: number; // for B
};

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function haversineMeters(a: CoordNoT, b: CoordNoT) {
  const R = 6371000; // meters
  const toRad = (x: number) => (x * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;

  return 2 * R * Math.asin(Math.sqrt(s));
}

export function SmoothMarkerMap({
  coords,
  zoom = 15,
  tileUrl = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
  tileAttribution = "&copy; OpenStreetMap contributors",
  containerStyle,

  showControls = true,
  defaultMode = "A",
  defaultStepMs = 800,
  defaultSpeedMps = 500,
}: Props) {
  const raw = useMemo(() => coords ?? [], [coords]);

  const [mode, setMode] = useState<Mode>(defaultMode);
  const [stepMs, setStepMs] = useState<number>(defaultStepMs);
  const [speedMps, setSpeedMps] = useState<number>(defaultSpeedMps);

  // Build points[] with generated t
  const points: Coord[] = useMemo(() => {
    if (raw.length === 0) return [];

    if (mode === "A") {
      const ms = Number.isFinite(stepMs) && stepMs > 0 ? stepMs : defaultStepMs;
      return raw.map((p, i) => ({ ...p, t: i * ms }));
    }

    const v =
      Number.isFinite(speedMps) && speedMps > 0 ? speedMps : defaultSpeedMps;

    let t = 0;
    return raw.map((p, i) => {
      if (i > 0) {
        const dist = haversineMeters(raw[i - 1], raw[i]);
        t += (dist / v) * 1000; // ms
      }
      return { ...p, t: Math.round(t) };
    });
  }, [raw, mode, stepMs, speedMps, defaultStepMs, defaultSpeedMps]);

  const start = points[0] ?? { lat: 0, lng: 0, t: 0 };
  const [pos, setPos] = useState<LatLngTuple>([start.lat, start.lng]);

  // Animation refs
  const segIndexRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const segStartTimeRef = useRef<number | null>(null);

  useEffect(() => {
    if (points.length < 2) {
      if (points.length === 1) setPos([points[0].lat, points[0].lng]);
      return;
    }

    // Reset when points/mode changes
    segIndexRef.current = 0;
    segStartTimeRef.current = null;
    setPos([points[0].lat, points[0].lng]);

    const frame = (now: number) => {
      const i = segIndexRef.current;
      const a = points[i];
      const b = points[i + 1];

      if (!b) {
        const last = points[points.length - 1];
        setPos([last.lat, last.lng]);
        return;
      }

      if (segStartTimeRef.current == null) segStartTimeRef.current = now;

      const segDuration = Math.max(1, b.t - a.t);
      const elapsed = now - segStartTimeRef.current;
      const t = Math.min(1, elapsed / segDuration);

      setPos([lerp(a.lat, b.lat, t), lerp(a.lng, b.lng, t)]);

      if (t >= 1) {
        segIndexRef.current = i + 1;
        segStartTimeRef.current = now;
      }

      rafRef.current = requestAnimationFrame(frame);
    };

    rafRef.current = requestAnimationFrame(frame);

    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, [points]);

  const polyline: LatLngTuple[] = points.map((p) => [p.lat, p.lng]);

  if (raw.length === 0) return <div>No coordinates provided.</div>;

  return (
    <div
      style={{
        position: "relative",
        height: "100vh",
        width: "100vw",
        ...containerStyle,
      }}
    >
      {showControls && (
        <div
          style={{
            position: "absolute",
            zIndex: 999,
            top: 12,
            left: 60,
            padding: 12,
            borderRadius: 12,
            background: "rgba(0,0,0,0.65)",
            color: "white",
            fontFamily: "system-ui, Arial",
            minWidth: 240,
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: 8 }}>Marker motion</div>

          <label style={{ display: "block", marginBottom: 8 }}>
            Mode:&nbsp;
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value as Mode)}
              style={{ padding: "6px 8px", borderRadius: 8 }}
            >
              <option value="A">A — Fixed time per segment</option>
              <option value="B">B — Constant speed (m/s)</option>
            </select>
          </label>

          {mode === "A" ? (
            <label style={{ display: "block" }}>
              Step (ms per segment):&nbsp;
              <input
                type="number"
                value={stepMs}
                min={1}
                onChange={(e) =>
                  setStepMs(parseInt(e.target.value || `${defaultStepMs}`, 10))
                }
                style={{ width: 110, padding: "6px 8px", borderRadius: 8 }}
              />
            </label>
          ) : (
            <label style={{ display: "block" }}>
              Speed (m/s):&nbsp;
              <input
                type="number"
                value={speedMps}
                min={0.1}
                step={0.1}
                onChange={(e) =>
                  setSpeedMps(
                    parseFloat(e.target.value || `${defaultSpeedMps}`),
                  )
                }
                style={{ width: 110, padding: "6px 8px", borderRadius: 8 }}
              />
            </label>
          )}

          <div style={{ marginTop: 8, opacity: 0.8, fontSize: 12 }}>
            Points: {raw.length}
          </div>
        </div>
      )}

      <MapContainer
        center={[raw[0].lat, raw[0].lng]}
        zoom={zoom}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer attribution={tileAttribution} url={tileUrl} />
        <Polyline positions={polyline} />
        <Marker position={pos} />
      </MapContainer>
    </div>
  );
}
