import React, { useEffect, useMemo, useState } from "react";
import {
  autoplayStep,
  buildBuilding,
  cameraFor,
  createGame,
  endTurn,
  isDiscovered,
  kingdomPopulation,
  moveCamera,
  moveUnit,
  recruit,
  regionAt,
  terrainAt,
  VIEW_SIZE,
} from "./game.js";
import CampaignHeader from "./components/CampaignHeader.jsx";
import ChronicleDialog from "./components/ChronicleDialog.jsx";
import GameOverScreen from "./components/GameOverScreen.jsx";
import SelectedDetails from "./components/SelectedDetails.jsx";
import Sidebar from "./components/Sidebar.jsx";
import StandingsDialog from "./components/StandingsDialog.jsx";
import WorldMap from "./components/WorldMap.jsx";
import WorldOverview from "./components/WorldOverview.jsx";

export default function App() {
  const [game, setGame] = useState(createGame);
  const [camera, setCamera] = useState(() => cameraFor(49, 49));
  const [selected, setSelected] = useState({ type: "unit", id: "army-1" });
  const [notice, setNotice] = useState("");
  const [playMode, setPlayMode] = useState(null);
  const [showChronicle, setShowChronicle] = useState(false);
  const [showStandings, setShowStandings] = useState(false);
  const autoplay = playMode !== null;
  const unit =
    selected?.type === "unit"
      ? game.armies.find((army) => army.id === selected.id)
      : null;
  const city =
    selected?.type === "city"
      ? game.cities.find((place) => place.id === selected.id)
      : null;
  const explored = Object.keys(game.discovered).length;
  const resources = game.resources.england;
  const population = kingdomPopulation(game, "england");

  const tiles = useMemo(
    () =>
      Array.from({ length: VIEW_SIZE * VIEW_SIZE }, (_, index) => {
        const x = camera.x + (index % VIEW_SIZE);
        const y = camera.y + Math.floor(index / VIEW_SIZE);
        const revealed = isDiscovered(game, x, y);
        const place = revealed
          ? game.cities.find((item) => item.x === x && item.y === y)
          : null;
        const occupant = revealed
          ? game.armies.find((army) => army.x === x && army.y === y)
          : null;
        const region = revealed ? regionAt(game.cities, x, y) : null;
        return {
          x,
          y,
          revealed,
          place,
          occupant,
          region,
          terrain: terrainAt(x, y),
        };
      }),
    [camera, game],
  );

  useEffect(() => {
    function onKey(event) {
      if (document.querySelector("dialog[open]")) return;
      if (
        event.target instanceof HTMLElement &&
        (/INPUT|TEXTAREA|SELECT/.test(event.target.tagName) ||
          event.target.isContentEditable)
      )
        return;
      const direction = {
        ArrowLeft: [-1, 0],
        ArrowRight: [1, 0],
        ArrowUp: [0, -1],
        ArrowDown: [0, 1],
      }[event.key];
      if (direction) {
        event.preventDefault();
        setCamera((current) => moveCamera(current, ...direction));
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!autoplay) return;
    const timer = window.setTimeout(
      () => {
        let state = game;
        let result;
        const start = performance.now();
        let steps = 0;
        do {
          result = autoplayStep(state);
          state = result.state;
          steps++;
        } while (
          playMode === "fast" &&
          !result.stopped &&
          steps < 30 &&
          performance.now() - start < 75
        );
        setGame(state);
        if (result.stopped) {
          setPlayMode(null);
          setNotice(result.stopped);
          return;
        }
        if (result.position && playMode === "normal") {
          setCamera(cameraFor(result.position.x, result.position.y));
          setSelected(
            result.state.armies.some((army) => army.id === result.unitId)
              ? { type: "unit", id: result.unitId }
              : null,
          );
        }
      },
      playMode === "fast" ? 10 : 500,
    );
    return () => window.clearTimeout(timer);
  }, [playMode, game, autoplay]);

  function clickTile(tile) {
    if (game.gameOver) return;
    setNotice("");
    if (unit && unit.x === tile.x && unit.y === tile.y) {
      setSelected(tile.place ? { type: "city", id: tile.place.id } : null);
      return;
    }
    if (
      !autoplay &&
      unit &&
      unit.owner === "england" &&
      Math.abs(unit.x - tile.x) + Math.abs(unit.y - tile.y) === 1 &&
      unit.moves > 0
    ) {
      const next = moveUnit(game, unit.id, tile.x, tile.y);
      if (next !== game) {
        setGame(next);
        const survivor = next.armies.find(
          (army) =>
            army.owner === unit.owner &&
            army.x === tile.x &&
            army.y === tile.y,
        );
        setSelected(survivor ? { type: "unit", id: survivor.id } : null);
        return;
      }
      if (!tile.occupant) {
        setNotice(
          tile.terrain === "water"
            ? "Water cannot be crossed."
            : "Not enough movement to enter this mountain.",
        );
        return;
      }
      if (
        tile.occupant.owner === unit.owner &&
        tile.occupant.kind === "army" &&
        unit.kind === "army" &&
        (tile.occupant.troopType || "spearman") !==
          (unit.troopType || "spearman")
      ) {
        setSelected({ type: "unit", id: tile.occupant.id });
        setNotice("Armies of different troop types cannot merge.");
        return;
      }
      if (
        tile.occupant.owner === unit.owner &&
        tile.occupant.general &&
        unit.general
      ) {
        setSelected({ type: "unit", id: tile.occupant.id });
        setNotice("Armies with two generals cannot merge.");
        return;
      }
    }
    if (tile.occupant) setSelected({ type: "unit", id: tile.occupant.id });
    else if (tile.place) setSelected({ type: "city", id: tile.place.id });
    else setSelected(null);
  }

  function doRecruit(kind) {
    const next = recruit(game, city.id, kind);
    if (next === game) {
      setNotice("Not enough resources, or a unit is already in this city.");
      return;
    }
    setGame(next);
    setSelected({ type: "unit", id: `army-${game.nextId}` });
    setNotice("");
  }

  function doBuild(buildingId) {
    const next = buildBuilding(game, city.id, buildingId);
    if (next === game) {
      setNotice(
        "This improvement is unavailable or your kingdom lacks the required resources.",
      );
      return;
    }
    setGame(next);
    setNotice("");
  }

  function restartGame() {
    const next = createGame();
    setGame(next);
    setCamera(cameraFor(49, 49));
    setSelected({ type: "unit", id: "army-1" });
    setPlayMode(null);
    setNotice("");
  }

  function focusUnit(target) {
    setSelected({ type: "unit", id: target.id });
    setCamera(cameraFor(target.x, target.y));
    setNotice("");
  }

  function focusCity(target) {
    setSelected({ type: "city", id: target.id });
    setCamera(cameraFor(target.x, target.y));
    setNotice("");
  }

  function endPlayerTurn() {
    setGame(endTurn(game));
    setNotice("");
  }

  function changePlayMode(mode) {
    setPlayMode(mode);
    setNotice("");
  }

  return (
    <div className="app-shell">
      <Sidebar
        game={game}
        city={city}
        unit={unit}
        explored={explored}
        onFocusCity={focusCity}
        onFocusUnit={focusUnit}
      />
      <main className="main">
        <CampaignHeader
          game={game}
          resources={resources}
          population={population}
          playMode={playMode}
          onEndTurn={endPlayerTurn}
          onOpenStandings={() => setShowStandings(true)}
          onPlayModeChange={changePlayMode}
        />
        <div className="content">
          <div className="workspace">
            <WorldMap
              game={game}
              camera={camera}
              tiles={tiles}
              unit={unit}
              city={city}
              autoplay={autoplay}
              onTileClick={clickTile}
              onCameraChange={setCamera}
            />
            <aside className="right-column">
              <SelectedDetails
                game={game}
                unit={unit}
                city={city}
                resources={resources}
                autoplay={autoplay}
                notice={notice}
                onBuild={doBuild}
                onRecruit={doRecruit}
                onSelectCity={(id) => setSelected({ type: "city", id })}
              />
              <WorldOverview
                game={game}
                camera={camera}
                explored={explored}
                onOpenChronicle={() => setShowChronicle(true)}
              />
            </aside>
          </div>
          <div className="bottom-note">
            <span>✧</span> A kingdom is built one decision at a time.{" "}
            <span>✧</span>
            <small>ARROW KEYS TO PAN THE MAP</small>
          </div>
        </div>
      </main>
      {showChronicle && (
        <ChronicleDialog
          events={game.logEvents}
          onClose={() => setShowChronicle(false)}
        />
      )}
      {showStandings && (
        <StandingsDialog
          game={game}
          onClose={() => setShowStandings(false)}
        />
      )}
      {game.gameOver && (
        <GameOverScreen
          game={game}
          onRestart={restartGame}
          onOpenChronicle={() => setShowChronicle(true)}
        />
      )}
    </div>
  );
}
