import React, { useEffect, useRef, useState } from "react";
import { useSimulation } from "./shared/useSimulation.js";
import { SCENARIOS } from "./shared/constants.js";
import Scene from "./scene/Scene.jsx";
import MissionControlView from "./ui/MissionControlView.jsx";
import BuildGuide from "./ui/BuildGuide.jsx";
import ScoreScreen from "./ui/ScoreScreen.jsx";
import { missionTime, number, phaseLabels } from "./ui/format.js";
import "./flight.css";
import Dashboard from "./ui/Dashboard.jsx";
import {useMissionBroadcast} from "./ui/MissionStation.jsx";
import { resultRevealDelay } from "./ui/resultTiming.js";

function Drawer({ panel, onClose, snapshot }) {
  const dialog = useRef(null);
  useEffect(() => {
    const d = dialog.current;
    d.showModal();
    return () => d.close();
  }, []);
  return (
    <dialog
      ref={dialog}
      className="flight-drawer"
      onCancel={onClose}
      aria-label={panel === "guide" ? "Build guide" : "Mission control"}
    >
      <button className="drawer-close" onClick={onClose} autoFocus>
        Close panel ×
      </button>
      {panel === "guide" ? (
        <>
          <h2>Perseverance visual edition</h2>
          <p>
            NASA rover asset. Illustrative entry hardware and sky-crane
            geometry. Generic 3-DoF flight now includes commanded lift, terrain contact,
            heat flux and storm disturbances. See the current integration notes for
            the revised state contract and scientific boundaries.
          </p>
          <AssetCredits />
          <BuildGuide />
        </>
      ) : (
        <>
          <MissionControlView snapshot={snapshot} />
        </>
      )}
    </dialog>
  );
}
function AssetCredits() {
  return (
    <section className="asset-credits">
      <h3>Sources & visual boundaries</h3>
      <p>
        Rover: NASA/JPL. Orbital globe: NASA/JPL/USGS Viking MDIM. Entry
        corridor: NASA Northeast Syrtis–Jezero HiRISE/CTX/HRSC mosaic.
        Panorama: NASA/JPL-Caltech/ASU/MSSS, Airey Hill (PIA26080). Close
        surface: Poly Haven, Rocky Terrain 02, CC0. Sky uses the photograph’s
        upper band with an extended gradient, not a measured all-sky HDRI.
        Terrain geometry is Mars-inspired, not a Jezero elevation reconstruction.
      </p>
      <p>
        The parachute, stage, tether, heat glow, wind response and dust are
        presentation effects driven by the flight snapshot. Dust uses drag, gravity
        and simplified collision; stage/tether motion remains illustrative.
        The three required scoring limits are retained.
      </p>
      <a
        href="https://science.nasa.gov/3d-resources/mars-2020-perseverance-rover/"
        target="_blank"
        rel="noreferrer"
      >
        NASA rover asset ↗
      </a>{" "}
      ·{" "}
      <a
        href="https://www.jpl.nasa.gov/images/pia26080-perseverances-360-degree-view-from-airey-hill/"
        target="_blank"
        rel="noreferrer"
      >
        NASA panorama ↗
      </a>{" "}
      ·{" "}
      <a
        href="https://polyhaven.com/a/rocky_terrain_02"
        target="_blank"
        rel="noreferrer"
      >
        Terrain materials ↗
      </a>
    </section>
  );
}

