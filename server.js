const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

const dbFile = path.join(__dirname, 'veriler.json');
let veriler = { kullanicilar: { "admin": "admin123" }, ayarlari: {} };
if (fs.existsSync(dbFile)) veriler = JSON.parse(fs.readFileSync(dbFile, 'utf8'));
function save() { fs.writeFileSync(dbFile, JSON.stringify(veriler, null, 2)); }

const upload = multer({ dest: 'public/uploads/' });

// TASARIM ŞABLONU
const layout = (content, user, isSidebar = true) => `
    <html>
    <head>
        <title>Resul Müzik Mix Panel</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
            body { font-family: -apple-system, sans-serif; margin: 0; background: #fafafa; display: flex; }
            .sidebar { width: 250px; background: #fff; height: 100vh; border-right: 1px solid #dbdbdb; padding: 20px; }
            .menu-btn { display: block; width: 100%; padding: 15px; margin: 10px 0; background: #f0f2f5; border-radius: 8px; text-decoration: none; color: #333; font-weight: 600; }
            .content-area { flex: 1; display: flex; justify-content: center; align-items: flex-start; padding: 40px; }
            .card { background: white; padding: 30px; border-radius: 15px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); width: 100%; max-width: 400px; }
            input, select, button { width: 100%; padding: 12px; margin: 8px 0; border: 1px solid #ddd; border-radius: 8px; }
            button { background: #0095f6; color: white; font-weight: bold; cursor: pointer; border: none; }
        </style>
    </head>
    <body>
        ${isSidebar ? `<div class="sidebar"><h3>≡ RESUL MÜZİK</h3>
            <a class="menu-btn" href="/panel?user=${user}&view=resim">🖼 Resim Yükle</a>
            <a class="menu-btn" href="/panel?user=${user}&view=yazi">✍ Yazı Ayarları</a>
            <a href="/" style="color:red; margin-top:20px; display:block;">Çıkış Yap</a>
        </div>` : ''}
        <div class="content-area"><div class="card">${content}</div></div>
    </body>
    </html>
`;

// GİRİŞ ROTALARI
app.get('/', (req, res) => res.send(layout(`<h3>Giriş Yap</h3><form action="/login" method="POST"><input type="text" name="user" placeholder="Kullanıcı Adı"><input type="password" name="pass" placeholder="Şifre"><button type="submit">Giriş</button></form>`, "Giriş", false)));

app.post('/login', (req, res) => {
    const { user, pass } = req.body;
    if (veriler.kullanicilar[user] === pass) res.redirect(user === 'admin' ? '/admin-paneli' : '/panel?user=' + user);
    else res.send("Hatalı kullanıcı adı veya şifre!");
});

// ADMIN PANELİ
app.get('/admin-paneli', (req, res) => {
    let list = Object.keys(veriler.kullanicilar).map(u => `<div style="padding:10px; border-bottom:1px solid #eee;">${u}</div>`).join('');
    res.send(layout(`<h1>Yönetim</h1><form action="/kisi-ekle" method="POST"><input type="text" name="yeniUser" placeholder="Kullanıcı"><input type="text" name="yeniPass" placeholder="Şifre"><button type="submit">Ekle</button></form><h3>Kullanıcılar:</h3>${list}`, "admin"));
});

app.post('/kisi-ekle', (req, res) => {
    veriler.kullanicilar[req.body.yeniUser] = req.body.yeniPass;
    save(); res.redirect('/admin-paneli');
});

// KULLANICI PANELİ
app.get('/panel', (req, res) => {
    const { user, view, msg } = req.query;
    if(!user) return res.redirect('/');
    if(!veriler.ayarlari[user]) veriler.ayarlari[user] = {metin:"Resul Müzik", boyut:40, font:"Arial", renk:"#000", konum:"bottom: 50px; left: 50px;"};
    const d = veriler.ayarlari[user];

    let content = `
        ${msg ? `<div style="background:#d4edda; color:#155724; padding:10px; border-radius:8px; margin-bottom:15px; font-size:14px;">✅ ${msg}</div>` : ''}
        <div style="text-align:center; margin-bottom:20px;">
            <div style="width:90px; height:90px; border-radius:50%; border:3px solid #e1306c; padding:3px; margin:0 auto;">
                <img src="/uploads/${user}_son.jpg" onerror="this.src='https://via.placeholder.com/90'" style="width:100%; height:100%; border-radius:50%; object-fit:cover;">
            </div>
            <h3 style="margin-top:10px;">${user}</h3>
        </div>
    `;
    
    if (view === 'resim') {
        content += `<h2>Resim Yükle</h2>
        <form action="/upload" method="POST" enctype="multipart/form-data">
            <input type="hidden" name="user" value="${user}">
            <input type="file" name="resim"><button type="submit">Yükle</button>
        </form>`;
    } else if (view === 'yazi') {
        content += `<h2>Yazı Ayarları</h2>
        <form action="/update-yayin" method="POST">
            <input type="hidden" name="user" value="${user}">
            <input type="text" name="metin" value="${d.metin}">
            <input type="color" name="renk" value="${d.renk}">
            <input type="range" name="boyut" min="10" max="100" value="${d.boyut}">
            <select name="font">
                <option value="Arial" ${d.font=="Arial"?"selected":""}>Arial</option>
                <option value="cursive" ${d.font=="cursive"?"selected":""}>El Yazısı</option>
                <option value="fantasy" ${d.font=="fantasy"?"selected":""}>Modern</option>
            </select>
            <select name="konum">
                <option value="bottom: 50px; left: 50px;" ${d.konum.includes("bottom")?"selected":""}>Sol Alt</option>
            </select>
            <button type="submit">Kaydet</button>
        </form>`;
    } else {
        content += `<p>Sol menüden düzenlemek istediğin alanı seç.</p>`;
    }
    res.send(layout(content, user));
});

app.post('/upload', upload.single('resim'), (req, res) => {
    if(req.file) {
        const newPath = path.join('public/uploads/', req.body.user + '_son.jpg');
        fs.renameSync(req.file.path, newPath);
    }
    res.redirect('/panel?user=' + req.body.user + '&view=resim&msg=Resim+yüklendi!');
});

app.post('/update-yayin', (req, res) => {
    veriler.ayarlari[req.body.user] = req.body;
    save(); res.redirect('/panel?user=' + req.body.user + '&view=yazi&msg=Ayarlar+kaydedildi!');
});

app.get('/yayin/:user', (req, res) => {
    const d = veriler.ayarlari[req.params.user] || { metin: "Yayında", boyut: 40, renk: "#fff", font: "Arial", konum: "bottom: 50px; left: 50px;" };
    res.send(`<body style="margin:0; background:black;"><img src="/uploads/${req.params.user}_son.jpg" style="width:100%;"><div style="position:absolute; ${d.konum} color:${d.renk}; font-size:${d.boyut}px; font-family:${d.font};">${d.metin}</div></body>`);
});

app.listen(process.env.PORT || 10000);
