const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const app = express();

const uploadDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadDir)) { fs.mkdirSync(uploadDir, { recursive: true }); }

app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

const dbFile = path.join(__dirname, 'veriler.json');
let veriler = { kullanicilar: { "admin": "admin123" }, ayarlari: {} };
if (fs.existsSync(dbFile)) {
    try { const data = fs.readFileSync(dbFile, 'utf8'); if (data) veriler = JSON.parse(data); } catch (e) {}
}
function save() { fs.writeFileSync(dbFile, JSON.stringify(veriler, null, 2)); }

const upload = multer({ dest: 'public/uploads/' });

function getAyarlar(user) {
    if (!veriler.ayarlari[user]) {
        veriler.ayarlari[user] = { metin: "Resul Müzik", boyut: 40, font: "'Roboto', sans-serif", renk: "#ffffff", dikey: 50, yatay: 50 };
    }
    return veriler.ayarlari[user];
}

const layout = (content, user, isSidebar = false, isAdmin = false, showWelcome = false, isLogin = false) => `
    <html>
    <head>
        <title>Resul Müzik Mix Panel</title>
        <link href="https://fonts.googleapis.com/css2?family=Roboto&family=Pacifico&family=Anton&family=Bebas+Neue&display=swap" rel="stylesheet">
        <style>
            body { font-family: 'Roboto', sans-serif; margin: 0; background: #fafafa; display: flex; ${isLogin ? 'justify-content: center; align-items: center; height: 100vh;' : ''} }
            .sidebar { width: 250px; background: #fff; height: 100vh; border-right: 1px solid #dbdbdb; padding: 20px; }
            .menu-btn { display: block; padding: 15px; margin: 10px 0; background: #f0f2f5; border-radius: 8px; text-decoration: none; color: #333; font-weight: 600; }
            .content-area { flex: 1; padding: 40px; display: flex; justify-content: center; }
            .card { background: white; padding: 30px; border-radius: 15px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); width: 100%; max-width: 400px; }
            .toast { position: fixed; top: 20px; right: 20px; background: #27ae60; color: white; padding: 15px 25px; border-radius: 50px; animation: fadeOut 3s forwards; z-index: 1000; }
            @keyframes fadeOut { 0% { opacity: 1; } 70% { opacity: 1; } 100% { opacity: 0; } }
            input, select, button { width: 100%; padding: 12px; margin: 8px 0; border: 1px solid #ddd; border-radius: 8px; }
            button { background: #0095f6; color: white; font-weight: bold; cursor: pointer; border: none; }
        </style>
    </head>
    <body>
        ${isSidebar ? `<div class="sidebar"><h3>≡ RESUL MÜZİK MIX PANEL</h3>
            <a class="menu-btn" href="/panel?user=${user}">🏠 Ana Sayfa</a>
            ${user === 'admin' ? '<a class="menu-btn" href="/admin-paneli">👤 Kullanıcılar</a>' : `
            <a class="menu-btn" href="/panel?user=${user}&view=resim">🖼 Resim Yükle</a>
            <a class="menu-btn" href="/panel?user=${user}&view=yazi">✍ Yazı Ayarları</a>`}
            <a href="/" style="color:red; margin-top:20px; display:block;">Çıkış Yap</a>
        </div>` : ''}
        <div class="content-area">
            ${showWelcome ? `<div class="toast">Resul Müzik Mix Panelimize hoş geldiniz, ${user}!</div>` : ''}
            <div class="card">${content}</div>
        </div>
    </body>
    </html>
`;

app.get('/', (req, res) => res.send(layout(`<h3>Giriş Yap</h3><form action="/login" method="POST"><input type="text" name="user" placeholder="Kullanıcı Adı" required><input type="password" name="pass" placeholder="Şifre" required><button type="submit">Giriş</button></form>`, "", false, false, false, true)));

app.post('/login', (req, res) => {
    const { user, pass } = req.body;
    if (veriler.kullanicilar[user] && veriler.kullanicilar[user] === pass) {
        res.redirect('/panel?user=' + user + '&welcome=true');
    } else { res.send("Hatalı bilgiler! <a href='/'>Geri dön</a>"); }
});