export default function App() {
  const sim = useSimulation(),
    { snapshot, running, started, scenario, speed, runId } = sim;
  const [camera, setCamera] = useState("follow"),
    [panel, setPanel] = useState(null),
    [hiddenResult, setHiddenResult] = useState(-1),
    [blend, setBlend] = useState(true),
    [asset, setAsset] = useState("Flight rover ready"),
    [performance,setPerformance]=useState(null),
    [detailed,setDetailed]=useState(false),
    [charts,setCharts]=useState(true),
    [review,setReview]=useState(false),
    [tuning,setTuning]=useState({response:1,precision:1}),
    [seed,setSeed]=useState(42),
    [pastRuns,setPastRuns]=useState([]),
    [showResult,setShowResult]=useState(false);
  const {open:openStation,url:stationUrl}=useMissionBroadcast(snapshot,running,runId,performance);
  const recorded=useRef(-1);
  useEffect(()=>{if(snapshot.result&&recorded.current!==runId){recorded.current=runId;setPastRuns(p=>[{scenario:snapshot.scenario,seed:snapshot.seed,tuning:{...tuning},...snapshot.result},...p].slice(0,6));}},[snapshot.result,runId]);
  const resultAvailable=Boolean(snapshot.result);
  useEffect(()=>{
    setShowResult(false);
    if(!resultAvailable)return undefined;
    const timer=window.setTimeout(()=>setShowResult(true),resultRevealDelay(snapshot.result));
    return()=>window.clearTimeout(timer);
  },[resultAvailable,runId]);
  const { state, diagnostics, wind, metrics } = snapshot;
  useEffect(() => {
    document.body.classList.toggle("flight-launched", started);
    return () => document.body.classList.remove("flight-launched");
  }, [started]);
  function reset(next = scenario) {
    const nextSeed=next===scenario?seed:SCENARIOS[next].seed;
    setSeed(nextSeed);sim.reset(next,{seed:nextSeed,tuning});
    setCamera("follow");
    setPanel(null);
    setAsset("Flight rover ready");
    setDetailed(false);
    setShowResult(false);
  }
  const status = snapshot.complete
    ? snapshot.result?.success
      ? "TOUCHDOWN CONFIRMED"
      : "MISSION ENDED"
    : running
      ? "AUTONOMOUS FLIGHT"
      : started
        ? "FLIGHT PAUSED"
        : camera==="inspection" ? "ROVER INSPECTION" : "ORBITAL MISSION BRIEFING";
  const actual = diagnostics.actualThrottle || 0;
  return (
    <div className={`visual-app ${started ? "launched" : ""}`}>
      {!started && (
        <header className="visual-intro">
          <a className="visual-wordmark" href="#flight">
            A<span>REION</span>
            <small>TEAM INDENTATION / FINAL BUILD 1.0</small>
          </a>
          <span>PERSEVERANCE-INSPIRED · LIVE PHYSICS</span>
        </header>
      )}
      <main className="visual-main">
        <section
          id="flight"
          className={`flight-stage ${started ? "in-flight" : ""} ${blend ? "difference-mode" : "contrast-mode"}`}
          aria-label="Flight visualization"
        >
          <Scene
            live={sim.live}
            runId={runId}
            cameraMode={camera}
            briefing={!started}
            running={running}
            onAsset={setAsset}
            detailed={detailed}
            onPerformance={setPerformance}
          />
          <div className="scene-vignette" />
          <div className="hud-header">
            <div className="hud-heading hud-ink">
              <span className="hud-kicker">AREION · TEAM INDENTATION / MARS ARRIVAL</span>
              <h1>
                {started ? phaseLabels[state.phase] : "A world worth reaching."}
              </h1>
              <p>
                <i />
                {status}
                {started && ` · T+ ${missionTime(snapshot.time)}`}
              </p>
            </div>
            <nav className="hud-nav" aria-label="Flight tools">
              <button onClick={() => setBlend((x) => !x)} aria-pressed={!blend}>
                {blend ? "High contrast" : "Difference blend"}
              </button>
              <button onClick={()=>setReview(x=>!x)}>Mission control</button>
              <a className="station-link" href={stationUrl} target="_blank" rel="noopener">Open second station ↗</a>
              <button onClick={() => setPanel("guide")}>Build guide ↗</button>
            </nav>
          </div>
          {!started && (
            <div className="launch-brief">
              <span className="hud-kicker">01 / THE NEXT ARRIVAL</span>
              <h2>
                Some journeys
                <br />
                begin with
                <br />
                <em>a landing.</em>
              </h2>
              <p>
                Target: local X 0 m / Z 0 m · 50 m radius.<br/>
                Entry: 35 km datum altitude · 1,300 m/s.<br/>
                Vehicle: 900 kg dry + scenario propellant.<br/>
                Limits: touchdown &lt; 2.5 m/s · peak load &lt; 5 G.
              </p>
              <label htmlFor="scenario">FLIGHT SCENARIO</label>
              <select
                id="scenario"
                value={scenario}
                onChange={(e) => reset(e.target.value)}
              >
                {Object.entries(SCENARIOS).map(([id, s]) => (
                  <option value={id} key={id}>
                    {s.label}
                  </option>
                ))}
              </select>
              <button
                className="launch-button"
                onClick={()=>{setCamera("follow");sim.toggle();}}
                disabled={asset.startsWith("Loading")}
              >
                Begin entry <span>↗</span>
              </button>
              <small role="status">{asset}</small>
              <div className="preflight-actions"><button onClick={()=>{setCamera(camera==="inspection"?"follow":"inspection");}}> {camera==="inspection"?"Return to orbit":"Inspect rover"}</button><button onClick={()=>{setDetailed(x=>!x);setCamera("inspection");}}>{detailed?"Use lightweight rover":"Inspect NASA original"}</button></div>
              <details className="tuning-controls"><summary>Guidance & repeatable scenarios</summary><label>Random seed <input type="number" value={seed} onChange={e=>{const s=Number(e.target.value);setSeed(s);sim.reset(scenario,{seed:s,tuning});}}/></label>{[["response","Vertical response"],["precision","Target correction"]].map(([key,label])=><label key={key}>{label} ×{tuning[key].toFixed(2)}<input type="range" min="0.6" max="1.4" step="0.05" value={tuning[key]} onChange={e=>{const t={...tuning,[key]:Number(e.target.value)};setTuning(t);sim.reset(scenario,{seed,tuning:t});}}/></label>)}<small>Applied before launch. No manual flight control.</small></details>
            </div>
          )}
          {started && (
            <>
              <aside className="flight-telemetry" aria-label="Live telemetry">
                <div className="hud-ink">
                  <span className="hud-kicker">TELEMETRY / TRUE STATE</span>
                  <div className="hud-metric">
                    <label>Altitude AGL</label>
                    <strong>
                      {state.altitude >= 1000
                        ? number(state.altitude / 1000, 2)
                        : number(state.altitude, 1)}
                      <small>{state.altitude >= 1000 ? "km" : "m"}</small>
                    </strong>
                  </div>
                  <div className="hud-metric">
                    <label>Vertical velocity</label>
                    <strong>
                      {number(state.velocity.y, 1)}
                      <small>m/s</small>
                    </strong>
                  </div>
                  <div className="hud-pair">
                    <div>
                      <label>Propellant</label>
                      <b>
                        {number(state.fuel, 1)}
                        <small>kg</small>
                      </b>
                    </div>
                    <div>
                      <label>Peak load</label>
                      <b>
                        {number(metrics.peakG, 2)}
                        <small>G</small>
                      </b>
                    </div>
                  </div>
                  <div className="hud-throttle">
                    <label>
                      Actual thrust command <b>{number(actual * 100)}%</b>
                    </label>
                    <div>
                      <i style={{ transform: `scaleX(${actual})` }} />
                    </div>
                  </div>
                  <div className="hud-small">
                    <span>Heat flux</span>
                    <b>{number(state.heatFlux /1000,1)} kW/m²</b>
                  </div>
                  <div className="hud-small">
                    <span>Wind · lateral</span>
                    <b>{number(Math.hypot(wind.x, wind.z), 1)} m/s</b>
                  </div>
                  <div className="hud-small">
                    <span>Target offset</span>
                    <b>
                      {number(
                        Math.hypot(state.position.x, state.position.z),
                        1,
                      )}{" "}
                      m
                    </b>
                  </div>
                </div>
                <div className="storm-status">{(snapshot.environment?.storm??0)>.18?"DUST FRONT ACTIVE":"ATMOSPHERE MONITORED"} · {number((snapshot.environment?.storm??0)*100)}%</div>
              </aside>
              {charts&&<aside className="flight-charts" aria-label="Continuous flight graphs"><Dashboard snapshot={snapshot}/></aside>}
              <div className="phase-ribbon hud-ink" aria-label="Flight phases">
                {["aerobraking", "parachute", "poweredDescent", "landed"].map(
                  (phase, i) => (
                    <div
                      key={phase}
                      className={
                        state.phase === phase
                          ? "current"
                          : snapshot.events.some((e) => e.phase === phase)
                            ? "passed"
                            : ""
                      }
                    >
                      <span>0{i + 1}</span>
                      {
                        ["Entry", "Parachute", "Powered descent", "Touchdown"][
                          i
                        ]
                      }
                    </div>
                  ),
                )}
              </div>
              {!running && !snapshot.complete && (
                <div className="flight-paused">Ⅱ PAUSED · drag to inspect</div>
              )}
            </>
          )}
          <div className="hud-bottom">
            <div className="flight-controls">
              {started && (
                <>
                  <button
                    onClick={sim.toggle}
                    disabled={snapshot.complete}
                    aria-label={
                      running ? "Pause simulation" : "Resume simulation"
                    }
                  >
                    {running ? "Ⅱ Pause" : "▶ Resume"}
                  </button>
                  <button onClick={() => reset()} aria-label="Reset mission">
                    ↻ Reset
                  </button>
                  <button onClick={()=>setCharts(x=>!x)}>{charts?"Hide charts":"Show charts"}</button>
                  <button onClick={()=>setDetailed(x=>!x)}>{detailed?"Flight rover":"Detailed rover"}</button>
                  <div className="flight-speeds" aria-label="Playback speed">
                    {[1, 4, 10].map((n) => (
                      <button
                        key={n}
                        onClick={() => sim.setSpeed(n)}
                        aria-pressed={speed === n}
                        aria-label={`${n} times playback speed`}
                      >
                        {n}×
                      </button>
                    ))}
                  </div>
                </>
              )}
              {started && (
                <div className="flight-cameras" aria-label="Camera mode">
                  <button
                    aria-pressed={camera === "follow"}
                    onClick={() => setCamera("follow")}
                  >
                    Vehicle
                  </button>
                  <button
                    aria-pressed={camera === "trajectory"}
                    onClick={() => setCamera("trajectory")}
                  >
                    Trajectory
                  </button>
                </div>
              )}
              {snapshot.result && (
                <button onClick={() => {setShowResult(true);setHiddenResult(-1);}}>
                  Mission result ↗
                </button>
              )}
            </div>
            <div className="hud-footer hud-ink">
              <span>DRAG TO ORBIT · SCROLL TO ZOOM</span>
              <span>
                {started
                  ? "ILLUSTRATIVE SKY CRANE · GENERIC 3-DoF PHYSICS"
                  : "ORBITAL BRIEFING · LOCAL TARGET X 0 / Z 0"}
              </span>
              <span>NASA/JPL/USGS · POLY HAVEN</span>
            </div>
          </div>
          <div className="reticle" aria-hidden="true">
            <i />
            <i />
          </div>
          {performance&&<output className="frame-budget">{number(performance.fps)} FPS · {number(performance.frameMs,1)} ms · {performance.drawCalls} draws</output>}
        </section>
        {!started && (
          <div className="preflight-note">
            <span>REAL ASSET. SHARED STATE. AUTONOMOUS ARRIVAL.</span>
            <p>
              Launch opens an edge-to-edge flight view. All telemetry remains
              live; visual easing does not change the simulation.
            </p>
          </div>
        )}
      </main>
      {review&&<aside className="side-review"><button onClick={()=>setReview(false)}>Close Mission Control ×</button><button onClick={openStation}>Open separate window ↗</button><MissionControlView snapshot={snapshot} performance={performance}/>{pastRuns.length>0&&<section><h2>Recent mission comparison</h2><table><thead><tr><th>Scenario / seed</th><th>Touchdown</th><th>Offset</th><th>Fuel used</th><th>Result</th></tr></thead><tbody>{pastRuns.map((r,i)=><tr key={i}><td>{r.scenario} / {r.seed}</td><td>{number(r.verticalSpeed,2)} m/s</td><td>{number(r.distance,1)} m</td><td>{number(r.fuelUsed,1)} kg</td><td>{r.success?"PASS":"FAIL"}</td></tr>)}</tbody></table></section>}</aside>}
      {panel && (
        <Drawer
          panel={panel}
          onClose={() => setPanel(null)}
          snapshot={snapshot}
        />
      )}
      {snapshot.result && showResult && hiddenResult !== runId && (
        <ScoreScreen
          result={snapshot.result}
          time={snapshot.time}
          onClose={() => setHiddenResult(runId)}
          onReplay={() => reset()}
        />
      )}
    </div>
  );
}
