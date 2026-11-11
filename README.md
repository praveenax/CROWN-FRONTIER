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
- Move an army onto an adjacent friendly army to merge them, up to five original units and 300 soldiers in the resulting formation. Scouts cannot merge, nor can two armies that each have a general. If only one army has a general, that general leads the merged army. The merged army retains the lower remaining movement of the two, and its unit count persists after casualties.
- Armies claim settlements they enter. Each tile belongs to the region of its nearest settlement, so ownership changes with that settlement.
- Select an owned, unoccupied settlement to raise an army or recruit scouts. Recruitment costs gold, food, and population; new units can move on the next turn. Scouts reveal a larger area but cannot claim settlements.
- Select an owned settlement under **Your settlements** in the sidebar to center the map and open its details, even when a unit occupies it.
- The Royal Guard starts with a general; newly recruited armies of any kingdom have a 50% chance of receiving one. Select a name under **Your generals** to find their army and inspect their skills. Generals start at level 1 with one point each in fighting, captain and charisma. Every battle their army wins increases their level and one randomly chosen skill by one; a general is lost if their army is defeated. These skills do not yet affect the placeholder combat.
- From turn 4, up to two barbarian bands appear every other turn near owned settlements (maximum 20 bands). Each has 20–40 raiders, moves up to two points per turn and seeks nearby cities. They obey terrain and attack garrisons using the normal battle rule. A successful raid costs the owning kingdom up to 30 gold, 20 food and 50 population; the band then leaves and the city stays with its owner. Keep an army on the city tile to defend it.
- End your turn to collect resources from owned settlements and let the three opposing kingdoms act. They move toward settlements, fight, merge compatible armies and recruit new units using their resources.
- Select **Autoplay** beside End turn to watch England issue orders and advance turns automatically. It keeps an army on each owned city when possible, explores, fights, merges and claims settlements. Autoplay and rival kingdoms can recruit beside a garrisoned city, up to four mobile armies plus one formation per owned city. Manual recruitment still requires an empty city. The map follows each action. Pause autoplay to resume manual control. It stops if England has no settlements or units, or all settlements are owned and all enemy units defeated.
- Select **Fast Play** to run the same automatic orders much faster without following each action on the map. Pause it or switch to Autoplay at any time.
- Select **Show All** in the Chronicle to view and copy the complete, turn-by-turn campaign history. It includes events from all kingdoms, including battles and raids beyond the explored map, so it can reveal information hidden by fog. The history lasts for the current campaign and resets on refresh.
- The fog shows only explored tiles. Explored tiles remain visible; this prototype does not yet distinguish current line of sight from previously explored territory.

Combat is a placeholder: when opposing units meet, the larger force wins and loses troops equal to the opposing strength; ties favor the defender. There are no detailed battle mechanics, diplomacy, saving, or victory conditions yet. Campaign state resets on refresh.
