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

// GÜZELLEŞTİRİLMİŞ GİRİŞ PANELİ (Kendi kullandığın ekran)
app.get('/', (req, res) => {
    res.send(`
        <html>
        <head>
            <style>
                body { background: #fafafa; font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
                .login-card { background: white; border: 1px solid #dbdbdb; width: 350px; padding: 40px; text-align: center; }
                .logo { font-size: 1.5em; font-weight: bold; margin-bottom: 20px; color: #262626; }
                input { width: 100%; padding: 10px; margin: 5px 0; border: 1px solid #dbdbdb; box-sizing: border-box; border-radius: 3px; }
                button { width: 100%; padding: 10px; background: #0095f6; color: white; border: none; font-weight: bold; margin-top: 10px; cursor: pointer; border-radius: 3px; }
            </style>
        </head>
        <body>
            <div class="login-card">
                <div class="logo">Resul Müzik Paneli</div>
                <form action="/login" method="POST">
                    <input type="text" name="user" placeholder="Kullanıcı Adı">
                    <input type="password" name="pass" placeholder="Şifre">
                    <button type="submit">Giriş Yap</button>
                </form>
            </div>
        </body>
        </html>
    `);
});

app.post('/login', (req, res) => {
    const { user, pass } = req.body;
    if (kullanicilar[user] && kullanicilar[user] === pass) {
        res.send(`<html><body style="font-family:sans-serif; text-align:center; padding-top:50px;">
            <h3>Resim Yükle</h3>
            <form action="/upload" method="POST" enctype="multipart/form-data">
            <input type="hidden" name="user" value="${user}">
            <input type="file" name="resim" required><br><br>
            <button type="submit" style="padding:10px 20px; background:#0095f6; color:white; border:none; cursor:pointer;">Yükle</button>
            </form></body></html>`);
    } else { res.send("Hatalı Giriş!"); }
});

app.post('/upload', upload.single('resim'), (req, res) => {
    res.send("Başarıyla Yüklendi! <br><br> <a href='/'>Geri dön</a>");
});

// OBS İÇİN TASARIMLI EKRAN
app.get('/son-resim/:user', (req, res) => {
    const user = req.params.user;
    const dir = 'public/uploads';
    if (!fs.existsSync(dir)) return res.send("Klasör yok");
    const files = fs.readdirSync(dir).filter(f => f.startsWith(user + '_')).sort();
    
    if (files.length > 0) {
        const sonDosya = files[files.length - 1];
        res.send(`
            <html>
            <head>
                <meta http-equiv="refresh" content="1">
                <style>
                    body { background: #fafafa; font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
                    .login-card { background: white; border: 1px solid #dbdbdb; width: 350px; padding: 40px; text-align: center; }
                    .logo { font-size: 1.5em; font-weight: bold; margin-bottom: 20px; color: #262626; }
                    .img-preview { width: 100%; height: 200px; object-fit: contain; margin-bottom: 20px; background: #000; }
                </style>
            </head>
            <body>
                <div class="login-card">
                    <div class="logo">Resul Müzik Paneli</div>
                    <img src="/uploads/${sonDosya}?t=${Date.now()}" class="img-preview">
                </div>
            </body>
            </html>
        `);
    } else {
        res.send("<h1 style='text-align:center;'>Resim bekleniyor...</h1>");
    }
});

app.listen(10000);
