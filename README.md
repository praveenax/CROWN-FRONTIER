# Crown & Frontier

A single-player, turn-based kingdom strategy prototype. The world is a deterministic 100 × 100 grid, viewed eight tiles at a time.

## Run

Requires Node.js 18 or newer.

```sh
npm install
npm run dev
```

Open the address printed by Vite. Run `npm test` for the game logic tests or `npm run build` for a production build.

## Editing game data

Edit [src/data.json](./src/data.json) to change kingdom names and colors, troop stats and costs, city development tiers, buildings, generated names and lakes, map settings, or the starting campaign setup. The game reads this file when it starts; restart or refresh the page after editing.

## How to play

- Select the Royal Guard and click an adjacent highlighted tile to move. Each unit has three movement points per turn; mountains cost two points to enter and blue water tiles cannot be crossed. The world has numerous lakes and mountain ranges. Use the arrow keys or map buttons to pan.
- Move an army onto an adjacent friendly army to merge them, up to five original units and 300 soldiers in the resulting formation. Scouts cannot merge, nor can two armies that each have a general. If only one army has a general, that general leads the merged army. The merged army retains the lower remaining movement of the two, and its unit count persists after casualties. Its full strength is the sum of the original armies' full strengths, capped at 300.
- An army standing in a friendly settlement recovers 10% of its full strength at the start of each turn, rounded up and capped at full strength. For example, an army with a full strength of 60 and 20 survivors recovers 6 soldiers per turn. Recovery is free, applies to opposing kingdoms too, and happens before their actions and barbarian attacks. Scouts and raiders do not recover this way.
- Armies claim settlements after defeating their garrison and city defenses. Neutral settlements have defenses too. Each tile belongs to the region of its nearest settlement, so ownership changes with that settlement.
- Select an owned, unoccupied settlement to raise an army or recruit scouts. Recruitment costs kingdom gold and food and that city's population; new units can move on the next turn. Scouts reveal a larger area but cannot claim settlements.
- Select an owned settlement under **Your settlements** in the sidebar to center the map and open its details, even when a unit occupies it.
- Each city has its own population, defenses, buildings, and production. The capitals are Crownstead, Lunebelle, Solmere, and Frostharbor. Capitals start with 1,200 people; other settlements start with 300. Owned cities produce gold and food for their kingdom and grow each turn; neutral settlements do not grow or produce until claimed. Population tiers unlock the listed civic buildings automatically:

  | Level | Population | Buildings unlocked | Gold / food / growth per turn | Maximum defense |
  | --- | ---: | --- | --- | ---: |
  | 1 | 0 | Farm, Market, Palisade | 25 / 20 / 80 | 20 |
  | 2 | 500 | Guildhall | 35 / 30 / 100 | 30 |
  | 3 | 1,000 | Bank | 50 / 45 / 120 | 40 |
  | 4 | 2,000 | Stone walls | 70 / 60 / 150 | 50 |

  Buildings from earlier levels remain available. Production for a turn uses the level at its start; growth can then unlock the next level. Recruitment or raids can lower population and level, removing the higher-level bonuses until the city grows again. Captured cities retain their population and development.
- Select an owned city to construct extra improvements. Granaries add food and growth, Watchtowers increase maximum defenses, Trading Posts add gold, and Academies add growth. Each can be built once per city; their gold/food costs and effects are shown in the city panel. Trading Posts unlock at level 2 and Academies at level 3. Improvements stay with a city if it is captured.
- The Royal Guard starts with a general; newly recruited armies of any kingdom have a 50% chance of receiving one. Select a name under **Your generals** to find their army and inspect their skills. Generals start at level 1 with one point each in fighting, captain and charisma. Every battle their army wins increases their level and one randomly chosen skill by one; a general is lost if their army is defeated. These skills do not yet affect the placeholder combat.
- Each kingdom has a randomly named ruler for the campaign. Your ruler appears in the sidebar; all rulers appear in **Standings**. Rulers and generals draw from the same pool of first and last names.
- From turn 4, up to two barbarian bands appear every other turn near owned settlements (maximum 20 bands). Each has 20–40 raiders, moves up to two points per turn and seeks nearby cities. A garrison fights first, followed by city defenses if the attacker survives. Defenses use the same combat rule as armies, recover fully at the start of each turn, and remain damaged between attacks within that turn. A successful raid costs the owning kingdom up to 30 gold and 20 food and the city up to 50 population; the band then leaves and the city stays with its owner.
- End your turn to collect resources from owned settlements and let the three opposing kingdoms act. They move toward settlements, fight, merge compatible armies and recruit new units using their resources.
- Select **Autoplay** beside End turn to watch your kingdom issue orders and advance turns automatically. It keeps an army on each owned city when possible, explores, fights, merges and claims settlements. Autoplay and rival kingdoms can recruit beside a garrisoned city, up to four mobile armies plus one formation per owned city. Manual recruitment still requires an empty city. The map follows each action. Pause autoplay to resume manual control.
- Select **Fast Play** to run the same automatic orders much faster without following each action on the map. Pause it or switch to Autoplay at any time.
- Win by claiming every settlement and defeating all rival forces, including raiders. You lose when both your last settlement and your last army are gone. The game then pauses and offers a new campaign.
- Select **Standings** to compare all four kingdoms, including information beyond the fog. Economic score is treasury gold + food + city population + ten times gold and food production per turn. Military score is army and scout troops plus current city defenses. Land score is ten times the number of map tiles controlled by owned settlements, including water. Total score is the sum of these three scores; the highest total leads.
- Select **Show All** in the Chronicle to view and copy campaign history, including after the campaign ends. The default condensed view groups routine movement, recruitment, recovery, production, and minor raid events between major events; switch to **Full detail** for every recorded entry. Both views include events from all kingdoms beyond the fog. AI orders describe the target selected for that step, not a persistent strategy; manual moves are labeled separately. An operation ID links a single arrival's combat, breach, raid, and capture, while stable general and settlement IDs distinguish namesakes. Select a general or city to see recent history; the full log retains general losses and earlier events. City history tracks owners and occupation start turns; captures report completed turns held, retained population/buildings, and the actual change in production ownership. Nothing happens to rulers or treasuries on capture. History lasts for the current campaign and resets on refresh.
- The fog shows only explored tiles. Explored tiles remain visible; this prototype does not yet distinguish current line of sight from previously explored territory.

Combat is a placeholder: when opposing units meet, the larger force wins and loses troops equal to the opposing strength; ties favor the defender. There are no detailed battle mechanics, diplomacy, or saving yet. Campaign state resets on refresh.
