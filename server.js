const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Başlangıç kullanıcıları
let kullanicilar = { "admin": "admin123" }; 
let veritabani = {}; 

const upload = multer({ dest: 'public/uploads/' });

// ORTAK TASARIM (Admin ve Yayıncı için ortak menü)
const layout = (content, user, isMenu = true) => `
    <html>
    <head>
        <style>
            body { background: #fafafa; font-family: sans-serif; margin: 0; display: flex; }
            .sidebar { width: 220px; background: white; border-right: 1px solid #dbdbdb; height: 100vh; padding: 20px; }
            .card { background: white; border: 1px solid #dbdbdb; width: 450px; padding: 30px; border-radius: 3px; }
            input { width: 100%; padding: 10px; margin: 5px 0; border: 1px solid #dbdbdb; }
            button { width: 100%; padding: 10px; background: #0095f6; color: white; border: none; cursor: pointer; }
            .user-item { display: flex; justify-content: space-between; padding: 10px; border-bottom: 1px solid #eee; }
        </style>
    </head>
    <body>
        ${isMenu ? `<div class="sidebar"><h3>≡ RESUL MÜZİK</h3><a href="${user === 'admin' ? '/admin-paneli' : '/panel?user=' + user}">🏠 Panel</a><br><br><a href="/">🚪 Çıkış</a></div>` : ''}
        <div style="flex:1; display:flex; justify-content:center; align-items:center;">
            <div class="card">${content}</div>
        </div>
    </body>
    </html>
`;

app.get('/', (req, res) => res.send(layout(`<h3>Giriş Yap</h3><form action="/login" method="POST"><input type="text" name="user" placeholder="Kullanıcı"><input type="password" name="pass" placeholder="Şifre"><button type="submit">Giriş</button></form>`, "Giriş", false)));

app.post('/login', (req, res) => {
    const { user, pass } = req.body;
    if (kullanicilar[user] === pass) res.redirect(user === 'admin' ? '/admin-paneli' : '/panel?user=' + user);
    else res.send("Hatalı!");
});

// ADMIN PANELİ (KULLANICI LİSTESİ VE SİLME BUTONU)
app.get('/admin-paneli', (req, res) => {
    let list = Object.keys(kullanicilar).map(u => `
        <div class="user-item">
            <span>${u}</span>
            ${u !== 'admin' ? `<form action="/sil" method="POST"><input type="hidden" name="user" value="${u}"><button style="background:red; width:auto; padding:5px 10px;">Sil</button></form>` : 'Admin'}
        </div>
    `).join('');
    
    res.send(layout(`<h1>Yönetim Paneli</h1>
        <form action="/kisi-ekle" method="POST">
            <input type="text" name="yeniUser" placeholder="Yeni Kullanıcı Adı">
            <input type="text" name="yeniPass" placeholder="Şifre">
            <button type="submit">Ekle</button>
        </form>
        <h3>Kullanıcılar:</h3>${list}`, "admin"));
});

app.post('/kisi-ekle', (req, res) => {
    kullanicilar[req.body.yeniUser] = req.body.yeniPass;
    res.redirect('/admin-paneli');
});

// KULLANICI SİLME İŞLEMİ
app.post('/sil', (req, res) => {
    delete kullanicilar[req.body.user];
    res.redirect('/admin-paneli');
});

// YAYINCI PANELİ
app.get('/panel', (req, res) => {
    const user = req.query.user;
    if(!veritabani[user]) veritabani[user] = {metin:"Resul Müzik Mix Panel", boyut:40};
    res.send(layout(`<h3>${user} Paneli</h3><form action="/set-yazi" method="POST"><input type="hidden" name="user" value="${user}"><input type="text" name="metin" value="${veritabani[user].metin}"><input type="range" name="boyut" min="10" max="100" value="${veritabani[user].boyut}"><button type="submit">Kaydet</button></form>`, user));
});

app.post('/set-yazi', (req, res) => {
    veritabani[req.body.user] = { metin: req.body.metin, boyut: req.body.boyut };
    res.redirect('/panel?user=' + req.body.user);
});

app.listen(10000);
