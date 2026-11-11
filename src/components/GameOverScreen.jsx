import React from "react";
import { useState } from "react";
import { chronicleEntries } from "../game.js";

export default function GameOverScreen({
  game,
  events,
  onRestart,
  onOpenChronicle,
}) {
  const [copyStatus, setCopyStatus] = useState("");

  async function copyLog() {
    try {
      await navigator.clipboard.writeText(
        chronicleEntries(events, false).join("\n"),
      );
      setCopyStatus("Chronicle copied.");
    } catch {
      setCopyStatus("Copy failed. Open the Chronicle to select and copy it.");
    }
  }

  return (
    <div
      className={`game-over ${game.gameOver.outcome}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="game-over-title"
    >
      <div className="game-over-card">
        <div className="selection-tag">
          {game.gameOver.outcome === "victory" ? "VICTORY" : "DEFEAT"} · TURN{" "}
          {game.turn}
        </div>
        <h2 id="game-over-title">{game.gameOver.title}</h2>
        <p>{game.gameOver.message}</p>
        <button className="end-turn" onClick={onRestart}>
          Begin a new campaign <span className="end-arrow">→</span>
        </button>
        <button
          className="chronicle-copy game-over-chronicle"
          onClick={copyLog}
        >
          Copy full log
        </button>
        <p className="game-over-copy-status" role="status" aria-live="polite">
          {copyStatus}
        </p>
        <button
          className="chronicle-copy game-over-chronicle"
          onClick={onOpenChronicle}
        >
          Read the Chronicle
        </button>
      </div>
    </div>
  );
}
