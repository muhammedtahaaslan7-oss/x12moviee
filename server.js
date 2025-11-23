const express = require('express');
const path = require('path');
const sqlite = require('sqlite'); // SQLite için gerekli 
const sqlite3 = require('sqlite3'); // SQLite sürücüsü
const app = express();
const port = 3000;
const dbName = path.join(__dirname, "x12movies.db"); // Veritabanı dosyası adı

// İstemciden (tarayıcıdan) gelen JSON verilerini okuyabilmek için gerekli
app.use(express.json());

// Veritabanını başlatma fonksiyonu
async function initializeDB() {
    const db = await sqlite.open({
        filename: dbName,
        driver: sqlite3.Database
    });
    
    // Filmlerin saklanacağı tabloyu oluşturma (Eğer yoksa)
    await db.run(`
        CREATE TABLE IF NOT EXISTS movies (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT,
            url TEXT,
            description TEXT,
            image TEXT
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


// Sunucuyu başlat
app.listen(port, () => {
    console.log(`Sunucu hazır! Açmak için: http://localhost:${port} adresini kullanın.`);
});