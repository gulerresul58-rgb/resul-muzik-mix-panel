const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

const kullanicilar = { "yayin1": "1234", "yayin2": "5678" };

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = 'public/uploads';
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        cb(null, req.body.user + '_' + Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

app.get('/', (req, res) => {
    res.send(`<html><body><form action="/login" method="POST">
        <input type="text" name="user" placeholder="Kullanıcı"><input type="password" name="pass" placeholder="Şifre">
        <button type="submit">Giriş</button></form></body></html>`);
});

app.post('/login', (req, res) => {
    const { user, pass } = req.body;
    if (kullanicilar[user] && kullanicilar[user] === pass) {
        res.send(`<html><body><form action="/upload" method="POST" enctype="multipart/form-data">
            <input type="hidden" name="user" value="${user}">
            <input type="file" name="resim" required><button type="submit">Yükle</button></form></body></html>`);
    } else { res.send("Hatalı!"); }
});

app.post('/upload', upload.single('resim'), (req, res) => {
    res.send("Yüklendi! <a href='/'>Geri dön</a>");
});

// TASARIMLI VE OTOMATİK YENİLEYEN SİSTEM
app.get('/son-resim/:user', (req, res) => {
    const user = req.params.user;
    const dir = 'public/uploads';
    if (!fs.existsSync(dir)) return res.send("Klasör yok");
    
    const files = fs.readdirSync(dir).filter(f => f.startsWith(user + '_')).sort();
    
    if (files.length > 0) {
        const sonDosya = files[files.length - 1];
        
        // Buraya Instagram tasarımını ekledik
        res.send(`
            <html>
            <head>
                <meta http-equiv="refresh" content="1">
                <style>
                    body { margin: 0; padding: 0; background: #000; display: flex; justify-content: center; align-items: center; height: 100vh; overflow: hidden; }
                    .instagram-container { width: 100%; height: 100%; border: 2px solid #333; box-sizing: border-box; }
                    img { width: 100%; height: 100%; object-fit: contain; }
                </style>
            </head>
            <body>
                <div class="instagram-container">
                    <img src="/uploads/${sonDosya}?t=${Date.now()}">
                </div>
            </body>
            </html>
        `);
    } else {
        res.send("<h1 style='color:white; text-align:center;'>Resim bekleniyor...</h1>");
    }
});

app.listen(10000);
