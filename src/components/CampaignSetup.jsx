import React, { useState } from "react";
import { KINGDOMS, KINGDOM_OWNERS, MAP_SIZE, MAP_SIZES } from "../game.js";
import { Icon } from "./Visuals.jsx";

const defaultSettings = {
  mapSize: MAP_SIZE,
  opponentCount: KINGDOM_OWNERS.length - 1,
  kingdoms: KINGDOMS,
};

export default function CampaignSetup({ initialSettings, onStart }) {
  const [settings, setSettings] = useState(initialSettings ?? defaultSettings);
  const { mapSize, opponentCount, kingdoms } = settings;

  function updateKingdom(owner, field, value) {
    setSettings((current) => ({
      ...current,
      kingdoms: {
        ...current.kingdoms,
        [owner]: { ...current.kingdoms[owner], [field]: value },
      },
    }));
  }

  return (
    <main className="campaign-setup">
      <header className="setup-header">
        <div className="brand-mark"><Icon name="crown" size={26} /></div>
        <h1>Crown <span>&amp;</span> Frontier</h1>
        <p>New campaign</p>
      </header>
      <form
        className="setup-form"
        onSubmit={(event) => {
          event.preventDefault();
          onStart(settings);
        }}
      >
        <div className="setup-options">
          <label>
            Map size
            <select
              value={mapSize}
              onChange={(event) => setSettings({ ...settings, mapSize: Number(event.target.value) })}
            >
              {MAP_SIZES.map((size) => (
                <option key={size} value={size}>{size} × {size}</option>
              ))}
            </select>
          </label>
          <label>
            Opponents
            <select
              value={opponentCount}
              onChange={(event) => setSettings({ ...settings, opponentCount: Number(event.target.value) })}
            >
              {KINGDOM_OWNERS.slice(1).map((owner, index) => (
                <option key={owner} value={index + 1}>{index + 1}</option>
              ))}
            </select>
          </label>
        </div>
        {KINGDOM_OWNERS.slice(0, opponentCount + 1).map((owner, index) => (
          <fieldset key={owner} className="setup-kingdom">
            <legend>{index === 0 ? "Your kingdom" : `Opponent ${index}`}</legend>
            <label>
              Name
              <input
                type="text"
                value={kingdoms[owner].name}
                maxLength={40}
                required
                pattern=".*\S.*"
                onChange={(event) => updateKingdom(owner, "name", event.target.value)}
              />
            </label>
            <label>
              Color
              <input
                type="color"
                value={kingdoms[owner].color}
                onChange={(event) => updateKingdom(owner, "color", event.target.value)}
              />
            </label>
          </fieldset>
        ))}
        <button className="setup-start" type="submit">Start campaign <span aria-hidden="true">→</span></button>
      </form>
    </main>
  );
}
