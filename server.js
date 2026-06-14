const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const app = express();

app.use(express.urlencoded({ extended: true }));
const uploadDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
app.use(express.static(path.join(__dirname, 'public')));

// Kullanıcıların ayarlarını tutan depo
let veritabani = {};

const storage = multer.diskStorage({
    destination: (req, file, cb) => { cb(null, uploadDir); },
    filename: (req, file, cb) => { cb(null, req.body.user + '_son.jpg'); }
});
const upload = multer({ storage: storage });

const layout = (content, user) => `
    <html>
    <head>
        <style>
            body { background: #fafafa; font-family: sans-serif; margin: 0; display: flex; }
            .sidebar { width: 220px; background: white; border-right: 1px solid #dbdbdb; height: 100vh; padding: 20px; }
            .card { background: white; border: 1px solid #dbdbdb; width: 400px; padding: 30px; border-radius: 3px; }
            input, select { width: 100%; padding: 10px; margin: 5px 0; border: 1px solid #dbdbdb; }
            button { width: 100%; padding: 10px; background: #0095f6; color: white; border: none; font-weight: bold; margin-top: 10px; cursor: pointer; }
            .ig-bubble { position: fixed; top: 20px; right: 20px; background: white; border-radius: 15px; padding: 15px; border: 1px solid #dbdbdb; display: flex; align-items: center; gap: 10px; box-shadow: 0 5px 15px rgba(0,0,0,0.1); opacity: 0; transition: opacity 0.3s; z-index: 1000; }
        </style>
    </head>
    <body>
        <div id="status-bubble" class="ig-bubble">İşlem Başarılı!</div>
        <div class="sidebar">
            <div style="font-weight:bold; margin-bottom:20px;">Kullanıcı: ${user || 'Giriş Yap'}</div>
            <a href="/panel?user=${user}">🖼 Panelim</a>
        </div>
        <div style="flex:1; display:flex; justify-content:center; align-items:center;">
            <div class="card">${content}</div>
        </div>
        <script>function showBubble(){ const b = document.getElementById('status-bubble'); b.style.opacity = 1; setTimeout(()=>b.style.opacity=0, 2000); }</script>
    </body>
    </html>
`;

// GİRİŞ EKRANI
app.get('/', (req, res) => res.send(`
    <body style="display:flex; justify-content:center; align-items:center; height:100vh;">
        <form action="/panel" method="GET">
            <input type="text" name="user" placeholder="Kullanıcı Adını Gir" required style="padding:10px;">
            <button type="submit">Giriş Yap</button>
        </form>
    </body>
`));

// PANEL EKRANI
app.get('/panel', (req, res) => {
    const user = req.query.user;
    if (!veritabani[user]) veritabani[user] = { metin: "Hoş geldin", boyut: "40px", renk: "#ffffff", font: "'Arial', sans-serif", konum: "bottom: 50px; left: 50px;" };
    res.send(layout(`
        <h3>${user} Yayın Paneli</h3>
        <form action="/upload" method="POST" enctype="multipart/form-data" onsubmit="showBubble()">
            <input type="hidden" name="user" value="${user}">
            <input type="file" name="resim" required><button type="submit">Resmi Yükle</button>
        </form>
        <form action="/set-yazi" method="POST" onsubmit="showBubble()">
            <input type="hidden" name="user" value="${user}">
            <input type="text" name="metin" value="${veritabani[user].metin}">
            <input type="color" name="renk" value="${veritabani[user].renk}">
            <button type="submit">Güncelle</button>
        </form>
    `, user));
});

app.post('/set-yazi', (req, res) => {
    const { user, metin, renk } = req.body;
    veritabani[user] = { ...veritabani[user], metin, renk };
    res.redirect('/panel?user=' + user);
});

app.post('/upload', upload.single('resim'), (req, res) => res.redirect('/panel?user=' + req.body.user));

// OBS EKRANI (1 Saniyede Bir Yenilenir)
app.get('/yayin/:user', (req, res) => {
    const user = req.params.user;
    res.send(`
        <body style="margin:0; background:black; height:100vh; overflow:hidden;">
            <img id="img" src="/uploads/${user}_son.jpg?t=${Date.now()}" style="width:100%; height:100%; object-fit:contain;">
            <div id="yazi" style="position:absolute; ${veritabani[user]?.konum || ''} color:${veritabani[user]?.renk || 'white'}; font-size:${veritabani[user]?.boyut || '40px'};">
                ${veritabani[user]?.metin || ''}
            </div>
            <script>
                setInterval(() => {
                    document.getElementById('img').src = '/uploads/${user}_son.jpg?t=' + Date.now();
                    fetch('/api-yazi/${user}').then(r => r.json()).then(d => {
                        const y = document.getElementById('yazi');
                        y.innerText = d.metin; y.style.color = d.renk;
                    });
                }, 1000);
            </script>
        </body>
    `);
});

app.get('/api-yazi/:user', (req, res) => res.json(veritabani[req.params.user] || {}));

app.listen(process.env.PORT || 10000);
