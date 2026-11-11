import React from "react";
export function Icon({ name, size = 20, className = "" }) {
  const paths = {
    crown: (
      <>
        <path d="m3 7 4 3 5-7 5 7 4-3-2 11H5L3 7Z" />
        <path d="M5 21h14" />
      </>
    ),
    gold: (
      <>
        <circle cx="12" cy="12" r="8" />
        <circle cx="12" cy="12" r="4" />
        <path d="M12 9v6m-2-4h4" />
      </>
    ),
    food: (
      <>
        <path d="M12 21V9m0 7c-5 0-7-3-7-6 4 0 7 2 7 6Zm0-4c0-4 3-6 7-6 0 4-2 6-7 6Z" />
        <path d="M12 9c-2-2-2-5 0-7 2 2 2 5 0 7Z" />
      </>
    ),
    people: (
      <>
        <circle cx="9" cy="8" r="3" />
        <path d="M3 20v-2a6 6 0 0 1 12 0v2M16 5a3 3 0 0 1 0 6m1 3a5 5 0 0 1 4 5v1" />
      </>
    ),
    sword: (
      <>
        <path d="m14 4 6-2-2 6L7 19l-3 1 1-3L14 4ZM4 14l6 6M3 21l3-3" />
      </>
    ),
    eye: (
      <>
        <path d="M2 12s4-6 10-6 10 6 10 6-4 6-10 6S2 12 2 12Z" />
        <circle cx="12" cy="12" r="3" />
      </>
    ),
    flag: (
      <>
        <path d="M5 21V4m0 1c5-3 8 3 14 0v9c-6 3-9-3-14 0" />
      </>
    ),
    chevron: <path d="m9 18 6-6-6-6" />,
    crosshair: (
      <>
        <circle cx="12" cy="12" r="7" />
        <path d="M12 2v4m0 12v4M2 12h4m12 0h4" />
      </>
    ),
    scroll: (
      <>
        <path d="M7 3h12v15H7a3 3 0 0 0-3 3V6a3 3 0 0 1 3-3Zm0 15a3 3 0 0 1 0 6h12v-6" />
        <path d="M10 7h6m-6 4h6" />
      </>
    ),
  };
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}

export function TownArt({ capital }) {
  return (
    <svg viewBox="0 0 60 50" className="town-art" aria-hidden="true">
      <path d="M5 43h50v4H5z" fill="#343a2c" opacity=".35" />
      <path
        d="M11 28h38v15H11z"
        fill="#d0bd8e"
        stroke="#555547"
        strokeWidth="1.5"
      />
      <path
        d="m8 29 22-17 22 17Z"
        fill="#9a6249"
        stroke="#555547"
        strokeWidth="1.5"
      />
      <path
        d="M22 18V8h16v10"
        fill="#d9c99e"
        stroke="#555547"
        strokeWidth="1.5"
      />
      <path
        d="m19 9 11-7 11 7Z"
        fill="#865443"
        stroke="#555547"
        strokeWidth="1.5"
      />
      <path
        d="M26 43V31h8v12M16 33h4m20 0h4M28 13h4"
        fill="none"
        stroke="#655746"
        strokeWidth="2"
      />
      {capital && (
        <>
          <path d="M30 2v-7" stroke="#e5d6a9" strokeWidth="1.5" />
          <path d="m30-5 9 2-9 3" fill="#d5aa62" />
        </>
      )}
    </svg>
  );
}
