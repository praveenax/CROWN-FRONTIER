import { KINGDOMS, TROOP_TYPES } from "../game.js";
import { Icon } from "./Visuals.jsx";

export default function Sidebar({
  game,
  city,
  unit,
  explored,
  onFocusCity,
  onFocusUnit,
}) {
  const ownedCities = game.cities.filter((place) => place.owner === "england");
  const playerUnits = game.armies.filter((army) => army.owner === "england");
  const generals = playerUnits.filter((army) => army.general);

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark">
          <Icon name="crown" size={23} />
        </div>
        <div>
          <strong>
            CROWN <span>&</span>
          </strong>
          <small>FRONTIER</small>
        </div>
      </div>
      <div className="sidebar-label">YOUR CAMPAIGN</div>
      <div className="kingdom-card">
        <div className="crest">
          <Icon name="crown" size={25} />
        </div>
        <div>
          <strong>Kingdom of {KINGDOMS.england.name}</strong>
          <small>Ruler: {game.rulers.england}</small>
        </div>
      </div>
      <div className="sidebar-section">
        <div className="section-heading">
          KINGDOM OVERVIEW <span>01</span>
        </div>
        <div className="overview-row">
          <Icon name="flag" size={16} /> <span>Settlements</span>
          <strong>{ownedCities.length}</strong>
        </div>
        <div className="overview-row">
          <Icon name="sword" size={16} /> <span>Units</span>
          <strong>{playerUnits.length}</strong>
        </div>
        <div className="overview-row">
          <Icon name="eye" size={16} /> <span>World explored</span>
          <strong>{(explored / 100).toFixed(1)}%</strong>
        </div>
      </div>
      <div className="sidebar-section">
        <div className="section-heading">
          YOUR SETTLEMENTS{" "}
          <span>{String(ownedCities.length).padStart(2, "0")}</span>
        </div>
        <div
          className="forces settlements"
          role="group"
          aria-label="Your settlements"
        >
          {ownedCities.length ? (
            ownedCities.map((place) => (
              <button
                key={place.id}
                onClick={() => onFocusCity(place)}
                aria-pressed={city?.id === place.id}
                className={`force-row ${city?.id === place.id ? "active" : ""}`}
              >
                <span className="force-icon">
                  <Icon name="flag" size={16} />
                </span>
                <span>
                  <strong>{place.name}</strong>
                  <small>
                    {place.capital ? "Capital" : "Town"} · {place.x + 1},{" "}
                    {place.y + 1}
                  </small>
                </span>
                <Icon name="chevron" size={15} />
              </button>
            ))
          ) : (
            <div className="settlements-empty">No settlements held</div>
          )}
        </div>
      </div>
      <div className="sidebar-section">
        <div className="section-heading">
          YOUR FORCES{" "}
          <span>{String(playerUnits.length).padStart(2, "0")}</span>
        </div>
        <div className="forces">
          {playerUnits.map((army) => (
            <button
              key={army.id}
              onClick={() => onFocusUnit(army)}
              className={`force-row ${unit?.id === army.id ? "active" : ""}`}
            >
              <span className="force-icon">
                <Icon name={army.kind === "scout" ? "eye" : "sword"} size={16} />
              </span>
              <span>
                <strong>{army.name}</strong>
                <small>
                  {army.troops}{" "}
                  {army.kind === "scout"
                    ? "scouts"
                    : `${TROOP_TYPES[army.troopType || "spearman"]?.name || "soldiers"}`}
                </small>
              </span>
              <Icon name="chevron" size={15} />
            </button>
          ))}
        </div>
      </div>
      <div className="sidebar-section">
        <div className="section-heading">
          YOUR GENERALS{" "}
          <span>{String(generals.length).padStart(2, "0")}</span>
        </div>
        <div
          className="forces settlements"
          role="group"
          aria-label="Your generals"
        >
          {generals.length ? (
            generals.map((army) => (
              <button
                key={army.general.id}
                onClick={() => onFocusUnit(army)}
                aria-pressed={unit?.general?.id === army.general.id}
                className={`force-row ${unit?.general?.id === army.general.id ? "active" : ""}`}
              >
                <span className="force-icon">
                  <Icon name="crown" size={16} />
                </span>
                <span>
                  <strong>{army.general.name}</strong>
                  <small>
                    Level {army.general.level} · {army.name} ({army.x + 1},{" "}
                    {army.y + 1})
                  </small>
                </span>
                <Icon name="chevron" size={15} />
              </button>
            ))
          ) : (
            <div className="settlements-empty">No generals in service</div>
          )}
        </div>
      </div>
      <div className="sidebar-bottom">
        <span className="status-dot" />{" "}
        {game.gameOver ? "CAMPAIGN COMPLETE" : "CAMPAIGN IN PROGRESS"}{" "}
        <small>Prototype · v0.1</small>
      </div>
    </aside>
  );
}
