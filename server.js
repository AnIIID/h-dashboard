require('dotenv').config();
const express = require('express');
const session = require('express-session');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const sharp = require('sharp');
const Database = require('better-sqlite3');

const app = express();
const PORT = process.env.PORT || 3000;
const GALLERY_PASSWORD = process.env.GALLERY_PASSWORD || 'changeme';
const API_KEY = process.env.API_KEY || 'agent1-gallery-key';
const SESSION_SECRET = process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex');

// --- Database Setup ---
const dbPath = path.join(__dirname, 'data', 'gallery.db');
fs.mkdirSync(path.join(__dirname, 'data'), { recursive: true });
fs.mkdirSync(path.join(__dirname, 'uploads'), { recursive: true });

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS images (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    image_path TEXT NOT NULL,
    thumb_path TEXT DEFAULT '',
    prompt TEXT DEFAULT '',
    model TEXT DEFAULT '',
    brand TEXT DEFAULT '',
    version TEXT DEFAULT '',
    score INTEGER DEFAULT 0,
    tags TEXT DEFAULT '',
    parent_id INTEGER,
    notes TEXT DEFAULT '',
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (parent_id) REFERENCES images(id) ON DELETE SET NULL
  )
`);

// Migrations
try { db.exec('ALTER TABLE images ADD COLUMN thumb_path TEXT DEFAULT ""'); } catch (e) {}
try { db.exec('ALTER TABLE images ADD COLUMN favorite INTEGER DEFAULT 0'); } catch (e) {}
try { db.exec('ALTER TABLE images ADD COLUMN hidden INTEGER DEFAULT 0'); } catch (e) {}

// --- Multer Setup ---
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, 'uploads')),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`;
    cb(null, name);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (req, file, cb) => {
    const allowed = /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i;
    if (allowed.test(path.extname(file.originalname))) {
      cb(null, true);
    } else {
      cb(new Error('Nur Bilddateien erlaubt'));
    }
  }
});

// --- Middleware ---
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 7 * 24 * 60 * 60 * 1000 } // 7 Tage
}));

// Statische Dateien
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/css', express.static(path.join(__dirname, 'public', 'css')));
app.use('/js', express.static(path.join(__dirname, 'public', 'js')));
app.use('/favicon.svg', express.static(path.join(__dirname, 'public', 'favicon.svg')));

// --- Guest Password (rotates daily) ---
function getGuestPassword() {
  const today = new Date().toISOString().slice(0, 10);
  return crypto.createHash('sha256').update(today + SESSION_SECRET).digest('hex').substring(0, 8);
}

// --- Auth Middleware ---
function requireAuth(req, res, next) {
  if (req.session && req.session.authenticated) {
    return next();
  }
  res.redirect('/');
}

function requireAdmin(req, res, next) {
  if (req.session && req.session.role === 'admin') {
    return next();
  }
  if (req.headers['x-api-key'] === API_KEY) {
    return next();
  }
  res.status(403).json({ error: 'Nur für Admins' });
}

function requireApiKey(req, res, next) {
  const key = req.headers['x-api-key'];
  if (key === API_KEY) {
    return next();
  }
  res.status(401).json({ error: 'Ungültiger API-Key' });
}

// --- Routes ---

// Login-Seite
app.get('/', (req, res) => {
  if (req.session && req.session.authenticated) {
    return res.redirect('/gallery');
  }
  res.sendFile(path.join(__dirname, 'public', 'index.html'), {
    headers: { 'Content-Type': 'text/html; charset=utf-8' }
  });
});

// Login-POST
app.post('/login', (req, res) => {
  const { password } = req.body;
  if (password === GALLERY_PASSWORD) {
    req.session.authenticated = true;
    req.session.role = 'admin';
    res.json({ success: true, role: 'admin' });
  } else if (password === getGuestPassword()) {
    req.session.authenticated = true;
    req.session.role = 'guest';
    res.json({ success: true, role: 'guest' });
  } else {
    res.status(401).json({ error: 'Falsches Passwort' });
  }
});

