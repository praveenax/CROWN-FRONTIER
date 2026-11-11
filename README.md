# Crown & Frontier

A single-player, turn-based kingdom strategy prototype. The world is a deterministic 100 × 100 grid, viewed eight tiles at a time.

## Run

Requires Node.js 18 or newer.

```sh
npm install
npm run dev
```

Open the address printed by Vite. Run `npm test` for the game logic tests or `npm run build` for a production build.

## How to play

- Select the Royal Guard and click an adjacent highlighted tile to move. Each unit can move three tiles per turn; use the arrow keys or map buttons to pan.
- Armies claim settlements they enter. Each tile belongs to the region of its nearest settlement, so ownership changes with that settlement.
- Select an owned, unoccupied settlement to raise an army or recruit scouts. Recruitment costs gold, food, and population; new units can move on the next turn. Scouts reveal a larger area but cannot claim settlements.
- End your turn to collect resources from owned settlements and let the three opposing kingdoms act. They move toward settlements, claim them, and use resources to reinforce their armies.
- The fog shows only explored tiles. Explored tiles remain visible; this prototype does not yet distinguish current line of sight from previously explored territory.

Combat is a placeholder: when opposing units meet, the larger force wins and loses troops equal to the opposing strength; ties favor the defender. There are no detailed battle mechanics, diplomacy, saving, or victory conditions yet. Campaign state resets on refresh.
