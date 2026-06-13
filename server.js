const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

const kullanicilar = {
    "yayin1": "1234",
    "yayin2": "5678"
};

// Dosya ismini her seferinde değişecek şekilde (zaman damgalı) ayarlar
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

const style = `<style>
    body { font-family: sans-serif; background: #f0f2f5; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
    .card { background: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); width: 320px; text-align: center; }
    input { width: 100%; padding: 12px; margin: 10px 0; border: 1px solid #ddd; border-radius: 6px; box-sizing: border-box; }
    button { width: 100%; padding: 12px; background: #0095f6; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold; }
</style>`;

// Giriş Sayfası
app.get('/', (req, res) => {
    res.send(`<html><head>${style}</head><body><div class="card">
        <h2>Resul Müzik Mix Panel</h2>
        <form action="/login" method="POST">
            <input type="text" name="user" placeholder="Kullanıcı Adı" required>
            <input type="password" name="pass" placeholder="Şifre" required>
            <button type="submit">Giriş Yap</button>
        </form></div></body></html>`);
});

// Giriş Kontrolü
app.post('/login', (req, res) => {
    const { user, pass } = req.body;
    if (kullanicilar[user] && kullanicilar[user] === pass) {
        res.send(`<html><head>${style}</head><body><div class="card">
            <h2>Resul Müzik Mix Panel</h2>
            <p>Hoş geldin, ${user}</p>
            <form action="/upload" method="POST" enctype="multipart/form-data">
                <input type="hidden" name="user" value="${user}">
                <input type="file" name="resim" accept="image/*,video/*" required>
                <button type="submit">Resmi Güncelle</button>
            </form></div></body></html>`);
    } else {
        res.send("Hatalı giriş! <a href='/'>Geri dön</a>");
    }
});

// Yükleme İşlemi
app.post('/upload', upload.single('resim'), (req, res) => {
    res.send(`<html><head>${style}</head><body><div class="card">
        <h2>Resul Müzik Mix Panel</h2>
        <p>Resim başarıyla güncellendi!</p>
        <a href="/">Panele Dön</a></div></body></html>`);
});

// OBS İÇİN ÖNEMLİ: Son yüklenen dosyayı otomatik bulan sistem
app.get('/son-resim/:user', (req, res) => {
    const user = req.params.user;
    const dir = 'public/uploads';
    if (!fs.existsSync(dir)) return res.status(404).send('Klasör bulunamadı');
    
    const files = fs.readdirSync(dir);
    const userFiles = files.filter(f => f.startsWith(user + '_')).sort();
    
    if (userFiles.length > 0) {
        // En son yüklenen (en büyük zaman damgalı) dosyayı gönder
        res.redirect('/uploads/' + userFiles[userFiles.length - 1]);
    } else {
        res.status(404).send('Henüz resim yüklenmemiş.');
    }
});

app.listen(10000);
