const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { MongoClient } = require('mongodb');
const app = express();

const uri = process.env.MONGO_URI || "mongodb+srv://resul3402:resul0234@cluster0.9jn6f7f.mongodb.net/?retryWrites=true&w=majority";
const client = new MongoClient(uri);

async function getDb() {
    if (!client.topology || !client.topology.isConnected()) await client.connect();
    const db = client.db("resul_muzik").collection("data");
    const check = await db.findOne({ id: "veriler" });
    if (!check) {
        await db.insertOne({ id: "veriler", kullanicilar: { "admin": "admin123" }, ayarlari: {} });
    }
    return db;
}

const uploadDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadDir)) { fs.mkdirSync(uploadDir, { recursive: true }); }
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
const upload = multer({ dest: 'public/uploads/' });

// Bildirim mekanizmalı layout
const layout = (content, user, isSidebar = false, isLogin = false, msg = "") => `
    <html>
    <head>
        <title>Resul Müzik Mix Panel</title>
        <style>
            body { font-family: sans-serif; margin: 0; background: #fafafa; display: flex; }
            .sidebar { width: 220px; background: #fff; height: 100vh; padding: 20px; border-right: 1px solid #ddd; }
            .content { flex: 1; padding: 40px; display: flex; justify-content: center; }
            .card { background: white; padding: 30px; border-radius: 15px; border: 1px solid #ddd; width: 100%; max-width: 400px; text-align: center; }
            .brand { font-size: 28px; margin-bottom: 25px; color: #333; font-weight: bold; }
            input, select { width: 100%; padding: 12px; margin: 8px 0; border: 1px solid #ddd; border-radius: 6px; box-sizing: border-box; }
            button { width: 100%; padding: 12px; background: #0095f6; color: white; border: none; border-radius: 6px; font-weight: bold; cursor: pointer; }
            #toast { visibility: hidden; min-width: 250px; background-color: #333; color: #fff; text-align: center; border-radius: 6px; padding: 16px; position: fixed; z-index: 999; left: 50%; bottom: 30px; transform: translateX(-50%); }
            #toast.show { visibility: visible; animation: fadein 0.5s, fadeout 0.5s 2.5s; }
            @keyframes fadein { from {bottom: 0; opacity: 0;} to {bottom: 30px; opacity: 1;} }
            @keyframes fadeout { from {bottom: 30px; opacity: 1;} to {bottom: 0; opacity: 0;} }
        </style>
    </head>
    <body>
        ${isSidebar ? `<div class="sidebar"><h3>≡ PANEL</h3>
            <a href="/panel?user=${user}">🏠 Ana Sayfa</a><br><br>
            ${user === 'admin' ? '<a href="/admin-paneli">👤 Kullanıcı Yönetimi</a>' : `
            <a href="/panel?user=${user}&view=resim">🖼 Resim Yükle</a><br>
            <a href="/panel?user=${user}&view=yazi">✍ Yazı Ayarları</a>`}
            <br><br><a href="/" style="color:red; text-decoration:none;">Çıkış Yap</a>
        </div>` : ''}
        <div class="content"><div class="card">${content}</div></div>
        <div id="toast">${msg}</div>
        <script>${msg ? "var x = document.getElementById('toast'); x.className = 'show'; setTimeout(function(){ x.className = x.className.replace('show', ''); }, 3000);" : ""}</script>
    </body>
    </html>
`;

app.get('/', (req, res) => res.send(layout(`
    <div class="brand">Resul Müzik Mix Panel</div>
    <form action="/login" method="POST">
        <input name="user" placeholder="Kullanıcı Adı" required>
        <input name="pass" type="password" placeholder="Şifre" required>
        <button type="submit">Giriş Yap</button>
    </form>`, "", false, true)));

app.post('/login', async (req, res) => {
    const db = await getDb();
    const doc = await db.findOne({ id: "veriler" });
    const { user, pass } = req.body;
    if (doc.kullanicilar && doc.kullanicilar[user] === pass) res.redirect('/panel?user=' + user);
    else res.send("Hatalı giriş!");
});

