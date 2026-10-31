import type { SampleWorld } from './types'

/** English demo world: 20 linked pages, a calendar, eras, and a few deliberate red links. */
export const drownedCrown: SampleWorld = {
  world: {
    name: 'The Drowned Crown',
    genre: 'Dark fantasy',
    tone: 'Melancholic, political',
    contentLanguage: 'en',
    cover: 'viridian',
    summary:
      'A salt-marsh kingdom that has been sinking for three hundred years. Its queen wears a crown pulled from the sea, its priests read the tides for omens, and every flood redraws the border between the living and the drowned.',
    calendar: {
      yearLabel: 'after the Founding',
      yearAbbr: 'AF',
      negativeLabel: 'before the Founding',
      negativeAbbr: 'BF',
    },
  },
  eras: [
    { name: 'Age of Founding', startYear: 0, endYear: 211, ink: 'jade', order: 0 },
    { name: 'Age of Water', startYear: 212, endYear: 308, ink: 'cobalt', order: 1 },
    { name: 'Age of Ash', startYear: 309, ink: 'sienna', order: 2 },
  ],
  pages: [
    {
      category: 'character',
      title: 'Queen Maelis Varn',
      aliases: ['Maelis', 'The Salt Queen'],
      status: 'complete',
      fields: {
        born: { year: 289 },
        species: 'Human',
        affiliation: [{ ref: 'House Varn' }],
        home: { ref: 'Varnhold' },
        occupation: 'Queen of the Reach',
        lifeStatus: 'alive',
      },
      body: `Maelis Varn is the last crowned ruler of [[House Varn]] and the first to wear [[The Drowned Crown]] since it was lost in [[The Great Flood]]. She took the throne at twenty-three after the [[Siege of Saltspire]] left her elder brother, [[Prince Edric Varn]], dead in the surf.

## Reign

Her [[Coronation of Maelis|coronation]] was held on the steps of the flooded cathedral in [[Varnhold]], with the water at her ankles. The [[The Tidebound|Tidebound]] called it an omen of favour; her enemies called it a warning.

She rules through two people she trusts and one she fears:

- [[Aldric Thorne]], her knight-commander, who carried her brother's body out of the sea.
- [[Lady Senna Holt]], her spymaster, who knows where every boat in the marsh is tied.
- [[Sister Ivra]], the oracle, who has never once been wrong about the tide.

> **Designer's note.** Maelis should feel like a ruler who is always negotiating with something larger than herself: the sea, the faith, the past. Never a villain, never safe.

## The crown

Since the coronation, the crown has not come off. Courtiers whisper that it cannot. Maelis has stopped answering the question.`,
    },
    {
      category: 'character',
      title: 'Aldric Thorne',
      aliases: ['The Grey Knight'],
      status: 'complete',
      fields: {
        born: { year: 271 },
        species: 'Human',
        affiliation: [{ ref: 'House Varn' }],
        home: { ref: 'Saltspire' },
        occupation: 'Knight-commander',
        lifeStatus: 'alive',
      },
      body: `Knight-commander of the queen's guard and the only survivor of the inner wall at the [[Siege of Saltspire]]. He found [[Prince Edric Varn]] in the surf the next morning and carried him back to [[Varnhold]] himself.

Thorne is loyal to [[Queen Maelis Varn]] in the way a man is loyal to a promise made to someone else. He distrusts [[The Tidebound]] openly and [[Lady Senna Holt]] privately.

## Equipment

He carries a salt-etched blade from the forges of [[Saltspire]] and refuses to wear the sea-green cloak of the guard, preferring the grey wool of the old marsh militia.`,
    },
    {
      category: 'character',
      title: 'Sister Ivra',
      aliases: ['The Oracle of the Tide'],
      status: 'draft',
      fields: {
        species: 'Human',
        affiliation: [{ ref: 'The Tidebound' }],
        home: { ref: 'The Sunken Abbey' },
        occupation: 'Oracle',
        lifeStatus: 'alive',
      },
      body: `The oracle of [[The Tidebound]], keeper of the tide tables at [[The Sunken Abbey]]. She reads the water using the rites of [[The Tide Faith]] and has predicted every flood since the [[Siege of Saltspire]].

No one knows her age. The abbey records list a "Sister Ivra" in the year of [[The Great Flood]], a century before she should have been born.`,
    },
    {
      category: 'character',
      title: 'Corwen the Ferryman',
      status: 'draft',
      fields: {
        species: 'Unknown',
        home: { ref: 'Greywater Marshes' },
        occupation: 'Ferryman',
        lifeStatus: 'unknown',
      },
      body: `A ferryman who poles a flat black boat through the [[Greywater Marshes]]. Travellers who pay him in salt arrive safely. Travellers who pay in coin arrive somewhere.

Locals say he ferried the dead after [[The Great Flood]] and simply never stopped. The [[Marsh Wights]] do not approach his boat.`,
    },
    {
      category: 'character',
      title: 'Lady Senna Holt',
      aliases: ['Senna'],
      status: 'complete',
      fields: {
        born: { year: 284 },
        species: 'Human',
        affiliation: [{ ref: 'House Varn' }, { ref: 'The Ash Company' }],
        home: { ref: 'Varnhold' },
        occupation: 'Spymaster',
        lifeStatus: 'alive',
      },
      body: `Spymaster to [[Queen Maelis Varn]]. Before entering royal service she kept the books for [[The Ash Company]], and she has never fully left: the mercenaries still answer her letters faster than the queen's.

She is the only member of the court who has seen [[Corwen the Ferryman]] up close and talked about it afterwards.`,
    },
    {
      category: 'location',
      title: 'Varnhold',
      aliases: ['The Capital'],
      status: 'complete',
      fields: {
        locationType: 'Capital city',
        region: { ref: 'Greywater Marshes' },
        ruler: { ref: 'Queen Maelis Varn' },
        population: 'about 40,000',
      },
      body: `Capital of the Reach and seat of [[House Varn]]. Founded on a ridge of black stone during [[The Founding of Varnhold]], it has lost a district to the sea in every generation since [[The Great Flood]].

## Districts

| District | Notes |
|---|---|
| The Ridge | Palace, cathedral, the old families |
| Lowtown | Canals, markets, half of it underwater at spring tide |
| The Drowned Quarter | Abandoned after 212 AF; now a pilgrimage site of [[The Tidebound]] |

The flooded cathedral on the Ridge is where [[Queen Maelis Varn]] was crowned.`,
    },
    {
      category: 'location',
      title: 'The Sunken Abbey',
      status: 'draft',
      fields: {
        locationType: 'Abbey (half-submerged)',
        region: { ref: 'Greywater Marshes' },
        ruler: { ref: 'The Tidebound' },
      },
      body: `Mother house of [[The Tidebound]], built on a sandbar that the sea reclaimed during [[The Great Flood]]. The lower cloisters are flooded twice a day; the monks pray standing in the water.

[[Sister Ivra]] keeps the tide tables in the bell tower, the only part of the abbey that has never flooded.`,
    },
    {
      category: 'location',
      title: 'Greywater Marshes',
      status: 'complete',
      fields: { locationType: 'Wetland region', population: 'scattered villages' },
      body: `The vast tidal wetland that surrounds [[Varnhold]] and most of the Reach. Paths shift with every tide; only [[Corwen the Ferryman]] and the old marsh families can cross it safely at night.

The marshes are home to the [[Marsh Wights]] and to the reed-cutters who practise [[Saltbinding]] without the church's blessing. To the west they open onto the sea and, on clear days, the outline of [[The Hollow Isles]].`,
    },
    {
      category: 'location',
      title: 'Saltspire',
      status: 'complete',
      fields: {
        locationType: 'Lighthouse fortress',
        region: { ref: 'Greywater Marshes' },
        ruler: { ref: 'House Varn' },
      },
      body: `A lighthouse fortress at the mouth of the marshes, guarding the only deep-water channel to [[Varnhold]]. Its forges quench steel in seawater, giving Saltspire blades their pale etching.

Scene of the [[Siege of Saltspire]] in 309 AF, when [[The Ash Company]] held the inner wall for eleven days.`,
    },
    {
      category: 'faction',
      title: 'House Varn',
      status: 'complete',
      fields: {
        factionType: 'Royal house',
        leader: { ref: 'Queen Maelis Varn' },
        headquarters: { ref: 'Varnhold' },
        founded: { year: 0 },
      },
      body: `The royal house of the Reach since [[The Founding of Varnhold]]. Its sigil is a crown above three waves.

Current members of note: [[Queen Maelis Varn]] and, until his death, [[Prince Edric Varn]]. Sworn swords include [[Aldric Thorne]].`,
    },
    {
      category: 'faction',
      title: 'The Tidebound',
      aliases: ['Tidebound'],
      status: 'complete',
      fields: {
        factionType: 'Religious order',
        leader: { ref: 'Sister Ivra' },
        headquarters: { ref: 'The Sunken Abbey' },
        founded: { year: 214 },
      },
      body: `A religious order founded in the years after [[The Great Flood]], devoted to [[The Tide Faith]]. They believe the sea keeps a ledger of every debt, and that floods are payments coming due.

The order controls the only reliable tide tables in the Reach, which gives it quiet power over trade, war and harvest. Their oracle is [[Sister Ivra]].`,
    },
    {
      category: 'faction',
      title: 'The Ash Company',
      status: 'draft',
      fields: {
        factionType: 'Mercenary company',
        headquarters: { ref: 'Saltspire' },
        founded: { year: 296 },
      },
      body: `A mercenary company paid in salt and land. Hired by the crown to hold [[Saltspire]], they changed sides on the ninth day of the [[Siege of Saltspire]] and changed back on the eleventh.

[[Lady Senna Holt]] kept their books for six years. Their current captain, [[Captain Harrow]], has never been seen without his helm.`,
    },
    {
      category: 'event',
      title: 'The Founding of Varnhold',
      status: 'complete',
      date: { year: 0 },
      fields: { place: { ref: 'Varnhold' }, participants: [{ ref: 'House Varn' }] },
      body: `The first Varn chieftain drove a black iron stake into the ridge above the marsh and declared that the sea would come no further. Year 0 of the calendar of the Reach. See [[House Varn]] and [[Varnhold]].`,
    },
    {
      category: 'event',
      title: 'The Great Flood',
      status: 'complete',
      date: { year: 212 },
      fields: {
        place: { ref: 'Greywater Marshes' },
        outcome: 'A third of the Reach lost to the sea; the crown lost with it.',
      },
      body: `A storm surge that drowned a third of the Reach in a single night. The Drowned Quarter of [[Varnhold]] was abandoned, [[The Sunken Abbey]] went under, and the old crown of [[House Varn]] was lost with the royal barge.

In the years that followed, [[The Tidebound]] rose to explain why.`,
    },
    {
      category: 'event',
      title: 'Siege of Saltspire',
      status: 'complete',
      date: { year: 309 },
      fields: {
        place: { ref: 'Saltspire' },
        participants: [{ ref: 'House Varn' }, { ref: 'The Ash Company' }, { ref: 'Aldric Thorne' }],
        outcome: 'Saltspire held; Prince Edric killed.',
      },
      body: `Eleven-day siege of [[Saltspire]] by raiders from [[The Hollow Isles]]. [[The Ash Company]] held the inner wall, briefly betrayed the crown, and returned to its side before the end.

[[Prince Edric Varn]] fell on the last night. [[Aldric Thorne]] recovered his body from the surf at dawn. The siege marks the start of the Age of Ash.`,
    },
    {
      category: 'event',
      title: 'Coronation of Maelis',
      status: 'complete',
      date: { year: 312 },
      fields: { place: { ref: 'Varnhold' }, participants: [{ ref: 'Queen Maelis Varn' }, { ref: 'The Tidebound' }] },
      body: `[[Queen Maelis Varn]] was crowned with [[The Drowned Crown]] on the steps of the flooded cathedral of [[Varnhold]], three years after her brother's death. [[Sister Ivra]] read the tide and declared it favourable.`,
    },
    {
      category: 'item',
      title: 'The Drowned Crown',
      status: 'complete',
      fields: {
        itemType: 'Crown',
        owner: { ref: 'Queen Maelis Varn' },
        origin: { ref: 'Varnhold' },
        rarity: 'Unique',
      },
      body: `The ancient crown of [[House Varn]], lost with the royal barge during [[The Great Flood]] and returned by the sea, encrusted with salt and pearl, a century later. No one admits to finding it.

It was placed on the head of [[Queen Maelis Varn]] at her [[Coronation of Maelis|coronation]]. [[Saltbinding|Saltbinders]] say it hums at low tide.`,
    },
    {
      category: 'creature',
      title: 'Marsh Wights',
      status: 'draft',
      fields: { classification: 'Undead', habitat: [{ ref: 'Greywater Marshes' }], danger: 'High at night' },
      body: `Pale shapes that walk the [[Greywater Marshes]] at low tide. The [[The Tidebound|Tidebound]] teach that they are the unpaid dead of [[The Great Flood]].

They avoid salt, running water, and the boat of [[Corwen the Ferryman]].`,
    },
    {
      category: 'concept',
      title: 'The Tide Faith',
      status: 'complete',
      fields: { conceptType: 'Religion', related: [{ ref: 'The Tidebound' }, { ref: 'Saltbinding' }] },
      body: `The belief that the sea keeps a ledger of every life and every debt, and that each tide settles a little of the account. Codified by [[The Tidebound]] after [[The Great Flood]].

### Core tenets

1. Nothing given to the sea is lost; it is held.
2. A flood is a debt come due.
3. Salt is a promise; break it and the tide remembers.`,
    },
    {
      category: 'concept',
      title: 'Saltbinding',
      status: 'draft',
      fields: { conceptType: 'Magic system', related: [{ ref: 'The Tide Faith' }] },
      body: `Folk magic of the marsh: binding a promise, a ward or a memory into salt. Practised openly by reed-cutters in the [[Greywater Marshes]] and quietly condemned by [[The Tidebound]].

The stronger the binding, the more salt it consumes. Legends say [[The Drowned Crown]] is the largest binding ever made.`,
    },
  ],
}
