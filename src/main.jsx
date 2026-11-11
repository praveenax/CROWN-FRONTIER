import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { autoplayStep, cameraFor, canMoveUnit, createGame, endTurn, isDiscovered, KINGDOMS, moveCamera, moveUnit, recruit, terrainAt, VIEW_SIZE } from './game.js';
import './styles.css';

function Icon({ name, size = 20, className = '' }) {
  const paths = {
    crown: <><path d="m3 7 4 3 5-7 5 7 4-3-2 11H5L3 7Z"/><path d="M5 21h14"/></>,
    gold: <><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><path d="M12 9v6m-2-4h4"/></>,
    food: <><path d="M12 21V9m0 7c-5 0-7-3-7-6 4 0 7 2 7 6Zm0-4c0-4 3-6 7-6 0 4-2 6-7 6Z"/><path d="M12 9c-2-2-2-5 0-7 2 2 2 5 0 7Z"/></>,
    people: <><circle cx="9" cy="8" r="3"/><path d="M3 20v-2a6 6 0 0 1 12 0v2M16 5a3 3 0 0 1 0 6m1 3a5 5 0 0 1 4 5v1"/></>,
    sword: <><path d="m14 4 6-2-2 6L7 19l-3 1 1-3L14 4ZM4 14l6 6M3 21l3-3"/></>,
    eye: <><path d="M2 12s4-6 10-6 10 6 10 6-4 6-10 6S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></>,
    flag: <><path d="M5 21V4m0 1c5-3 8 3 14 0v9c-6 3-9-3-14 0"/></>,
    chevron: <path d="m9 18 6-6-6-6"/>,
    crosshair: <><circle cx="12" cy="12" r="7"/><path d="M12 2v4m0 12v4M2 12h4m12 0h4"/></>,
    scroll: <><path d="M7 3h12v15H7a3 3 0 0 0-3 3V6a3 3 0 0 1 3-3Zm0 15a3 3 0 0 1 0 6h12v-6"/><path d="M10 7h6m-6 4h6"/></>,
  };
  return <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

function TownArt({ capital }) {
  return <svg viewBox="0 0 60 50" className="town-art" aria-hidden="true">
    <path d="M5 43h50v4H5z" fill="#343a2c" opacity=".35"/>
    <path d="M11 28h38v15H11z" fill="#d0bd8e" stroke="#555547" strokeWidth="1.5"/>
    <path d="m8 29 22-17 22 17Z" fill="#9a6249" stroke="#555547" strokeWidth="1.5"/>
    <path d="M22 18V8h16v10" fill="#d9c99e" stroke="#555547" strokeWidth="1.5"/>
    <path d="m19 9 11-7 11 7Z" fill="#865443" stroke="#555547" strokeWidth="1.5"/>
    <path d="M26 43V31h8v12M16 33h4m20 0h4M28 13h4" fill="none" stroke="#655746" strokeWidth="2"/>
    {capital && <><path d="M30 2v-7" stroke="#e5d6a9" strokeWidth="1.5"/><path d="m30-5 9 2-9 3" fill="#d5aa62"/></>}
  </svg>;
}

function Chronicle({ log, onClose }) {
  const dialog = useRef(null);
  const [copyStatus, setCopyStatus] = useState('');
  const text = useMemo(() => [...log].reverse().join('\n'), [log]);

  useEffect(() => {
    dialog.current.showModal();
  }, []);

  async function copyLog() {
    try {
      await navigator.clipboard.writeText(text);
      setCopyStatus('Chronicle copied.');
    } catch {
      setCopyStatus('Could not copy. Select the log below and copy it manually.');
    }
  }

  return <dialog ref={dialog} className="chronicle-dialog" aria-labelledby="chronicle-title" onClose={onClose}>
    <div className="chronicle-header"><div><div className="selection-tag">CAMPAIGN HISTORY</div><h2 id="chronicle-title">The Chronicle</h2><p>Every recorded event, from the beginning of your campaign.</p></div><button className="chronicle-close" onClick={() => dialog.current.close()} aria-label="Close chronicle" autoFocus>×</button></div>
    <div className="chronicle-toolbar"><span>{log.length} events · oldest first</span><button className="chronicle-copy" onClick={copyLog}>Copy log</button></div>
    <p className="copy-status" role="status">{copyStatus || 'Select the text below to copy it manually.'}</p>
    <textarea className="chronicle-log" aria-label="Campaign event log" readOnly value={text} onFocus={event => event.target.select()}/>
  </dialog>;
}

function App() {
  const [game, setGame] = useState(createGame);
  const [camera, setCamera] = useState(() => cameraFor(49, 49));
  const [selected, setSelected] = useState({ type: 'unit', id: 'army-1' });
  const [notice, setNotice] = useState('');
  const [playMode, setPlayMode] = useState(null);
  const [showChronicle, setShowChronicle] = useState(false);
  const autoplay = playMode !== null;
  const unit = selected?.type === 'unit' ? game.armies.find(a => a.id === selected.id) : null;
  const city = selected?.type === 'city' ? game.cities.find(c => c.id === selected.id) : null;
  const ownedCities = game.cities.filter(c => c.owner === 'england');
  const playerUnits = game.armies.filter(a => a.owner === 'england');
  const generals = playerUnits.filter(a => a.general);
  const cityOccupant = city && game.armies.find(a => a.x === city.x && a.y === city.y);
  const explored = Object.keys(game.discovered).length;
  const resources = game.resources.england;

  const tiles = useMemo(() => Array.from({ length: VIEW_SIZE * VIEW_SIZE }, (_, index) => {
    const x = camera.x + index % VIEW_SIZE;
    const y = camera.y + Math.floor(index / VIEW_SIZE);
    const revealed = isDiscovered(game, x, y);
    const place = revealed ? game.cities.find(c => c.x === x && c.y === y) : null;
    const occupant = revealed ? game.armies.find(a => a.x === x && a.y === y) : null;
    const region = revealed ? game.cities.reduce((closest, c) => Math.abs(c.x - x) + Math.abs(c.y - y) < Math.abs(closest.x - x) + Math.abs(closest.y - y) ? c : closest) : null;
    return { x, y, revealed, place, occupant, region, terrain: terrainAt(x, y) };
  }), [camera, game]);

  useEffect(() => {
    function onKey(event) {
      if (event.target instanceof HTMLElement && (/INPUT|TEXTAREA|SELECT/.test(event.target.tagName) || event.target.isContentEditable)) return;
      const direction = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[event.key];
      if (direction) {
        event.preventDefault();
        setCamera(current => moveCamera(current, ...direction));
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (!autoplay) return;
    const timer = window.setTimeout(() => {
      let state = game;
      let result;
      const start = performance.now();
      let steps = 0;
      do {
        result = autoplayStep(state);
        state = result.state;
        steps++;
      } while (playMode === 'fast' && !result.stopped && steps < 30 && performance.now() - start < 75);
      setGame(state);
      if (result.stopped) {
        setPlayMode(null);
        setNotice(result.stopped);
        return;
      }
      if (result.position && playMode === 'normal') {
        setCamera(cameraFor(result.position.x, result.position.y));
        setSelected(result.state.armies.some(army => army.id === result.unitId) ? { type: 'unit', id: result.unitId } : null);
      }
    }, playMode === 'fast' ? 10 : 500);
    return () => window.clearTimeout(timer);
  }, [playMode, game]);

  function clickTile(tile) {
    setNotice('');
    if (unit && unit.x === tile.x && unit.y === tile.y) {
      setSelected(tile.place ? { type: 'city', id: tile.place.id } : null);
      return;
    }
    if (!autoplay && unit && unit.owner === 'england' && Math.abs(unit.x - tile.x) + Math.abs(unit.y - tile.y) === 1 && unit.moves > 0) {
      const next = moveUnit(game, unit.id, tile.x, tile.y);
      if (next !== game) {
        setGame(next);
        const survivor = next.armies.find(a => a.owner === unit.owner && a.x === tile.x && a.y === tile.y);
        setSelected(survivor ? { type: 'unit', id: survivor.id } : null);
        return;
      }
      if (!tile.occupant) {
        setNotice(tile.terrain === 'water' ? 'Water cannot be crossed.' : 'Not enough movement to enter this mountain.');
        return;
      }
      if (tile.occupant.owner === unit.owner && tile.occupant.general && unit.general) {
        setSelected({ type: 'unit', id: tile.occupant.id });
        setNotice('Armies with two generals cannot merge.');
        return;
      }
    }
    if (tile.occupant) setSelected({ type: 'unit', id: tile.occupant.id });
    else if (tile.place) setSelected({ type: 'city', id: tile.place.id });
    else setSelected(null);
  }

  function doRecruit(kind) {
    const next = recruit(game, city.id, kind);
    if (next === game) {
      setNotice('Not enough resources, or a unit is already in this city.');
      return;
    }
    setGame(next);
    setSelected({ type: 'unit', id: `army-${game.nextId}` });
    setNotice('');
  }

  function focusUnit(target) {
    setSelected({ type: 'unit', id: target.id });
    setCamera(cameraFor(target.x, target.y));
    setNotice('');
  }

  function focusCity(target) {
    setSelected({ type: 'city', id: target.id });
    setCamera(cameraFor(target.x, target.y));
    setNotice('');
  }

  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><div className="brand-mark"><Icon name="crown" size={23}/></div><div><strong>CROWN <span>&</span></strong><small>FRONTIER</small></div></div>
      <div className="sidebar-label">YOUR CAMPAIGN</div>
      <div className="kingdom-card"><div className="crest"><Icon name="crown" size={25}/></div><div><strong>Kingdom of England</strong><small>Your sovereign realm</small></div></div>
      <div className="sidebar-section"><div className="section-heading">KINGDOM OVERVIEW <span>01</span></div>
        <div className="overview-row"><Icon name="flag" size={16}/> <span>Settlements</span><strong>{ownedCities.length}</strong></div>
        <div className="overview-row"><Icon name="sword" size={16}/> <span>Units</span><strong>{playerUnits.length}</strong></div>
        <div className="overview-row"><Icon name="eye" size={16}/> <span>World explored</span><strong>{(explored / 100).toFixed(1)}%</strong></div>
      </div>
      <div className="sidebar-section"><div className="section-heading">YOUR SETTLEMENTS <span>{String(ownedCities.length).padStart(2, '0')}</span></div>
        <div className="forces settlements" role="group" aria-label="Your settlements">{ownedCities.length ? ownedCities.map(place => <button key={place.id} onClick={() => focusCity(place)} aria-pressed={city?.id === place.id} className={`force-row ${city?.id === place.id ? 'active' : ''}`}><span className="force-icon"><Icon name="flag" size={16}/></span><span><strong>{place.name}</strong><small>{place.capital ? 'Capital' : 'Town'} · {place.x + 1}, {place.y + 1}</small></span><Icon name="chevron" size={15}/></button>) : <div className="settlements-empty">No settlements held</div>}</div>
      </div>
      <div className="sidebar-section"><div className="section-heading">YOUR FORCES <span>{String(playerUnits.length).padStart(2, '0')}</span></div>
        <div className="forces">{playerUnits.map(a => <button key={a.id} onClick={() => focusUnit(a)} className={`force-row ${unit?.id === a.id ? 'active' : ''}`}><span className="force-icon"><Icon name={a.kind === 'scout' ? 'eye' : 'sword'} size={16}/></span><span><strong>{a.name}</strong><small>{a.troops} {a.kind === 'scout' ? 'scouts' : 'soldiers'}</small></span><Icon name="chevron" size={15}/></button>)}</div>
      </div>
      <div className="sidebar-section"><div className="section-heading">YOUR GENERALS <span>{String(generals.length).padStart(2, '0')}</span></div>
        <div className="forces settlements" role="group" aria-label="Your generals">{generals.length ? generals.map(army => <button key={army.general.id} onClick={() => focusUnit(army)} aria-pressed={unit?.general?.id === army.general.id} className={`force-row ${unit?.general?.id === army.general.id ? 'active' : ''}`}><span className="force-icon"><Icon name="crown" size={16}/></span><span><strong>{army.general.name}</strong><small>Level {army.general.level} · {army.name} ({army.x + 1}, {army.y + 1})</small></span><Icon name="chevron" size={15}/></button>) : <div className="settlements-empty">No generals in service</div>}</div>
      </div>
      <div className="sidebar-bottom"><span className="status-dot"/> CAMPAIGN IN PROGRESS <small>Prototype · v0.1</small></div>
    </aside>

    <main className="main">
      <header className="topbar"><div className="breadcrumb">CAMPAIGN <span>/</span> <b>THE KNOWN WORLD</b></div><div className="top-right"><div className="resource"><Icon name="gold"/><span><b>{resources.gold.toLocaleString()}</b><small>GOLD</small></span></div><div className="resource"><Icon name="food"/><span><b>{resources.food.toLocaleString()}</b><small>FOOD</small></span></div><div className="resource"><Icon name="people"/><span><b>{resources.population.toLocaleString()}</b><small>POPULATION</small></span></div><div className="turn-chip"><small>CURRENT TURN</small><b>{String(game.turn).padStart(2, '0')}</b></div></div></header>
      <div className="content">
        <div className="page-heading"><div><div className="eyebrow"><span/> YOUR KINGDOM AWAITS</div><h1>The Known World</h1><p>Explore the frontier, grow your kingdom, and make your mark.</p></div><div className="turn-actions"><button className={`autoplay-button ${playMode === 'normal' ? 'running' : ''}`} aria-pressed={playMode === 'normal'} onClick={() => { setPlayMode(playMode === 'normal' ? null : 'normal'); setNotice(''); }}><span>{playMode === 'normal' ? 'Pause autoplay' : 'Autoplay'}<small>{playMode === 'normal' ? 'Take back control' : 'Watch your kingdom'}</small></span><span className="autoplay-icon" aria-hidden="true">{playMode === 'normal' ? 'Ⅱ' : '▶'}</span></button><button className={`autoplay-button ${playMode === 'fast' ? 'running' : ''}`} aria-pressed={playMode === 'fast'} onClick={() => { setPlayMode(playMode === 'fast' ? null : 'fast'); setNotice(''); }}><span>{playMode === 'fast' ? 'Pause fast play' : 'Fast Play'}<small>{playMode === 'fast' ? 'Take back control' : 'Advance quickly'}</small></span><span className="autoplay-icon" aria-hidden="true">{playMode === 'fast' ? 'Ⅱ' : '▶▶'}</span></button><button className="end-turn" disabled={autoplay} onClick={() => { setGame(endTurn(game)); setNotice(''); }}><span>End turn <small>Let the world advance</small></span><span className="end-arrow">→</span></button></div></div>
        <div className="workspace">
          <section className="map-panel"><div className="panel-header"><div><div className="panel-title"><span className="gold-dot"/> WORLD MAP <span className="subtle">/</span> <span className="subtle">THE FRONTIER</span></div><div className="panel-subtitle">A world of opportunity lies beyond the fog.</div></div><div className="map-coordinates">VIEW <b>{camera.x + 1}–{camera.x + 8} / {camera.y + 1}–{camera.y + 8}</b></div></div>
            <div className="map-wrap"><div className="map-grid" role="grid" aria-label="World map, eight by eight tiles">{tiles.map(tile => {
              const reachable = !autoplay && unit?.owner === 'england' && canMoveUnit(game, unit, tile.x, tile.y);
              const merging = reachable && tile.occupant?.owner === 'england';
              const selectedTile = (unit && unit.x === tile.x && unit.y === tile.y) || (city && city.x === tile.x && city.y === tile.y);
              const owner = tile.region?.owner;
              return <button role="gridcell" key={`${tile.x}-${tile.y}`} onClick={() => clickTile(tile)} className={`tile ${tile.revealed ? tile.terrain : 'fog'} ${reachable ? 'reachable' : ''} ${selectedTile ? 'selected' : ''}`} style={owner ? { '--region-color': KINGDOMS[owner].color } : undefined} aria-label={`${tile.x + 1}, ${tile.y + 1}: ${tile.revealed ? `${tile.place?.name || tile.terrain}${tile.occupant ? `, ${tile.occupant.name}` : ''}` : 'unexplored'}${merging ? ', merge' : reachable ? ', reachable' : ''}`}>
                {tile.revealed && <><span className="terrain-detail">{tile.terrain === 'forest' ? '♠  ♠' : tile.terrain === 'mountain' ? '▲  ▲' : tile.terrain === 'water' ? '≈  ≈' : tile.terrain === 'field' ? '∿ ∿ ∿' : '·  ˙'}</span>{tile.place && <><TownArt capital={tile.place.capital}/><span className="tile-name">{tile.place.name}</span></>}{tile.occupant && <span className={`unit-marker ${tile.occupant.owner === 'england' ? 'friendly' : 'enemy'}`} style={{ '--unit-color': KINGDOMS[tile.occupant.owner].color }}><Icon name={tile.occupant.kind === 'scout' ? 'eye' : 'sword'} size={14}/><b>{tile.occupant.troops}</b></span>}</>}
                {!tile.revealed && <span className="fog-mark">·</span>}
              </button>;
            })}</div></div>
            <div className="map-footer"><div className="legend"><span><i className="legend-dot england"/> Your kingdom</span><span><i className="legend-dot neutral"/> Neutral settlement</span><span><i className="legend-dot barbarian-key"/> Raiders</span><span><i className="legend-dot water-key"/> Water</span><span><i className="legend-dot mountain-key"/> Mountain</span><span><i className="legend-dot unknown"/> Unexplored</span></div><div className="map-nav"><button onClick={() => setCamera(c => moveCamera(c, -1, 0))} aria-label="Pan map left">←</button><button onClick={() => setCamera(c => moveCamera(c, 0, -1))} aria-label="Pan map up">↑</button><button onClick={() => setCamera(c => moveCamera(c, 0, 1))} aria-label="Pan map down">↓</button><button onClick={() => setCamera(c => moveCamera(c, 1, 0))} aria-label="Pan map right">→</button></div></div>
          </section>
          <aside className="right-column">
            <section className="detail-panel"><div className="detail-heading"><span>SELECTED</span><Icon name="crosshair" size={16}/></div>
              {unit ? <><div className="selection-icon"><Icon name={unit.kind === 'scout' ? 'eye' : 'sword'} size={26}/></div><div className="selection-tag">{unit.owner === 'england' ? 'YOUR FORCES' : KINGDOMS[unit.owner].name.toUpperCase()}</div><h2>{unit.name}</h2><p>{unit.kind === 'barbarian' ? 'Roaming raiders that attack and loot settlements.' : unit.kind === 'scout' ? 'A light-footed party, ready to reveal the unknown.' : `A host of ${unit.units} / 5 merged units, with room for up to 300 soldiers.`}</p><div className="detail-stats"><div><small>STRENGTH</small><b>{unit.troops} <span>{unit.kind === 'barbarian' ? 'raiders' : unit.kind === 'scout' ? 'scouts' : 'soldiers'}</span></b></div><div><small>MOVEMENT</small><b>{unit.moves} <span>/ {unit.kind === 'barbarian' ? 2 : 3} points</span></b></div></div>{unit.general ? <div className="general-detail"><div className="general-heading"><span>GENERAL</span><span>LEVEL {unit.general.level}</span></div><strong>{unit.general.name}</strong><div className="general-skills">{Object.entries(unit.general.skills).map(([skill, value]) => <div key={skill}><small>{skill}</small><b>{value}</b></div>)}</div><small className="general-hint">Skills do not affect combat yet.</small></div> : unit.kind === 'army' && <div className="general-detail"><div className="general-heading">NO GENERAL ASSIGNED</div></div>}{unit.owner === 'england' && <div className="instruction"><span>✦</span> {autoplay ? 'Autoplay is issuing orders. Pause to move your units manually.' : 'Move onto a friendly army to merge. Two generals cannot merge. Water blocks movement; mountains cost 2 points.'}</div>}{game.cities.some(c => c.x === unit.x && c.y === unit.y) && <button className="secondary-button" onClick={() => setSelected({ type: 'city', id: game.cities.find(c => c.x === unit.x && c.y === unit.y).id })}>View settlement <span>→</span></button>}</>
                : city ? <><div className="selection-icon"><Icon name="flag" size={26}/></div><div className="selection-tag">{city.owner ? KINGDOMS[city.owner].name.toUpperCase() : 'NEUTRAL SETTLEMENT'}</div><h2>{city.name}</h2><p>{city.owner === 'england' ? 'A settlement under your banner. It produces resources each turn.' : 'Send an army here to claim this settlement for your kingdom.'}</p><div className="detail-stats"><div><small>POSITION</small><b>{city.x + 1}, {city.y + 1}</b></div><div><small>STATUS</small><b>{city.capital ? 'Capital' : 'Town'}</b></div></div>{city.owner === 'england' && <><div className="instruction"><span>✦</span> {cityOccupant?.owner === 'england' && cityOccupant.kind === 'army' ? `Garrison: ${cityOccupant.troops} soldiers.` : 'No army garrison. This settlement is vulnerable to raiders.'}</div><button className="secondary-button" disabled={autoplay} onClick={() => doRecruit('army')}>Raise army <span>60 gold · 40 food · 60 people</span></button><button className="secondary-button" disabled={autoplay} onClick={() => doRecruit('scout')}>Recruit scouts <span>30 gold · 15 food · 20 people</span></button><small className="recruit-hint">The city tile must be unoccupied. New units move next turn.</small></>}</>
                  : <><div className="selection-icon"><Icon name="crosshair" size={26}/></div><div className="selection-tag">AWAITING ORDERS</div><h2>Choose your next move</h2><p>Select an army or a settlement on the map to see its details and available actions.</p></>}
              {notice && <div className="notice" role="alert">{notice}</div>}
            </section>
            <section className="minimap-panel"><div className="detail-heading"><span>THE WIDER WORLD</span><span className="mini-label">100 × 100</span></div><svg className="minimap" viewBox="0 0 100 100" role="img" aria-label="Overview of discovered world"><rect width="100" height="100" fill="#25342c"/>{Object.keys(game.discovered).map(k => { const [x, y] = k.split(',').map(Number); const terrain = terrainAt(x, y); return <rect key={k} x={x} y={y} width="1" height="1" fill={terrain === 'water' ? '#78a8c1' : terrain === 'mountain' ? '#93877b' : '#b3bb8c'}/>; })}<rect x={camera.x} y={camera.y} width="8" height="8" fill="none" stroke="#e7c37d" strokeWidth="1.5"/></svg><div className="minimap-caption"><span><i className="legend-dot england"/> Current view</span><span>{(explored / 100).toFixed(1)}% explored</span></div></section>
            <section className="activity-panel"><div className="detail-heading"><span>CHRONICLE</span><button className="show-chronicle" onClick={() => setShowChronicle(true)}>Show All</button></div>{game.log.slice(0, 3).map((entry, i) => <div className="activity" key={`${entry}-${i}`}><i/><span>{entry}</span></div>)}</section>
          </aside>
        </div>
        <div className="bottom-note"><span>✧</span> A kingdom is built one decision at a time. <span>✧</span><small>ARROW KEYS TO PAN THE MAP</small></div>
      </div>
    </main>
    {showChronicle && <Chronicle log={game.log} onClose={() => setShowChronicle(false)}/>}
  </div>;
}

createRoot(document.getElementById('root')).render(<App/>);
