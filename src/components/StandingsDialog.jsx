import React from "react";
import { useEffect, useMemo, useRef } from "react";
import { kingdomStandings, KINGDOMS } from "../game.js";

export default function StandingsDialog({ game, onClose }) {
  const dialog = useRef(null);
  const standings = useMemo(() => kingdomStandings(game), [game]);

  useEffect(() => {
    dialog.current.showModal();
  }, []);

  function close() {
    dialog.current.close();
    onClose();
  }

  return (
    <dialog
      ref={dialog}
      className="standings-dialog"
      aria-labelledby="standings-title"
      onCancel={(event) => {
        event.preventDefault();
        close();
      }}
    >
      <div className="chronicle-header">
        <div>
          <div className="selection-tag">THE CONTEST FOR THE WORLD</div>
          <h2 id="standings-title">Kingdom Standings</h2>
          <p>Live rankings for all kingdoms, including unexplored territory.</p>
        </div>
        <button
          className="chronicle-close"
          onClick={close}
          aria-label="Close standings"
          autoFocus
        >
          ×
        </button>
      </div>
      <div className="standings-table-wrap">
        <table className="standings-table">
          <thead>
            <tr>
              <th>Rank / Kingdom</th>
              <th>Economic</th>
              <th>Military</th>
              <th>Land</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {standings.map((row) => (
              <tr key={row.owner}>
                <th scope="row">
                  <span className="rank">
                    {standings.findIndex((other) => other.total === row.total) +
                      1}
                  </span>
                  <span className="standings-kingdom">
                    <i style={{ background: KINGDOMS[row.owner].color }} />
                    {KINGDOMS[row.owner].name}
                    {row.owner === "england" && " (You)"}
                    <small>Ruler: {game.rulers[row.owner]}</small>
                  </span>
                </th>
                <td>{row.economic.toLocaleString()}</td>
                <td>{row.military.toLocaleString()}</td>
                <td>{row.land.toLocaleString()}</td>
                <td>
                  <strong>{row.total.toLocaleString()}</strong>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="score-explanation">
        <strong>How scores work</strong>
        <p>
          Economic = gold + food + city population + 10 × gold and food produced
          per turn. Military = troops + current city defenses. Land = 10 ×
          controlled map tiles. Total is the sum of all three scores.
        </p>
      </div>
    </dialog>
  );
}
