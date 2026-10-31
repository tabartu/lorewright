# Lorewright

*[English README](README.md)*

Lorewright, oyun geliştiricilerin oyun dünyalarının lore'unu yazıp yönettiği, veriyi kendi cihazında tutan bir wiki uygulamasıdır. Herhangi bir oyun türüne ya da oyun motoruna bağlı değildir.

İlk modül **Lore Ansiklopedisi**, dünyayı bir kaynak kitap gibi tutar: kategoriler bölüm, sayfalar maddedir ve her madde diğerlerine bağlantı verebilir. Her şey tarayıcında saklanır; sunucu yok, hesap gerekmez.

> **Durum:** geliştiriliyor. 6 aşamadan ilk 2'si tamam: dünyalar, sayfalar, bölümler, iç bağlantılar, arama, geri bağlantılar, bilgi kutuları, EN/TR arayüz. Yol haritası için [docs/PLAN.md](docs/PLAN.md) dosyasına bak.

## Özellikler

Şu anda kullanılabilenler:

- **Birden fazla dünya.** Her dünyanın adı, türü, tonu, içerik dili, özeti, kapak rengi ve takvim etiketi var.
- **Markdown ile sayfalar.** Sayfalar bölümlere ayrılır: Karakter, Mekân, Fraksiyon, Olay, Eşya, Yaratık, Kavram ve kendi eklediğin bölümler.
- **İç bağlantılar.**
  - `[[Sayfa Adı]]` ya da `[[Sayfa Adı|etiket]]` yazınca bağlantı olur.
  - Henüz olmayan sayfalara giden bağlantılar kesik çizgili kırmızı görünür; tıklayınca o sayfa oluşturulur.
  - Bir sayfanın adı değişince ona giden tüm bağlantılar güncellenir.
  - Takma adlar ("diğer adları") da bağlantıları çözer.
- **Aranan sayfalar.** Dünya ana sayfası kırmızı bağlantıları, en çok kullanılandan başlayarak listeler.
- **Arama.** Bir dünyanın içindeyken Ctrl/⌘+K ile başlıklarda, takma adlarda ve metinde ara.
  - Büyük-küçük harf ve aksanlar fark etmez, Türkçe noktalı/noktasız i dahil: `istanbul` *İstanbul*'u, `isikli` *Işıklı*'yı bulur.
  - Aynı pencereden bölümlere ve ayarlara gidebilir, yazdığın adla yeni sayfa oluşturabilirsin.
- **Geri bağlantılar.** Her sayfa, metninde ya da bilgi kutusunda ona bağlantı veren sayfaları listeler.
- **Bilgi kutuları (infobox).** Her bölümün alanları vardır; örneğin karakterler için doğum, tür, bağlılık ve yurdu.
  - Alan türleri: kısa ve uzun metin, sayı, dünya tarihi, sayfa bağlantısı (tek ya da çok), seçim listesi, etiketler, evet/hayır.
  - Sayfa bağlantısı alanları bağlantı sayılır; geri bağlantılarda ve kırmızı bağlantılarda görünür.
  - **Bölümleri düzenle** ekranından herhangi bir bölüme kendi alanlarını ekleyebilirsin.
  - Olay sayfalarının dünyanın takviminde bir tarih aralığı vardır.
- **Düzenleyici.** CodeMirror; `[[` otomatik tamamlama, önizleme ya da yan yana görünüm, Ctrl/⌘+S ile kaydetme ve kaydedilmemiş değişikliklerin kaybolmasına karşı uyarı.
- **Çok dilli arayüz.** İngilizce ve Türkçe hazır.
  - İlk açılışta tarayıcı dili algılanır, seçimin hatırlanır.
  - Tarih ve sayılar arayüz diline göre biçimlenir.
  - Düzenler CSS logical properties kullanır, bu yüzden sağdan sola yazılan diller de çalışır.
- **İçerik dili arayüz dilinden ayrıdır.** Arayüzü İngilizce kullanıp lore'u Türkçe yazabilirsin.
- **Aydınlık ve karanlık tema**, telefonlara uygun düzenler.

Planlananlar ([docs/PLAN.md](docs/PLAN.md)):

- zaman çizelgesi ve ilişki ağı
- harita
- birden fazla sağlayıcıyla yapay zekâ desteği
- dışa aktarma, yedekleme ve GitHub Pages'e yayın

## Kurulum ve çalıştırma

Gereksinim: Node.js 20 veya üstü.

```bash
npm install
npm run dev
```

Vite'ın verdiği adresi aç (genellikle http://localhost:5173). İlk açılışta birbirine bağlı sayfalardan oluşan bir örnek dünyayı incelemek için **Örnek dünyayı aç**'ı seç ya da kendi dünyanı oluştur.

### Komutlar

| Komut | Ne yapar |
|---|---|
| `npm run dev` | Geliştirme sunucusunu başlatır |
| `npm run build` | Tip denetimi yapar ve `dist/` klasörüne derler |
| `npm run preview` | Derlenmiş sürümü yerelde sunar |
| `npm test` | Birim testleri (Vitest) |
| `npm run i18n:check` | Eksik, fazla ya da bilinmeyen çeviri anahtarı varsa hata verir |
| `npm run css:check` | Fiziksel CSS özelliği varsa hata verir (RTL uyumluluğunu korur) |
| `npm run check` | Yukarıdakilerin hepsi ve lint |

