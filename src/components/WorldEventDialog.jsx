import React, { useEffect, useRef } from "react";

export default function WorldEventDialog({ event, onChoose }) {
  const dialog = useRef(null);
  useEffect(() => {
    const element = dialog.current;
    element.showModal();
    return () => element.close();
  }, []);

  return (
    <dialog
      ref={dialog}
      className="world-event-dialog"
      aria-labelledby="world-event-title"
      aria-describedby="world-event-description"
      onCancel={(event) => event.preventDefault()}
    >
      <p className="world-event-label">World event</p>
      <h2 id="world-event-title">{event.title}</h2>
      <p id="world-event-description">{event.description}</p>
      <div className="world-event-choices">
        {event.choices.map((choice, index) => (
          <button key={choice.label} type="button" onClick={() => onChoose(index)}>
            <strong>{choice.label}</strong>
            <span>{choice.summary}</span>
          </button>
        ))}
      </div>
    </dialog>
  );
}
