import React, { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, Marker, Polyline, TileLayer } from "react-leaflet";
import type { LatLngTuple } from "leaflet";

export type TimedCoord = { lat: number; lng: number; t: number };

type Props = {
  points: TimedCoord[];
  zoom?: number;
  tileUrl?: string;
  tileAttribution?: string;
  containerStyle?: React.CSSProperties;
  onPositionChange?: (pos: LatLngTuple) => void;
};

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

export function SmoothTimedMarkerMap({
  points,
  zoom = 15,
  tileUrl = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
  tileAttribution = "&copy; OpenStreetMap contributors",
  containerStyle,
  onPositionChange,
}: Props) {
  const safePoints = useMemo(() => points ?? [], [points]);

  const start = safePoints[0];
  const [pos, setPos] = useState<LatLngTuple>(
    start ? [start.lat, start.lng] : [0, 0],
  );

  const segIndexRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const segStartTimeRef = useRef<number | null>(null);

  useEffect(() => {
    if (safePoints.length === 0) return;

    // Reset when points change
    segIndexRef.current = 0;
    segStartTimeRef.current = null;
    setPos([safePoints[0].lat, safePoints[0].lng]);

    if (safePoints.length < 2) return;

    const frame = (now: number) => {
      const i = segIndexRef.current;
      const a = safePoints[i];
      const b = safePoints[i + 1];

      if (!b) {
        const last = safePoints[safePoints.length - 1];
        const p: LatLngTuple = [last.lat, last.lng];
        setPos(p);
        onPositionChange?.(p);
        return;
      }

      if (segStartTimeRef.current == null) segStartTimeRef.current = now;

      const segDuration = Math.max(1, (b.t ?? 1000) - (a.t ?? 0)); // ms
      const elapsed = now - segStartTimeRef.current;
      const tt = Math.min(1, elapsed / segDuration);

      const p: LatLngTuple = [lerp(a.lat, b.lat, tt), lerp(a.lng, b.lng, tt)];
      setPos(p);
      onPositionChange?.(p);

      if (tt >= 1) {
        segIndexRef.current = i + 1;
        segStartTimeRef.current = now;
      }

      rafRef.current = requestAnimationFrame(frame);
    };

    rafRef.current = requestAnimationFrame(frame);

    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, [safePoints, onPositionChange]);

  const polyline = useMemo(
    () => safePoints.map((p) => [p.lat, p.lng] as LatLngTuple),
    [safePoints],
  );

  if (!start) return <div>No points provided.</div>;

  return (
    <div
      style={{
        height: "100vh",
        width: "100vw",
        ...containerStyle,
      }}
    >
      <MapContainer
        center={[start.lat, start.lng]}
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
