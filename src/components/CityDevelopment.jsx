import React from "react";
import { BUILDINGS, cityDevelopment } from "../game.js";

export default function CityDevelopment({
  city,
  resources,
  disabled,
  onBuild,
}) {
  const development = cityDevelopment(city);
  const constructed = city.constructedBuildings || [];
  const availableBuildings = BUILDINGS.filter(
    (building) =>
      !constructed.includes(building.id) && development.level >= building.level,
  );
  return (
    <div className="city-development">
      <div className="general-heading">
        <span>CITY DEVELOPMENT</span>
        <span>LEVEL {development.level}</span>
      </div>
      <div className="city-stats">
        <div>
          <small>POPULATION</small>
          <b>{city.population.toLocaleString()}</b>
        </div>
        <div>
          <small>DEFENSE</small>
          <b>
            {city.defense} / {development.defense}
          </b>
        </div>
        <div>
          <small>GOLD / TURN</small>
          <b>+{development.gold}</b>
        </div>
        <div>
          <small>FOOD / TURN</small>
          <b>+{development.food}</b>
        </div>
        <div>
          <small>GROWTH / TURN</small>
          <b>+{development.growth}</b>
        </div>
      </div>
      <p>
        {city.owner
          ? development.nextPopulation
            ? `Next level at ${development.nextPopulation.toLocaleString()} population.`
            : "Maximum city level reached."
          : "Production and growth begin when claimed."}
      </p>
      <div className="city-buildings">
        <small>BUILDINGS</small>
        <span>{development.buildings.join(" · ")}</span>
      </div>
      {city.owner === "england" && (
        <div className="building-options">
          <small>AVAILABLE TO BUILD</small>
          {availableBuildings.length ? (
            availableBuildings.map((building) => (
              <button
                key={building.id}
                className="building-option"
                disabled={
                  disabled ||
                  resources.gold < building.cost.gold ||
                  resources.food < building.cost.food
                }
                onClick={() => onBuild(building.id)}
              >
                <span>
                  <strong>{building.name}</strong>
                  <small>{building.effect}</small>
                </span>
                <b>
                  {building.cost.gold} gold · {building.cost.food} food
                </b>
              </button>
            ))
          ) : (
            <span className="settlements-empty">
              All available improvements are built.
            </span>
          )}
        </div>
      )}
    </div>
  );
}
