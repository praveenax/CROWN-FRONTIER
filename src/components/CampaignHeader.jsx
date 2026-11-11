import { Icon } from "./Visuals.jsx";

export default function CampaignHeader({
  game,
  resources,
  population,
  playMode,
  onEndTurn,
  onOpenStandings,
  onPlayModeChange,
}) {
  const autoplay = playMode !== null;

  return (
    <>
      <header className="topbar">
        <div className="breadcrumb">
          CAMPAIGN <span>/</span> <b>THE KNOWN WORLD</b>
        </div>
        <div className="top-right">
          <div className="resource">
            <Icon name="gold" />
            <span>
              <b>{resources.gold.toLocaleString()}</b>
              <small>GOLD</small>
            </span>
          </div>
          <div className="resource">
            <Icon name="food" />
            <span>
              <b>{resources.food.toLocaleString()}</b>
              <small>FOOD</small>
            </span>
          </div>
          <div className="resource">
            <Icon name="people" />
            <span>
              <b>{population.toLocaleString()}</b>
              <small>POPULATION</small>
            </span>
          </div>
          <div className="turn-chip">
            <small>CURRENT TURN</small>
            <b>{String(game.turn).padStart(2, "0")}</b>
          </div>
        </div>
      </header>
      <div className="page-heading">
        <div>
          <div className="eyebrow">
            <span /> YOUR KINGDOM AWAITS
          </div>
          <h1>The Known World</h1>
          <p>Explore the frontier, grow your kingdom, and make your mark.</p>
        </div>
        <div className="turn-actions">
          <button className="autoplay-button" onClick={onOpenStandings}>
            <span>
              Standings<small>Compare kingdoms</small>
            </span>
            <span className="autoplay-icon" aria-hidden="true">
              ♛
            </span>
          </button>
          {["normal", "fast"].map((mode) => (
            <button
              key={mode}
              className={`autoplay-button ${playMode === mode ? "running" : ""}`}
              disabled={Boolean(game.gameOver)}
              aria-pressed={playMode === mode}
              onClick={() => onPlayModeChange(playMode === mode ? null : mode)}
            >
              <span>
                {playMode === mode
                  ? mode === "normal"
                    ? "Pause autoplay"
                    : "Pause fast play"
                  : mode === "normal"
                    ? "Autoplay"
                    : "Fast Play"}
                <small>
                  {playMode === mode
                    ? "Take back control"
                    : mode === "normal"
                      ? "Watch your kingdom"
                      : "Advance quickly"}
                </small>
              </span>
              <span className="autoplay-icon" aria-hidden="true">
                {playMode === mode ? "Ⅱ" : mode === "normal" ? "▶" : "▶▶"}
              </span>
            </button>
          ))}
          <button
            className="end-turn"
            disabled={autoplay || Boolean(game.gameOver)}
            onClick={onEndTurn}
          >
            <span>
              End turn <small>Let the world advance</small>
            </span>
            <span className="end-arrow">→</span>
          </button>
        </div>
      </div>
    </>
  );
}
