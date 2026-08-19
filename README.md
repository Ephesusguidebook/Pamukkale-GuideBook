# TurRota — Paket Tur Web Sitesi

1 paket tur web sitesi: herkese açık bir ön yüz (ana sayfa, tur listesi, tur detay,
iletişim formu) ve turları yönetmek için bir admin paneli.

## Klasör Yapısı

```
tour-site/
  server/   → Node.js + Express API (turlar, admin girişi, görsel yükleme, mesajlar)
  client/   → React (Vite) ön yüz — hem herkese açık site hem admin paneli burada
```

Veritabanı olarak SQLite kullanılır (`server/data.sqlite`), tek dosyadır, ekstra bir
veritabanı sunucusu kurmana gerek yoktur.

## Özellikler

- **Ön yüz:** Ana sayfa, tur listesi, tur detay sayfası (galeri, gün gün program,
  fiyat), iletişim formu. Turla ilgili form gönderildiğinde admin panelindeki
  "Mesajlar" bölümüne düşer.
- **Admin paneli** (`/admin/giris`): Giriş yapıp turları ekleyebilir, düzenleyebilir,
  silebilir, taslak/yayında durumunu değiştirebilirsin. Her tur için: başlık, özet,
  detaylı açıklama, fiyat, para birimi, süre, lokasyon, başlangıç tarihi, kontenjan,
  görsel galerisi ve gün gün program (itinerary) girilebilir. Bu, senin istediğin
  "özel tur ekleme şablonu".
- **Sağlam ön yüz:** Sayfa render'ında oluşabilecek beklenmeyen hatalar bir
  `ErrorBoundary` ile yakalanır; kullanıcı beyaz/boş bir ekranla karşılaşmaz.
  Teslimattan önce tüm sayfalar (ana sayfa, tur listesi, tur detay, iletişim, admin
  girişi, admin panel, tur ekle/düzenle, mesajlar, 404) headless tarayıcı ile
  gezilip konsolda ve sayfa render'ında hiçbir hata üretmediği doğrulandı.
- **İleride eklenebilir:** Rezervasyon/ödeme henüz eklenmedi (şu an sadece iletişim
  formu var), ama veritabanı yapısı (turlar ayrı, mesajlar ayrı tablo) ileride bir
  "rezervasyon" ve ödeme (örn. iyzico/PayTR) modülü eklemeyi kolaylaştıracak şekilde
  tasarlandı.

## Yerel Geliştirme

Gerekli: Node.js 18+ (bu ortamda Node 22 ile test edildi).

### 1. Backend

```bash
cd server
npm install
cp .env.example .env
# .env dosyasını aç, JWT_SECRET'i rastgele uzun bir metinle değiştir,
# ADMIN_EMAIL ve ADMIN_PASSWORD'ü kendi bilgilerinle değiştir.
npm start
```

Sunucu `http://localhost:4000` üzerinde çalışır. İlk çalıştırmada `.env` içindeki
ADMIN_EMAIL/ADMIN_PASSWORD ile bir admin hesabı otomatik oluşturulur (veritabanı
boşsa). Admin hesabını sonradan değiştirmek için `server/data.sqlite` dosyasını
silip yeniden başlatabilir ya da doğrudan veritabanından güncelleyebilirsin.

### 2. Frontend (geliştirme modu)

Ayrı bir terminalde:

```bash
cd client
npm install
npm run dev
```

`http://localhost:5173` adresinde açılır ve `/api` isteklerini otomatik olarak
backend'e (4000 portu) yönlendirir.

## Production Build

```bash
cd client
npm install
npm run build        # client/dist klasörünü oluşturur

cd ../server
npm install
npm start             # tek sunucu hem API'yi hem client/dist'i sunar
```

Bundan sonra tek bir Node.js süreci (`server/index.js`) hem API'yi hem de
oluşturulan React sitesini aynı adresten (örn. `http://localhost:4000`) sunar —
Hostinger'daki "Node.js Web Uygulaması" seçeneği tam olarak bunu bekler.

## Hostinger'a Deploy

Ekran görüntüsünde gördüğün "Node.js Web Uygulaması" seçeneğini seçtiysen:

1. Bu projeyi bir GitHub reposuna yükle (ya da dosyaları doğrudan Hostinger'a
   yükle — "GitHub'dan dağıtın, dosyaları yükleyin veya doğrudan IDE'nizden
   dağıtın" seçenekleri var).
2. Hostinger'da **Başlangıç dosyası / entry point** olarak `server/index.js`
   göster.
3. **Build komutu** olarak şunu ayarla (Hostinger panelinde "build command" alanı
   varsa):
   ```
   cd client && npm install && npm run build && cd ../server && npm install
   ```
   Panelde tek build komutu alanı yoksa, deploy öncesi `client/dist` klasörünü
   build alıp repoya dahil ederek de yükleyebilirsin.
4. **Ortam değişkenleri (Environment Variables)** kısmına şunları ekle:
   - `JWT_SECRET` → uzun, rastgele bir metin
   - `ADMIN_EMAIL` → admin girişi için e-posta
   - `ADMIN_PASSWORD` → admin girişi için şifre
   - `PORT` → Hostinger genelde bunu otomatik atar, elle eklemene gerek kalmayabilir.
5. Deploy sonrası sitene git, `/admin/giris` üzerinden `.env`'de belirlediğin
   bilgilerle giriş yap ve ilk turunu ekle.

> Not: SQLite dosyası (`data.sqlite`) sunucu üzerinde diskte tutulur. Hostinger'ın
> Node.js barındırmasında disk kalıcıysa (çoğu paylaşımlı/VPS planında öyledir)
> sorun olmaz. İleride trafiğin artması ya da birden fazla sunucu örneği çalıştırman
> gerekirse MySQL/PostgreSQL gibi ayrı bir veritabanına geçmek gerekebilir — mimari
> buna kolayca uyarlanabilir.

## Sırada Ne Var?

- Ödeme/rezervasyon akışı istediğinde ekleriz (kart bilgisi almadan önce bir ödeme
  sağlayıcı — Türkiye'de yaygın olarak iyzico ya da PayTR — seçmemiz gerekecek).
- İstersen tur kategorileri, çoklu dil, indirim kuponları gibi ek özellikler de bu
  yapının üzerine eklenebilir.