// Aktuelle Rolle
app.get('/api/me', requireAuth, (req, res) => {
  res.json({ role: req.session.role || 'guest' });
});

// Gast-Passwort anzeigen (nur Admin)
app.get('/api/guest-password', requireAdmin, (req, res) => {
  res.json({ password: getGuestPassword() });
});

// Logout
app.post('/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

// Galerie-Seite
app.get('/gallery', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'gallery.html'), {
    headers: { 'Content-Type': 'text/html; charset=utf-8' }
  });
});

// --- API: Bilder abfragen ---
app.get('/api/images', requireAuth, (req, res) => {
  const {
    brand, model, tags, score_min, score_max,
    sort = 'newest', page = 1, limit = 50, search
  } = req.query;

  let where = [];
  let params = {};

  if (brand) {
    where.push('brand = @brand');
    params.brand = brand;
  }
  if (model) {
    where.push('model = @model');
    params.model = model;
  }
  if (tags) {
    where.push('tags LIKE @tags');
    params.tags = `%${tags}%`;
  }
  if (score_min !== undefined) {
    where.push('score >= @score_min');
    params.score_min = Number(score_min);
  }
  if (score_max !== undefined) {
    where.push('score <= @score_max');
    params.score_max = Number(score_max);
  }
  if (search) {
    where.push('(prompt LIKE @search OR notes LIKE @search OR tags LIKE @search)');
    params.search = `%${search}%`;
  }

  const whereClause = where.length > 0 ? 'WHERE ' + where.join(' AND ') : '';

  let orderBy;
  switch (sort) {
    case 'score': orderBy = 'favorite DESC, hidden ASC, score DESC'; break;
    case 'brand': orderBy = 'favorite DESC, hidden ASC, brand ASC, created_at DESC'; break;
    case 'oldest': orderBy = 'favorite DESC, hidden ASC, created_at ASC'; break;
    default: orderBy = 'favorite DESC, hidden ASC, created_at DESC';
  }

  const offset = (Number(page) - 1) * Number(limit);

  const countStmt = db.prepare(`SELECT COUNT(*) as total FROM images ${whereClause}`);
  const { total } = countStmt.get(params);

  const stmt = db.prepare(`
    SELECT * FROM images ${whereClause}
    ORDER BY ${orderBy}
    LIMIT @limit OFFSET @offset
  `);
  params.limit = Number(limit);
  params.offset = offset;

  const images = stmt.all(params);

  res.json({
    images,
    total,
    page: Number(page),
    pages: Math.ceil(total / Number(limit))
  });
});

// --- API: Einzelnes Bild (API-Key oder Session) ---
app.get('/api/images/:id', (req, res, next) => {
  if (req.headers['x-api-key'] === API_KEY) return next();
  requireAuth(req, res, next);
}, (req, res) => {
  const image = db.prepare('SELECT * FROM images WHERE id = ?').get(req.params.id);
  if (!image) {
    return res.status(404).json({ error: 'Bild nicht gefunden' });
  }

  // Kinder (Iterationen) laden
  const children = db.prepare('SELECT id, image_path, version, score, created_at FROM images WHERE parent_id = ? ORDER BY created_at ASC').all(image.id);

  // Parent laden falls vorhanden
  let parent = null;
  if (image.parent_id) {
    parent = db.prepare('SELECT id, image_path, version, score FROM images WHERE id = ?').get(image.parent_id);
  }

  res.json({ ...image, children, parent });
});

// --- API: Filter-Optionen ---
app.get('/api/filters', requireAuth, (req, res) => {
  const brands = db.prepare("SELECT DISTINCT brand FROM images WHERE brand != '' ORDER BY brand").all().map(r => r.brand);
  const models = db.prepare("SELECT DISTINCT model FROM images WHERE model != '' ORDER BY model").all().map(r => r.model);
  const allTags = db.prepare("SELECT tags FROM images WHERE tags != ''").all();

  const tagSet = new Set();
  allTags.forEach(row => {
    row.tags.split(',').forEach(t => {
      const trimmed = t.trim();
      if (trimmed) tagSet.add(trimmed);
    });
  });

  res.json({
    brands,
    models,
    tags: Array.from(tagSet).sort()
  });
});

