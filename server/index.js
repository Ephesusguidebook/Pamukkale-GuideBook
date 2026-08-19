require('dotenv').config();
const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');

const packageToursRouter = require('./routes/packageTours');
const adminPackageToursRouter = require('./routes/adminPackageTours');
const dailyToursRouter = require('./routes/dailyTours');
const adminDailyToursRouter = require('./routes/adminDailyTours');
const activitiesRouter = require('./routes/activities');
const adminActivitiesRouter = require('./routes/adminActivities');
const blogRouter = require('./routes/blog');
const adminBlogRouter = require('./routes/adminBlog');
const adminMediaRouter = require('./routes/adminMedia');
const authRouter = require('./routes/auth');
const contactRouter = require('./routes/contact');
const settingsRouter = require('./routes/settings');
const pageContentRouter = require('./routes/pageContent');
const adminPageContentRouter = require('./routes/adminPageContent');
const sitemapRouter = require('./routes/sitemap');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json({ limit: '5mb' }));

// Uploaded images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API routes
app.use('/api/package-tours', packageToursRouter);
app.use('/api/admin/package-tours', adminPackageToursRouter);
app.use('/api/daily-tours', dailyToursRouter);
app.use('/api/admin/daily-tours', adminDailyToursRouter);
app.use('/api/activities', activitiesRouter);
app.use('/api/admin/activities', adminActivitiesRouter);
app.use('/api/blog', blogRouter);
app.use('/api/admin/blog', adminBlogRouter);
app.use('/api/admin/media', adminMediaRouter);
app.use('/api/auth', authRouter);
app.use('/api/contact', contactRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/page-content', pageContentRouter);
app.use('/api/admin/page-content', adminPageContentRouter);

app.get('/api/health', (req, res) => res.json({ ok: true }));

// SEO: sitemap.xml regenerated on every request from published content.
app.use('/sitemap.xml', sitemapRouter);

// Serve the React build in production (server/public — on hosts like
// Hostinger where the "root directory" can only be server/, we put the
// build output inside server itself).
const clientDist = path.join(__dirname, 'public');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) return next();
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

// Generic error handler (e.g. multer file errors)
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: err.message || 'Server error.' });
});

app.listen(PORT, () => {
  console.log(`[server] running on http://localhost:${PORT}`);
});
