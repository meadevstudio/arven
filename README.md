# Arven — Parfüm inceleme uygulaması

Arven; erkek, kadın ve unisex seçkilerini koku ailesi, notalar ve yayılım bilgisiyle keşfetmeye yarayan React + Vite uygulamasıdır. Türkçe, İngilizce ve Arapça için yuvarlak bayrak düğmeleri bulunur. Puan ve kalıcılık gösterilmez.

## Çalıştırma

```bash
npm install
npm run dev
```

Uygulamadaki ürün görselleri, aynı oranda yerel SVG data URI'lar olarak üretilir; harici görsel servisine ihtiyaç duymaz. Ürün fiyatları USD olarak sabittir; USD/TRY kuru `api.frankfurter.app` üzerinden alınır, son başarılı değer saklanır ve sayfa açıkken saat başı yeniden sorgulanır. Servis en son yayımlanan referans kuru sağlar; bu değer gün içi piyasa kuru değildir. Kur servisi kullanılamadığında son başarılı kur kullanılır; kayıtlı kur da yoksa USD fiyatı görünmeye devam eder ve TL dönüşümünün alınamadığı belirtilir.

## GitHub / Vercel güncellemesi

`src/main.jsx`, `src/data.js`, `src/i18n.js` ve `src/styles.css` dosyalarını aynı sürümden birlikte yükleyin. Özellikle `src/data.js` dosyasındaki 70 ürünün `priceUsd` alanları dolar fiyatlarını sağlar. Fiyat verisi eski kalırsa arayüzde tutarlar görünmez.

Vercel için build komutu `npm run build`, çıktı klasörü `dist` olmalıdır. `node_modules`, `.npm-cache` ve `release` klasörlerini GitHub'a yüklemeyin.
