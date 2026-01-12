const express = require('express');
const cors = require('cors');
const { GoogleGenAI } = require('@google/genai');
const fs = require('fs').promises;
const path = require('path');
const fsDirect = require('fs');

// --- Configuration ---
const app = express();
const PORT = 3001;
const API_KEY = process.env.API_KEY || ''; 

// --- Middleware ---
app.use(cors());
app.use(express.json({ limit: '50mb' })); 

// Request Logger
app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(`[${req.method}] ${req.originalUrl} - ${res.statusCode} (${duration}ms)`);
    });
    next();
});

// --- Directory Structure ---
const DATA_DIR = path.join(__dirname, 'data');
const BACKUPS_DIR = path.join(DATA_DIR, 'backups');
const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');
const PROJECT_FILE = path.join(DATA_DIR, 'project.json');
const CMS_FILE = path.join(DATA_DIR, 'cms.json');

// Ensure directories exist immediately on startup
try {
    [DATA_DIR, BACKUPS_DIR, UPLOADS_DIR].forEach(dir => {
        if (!fsDirect.existsSync(dir)) {
            fsDirect.mkdirSync(dir, { recursive: true });
        }
    });
} catch (err) {
    console.error("Critical Error: Could not create data directories.", err);
    process.exit(1);
}

// Serve Uploaded Files Statically
app.use('/uploads', express.static(UPLOADS_DIR));

// --- Persistence Helpers & Locking ---

class Mutex {
    constructor() {
        this.queue = Promise.resolve();
    }
    async lock() {
        let release;
        const currentQueue = this.queue;
        const nextPromise = new Promise(resolve => { release = resolve; });
        this.queue = currentQueue.then(() => nextPromise);
        await currentQueue;
        return release;
    }
}

const fileLock = new Mutex();
let isShuttingDown = false;

// Atomic Write with Locking
async function writeDB(file, data) {
  if (isShuttingDown) {
      console.warn(`[Write Blocked] Server shutting down, skipping write to ${path.basename(file)}`);
      throw new Error("Server is shutting down");
  }

  const release = await fileLock.lock();
  const tempFile = `${file}.tmp`;
  try {
    await fs.writeFile(tempFile, JSON.stringify(data, null, 2));
    await fs.rename(tempFile, file);
  } catch (err) {
    console.error(`Failed to write to ${file}:`, err);
    throw err;
  } finally {
    release();
  }
}

async function readDB(file, defaultData) {
  try {
    const data = await fs.readFile(file, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
        // File doesn't exist, initialize
        console.log(`[Init] Creating ${path.basename(file)}`);
        await writeDB(file, defaultData);
        return defaultData;
    } else if (error instanceof SyntaxError) {
        // JSON Corruption detected!
        const corruptFile = `${file}.corrupt.${Date.now()}`;
        console.error(`[CRITICAL] JSON Corruption in ${path.basename(file)}. Backing up to ${path.basename(corruptFile)}`);
        
        // Move corrupt file aside so we don't lose user data
        await fs.rename(file, corruptFile).catch(e => console.error("Failed to move corrupt file", e));
        
        // Re-initialize
        await writeDB(file, defaultData);
        return defaultData;
    }
    console.error(`Read Error (${path.basename(file)}):`, error);
    throw error;
  }
}

// Data Validation
function validateProjectTree(node) {
    if (!node || typeof node !== 'object') return false;
    if (!node.id || !node.type) return false;
    if (!Array.isArray(node.children)) return false;
    return true;
}

// Default Data
const DEFAULT_PROJECT = {
  id: 'root',
  name: 'Page Body',
  type: 'container',
  props: {},
  styleConfig: {
    display: 'flex',
    flexDirection: 'col',
    paddingAll: 8,
    gap: 4,
    backgroundColor: '#ffffff',
    textColor: '#000000',
    fontSize: 'base',
  },
  children: [],
  parentId: null,
};

const DEFAULT_CMS = [
  {
    id: 'blog-posts',
    name: 'Blog Posts',
    fields: [
      { id: 'title', name: 'Title', type: 'text' },
      { id: 'cover', name: 'Cover Image', type: 'image' },
      { id: 'excerpt', name: 'Excerpt', type: 'text' },
      { id: 'date', name: 'Publish Date', type: 'date' },
    ],
    items: [
      { 
        id: 'post-1', 
        title: 'The Future of No-Code', 
        cover: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&q=80',
        excerpt: 'How visual builders are reshaping the web development landscape.',
        date: 'Oct 24, 2025' 
      },
    ]
  }
];

// --- Routes ---

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// ASSETS / UPLOAD
app.post('/api/upload', async (req, res) => {
    try {
        const { image, name } = req.body;
        if (!image || !name) return res.status(400).json({ error: 'Missing image data' });

        // Strip Base64 header
        const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
        const buffer = Buffer.from(base64Data, 'base64');
        
        // Create safe filename with timestamp
        const safeName = name.replace(/[^a-z0-9.]/gi, '_').toLowerCase();
        const fileName = `${Date.now()}-${safeName}`;
        const filePath = path.join(UPLOADS_DIR, fileName);
        
        await fs.writeFile(filePath, buffer);
        
        const url = `http://localhost:${PORT}/uploads/${fileName}`;
        console.log(`[Asset] Uploaded: ${fileName}`);
        res.json({ url, fileName });
    } catch(e) {
        console.error("Upload failed:", e);
        res.status(500).json({ error: 'Upload failed' });
    }
});

