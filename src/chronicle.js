export function addLog(state, message, category = "major") {
  const text = `Turn ${state.turn}: ${message}`;
  state.log.unshift(text);
  state.logEvents.unshift({ turn: state.turn, category, text });
}

export function chronicleEntries(events, condensed = true) {
  const result = [];
  let groups = new Map();
  for (const event of [...events].reverse()) {
    if (condensed && event.category !== "major") {
      const key = `${event.turn}:${event.category}`;
      const group = groups.get(key);
      if (group) {
        group.count++;
        group.text = `Turn ${event.turn}: ${group.count} ${event.category} events.`;
      } else {
        const entry = { ...event, count: 1 };
        groups.set(key, entry);
        result.push(entry);
      }
    } else {
      result.push({ ...event, count: 1 });
      groups = new Map();
    }
  }
  return result.map((entry) => entry.text);
}

export function rememberGeneral(state, general, event) {
  if (!general) return;
  const previous = state.generalHistory[general.id];
  state.generalHistory[general.id] = {
    id: general.id,
    name: general.name,
    events: event
      ? [...(previous?.events || []), `Turn ${state.turn}: ${event}`]
      : previous?.events || [],
  };
}

export function generalLabel(general) {
  return general ? `${general.name} [${general.id}]` : "No general";
}

export function generalPast(state, general) {
  const events = general && state.generalHistory[general.id]?.events;
  return events?.length
    ? events.slice(-3).join(" | ")
    : "No previous recorded actions";
}

export function cityLabel(city) {
  return `${city.name} [${city.id}]`;
}
