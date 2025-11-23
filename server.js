const express = require('express');
const path = require('path');
const sqlite = require('sqlite'); // SQLite için gerekli 
const sqlite3 = require('sqlite3'); // SQLite sürücüsü
const app = express();
// Render, PORT değişkenini otomatik atayacaktır, 3000 sadece yerelde test içindir.
const port = process.env.PORT || 3000; 
const dbName = path.join(__dirname, "x12movies.db"); // Veritabanı dosyası adı

// İstemciden (tarayıcıdan) gelen JSON verilerini okuyabilmek için gerekli
app.use(express.json());

// Veritabanını başlatma fonksiyonu
async function initializeDB() {
    // Render ortamında PostgreSQL kullanılıyorsa, bu kısım farklı bir sürücü ile güncellenmelidir.
    const db = await sqlite.open({
        filename: dbName,
        driver: sqlite3.Database
    });
    
    // HATA DÜZELTİLDİ: 'cat' (kategori) sütunu eklendi
    await db.run(`
        CREATE TABLE IF NOT EXISTS movies (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT,
            url TEXT,
            description TEXT,
            image TEXT,
            cat TEXT  
        )
    `);
    
    // Kullanıcı hesaplarının saklanacağı tabloyu oluşturma
    await db.run(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE,
            password TEXT,
            role TEXT DEFAULT 'user'
        )
    `);
    
    console.log("Veritabanı bağlantısı başarılı. 'movies' ve 'users' tabloları hazır.");
    return db;
}

let db; // Veritabanı bağlantısını bu değişkende tutacağız
initializeDB().then(database => {
    db = database;
}).catch(err => {
    console.error("Veritabanı başlatılırken hata oluştu:", err);
});


// --- SUNUCU YOLLARI (ROUTES) ---
// Statik dosyaları (index.html, CSS, JS) sunar
app.use(express.static(path.join(__dirname, '')));

// Ana sayfaya gelen istekleri index.html'e yönlendirir.
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Filmleri listeleme yolu (GET /movies)
app.get('/movies', async (req, res) => {
    try {
        // Bütün filmleri çek, herkese görünür olsun
        const movies = await db.all('SELECT * FROM movies ORDER BY id DESC');
        res.json(movies);
    } catch (error) {
        console.error('Filmleri çekerken hata:', error);
        res.status(500).json({ error: 'Filmleri veritabanından çekerken hata oluştu.' });
    }
});

// Film ekleme yolu (POST /movies)
app.post('/movies', async (req, res) => {
    // HATA DÜZELTİLDİ: 'cat' eklendi
    const { title, url, description, image, cat } = req.body; 

    if (!title || !url || !image || !cat) {
        return res.status(400).json({ error: 'Başlık, URL, Resim ve Kategori alanları zorunludur.' });
    }

    try {
        const result = await db.run(
            // HATA DÜZELTİLDİ: 'cat' eklendi
            'INSERT INTO movies (title, url, description, image, cat) VALUES (?, ?, ?, ?, ?)',
            [title, url, description, image, cat]
        );
        // Yeni eklenen filmi geri döndür
        res.status(201).json({ 
            id: result.lastID, 
            title, 
            url, 
            description, 
            image, 
            cat 
        });
    } catch (error) {
        console.error('Film eklerken hata:', error);
        res.status(500).json({ error: 'Film veritabanına eklenirken hata oluştu.' });
    }
});


// Sunucuyu başlat
app.listen(port, () => {
    console.log(`Sunucu hazır! Açmak için: http://localhost:${port} adresini kullanın.`);
});