app.get('/api/uploads', async (req, res) => {
    try {
        const files = await fs.readdir(UPLOADS_DIR);
        // Filter for images only
        const images = files
            .filter(f => /\.(jpg|jpeg|png|gif|webp)$/i.test(f))
            .map(f => `http://localhost:${PORT}/uploads/${f}`);
        res.json(images.reverse()); // Newest first (roughly)
    } catch(e) {
        res.json([]);
    }
});

// PROJECT
app.get('/api/project', async (req, res) => {
  try {
    const data = await readDB(PROJECT_FILE, DEFAULT_PROJECT);
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: 'Failed to read project' });
  }
});

app.post('/api/project', async (req, res) => {
  try {
    const newTree = req.body;
    if (!validateProjectTree(newTree)) {
        console.error("[Project] Invalid data received");
        return res.status(400).json({ error: 'Invalid project structure' });
    }
    
    // Save Main Project
    await writeDB(PROJECT_FILE, newTree);
    
    // Create Backup (Fire and forget, no lock needed as unique filename)
    // We only backup every 5 minutes or on explicit major save to save space, 
    // but for this demo, backing up on every save is safer.
    const backupFile = path.join(BACKUPS_DIR, `project-${Date.now()}.json`);
    fs.writeFile(backupFile, JSON.stringify(newTree, null, 2)).catch(console.error);
    
    res.json({ success: true });
  } catch (e) {
    console.error("[Project] Save Error:", e);
    res.status(500).json({ error: 'Failed to save project' });
  }
});

// CMS
app.get('/api/cms/collections', async (req, res) => {
    const data = await readDB(CMS_FILE, DEFAULT_CMS);
    res.json(data);
});

app.post('/api/cms/collections', async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Name required' });

    const collections = await readDB(CMS_FILE, DEFAULT_CMS);
    
    // Check duplicates
    if (collections.some(c => c.name.toLowerCase() === name.toLowerCase())) {
        return res.status(409).json({ error: 'Collection exists' });
    }

    const newCollection = {
      id: name.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now().toString().slice(-4),
      name,
      fields: [ { id: 'title', name: 'Title', type: 'text' }, { id: 'image', name: 'Image', type: 'image' } ],
      items: []
    };
    
    collections.push(newCollection);
    await writeDB(CMS_FILE, collections);
    res.json(collections);
  } catch (e) { res.status(500).json({ error: 'Failed' }); }
});

app.post('/api/cms/item/:collectionId', async (req, res) => {
  try {
    const { collectionId } = req.params;
    const itemData = req.body;
    const collections = await readDB(CMS_FILE, DEFAULT_CMS);
    
    const colIndex = collections.findIndex(c => c.id === collectionId);
    if (colIndex === -1) return res.status(404).json({ error: 'Not found' });
    
    collections[colIndex].items.push({ id: 'item-' + Date.now(), ...itemData });
    await writeDB(CMS_FILE, collections);
    res.json(collections);
  } catch (e) { res.status(500).json({ error: 'Failed' }); }
});

// AI
function cleanAIResponse(text) {
  return text.replace(/```json/g, '').replace(/```/g, '').trim();
}

app.post('/api/ai/generate', async (req, res) => {
  const { prompt, currentProps, type, task } = req.body;
  
  if (!API_KEY) {
      console.error("[AI] Missing API Key");
      return res.status(503).json({ error: 'AI Service Unavailable (Missing Key)' });
  }

  try {
    const ai = new GoogleGenAI({ apiKey: API_KEY });
    let contents = '';
    
    if (task === 'style') {
      contents = `Update styles for React component "${type}". Request: "${prompt}". Current Props: ${JSON.stringify(currentProps)}. Return JSON only.`;
    } else if (task === 'responsive') {
      contents = `Convert Desktop styles to Mobile. Config: ${JSON.stringify(currentProps)}. Return JSON only.`;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents,
      config: { responseMimeType: "application/json" }
    });

    res.json(JSON.parse(cleanAIResponse(response.text)));
  } catch (error) {
    console.error("[AI] Error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// --- Graceful Shutdown ---
const server = app.listen(PORT, () => {
  console.log(`=========================================`);
  console.log(` VECTRA BACKEND SYSTEM (v2.1)`);
  console.log(`=========================================`);
  console.log(` Status:    Online`);
  console.log(` Port:      ${PORT}`);
  console.log(` Storage:   ${DATA_DIR}`);
  console.log(`=========================================`);
});

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

function gracefulShutdown() {
    if (isShuttingDown) return;
    isShuttingDown = true;
    console.log('\n[Shutdown] Received signal. Closing server...');
    
    server.close(() => {
        console.log('[Shutdown] HTTP server closed.');
        // Wait for file locks if needed, or just exit if we trust the lock/writeDB logic
        process.exit(0);
    });

    // Force close after 5s
    setTimeout(() => {
        console.error('[Shutdown] Force exiting...');
        process.exit(1);
    }, 5000);
}