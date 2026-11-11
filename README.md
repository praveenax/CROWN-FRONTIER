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

- Select the Royal Guard and click an adjacent highlighted tile to move. Each unit has three movement points per turn; mountains cost two points to enter and blue water tiles cannot be crossed. Use the arrow keys or map buttons to pan.
- Move an army onto an adjacent friendly army to merge them, up to five original units and 300 soldiers in the resulting formation. Scouts cannot merge. The merged army retains the lower remaining movement of the two, and its unit count persists after casualties.
- Armies claim settlements they enter. Each tile belongs to the region of its nearest settlement, so ownership changes with that settlement.
- Select an owned, unoccupied settlement to raise an army or recruit scouts. Recruitment costs gold, food, and population; new units can move on the next turn. Scouts reveal a larger area but cannot claim settlements.
- Select an owned settlement under **Your settlements** in the sidebar to center the map and open its details, even when a unit occupies it.
- End your turn to collect resources from owned settlements and let the three opposing kingdoms act. They move toward settlements, fight, merge compatible armies and recruit new units using their resources.
- Select **Autoplay** beside End turn to watch England issue orders and advance turns automatically. Its units explore, pursue nearby discovered enemies, merge, and claim discovered settlements. It recruits armies when resources and an empty city are available, up to eight separate army formations at a time; rivals use the same limit. The map follows each action. Pause autoplay to resume manual control. It stops if England has no settlements or units, or all settlements are owned and all enemy units defeated.
- The fog shows only explored tiles. Explored tiles remain visible; this prototype does not yet distinguish current line of sight from previously explored territory.

Combat is a placeholder: when opposing units meet, the larger force wins and loses troops equal to the opposing strength; ties favor the defender. There are no detailed battle mechanics, diplomacy, saving, or victory conditions yet. Campaign state resets on refresh.
