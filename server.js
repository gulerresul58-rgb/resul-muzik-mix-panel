const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

const dbFile = path.join(__dirname, 'veriler.json');

let veriler = { kullanicilar: { "admin": "admin123" }, ayarlari: {} };
if (fs.existsSync(dbFile)) {
    try { veriler = JSON.parse(fs.readFileSync(dbFile, 'utf8')); } catch (e) {}
}
function save() { fs.writeFileSync(dbFile, JSON.stringify(veriler, null, 2)); }

const upload = multer({ dest: 'public/uploads/' });

function getAyarlar(user) {
    if (!veriler.ayarlari[user]) {
        veriler.ayarlari[user] = { metin: "Resul Müzik", boyut: 40, font: "'Roboto', sans-serif", renk: "#ffffff", dikey: 50, yatay: 50 };
    }
    return veriler.ayarlari[user];
}

const layout = (content, user, isSidebar = false) => `
    <html>
    <head>
        <title>Resul Müzik Mix Panel</title>
        <link href="https://fonts.googleapis.com/css2?family=Roboto&family=Pacifico&family=Lobster&family=Anton&family=Bebas+Neue&family=Press+Start+2P&family=Oswald&display=swap" rel="stylesheet">
        <style>
            body { font-family: 'Roboto', sans-serif; margin: 0; background: #fafafa; display: flex; }
            .sidebar { width: 250px; background: #fff; height: 100vh; border-right: 1px solid #dbdbdb; padding: 20px; }
            .menu-btn { display: block; padding: 15px; margin: 10px 0; background: #f0f2f5; border-radius: 8px; text-decoration: none; color: #333; font-weight: 600; }
            .content-area { flex: 1; padding: 40px; display: flex; justify-content: center; }
            .card { background: white; padding: 30px; border-radius: 15px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); width: 100%; max-width: 400px; }
            input, select, button { width: 100%; padding: 12px; margin: 8px 0; border: 1px solid #ddd; border-radius: 8px; }
            button { background: #0095f6; color: white; font-weight: bold; cursor: pointer; border: none; }
            .toast { position: fixed; bottom: 20px; right: 20px; background: #27ae60; color: white; padding: 15px 25px; border-radius: 50px; animation: fade 3s forwards; }
            @keyframes fade { 0% { opacity: 0; } 20% { opacity: 1; } 80% { opacity: 1; } 100% { opacity: 0; } }
            .profile-ring { width: 100px; height: 100px; border-radius: 50%; border: 4px solid #e1306c; padding: 3px; margin: 0 auto 20px; }
            .profile-ring img { width: 100%; height: 100%; border-radius: 50%; object-fit: cover; }
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

app.get('/', (req, res) => res.send(layout(`<h3>Giriş Yap</h3><form action="/login" method="POST"><input type="text" name="user" placeholder="Kullanıcı"><input type="password" name="pass" placeholder="Şifre"><button type="submit">Giriş</button></form>`, "Giriş")));

app.post('/login', (req, res) => {
    const { user, pass } = req.body;
    if (veriler.kullanicilar[user] === pass) res.redirect(user === 'admin' ? '/admin-paneli' : '/panel?user=' + user);
    else res.send("Hatalı!");
});

app.get('/panel', (req, res) => {
    const { user, view, msg } = req.query;
    if(!user) return res.redirect('/');
    const d = getAyarlar(user);
    const obsLink = `https://m-zik-paneli.onrender.com/yayin/${user}`;

    let content = `
        <div class="profile-ring"><img src="/uploads/${user}_son.jpg" onerror="this.src='https://via.placeholder.com/100'"></div>
        ${msg ? `<div class="toast">✅ ${msg}</div>` : ''}
        <h3>OBS Linkin:</h3><input type="text" value="${obsLink}" readonly onclick="this.select()">
        
        <div id="preview-box" style="position:relative; width:100%; height:150px; background:#ddd; margin:15px 0; overflow:hidden; border-radius:8px;">
            <img src="/uploads/${user}_son.jpg" style="width:100%; height:100%; object-fit:cover;">
            <div id="preview-text" style="position:absolute; font-weight:bold; text-shadow:2px 2px 4px #000; color:${d.renk}; font-size:${d.boyut/2}px; font-family:${d.font}; top:${d.dikey}%; left:${d.yatay}%; transform:translate(-50%, -50%);">
                ${d.metin}
            </div>
        </div>

        <form action="/update-yayin" method="POST" oninput="updatePreview()">
            <input type="hidden" name="user" value="${user}">
            <input type="text" id="metin" name="metin" value="${d.metin}">
            <input type="color" id="renk" name="renk" value="${d.renk}">
            <input type="number" id="boyut" name="boyut" value="${d.boyut}">
            <label>Dikey (%):</label><input type="range" id="dikey" name="dikey" min="0" max="100" value="${d.dikey}">
            <label>Yatay (%):</label><input type="range" id="yatay" name="yatay" min="0" max="100" value="${d.yatay}">
            <select name="font" id="font">
                <option value="'Roboto', sans-serif">Modern</option>
                <option value="'Bebas Neue', sans-serif">Manşet</option>
                <option value="'Anton', sans-serif">Kalın</option>
                <option value="'Pacifico', cursive">El Yazısı</option>
            </select>
            <button type="submit">Kaydet</button>
        </form>
        <script>
            function updatePreview() {
                const p = document.getElementById('preview-text');
                p.innerText = document.getElementById('metin').value;
                p.style.color = document.getElementById('renk').value;
                p.style.fontSize = (document.getElementById('boyut').value / 2) + 'px';
                p.style.top = document.getElementById('dikey').value + '%';
                p.style.left = document.getElementById('yatay').value + '%';
                p.style.fontFamily = document.getElementById('font').value;
            }
        </script>
    `;
    res.send(layout(content, user, true));
});

app.post('/update-yayin', (req, res) => {
    veriler.ayarlari[req.body.user] = req.body;
    save(); res.redirect('/panel?user=' + req.body.user + '&view=yazi&msg=Başarıyla+Eklendi!');
});

app.get('/yayin/:user', (req, res) => {
    res.send(`
        <html><head>
            <link href="https://fonts.googleapis.com/css2?family=Roboto&family=Pacifico&family=Lobster&family=Anton&family=Bebas+Neue&family=Press+Start+2P&family=Oswald&display=swap" rel="stylesheet">
            <style>body { margin
