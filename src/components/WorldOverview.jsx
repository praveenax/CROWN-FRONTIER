import React from "react";
import { regionAt } from "../game.js";

export default function WorldOverview({
  game,
  camera,
  explored,
  onOpenChronicle,
}) {
  return (
    <>
      <section className="minimap-panel">
        <div className="detail-heading">
          <span>POLITICAL MAP</span>
          <span className="mini-label">{game.mapSize} × {game.mapSize}</span>
        </div>
        <svg
          className="minimap"
          viewBox={`0 0 ${game.mapSize} ${game.mapSize}`}
          role="img"
          aria-label="Political map of discovered world"
        >
          <rect width={game.mapSize} height={game.mapSize} fill="#25342c" />
          {Object.keys(game.discovered).map((key) => {
            const [x, y] = key.split(",").map(Number);
            const owner = regionAt(game.cities, x, y)?.owner;
            return (
              <rect
                key={key}
                x={x}
                y={y}
                width="1"
                height="1"
                fill={owner ? game.kingdoms[owner].color : "#788475"}
              >
                <title>
                  {owner ? game.kingdoms[owner].name : "Neutral territory"}
                </title>
              </rect>
            );
          })}
          <rect
            x={camera.x}
            y={camera.y}
            width="8"
            height="8"
            fill="none"
            stroke="#e7c37d"
            strokeWidth="1.5"
          />
        </svg>
        <div className="minimap-legend">
          {game.kingdomOwners.map((owner) => (
              <span key={owner}>
                <i style={{ background: game.kingdoms[owner].color }} />
                {game.kingdoms[owner].name}
              </span>
            ))}
        </div>
        <div className="minimap-caption">
          <span>
            <i className="legend-dot england" /> Current view
          </span>
          <span>{(explored * 100 / game.mapSize ** 2).toFixed(1)}% explored</span>
        </div>
      </section>
      <section className="activity-panel">
        <div className="detail-heading">
          <span>CHRONICLE</span>
          <button className="show-chronicle" onClick={onOpenChronicle}>
            Show All
          </button>
        </div>
        {game.log.slice(0, 3).map((entry, index) => (
          <div className="activity" key={`${entry}-${index}`}>
            <i />
            <span>{entry}</span>
          </div>
        ))}
      </section>
    </>
  );
}
