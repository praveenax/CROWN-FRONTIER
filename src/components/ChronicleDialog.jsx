import { useEffect, useMemo, useRef, useState } from "react";
import { chronicleEntries } from "../game.js";

export default function ChronicleDialog({ events, onClose }) {
  const dialog = useRef(null);
  const [copyStatus, setCopyStatus] = useState("");
  const [condensed, setCondensed] = useState(true);
  const entries = useMemo(
    () => chronicleEntries(events, condensed),
    [events, condensed],
  );
  const text = useMemo(() => entries.join("\n"), [entries]);

  useEffect(() => {
    dialog.current.showModal();
  }, []);

  async function copyLog() {
    try {
      await navigator.clipboard.writeText(text);
      setCopyStatus("Chronicle copied.");
    } catch {
      setCopyStatus(
        "Could not copy. Select the log below and copy it manually.",
      );
    }
  }

  function close() {
    dialog.current.close();
    onClose();
  }

  return (
    <dialog
      ref={dialog}
      className="chronicle-dialog"
      aria-labelledby="chronicle-title"
      onCancel={(event) => {
        event.preventDefault();
        close();
      }}
    >
      <div className="chronicle-header">
        <div>
          <div className="selection-tag">CAMPAIGN HISTORY</div>
          <h2 id="chronicle-title">The Chronicle</h2>
          <p>
            Campaign events from all kingdoms, including unexplored territory.
          </p>
        </div>
        <button
          className="chronicle-close"
          onClick={close}
          aria-label="Close chronicle"
          autoFocus
        >
          ×
        </button>
      </div>
      <div className="chronicle-toolbar">
        <label>
          View{" "}
          <select
            value={condensed ? "condensed" : "full"}
            onChange={(event) => {
              setCondensed(event.target.value === "condensed");
              setCopyStatus("");
            }}
          >
            <option value="condensed">Condensed</option>
            <option value="full">Full detail</option>
          </select>
        </label>
        <span>{entries.length} entries · oldest first</span>
        <button className="chronicle-copy" onClick={copyLog}>
          Copy log
        </button>
      </div>
      <p className="copy-status" role="status">
        {copyStatus || "Select the text below to copy it manually."}
      </p>
      <textarea
        className="chronicle-log"
        aria-label="Campaign event log"
        readOnly
        value={text}
        onFocus={(event) => event.target.select()}
      />
    </dialog>
  );
}
