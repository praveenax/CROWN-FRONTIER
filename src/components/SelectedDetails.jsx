import React from "react";
import { TROOP_TYPES } from "../game.js";
import CityDevelopment from "./CityDevelopment.jsx";
import { Icon } from "./Visuals.jsx";

export default function SelectedDetails({
  game,
  unit,
  city,
  resources,
  autoplay,
  notice,
  onBuild,
  onRecruit,
  onSelectCity,
}) {
  const cityOccupant =
    city && game.armies.find((army) => army.x === city.x && army.y === city.y);

  return (
    <section className="detail-panel">
      <div className="detail-heading">
        <span>SELECTED</span>
        <Icon name="crosshair" size={16} />
      </div>
      {unit ? (
        <>
          <div className="selection-icon">
            <Icon name={unit.kind === "scout" ? "eye" : "sword"} size={26} />
          </div>
          <div className="selection-tag">
            {unit.owner === "england"
              ? "YOUR FORCES"
              : game.kingdoms[unit.owner].name.toUpperCase()}
          </div>
          <h2>{unit.name}</h2>
          <p>
            {unit.kind === "barbarian"
              ? "Roaming raiders that attack and loot settlements."
              : unit.kind === "scout"
                ? "A light-footed party, ready to reveal the unknown."
                : `${TROOP_TYPES[unit.troopType || "spearman"]?.description || "Combat unit."} Up to ${unit.units} same-type squads can merge, for a maximum of 300 soldiers.`}
          </p>
          <div className="detail-stats">
            <div>
              <small>STRENGTH</small>
              <b>
                {unit.troops}{" "}
                <span>
                  {unit.kind === "barbarian"
                    ? "raiders"
                    : unit.kind === "scout"
                      ? "scouts"
                      : "soldiers"}
                </span>
              </b>
            </div>
            <div>
              <small>MOVEMENT</small>
              <b>
                {unit.moves}{" "}
                <span>/ {unit.kind === "barbarian" ? 2 : 3} points</span>
              </b>
            </div>
          </div>
          {unit.general ? (
            <div className="general-detail">
              <div className="general-heading">
                <span>GENERAL</span>
                <span>LEVEL {unit.general.level}</span>
              </div>
              <strong>{unit.general.name}</strong>
              <div className="general-skills">
                {Object.entries(unit.general.skills).map(([skill, value]) => (
                  <div key={skill}>
                    <small>{skill}</small>
                    <b>{value}</b>
                  </div>
                ))}
              </div>
              <small className="general-hint">
                Skills do not affect combat yet.
              </small>
            </div>
          ) : (
            unit.kind === "army" && (
              <div className="general-detail">
                <div className="general-heading">NO GENERAL ASSIGNED</div>
              </div>
            )
          )}
          {unit.owner === "england" && (
            <div className="instruction">
              <span>✦</span>{" "}
              {autoplay
                ? "Autoplay is issuing orders. Pause to move your units manually."
                : "Only identical troop types can merge. Water blocks movement; mountains cost 2 points."}
            </div>
          )}
          {game.cities.some(
            (place) => place.x === unit.x && place.y === unit.y,
          ) && (
            <button
              className="secondary-button"
              onClick={() =>
                onSelectCity(
                  game.cities.find(
                    (place) => place.x === unit.x && place.y === unit.y,
                  ).id,
                )
              }
            >
              View settlement <span>→</span>
            </button>
          )}
        </>
      ) : city ? (
        <>
          <div className="selection-icon">
            <Icon name="flag" size={26} />
          </div>
          <div className="selection-tag">
            {city.owner
              ? game.kingdoms[city.owner].name.toUpperCase()
              : "NEUTRAL SETTLEMENT"}
          </div>
          <h2>{city.name}</h2>
          <p>
            {city.owner === "england"
              ? "A settlement under your banner. It produces resources each turn."
              : "Defeat its defenses with an army to claim this settlement."}
          </p>
          <div className="detail-stats">
            <div>
              <small>POSITION</small>
              <b>
                {city.x + 1}, {city.y + 1}
              </b>
            </div>
            <div>
              <small>STATUS</small>
              <b>{city.capital ? "Capital" : "Town"}</b>
            </div>
          </div>
          <CityDevelopment
            city={city}
            resources={resources}
            disabled={autoplay || Boolean(game.gameOver)}
            onBuild={onBuild}
          />
          {city.owner === "england" && (
            <>
              <div className="instruction">
                <span>✦</span>{" "}
                {cityOccupant?.owner === "england" &&
                cityOccupant.kind === "army"
                  ? `Garrison: ${cityOccupant.troops} soldiers. It fights before the city defenses.`
                  : "City defenses fight attackers even without a garrison."}
              </div>
              {Object.entries(TROOP_TYPES).map(([type, troop]) => (
                <button
                  key={type}
                  className="secondary-button"
                  disabled={
                    autoplay ||
                    Boolean(game.gameOver) ||
                    Boolean(cityOccupant) ||
                    resources.gold < troop.cost.gold ||
                    resources.food < troop.cost.food ||
                    city.population < troop.cost.population
                  }
                  onClick={() => onRecruit(type)}
                >
                  {troop.name}
                  <span>
                    {troop.cost.gold} gold · {troop.cost.food} food ·{" "}
                    {troop.cost.population} people
                  </span>
                </button>
              ))}
              <button
                className="secondary-button"
                disabled={
                  autoplay ||
                  Boolean(game.gameOver) ||
                  Boolean(cityOccupant) ||
                  resources.gold < 30 ||
                  resources.food < 15 ||
                  city.population < 20
                }
                onClick={() => onRecruit("scout")}
              >
                Recruit scouts <span>30 gold · 15 food · 20 people</span>
              </button>
              <small className="recruit-hint">
                Recruitment uses this city's population. Its tile must be empty;
                new units move next turn. Only identical troop types can merge.
              </small>
            </>
          )}
        </>
      ) : (
        <>
          <div className="selection-icon">
            <Icon name="crosshair" size={26} />
          </div>
          <div className="selection-tag">AWAITING ORDERS</div>
          <h2>Choose your next move</h2>
          <p>
            Select an army or a settlement on the map to see its details and
            available actions.
          </p>
        </>
      )}
      {unit?.kind === "army" && (
        <p className="recruit-hint">
          Full strength: {unit.maxTroops} soldiers. In a friendly settlement,
          armies recover 10% of full strength each turn for free.
        </p>
      )}
      {unit?.general && (
        <div className="history-detail">
          <small>GENERAL HISTORY · {unit.general.id}</small>
          {game.generalHistory[unit.general.id]?.events.length ? (
            game.generalHistory[unit.general.id].events
              .slice(-3)
              .map((event, index) => <p key={index}>{event}</p>)
          ) : (
            <p>No recorded victories or defeats yet.</p>
          )}
        </div>
      )}
      {city && (
        <div className="history-detail">
          <small>SETTLEMENT HISTORY · {city.id}</small>
          <p>
            Ownership changes:{" "}
            {Math.max(0, (city.ownershipHistory?.length || 1) - 1)}.{" "}
            {city.ownershipHistory
              ?.map(
                (entry) =>
                  `${entry.owner ? game.kingdoms[entry.owner].name : "Neutral"} (turn ${entry.sinceTurn ?? "unknown"})`,
              )
              .join(" → ")}
          </p>
          {city.ownershipHistory?.at(-1)?.sinceTurn != null && (
            <p>
              Current occupation:{" "}
              {game.turn - city.ownershipHistory.at(-1).sinceTurn} completed
              turns.
            </p>
          )}
        </div>
      )}
      {notice && (
        <div className="notice" role="alert">
          {notice}
        </div>
      )}
    </section>
  );
}
