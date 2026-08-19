require('dotenv').config();
const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');

const toursRouter = require('./routes/tours');
const adminToursRouter = require('./routes/adminTours');
const authRouter = require('./routes/auth');
const contactRouter = require('./routes/contact');
const settingsRouter = require('./routes/settings');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json({ limit: '5mb' }));

// Yüklenen görseller
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API rotaları
app.use('/api/tours', toursRouter);
app.use('/api/admin/tours', adminToursRouter);
app.use('/api/auth', authRouter);
app.use('/api/contact', contactRouter);
app.use('/api/settings', settingsRouter);

app.get('/api/health', (req, res) => res.json({ ok: true }));

// Üretimde React build'ini sun (server/public — Hostinger gibi platformlarda
// "kök dizin" sadece server/ olabildiği için build çıktısını server içine koyuyoruz)
const clientDist = path.join(__dirname, 'public');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) return next();
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

// Genel hata yakalayıcı (ör. multer dosya hataları)
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: err.message || 'Sunucu hatası.' });
});

app.listen(PORT, () => {
  console.log(`[server] http://localhost:${PORT} üzerinde çalışıyor`);
});