app.get('/panel', async (req, res) => {
    const { user, view, msg } = req.query;
    const db = await getDb();
    const doc = await db.findOne({ id: "veriler" });
    const d = (doc.ayarlari && doc.ayarlari[user]) ? doc.ayarlari[user] : { metin: "Resul Müzik", boyut: 40, font: "Arial", renk: "#ffffff", dikey: 50, yatay: 50 };
    
    let content = !view ? `<h2>Hoş geldin, ${user}</h2>
        ${user === 'admin' ? `<p>OBS Linkin:<br><input type="text" value="https://${req.headers.host}/yayin/${user}" readonly onclick="this.select()"></p>` : ''}
        <div style="width:100px; height:100px; margin:auto; border-radius:50%; overflow:hidden; border:2px solid #ddd;">
            <img src="/uploads/${user}_son.jpg?t=${Date.now()}" style="width:100%; height:100%; object-fit:cover;" onerror="this.src='https://via.placeholder.com/100'">
        </div>` : (view === 'yazi' ? `<h3>Yazı Ayarları</h3>
        <form action="/update-yayin" method="POST">
            <input type="hidden" name="user" value="${user}">
            <input name="metin" value="${d.metin}"><input name="renk" type="color" value="${d.renk}">
            <button type="submit">Kaydet</button>
        </form>` : `<h3>Resim Yükle</h3><form action="/upload" method="POST" enctype="multipart/form-data"><input type="hidden" name="user" value="${user}"><input type="file" name="resim"><button type="submit">Yükle</button></form>`);
    res.send(layout(content, user, true, false, msg));
});

app.post('/upload', upload.single('resim'), (req, res) => { 
    fs.renameSync(req.file.path, path.join('public/uploads/', req.body.user + '_son.jpg')); 
    res.redirect('/panel?user=' + req.body.user + '&msg=Resim başarıyla yüklendi!'); 
});

app.post('/update-yayin', async (req, res) => {
    const db = await getDb();
    await db.updateOne({ id: "veriler" }, { $set: { [`ayarlari.${req.body.user}`]: req.body } }, { upsert: true });
    res.redirect('/panel?user=' + req.body.user + '&msg=Ayarlar başarıyla kaydedildi!');
});

app.get('/yayin/:user', (req, res) => res.send(`<html><body style="margin:0;"><img id="img" src="/uploads/${req.params.user}_son.jpg" style="position:absolute; width:100%; height:100%; object-fit:contain;"><div id="y"></div><script>setInterval(async()=>{try{const r=await fetch('/api/ayarlar/${req.params.user}');const d=await r.json();const y=document.getElementById('y');y.innerText=d.metin;y.style.cssText='position:absolute;font-size:'+d.boyut+'px;top:'+d.dikey+'%;left:'+d.yatay+'%;color:'+d.renk+';font-family:'+d.font+';transform:translate(-50%,-50%);';document.getElementById('img').src='/uploads/${req.params.user}_son.jpg?t='+Date.now();}catch(e){}},3000)</script></body></html>`));

app.get('/api/ayarlar/:user', async (req, res) => {
    const db = await getDb();
    const doc = await db.findOne({ id: "veriler" });
    const d = (doc && doc.ayarlari && doc.ayarlari[req.params.user]) ? doc.ayarlari[req.params.user] : { metin: "Resul Müzik", boyut: 40, font: "Arial", renk: "#ffffff", dikey: 50, yatay: 50 };
    res.json(d);
});

app.get('/admin-paneli', async (req, res) => {
    const db = await getDb();
    const doc = await db.findOne({ id: "veriler" });
    const users = doc.kullanicilar || {};
    let list = Object.keys(users).map(u => `<div>${u} ${u!=='admin' ? `<a href="/kisi-sil/${u}" style="color:red;">Sil</a>` : ''}</div>`).join('');
    res.send(layout(`<h3>Kullanıcılar</h3><form action="/kisi-ekle" method="POST"><input name="yeniUser" placeholder="İsim"><input name="yeniPass" placeholder="Şifre"><button>Ekle</button></form>${list}`, "admin", true));
});

app.post('/kisi-ekle', async (req, res) => {
    const db = await getDb();
    await db.updateOne({ id: "veriler" }, { $set: { [`kullanicilar.${req.body.yeniUser}`]: req.body.yeniPass } }, { upsert: true });
    res.redirect('/admin-paneli');
});

app.get('/kisi-sil/:user', async (req, res) => {
    const db = await getDb();
    await db.updateOne({ id: "veriler" }, { $unset: { [`kullanicilar.${req.params.user}`]: "" } });
    res.redirect('/admin-paneli');
});

app.listen(process.env.PORT || 10000);
