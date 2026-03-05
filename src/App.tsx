import coordsA from "./coordinates/coordsA.json";
import { SmoothMarkerMap } from "./components/SmoothMarkerMap";
// import coordsB from "./coordinates/coordsB.json";
// import { SmoothTimedMarkerMap } from "./components/SmoothTimedMarkerMap";

export default function App() {
  return (
    <SmoothMarkerMap
      coords={coordsA}
      defaultMode="A"
      defaultStepMs={800}
      defaultSpeedMps={5}
      showControls
      containerStyle={{ height: "100vh", width: "100vw" }}
    />
  );
  // return <SmoothTimedMarkerMap points={coordsB} />;
}