// --- API: Upload (für externe Agents) ---
app.post('/api/upload', requireApiKey, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Kein Bild hochgeladen' });
    }

    const {
      prompt = '', model = '', brand = '', version = '',
      score = 0, tags = '', parent_id = null, notes = ''
    } = req.body;

    const brandDir = brand ? brand.toLowerCase().replace(/[^a-z0-9_-]/g, '') : 'unsorted';
    const brandPath = path.join(__dirname, 'uploads', brandDir);
    fs.mkdirSync(brandPath, { recursive: true });

    const baseName = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}`;
    const displayName = `${baseName}-display.webp`;
    const thumbName = `${baseName}-thumb.webp`;
    const displayPath = path.join(brandPath, displayName);
    const thumbPath = path.join(brandPath, thumbName);

    // Display-Version: max 1200px breit, 85% Qualität
    await sharp(req.file.path)
      .resize(1200, null, { withoutEnlargement: true })
      .webp({ quality: 85 })
      .toFile(displayPath);

    // Thumbnail: max 400px breit, 80% Qualität
    await sharp(req.file.path)
      .resize(400, null, { withoutEnlargement: true })
      .webp({ quality: 80 })
      .toFile(thumbPath);

    // Original löschen
    fs.unlinkSync(req.file.path);

    const imagePath = `/uploads/${brandDir}/${displayName}`;
    const imageThumbPath = `/uploads/${brandDir}/${thumbName}`;

    const stmt = db.prepare(`
      INSERT INTO images (image_path, thumb_path, prompt, model, brand, version, score, tags, parent_id, notes)
      VALUES (@image_path, @thumb_path, @prompt, @model, @brand, @version, @score, @tags, @parent_id, @notes)
    `);

    const result = stmt.run({
      image_path: imagePath,
      thumb_path: imageThumbPath,
      prompt,
      model,
      brand,
      version,
      score: Number(score) || 0,
      tags,
      parent_id: parent_id ? Number(parent_id) : null,
      notes
    });

    const image = db.prepare('SELECT * FROM images WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(image);
  } catch (err) {
    // Temp-Datei aufräumen falls vorhanden
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    console.error('Upload-Fehler:', err);
    res.status(500).json({ error: 'Bildverarbeitung fehlgeschlagen' });
  }
});

// --- API: Favorit toggeln ---
app.patch('/api/images/:id/favorite', requireAdmin, (req, res) => {
  const image = db.prepare('SELECT * FROM images WHERE id = ?').get(req.params.id);
  if (!image) {
    return res.status(404).json({ error: 'Bild nicht gefunden' });
  }
  const newVal = image.favorite ? 0 : 1;
  db.prepare('UPDATE images SET favorite = ? WHERE id = ?').run(newVal, image.id);
  res.json({ id: image.id, favorite: newVal });
});

// --- API: Hidden toggeln ---
app.patch('/api/images/:id/hidden', requireAdmin, (req, res) => {
  const image = db.prepare('SELECT * FROM images WHERE id = ?').get(req.params.id);
  if (!image) {
    return res.status(404).json({ error: 'Bild nicht gefunden' });
  }
  const newVal = image.hidden ? 0 : 1;
  db.prepare('UPDATE images SET hidden = ? WHERE id = ?').run(newVal, image.id);
  res.json({ id: image.id, hidden: newVal });
});

// --- API: Bild aktualisieren (API-Key oder Session) ---
app.patch('/api/images/:id', (req, res, next) => {
  if (req.headers['x-api-key'] === API_KEY) return next();
  requireAdmin(req, res, next);
}, (req, res) => {
  const image = db.prepare('SELECT * FROM images WHERE id = ?').get(req.params.id);
  if (!image) {
    return res.status(404).json({ error: 'Bild nicht gefunden' });
  }

  const fields = ['prompt', 'model', 'brand', 'version', 'score', 'tags', 'parent_id', 'notes', 'favorite', 'hidden'];
  const updates = [];
  const params = { id: Number(req.params.id) };

  for (const field of fields) {
    if (req.body[field] !== undefined) {
      updates.push(`${field} = @${field}`);
      params[field] = field === 'score' ? Number(req.body[field]) :
                      field === 'parent_id' ? (req.body[field] ? Number(req.body[field]) : null) :
                      req.body[field];
    }
  }

  if (updates.length === 0) {
    return res.json(image);
  }

  db.prepare(`UPDATE images SET ${updates.join(', ')} WHERE id = @id`).run(params);
  const updated = db.prepare('SELECT * FROM images WHERE id = ?').get(req.params.id);
  res.json(updated);
});

// --- API: Bild löschen ---
app.delete('/api/images/:id', requireAdmin, (req, res) => {
  const image = db.prepare('SELECT * FROM images WHERE id = ?').get(req.params.id);
  if (!image) {
    return res.status(404).json({ error: 'Bild nicht gefunden' });
  }

  // Datei löschen
  const filePath = path.join(__dirname, image.image_path);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }

  // Kinder lösen
  db.prepare('UPDATE images SET parent_id = NULL WHERE parent_id = ?').run(image.id);
  db.prepare('DELETE FROM images WHERE id = ?').run(image.id);

  res.json({ success: true });
});

// --- API: Projekte verwalten ---
app.post('/api/projects', requireApiKey, (req, res) => {
  const { name, description = '' } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'Projektname fehlt' });
  }

  const slug = name.toLowerCase().replace(/[^a-z0-9_-]/g, '');
  const projectPath = path.join(__dirname, 'uploads', slug);

  if (fs.existsSync(projectPath)) {
    return res.status(409).json({ error: 'Projekt existiert bereits', slug });
  }

  fs.mkdirSync(projectPath, { recursive: true });

  // Projekt-Metadaten speichern
  const metaPath = path.join(projectPath, 'project.json');
  const meta = { name, slug, description, created_at: new Date().toISOString() };
  fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2));

  res.status(201).json(meta);
});

app.get('/api/projects', requireAuth, (req, res) => {
  const uploadsDir = path.join(__dirname, 'uploads');
  const entries = fs.readdirSync(uploadsDir, { withFileTypes: true });

  const projects = entries
    .filter(e => e.isDirectory())
    .map(e => {
      const metaPath = path.join(uploadsDir, e.name, 'project.json');
      if (fs.existsSync(metaPath)) {
        return JSON.parse(fs.readFileSync(metaPath, 'utf8'));
      }
      return { name: e.name, slug: e.name, description: '', created_at: null };
    });

  // Bildanzahl pro Projekt
  const counts = db.prepare("SELECT brand, COUNT(*) as count FROM images WHERE brand != '' GROUP BY brand").all();
  const countMap = Object.fromEntries(counts.map(c => [c.brand.toLowerCase().replace(/[^a-z0-9_-]/g, ''), c.count]));

  projects.forEach(p => { p.image_count = countMap[p.slug] || 0; });

  res.json(projects);
});

// --- API: Statistiken ---
app.get('/api/stats', requireAuth, (req, res) => {
  const total = db.prepare('SELECT COUNT(*) as count FROM images').get().count;
  const avgScore = db.prepare('SELECT AVG(score) as avg FROM images WHERE score > 0').get().avg || 0;
  const brandCounts = db.prepare("SELECT brand, COUNT(*) as count FROM images WHERE brand != '' GROUP BY brand ORDER BY count DESC").all();

  res.json({ total, avgScore: Math.round(avgScore), brandCounts });
});

// --- Error Handler ---
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: `Upload-Fehler: ${err.message}` });
  }
  console.error(err);
  res.status(500).json({ error: 'Interner Serverfehler' });
});

// --- Start ---
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Gallery-Server läuft auf http://0.0.0.0:${PORT}`);
});
