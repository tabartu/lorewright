import type { SampleWorld } from './types'

/** Small Turkish demo world: exercises ı, İ, ş, ğ in titles, links and search. */
export const kulDenizi: SampleWorld = {
  world: {
    name: 'Kül Denizi',
    genre: 'Bilim-fantastik',
    tone: 'Hüzünlü, macera dolu',
    contentLanguage: 'tr',
    cover: 'rust',
    summary:
      'Yanardağ külünün denizi kapladığı, gemilerin suyun değil külün üstünde yüzdüğü bir dünya. Limanlar ışıkla, loncalar sırlarla ayakta kalıyor.',
    calendar: { yearLabel: 'Yangından sonra', yearAbbr: 'YS', negativeLabel: 'Yangından önce', negativeAbbr: 'YÖ' },
  },
  eras: [
    { name: 'Eski Deniz Çağı', startYear: -400, endYear: -1, ink: 'cobalt', order: 0 },
    { name: 'Kül Çağı', startYear: 0, ink: 'sienna', order: 1 },
  ],
  pages: [
    {
      category: 'character',
      title: 'İskender Han',
      aliases: ['Kaptan İskender'],
      status: 'complete',
      fields: {
        born: { year: 92 },
        species: 'İnsan',
        affiliation: [{ ref: 'Gölge Loncası' }],
        home: { ref: 'Işıklı Liman' },
        occupation: 'Kül gemisi kaptanı',
        lifeStatus: 'alive',
      },
      body: `[[Işıklı Liman]]'ın en tanınmış kül gemisi kaptanı. [[Büyük Yangın]]'dan sonra doğan ilk kuşaktandır ve denizi hiç su hâliyle görmemiştir.

Gençliğinde [[Gölge Loncası]] için kaçakçılık yaptı. Bugün loncanın borcunu ödemek için [[Şafak Taşı]]'nın peşinde.

> **Tasarımcı notu.** İskender, oyuncunun güvenip güvenmemekte kararsız kalacağı bir müttefik olmalı.`,
    },
    {
      category: 'location',
      title: 'Işıklı Liman',
      status: 'complete',
      fields: { locationType: 'Liman kenti', ruler: { ref: 'Gölge Loncası' }, population: 'yaklaşık 12.000' },
      body: `Kül denizinin kıyısındaki en büyük liman. Geceleri yüzlerce fener yanar, çünkü kül fırtınasında yolunu kaybeden gemiler ancak ışığı görerek dönebilir.

Limanın açığında [[İnci Adası]] görünür. Kentin gerçek yönetimi [[Gölge Loncası]]'nın elindedir.`,
    },
    {
      category: 'location',
      title: 'İnci Adası',
      status: 'draft',
      fields: { locationType: 'Ada', region: { ref: 'Işıklı Liman' } },
      body: `[[Işıklı Liman]]'ın açığında, külün altından yükselen kara bir kaya. Söylentiye göre [[Şafak Taşı]] burada saklanıyor.`,
    },
    {
      category: 'faction',
      title: 'Gölge Loncası',
      status: 'complete',
      fields: { factionType: 'Tüccar loncası', leader: { ref: 'İskender Han' }, headquarters: { ref: 'Işıklı Liman' } },
      body: `Fener yağı ve harita ticaretini elinde tutan gizli lonca. [[Büyük Yangın]]'dan sonra liman kentlerini ayakta tutan ışığın kontrolünü ele geçirdi.

Loncanın kayıtlarında [[Kül Rahipleri]] ile yapılmış eski bir anlaşmadan söz edilir.`,
    },
    {
      category: 'event',
      title: 'Büyük Yangın',
      status: 'complete',
      date: { year: 0 },
      fields: { place: { ref: 'Işıklı Liman' }, outcome: 'Deniz küle döndü.' },
      body: `Dünyanın bildiği denizlerin tek bir yıl içinde külle kaplandığı felaket. Takvim bu olaydan başlar.

[[Gölge Loncası]] bu yıldan sonra kuruldu.`,
    },
    {
      category: 'item',
      title: 'Şafak Taşı',
      status: 'stub',
      fields: { itemType: 'Kalıntı', origin: { ref: 'İnci Adası' }, rarity: 'Eşsiz' },
      body: `Külü yeniden suya çevirebildiğine inanılan taş. [[İskender Han]] onu arıyor.`,
    },
  ],
}