app.get('/admin-paneli', (req, res) => {
    let list = Object.keys(veriler.kullanicilar).map(u => `<div style="display:flex; justify-content:space-between; padding:10px; border-bottom:1px solid #eee;">${u} ${u !== 'admin' ? `<a href="/kisi-sil/${u}" style="color:red;">Sil</a>` : ''}</div>`).join('');
    res.send(layout(`<h1>Kullanıcı Yönetimi</h1><form action="/kisi-ekle" method="POST"><input type="text" name="yeniUser" placeholder="Yeni Kullanıcı" required><input type="text" name="yeniPass" placeholder="Şifre" required><button type="submit">Ekle</button></form><h3>Kullanıcılar:</h3>${list}`, "admin", true, true));
});

app.post('/kisi-ekle', (req, res) => { veriler.kullanicilar[req.body.yeniUser] = req.body.yeniPass; save(); res.redirect('/admin-paneli'); });
app.get('/kisi-sil/:user', (req, res) => { delete veriler.kullanicilar[req.params.user]; save(); res.redirect('/admin-paneli'); });

app.get('/panel', (req, res) => {
    const { user, view, welcome } = req.query;
    if(!user) return res.redirect('/');
    const d = getAyarlar(user);
    const isHome = !view;
    let content = isHome ? `<h2>Ana Sayfa</h2><p>OBS Linkin:</p><input type="text" value="https://m-zik-paneli.onrender.com/yayin/${user}" readonly onclick="this.select()"><h3>Canlı Önizleme</h3><div id="preview-box" style="position:relative; width:100%; height:150px; background:#ddd; border-radius:8px; overflow:hidden;"><img src="/uploads/${user}_son.jpg" style="width:100%; height:100%; object-fit:cover;" onerror="this.src='https://via.placeholder.com/100'"><div id="preview-text" style="position:absolute; top:${d.dikey}%; left:${d.yatay}%; color:${d.renk}; font-size:${d.boyut/2}px; font-family:${d.font}; transform:translate(-50%,-50%);">${d.metin}</div></div>` : (view === 'resim' ? `<h3>Resim Yükle</h3><form action="/upload" method="POST" enctype="multipart/form-data"><input type="hidden" name="user" value="${user}"><input type="file" name="resim" required><button type="submit">Yükle</button></form>` : `<h3>Yazı Ayarları</h3><div id="preview-box" style="position:relative; width:100%; height:150px; background:#ddd; border-radius:8px; overflow:hidden;"><img src="/uploads/${user}_son.jpg" style="width:100%; height:100%; object-fit:cover;" onerror="this.src='https://via.placeholder.com/100'"><div id="preview-text" style="position:absolute; top:${d.dikey}%; left:${d.yatay}%; color:${d.renk}; font-size:${d.boyut/2}px; font-family:${d.font}; transform:translate(-50%,-50%);">${d.metin}</div></div><form action="/update-yayin" method="POST" oninput="updatePreview()"><input type="hidden" name="user" value="${user}"><input type="text" id="metin" name="metin" value="${d.metin}"><input type="color" id="renk" name="renk" value="${d.renk}"><input type="number" id="boyut" name="boyut" value="${d.boyut}"><label>Dikey (%):</label><input type="range" id="dikey" name="dikey" min="0" max="100" value="${d.dikey}"><label>Yatay (%):</label><input type="range" id="yatay" name="yatay" min="0" max="100" value="${d.yatay}"><select name="font" id="font"><option value="'Roboto', sans-serif">Modern</option><option value="'Bebas Neue', sans-serif">Manşet</option><option value="'Anton', sans-serif">Kalın</option><option value="'Pacifico', cursive">El Yazısı</option></select><button type="submit">Kaydet</button></form><script>function updatePreview(){const p=document.getElementById('preview-text');p.innerText=document.getElementById('metin').value;p.style.color=document.getElementById('renk').value;p.style.fontSize=(document.getElementById('boyut').value/2)+'px';p.style.top=document.getElementById('dikey').value+'%';p.style.left=document.getElementById('yatay').value+'%';p.style.fontFamily=document.getElementById('font').value;}</script>`);
    res.send(layout(content, user, true, false, welcome === 'true'));
});

app.post('/upload', upload.single('resim'), (req, res) => {
    fs.renameSync(req.file.path, path.join('public/uploads/', req.body.user + '_son.jpg'));
    res.redirect('/panel?user=' + req.body.user);
});
app.post('/update-yayin', (req, res) => { veriler.ayarlari[req.body.user] = req.body; save(); res.redirect('/panel?user=' + req.body.user); });
app.get('/yayin/:user', (req, res) => { res.send(`<html><body><img src="/uploads/${req.params.user}_son.jpg" style="width:100%"></body></html>`); });
app.listen(process.env.PORT || 10000);
