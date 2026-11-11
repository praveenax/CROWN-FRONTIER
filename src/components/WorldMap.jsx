import { canMoveUnit, KINGDOMS, moveCamera, VIEW_SIZE } from "../game.js";
import { Icon, TownArt } from "./Visuals.jsx";

export default function WorldMap({
  game,
  camera,
  tiles,
  unit,
  city,
  autoplay,
  onTileClick,
  onCameraChange,
}) {
  return (
    <section className="map-panel">
      <div className="panel-header">
        <div>
          <div className="panel-title">
            <span className="gold-dot" /> WORLD MAP{" "}
            <span className="subtle">/</span>{" "}
            <span className="subtle">THE FRONTIER</span>
          </div>
          <div className="panel-subtitle">
            A world of opportunity lies beyond the fog.
          </div>
        </div>
        <div className="map-coordinates">
          VIEW{" "}
          <b>
            {camera.x + 1}–{camera.x + VIEW_SIZE} / {camera.y + 1}–
            {camera.y + VIEW_SIZE}
          </b>
        </div>
      </div>
      <div className="map-wrap">
        <div
          className="map-grid"
          role="grid"
          aria-label={`World map, ${VIEW_SIZE} by ${VIEW_SIZE} tiles`}
        >
          {tiles.map((tile) => {
            const reachable =
              !autoplay &&
              unit?.owner === "england" &&
              canMoveUnit(game, unit, tile.x, tile.y);
            const merging = reachable && tile.occupant?.owner === "england";
            const selectedTile =
              (unit && unit.x === tile.x && unit.y === tile.y) ||
              (city && city.x === tile.x && city.y === tile.y);
            const owner = tile.region?.owner;
            return (
              <button
                role="gridcell"
                key={`${tile.x}-${tile.y}`}
                disabled={Boolean(game.gameOver)}
                onClick={() => onTileClick(tile)}
                className={`tile ${tile.revealed ? tile.terrain : "fog"} ${reachable ? "reachable" : ""} ${selectedTile ? "selected" : ""}`}
                style={
                  owner ? { "--region-color": KINGDOMS[owner].color } : undefined
                }
                aria-label={`${tile.x + 1}, ${tile.y + 1}: ${tile.revealed ? `${tile.place?.name || tile.terrain}${tile.occupant ? `, ${tile.occupant.name}` : ""}` : "unexplored"}${merging ? ", merge" : reachable ? ", reachable" : ""}`}
              >
                {tile.revealed && (
                  <>
                    <span className="terrain-detail">
                      {tile.terrain === "forest"
                        ? "♠  ♠"
                        : tile.terrain === "mountain"
                          ? "▲  ▲"
                          : tile.terrain === "water"
                            ? "≈  ≈"
                            : tile.terrain === "field"
                              ? "∿ ∿ ∿"
                              : "·  ˙"}
                    </span>
                    {tile.place && (
                      <>
                        <TownArt capital={tile.place.capital} />
                        <span className="tile-name">{tile.place.name}</span>
                      </>
                    )}
                    {tile.occupant && (
                      <span
                        className={`unit-marker ${tile.occupant.owner === "england" ? "friendly" : "enemy"}`}
                        style={{
                          "--unit-color": KINGDOMS[tile.occupant.owner].color,
                        }}
                      >
                        <Icon
                          name={
                            tile.occupant.kind === "scout" ? "eye" : "sword"
                          }
                          size={14}
                        />
                        <b>{tile.occupant.troops}</b>
                      </span>
                    )}
                  </>
                )}
                {!tile.revealed && <span className="fog-mark">·</span>}
              </button>
            );
          })}
        </div>
      </div>
      <div className="map-footer">
        <div className="legend">
          <span>
            <i className="legend-dot england" /> Your kingdom
          </span>
          <span>
            <i className="legend-dot neutral" /> Neutral settlement
          </span>
          <span>
            <i className="legend-dot barbarian-key" /> Raiders
          </span>
          <span>
            <i className="legend-dot water-key" /> Water
          </span>
          <span>
            <i className="legend-dot mountain-key" /> Mountain
          </span>
          <span>
            <i className="legend-dot unknown" /> Unexplored
          </span>
        </div>
        <div className="map-nav">
          <button
            onClick={() =>
              onCameraChange((current) => moveCamera(current, -1, 0))
            }
            aria-label="Pan map left"
          >
            ←
          </button>
          <button
            onClick={() =>
              onCameraChange((current) => moveCamera(current, 0, -1))
            }
            aria-label="Pan map up"
          >
            ↑
          </button>
          <button
            onClick={() =>
              onCameraChange((current) => moveCamera(current, 0, 1))
            }
            aria-label="Pan map down"
          >
            ↓
          </button>
          <button
            onClick={() =>
              onCameraChange((current) => moveCamera(current, 1, 0))
            }
            aria-label="Pan map right"
          >
            →
          </button>
        </div>
      </div>
    </section>
  );
}