## GitHub Pages'e yayınlama

`.github/workflows/deploy.yml`, `main` dalına yapılan her push'ta tüm denetimleri çalıştırır, uygulamayı derler ve yayınlar. Vite `base` ayarı depo adından alınır, bu yüzden uygulama `https://<kullanıcı>.github.io/<depo>/` adresinde açılır. Hash yönlendirme sayesinde doğrudan bağlantılar sunucu ayarı gerekmeden çalışır.

Bir kerelik ayar:

1. **Settings → Pages → Build and deployment → Source: GitHub Actions.**
2. Ücretsiz GitHub planında Pages'in çalışması için deponun public olması gerekir.

## Verilerin

Tüm dünyalar tarayıcının IndexedDB'sinde, `lorewright` adlı veritabanında durur. Hiçbir şey bilgisayarından çıkmaz. Uygulamanın site verilerini silersen dünyaların da silinir. JSON yedekleme ve geri yükleme 6. aşamada geliyor.

## Yeni bir dil nasıl eklenir

Arayüz dilleri `src/locales/` klasöründen otomatik olarak bulunur. Örneğin Almanca eklemek için:

1. İngilizce klasörü kopyala:
   ```bash
   cp -r src/locales/en src/locales/de
   ```
2. `src/locales/de/meta.json` dosyasını düzenle:
   ```json
   { "name": "German", "nativeName": "Deutsch", "dir": "ltr" }
   ```
   Arapça ya da İbranice gibi sağdan sola yazılan diller için `"dir": "rtl"` kullan; düzen kendiliğinden aynalanır.
3. Klasördeki diğer JSON dosyalarının değerlerini çevir. Anahtarları ve `{{yer tutucuları}}` değiştirme.
   - Çoğul anahtarlar `_one` / `_other` ile biter. Dilin gerektiriyorsa `_zero`, `_two`, `_few` ya da `_many` ekle; bkz. [i18next çoğullar](https://www.i18next.com/translation-function/plurals).
4. Denetimi çalıştır:
   ```bash
   npm run i18n:check
   ```
   Eksik ya da fazla anahtarları ve uyuşmayan yer tutucuları bildirir.

Kod değişikliği gerekmez. Yeni dil, dil menüsünde ve **Ayarlar**'da görünür; tarayıcısı o dile ayarlı kullanıcılar için de otomatik seçilir.

## Proje yapısı

```
src/
├─ app/            Uygulama kabuğu: yönlendirme, üst bant, dünya düzeni, genel ekranlar
├─ core/
│  ├─ db/          Dexie (IndexedDB) şeması
│  ├─ i18n/        i18next kurulumu, dil keşfi, Intl biçimlendiricileri
│  └─ lore/        Alan katmanı: tipler, dünyalar, sayfalar, bağlantılar, takvim
│                  api.ts tüm modüllerin kullandığı okuma arayüzü
├─ modules/
│  ├─ registry.ts  Kurulu modüller (yönlendirmeler buradan bağlanır)
│  └─ encyclopedia/  1. modül: Lore Ansiklopedisi (ekranlar, bileşenler)
├─ ui/             Tasarım değişkenleri ve ortak arayüz bileşenleri
├─ locales/        Her arayüz dili için bir klasör
└─ sample-data/    Örnek dünyalar (İngilizce ve Türkçe)
scripts/           Depo denetimleri (i18n, logical CSS)
docs/PLAN.md       Mimari ve yol haritası
```

### Modül eklemek

İleride gelecek *NPC Personality Lab*, *Playtest Feedback Hub* ve *Store Page Studio* gibi modüller aynı şekilde eklenir:

1. `src/modules/<ad>/manifest.tsx` dosyasında bir `LorewrightModule` dışa aktar. Bu dosya modülün `/w/:worldId/<basePath>` altındaki yönlendirmelerini tanımlar.
2. Modülü `src/modules/registry.ts` dosyasına ekle.
3. Lore'u `src/core/lore/api.ts` üzerinden oku; örneğin `getPages(worldId, { builtIn: 'character' })` ya da `getLinkedPages(id)`.
4. Modülün kendi tablolarına ihtiyacı varsa, `src/core/db/db.ts` dosyasında yeni bir Dexie sürümüyle ad alanlı tablolar ekle.
5. Çevirilerini her dil klasöründe yeni bir ad alanı dosyasına koy ve bu ad alanını `src/core/i18n/index.ts` dosyasına kaydet.

## Teknoloji

| Alan | Kütüphane |
|---|---|
| Uygulama | Vite, React 19, TypeScript, React Router (hash yönlendirme) |
| Depolama | IndexedDB üzerinde Dexie |
| Çeviri | i18next ve react-i18next |
| Markdown | react-markdown, remark-gfm, rehype-sanitize |
| Düzenleyici | CodeMirror 6 |
| Fontlar | Literata ve Archivo, Fontsource ile projeden sunulur |
