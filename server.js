const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

let kullanicilar = { "resul3402": "resul0202" }; 
let veritabani = {};

const upload = multer({ dest: 'public/uploads/' });

// TASARIM ŞABLONU (Senin orijinal tasarımın burası)
const layout = (content, user, isMenu = true) => `
    <html>
    <head>
        <style>
            body { background: #fafafa; font-family: sans-serif; margin: 0; display: flex; }
            .sidebar { width: 220px; background: white; border-right: 1px solid #dbdbdb; height: 100vh; padding: 20px; }
            .card { background: white; border: 1px solid #dbdbdb; width: 400px; padding: 30px; border-radius: 3px; }
            input, select { width: 100%; padding: 10px; margin: 5px 0; border: 1px solid #dbdbdb; }
            button { width: 100%; padding: 10px; background: #0095f6; color: white; border: none; font-weight: bold; cursor: pointer; }
        </style>
    </head>
    <body>
        ${isMenu ? `<div class="sidebar"><h3>${user.toUpperCase()}</h3><a href="/panel?user=${user}">Panel</a><br><a href="/">Çıkış</a></div>` : ''}
        <div style="flex:1; display:flex; justify-content:center; align-items:center;">
            <div class="card">${content}</div>
        </div>
    </body>
    </html>
`;

// GİRİŞ
app.get('/', (req, res) => res.send(layout(`
    <form action="/login" method="POST">
        <h3>Giriş</h3>
        <input type="text" name="user" placeholder="Kullanıcı">
        <input type="password" name="pass" placeholder="Şifre">
        <button type="submit">Giriş Yap</button>
    </form>`, "Giriş", false)));

app.post('/login', (req, res) => {
    const { user, pass } = req.body;
    if (kullanicilar[user] === pass) {
        res.redirect(user === 'admin' ? '/admin-paneli' : '/panel?user=' + user);
    } else res.send("Hatalı!");
});

// ADMIN PANELİ (Kişi Ekleme)
app.get('/admin-paneli', (req, res) => {
    res.send(layout(`
        <h1>Admin Paneli</h1>
        <form action="/kisi-ekle" method="POST">
            <input type="text" name="yeniUser" placeholder="Yeni Kullanıcı Adı">
            <input type="text" name="yeniPass" placeholder="Şifre">
            <button type="submit">Ekle</button>
        </form>
    `, "Admin", true));
});

app.post('/kisi-ekle', (req, res) => {
    kullanicilar[req.body.yeniUser] = req.body.yeniPass;
    res.redirect('/admin-paneli');
});

// KULLANICI PANELİ (Slider, Tasarım vs. aynen burada devam ediyor)
app.get('/panel', (req, res) => {
    const user = req.query.user;
    if(!veritabani[user]) veritabani[user] = {metin:"Resul Müzik", boyut:40};
    res.send(layout(`
        <h3>${user} Paneli</h3>
        <input type="text" value="${veritabani[user].metin}">
        <label>Boyut: ${veritabani[user].boyut}px</label>
        <input type="range" value="${veritabani[user].boyut}">
    `, user, true));
});

app.listen(10000);
