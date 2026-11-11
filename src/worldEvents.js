// Effects are immediate. Population affects the largest owned city and troops
// affect the largest army. The event dialog previews the actual changes.
export const WORLD_EVENTS = [
  {
    id: "great-storm", title: "Storm of the Ages",
    description: "Floodwaters cut roads and threaten the granaries. Each crown must decide what to save.",
    choices: [
      { label: "Buy emergency grain", effects: { gold: -90, food: 120 } },
      { label: "Quarter troops in the towns", effects: { food: -70, troops: 30 } },
      { label: "Salvage the flooded storehouses", effects: { food: -85, gold: 45 } },
    ],
  },
  {
    id: "barbarian-horde", title: "Barbarian Horde",
    description: "A host gathers beyond the frontier. Paying it off, arming a defense, and risking a raid carry different costs.",
    choices: [
      { label: "Pay tribute", effects: { gold: -120, food: -30, underfundedRaiders: 85 } },
      { label: "Arm the frontier", effects: { gold: -65, food: -55, troops: 35, raiders: 45 } },
      { label: "Refuse tribute and levy supplies", effects: { gold: 45, food: 35, raiders: 85 } },
    ],
  },
  {
    id: "drought", title: "The Long Drought",
    description: "Wells run shallow and the fields dry out.",
    choices: [
      { label: "Import grain", effects: { gold: -110, food: 130 } },
      { label: "Open public kitchens", effects: { food: -80, population: 180 } },
      { label: "Sell emergency water rights", effects: { gold: 85, population: -140 } },
    ],
  },
  {
    id: "bumper-harvest", title: "The Golden Harvest",
    description: "A rare surplus gives the crowns a chance to restock, trade, or feed new settlers.",
    choices: [
      { label: "Store the harvest", effects: { food: 180 } },
      { label: "Sell the surplus", effects: { gold: 150, food: 20 } },
      { label: "Give grain to settlers", effects: { food: 45, population: 240 } },
    ],
  },
  {
    id: "hard-winter", title: "The Winter Without Mercy",
    description: "An early freeze traps households and supply carts in the snow.",
    choices: [
      { label: "Ration the stores", effects: { food: -100, population: 100 } },
      { label: "Hire winter caravans", effects: { gold: -100, food: 100 } },
      { label: "Withdraw the exposed patrols", effects: { troops: -25, food: 70 } },
    ],
  },
  {
    id: "refugees", title: "The Road of Refugees",
    description: "Displaced families arrive at gates across the realm.",
    choices: [
      { label: "Open the gates", effects: { food: -90, population: 280 } },
      { label: "Offer paid work", effects: { gold: -80, population: 180, food: 35 } },
      { label: "Fund passage elsewhere", effects: { gold: -35, food: 15 } },
    ],
  },
  {
    id: "pestilence", title: "The Grey Fever",
    description: "A fever spreads along the trade roads and reaches the larger towns.",
    choices: [
      { label: "Hire physicians", effects: { gold: -130, population: -40 } },
      { label: "Close the markets", effects: { gold: -55, food: -55, population: -70 } },
      { label: "Keep trade moving", effects: { gold: 85, population: -230 } },
    ],
  },
  {
    id: "market-fair", title: "The Great Fair",
    description: "Merchants gather for a fair that can fill either treasuries or storehouses.",
    choices: [
      { label: "Tax the stalls", effects: { gold: 135, food: -35 } },
      { label: "Trade for supplies", effects: { gold: -60, food: 155 } },
      { label: "Offer free stalls to newcomers", effects: { gold: -40, population: 200 } },
    ],
  },
  {
    id: "mercenaries", title: "Swords for Hire",
    description: "Disbanded soldiers seek employers while quartermasters auction their supplies.",
    choices: [
      { label: "Hire the veterans", effects: { gold: -125, troops: 45 } },
      { label: "Settle their families", effects: { food: -50, population: 165 } },
      { label: "Buy their provisions", effects: { gold: -60, food: 100 } },
    ],
  },
  {
    id: "desertion", title: "The Unpaid Watch",
    description: "Soldiers in the largest army demand better pay and rations.",
    choices: [
      { label: "Pay the arrears", effects: { gold: -95 } },
      { label: "Offer extra rations", effects: { food: -80, troops: -8 } },
      { label: "Release the discontented", effects: { troops: -35, population: 80 } },
    ],
  },
  {
    id: "pilgrimage", title: "The Pilgrims' Road",
    description: "Pilgrims arrive in large numbers and merchants follow them.",
    choices: [
      { label: "Provide lodging", effects: { food: -65, population: 160 } },
      { label: "Collect tolls", effects: { gold: 110, food: -30 } },
      { label: "Supply the roadside kitchens", effects: { gold: -45, food: 75 } },
    ],
  },
  {
    id: "river-flood", title: "The Rivers Rise",
    description: "A sudden thaw swells the rivers and washes away stores.",
    choices: [
      { label: "Rebuild the levees", effects: { gold: -105, population: -25 } },
      { label: "Evacuate the lowlands", effects: { food: -70, population: -55 } },
      { label: "Sell salvage rights", effects: { gold: 65, population: -150, food: -50 } },
    ],
  },
  {
    id: "mine", title: "Silver Beneath the Hills",
    description: "Prospectors offer shares in a newly discovered silver seam.",
    choices: [
      { label: "Take the crown's share", effects: { gold: 175, food: -45 } },
      { label: "Lease plots to workers", effects: { gold: 65, population: 130 } },
      { label: "Sell the mining rights for provisions", effects: { food: 135, gold: 25 } },
    ],
  },
  {
    id: "granary-fire", title: "The Burning Granaries",
    description: "Fires threaten the season's food reserve.",
    choices: [
      { label: "Buy replacement grain", effects: { gold: -115, food: 45 } },
      { label: "Salvage the stores", effects: { food: -75, troops: -10 } },
      { label: "Compensate displaced households", effects: { gold: -45, food: -55, population: 65 } },
    ],
  },
  {
    id: "census", title: "The Crown's Census",
    description: "New records reveal taxable estates, unregistered households, and eligible recruits.",
    choices: [
      { label: "Collect back taxes", effects: { gold: 145, population: -65 } },
      { label: "Recognize unregistered households", effects: { population: 190, gold: -35 } },
      { label: "Call up volunteers", effects: { troops: 30, food: -55 } },
    ],
  },
  {
    id: "tournament", title: "The Tournament of Crowns",
    description: "Competitors, merchants, and recruiters converge on the towns.",
    choices: [
      { label: "Recruit the finalists", effects: { gold: -90, troops: 30 } },
      { label: "Charge for the stands", effects: { gold: 105, food: -35 } },
      { label: "Offer land to visiting families", effects: { food: -60, population: 170 } },
    ],
  },
  {
    id: "price-shock", title: "The Grain Price Shock",
    description: "Merchant houses abruptly raise prices as supplies tighten.",
    choices: [
      { label: "Subsidize imports", effects: { gold: -105, food: 130 } },
      { label: "Sell from state stores", effects: { food: -110, gold: 110 } },
      { label: "Compensate hungry households", effects: { gold: -55, population: 95 } },
    ],
  },
  {
    id: "shipwreck", title: "Wrecks on the Coast",
    description: "Storm-wrecked ships leave cargo and stranded crews along the trade routes.",
    choices: [
      { label: "Salvage merchant cargo", effects: { gold: 120, food: -30 } },
      { label: "Rescue and settle the crews", effects: { food: -55, population: 150 } },
      { label: "Buy salvaged provisions", effects: { gold: -45, food: 120 } },
    ],
  },
  {
    id: "land-dispute", title: "The Boundary Dispute",
    description: "Villages petition the crowns over who may farm and collect rents.",
    choices: [
      { label: "Compensate the villages", effects: { gold: -70, population: 160 } },
      { label: "Auction the contested leases", effects: { gold: 135, population: -90 } },
      { label: "Set aside public farmland", effects: { gold: -40, food: 115 } },
    ],
  },
  {
    id: "trade-embargo", title: "The Broken Trade Road",
    description: "Merchants stop using their usual routes, stranding caravans and raising costs.",
    choices: [
      { label: "Subsidize a new route", effects: { gold: -90, food: 125 } },
      { label: "Sell stranded stock locally", effects: { food: -70, gold: 90 } },
      { label: "Sponsor displaced traders", effects: { gold: -55, population: 110 } },
    ],
  },
  {
    id: "veterans", title: "The Veterans' Petition",
    description: "Veterans ask the crowns for land, pensions, or a return to service.",
    choices: [
      { label: "Grant land", effects: { food: -75, population: 190 } },
      { label: "Recall willing veterans", effects: { gold: -75, troops: 35 } },
      { label: "Pay pensions", effects: { gold: -60, population: 85, food: 25 } },
    ],
  },
  {
    id: "locusts", title: "The Black Swarm",
    description: "Locusts descend across the harvest roads.",
    choices: [
      { label: "Buy seed and provisions", effects: { gold: -125, food: 110 } },
      { label: "Feed the towns first", effects: { food: -110, population: 90 } },
      { label: "Sell damaged crops", effects: { gold: 55, food: -90 } },
    ],
  },
  {
    id: "scholars", title: "The Traveling Academy",
    description: "Scholars and artisans offer their services to any crown willing to sponsor them.",
    choices: [
      { label: "Offer homes to artisans", effects: { gold: -105, population: 220 } },
      { label: "Commission surveys of farmland", effects: { gold: -65, food: 125 } },
      { label: "Sell commissions to merchants", effects: { gold: 100, population: 55 } },
    ],
  },
  {
    id: "amnesty", title: "The Outlaws' Amnesty",
    description: "Bands of outlaws offer to lay down their weapons in return for a place in the realm.",
    choices: [
      { label: "Resettle their families", effects: { food: -60, population: 185 } },
      { label: "Enlist eligible volunteers", effects: { gold: -80, troops: 40 } },
      { label: "Accept their restitution", effects: { gold: 95, population: 35 } },
    ],
  },
];
