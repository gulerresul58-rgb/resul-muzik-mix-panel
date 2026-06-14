const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const app = express();

app.use(express.urlencoded({ extended: true }));
const uploadDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
app.use(express.static(path.join(__dirname, 'public')));

let yaziAyarlari = {
    metin: "Resul Müzik Yayını",
    boyut: "40px",
    renk: "#ffffff",
    konum: "bottom: 50px; left: 50px;",
    font: "'Arial', sans-serif"
};

const storage = multer.diskStorage({
    destination: (req, file, cb) => { cb(null, uploadDir); },
    filename: (req, file, cb) => { cb(null, 'yayin1_son.jpg'); }
});
const upload = multer({ storage: storage });

const layout = (content) => `
    <html>
    <head>
        <style>
            body { background: #fafafa; font-family: sans-serif; margin: 0; display: flex; position: relative; }
            .sidebar { width: 220px; background: white; border-right: 1px solid #dbdbdb; height: 100vh; padding: 20px; }
            .card { background: white; border: 1px solid #dbdbdb; width: 400px; padding: 30px; border-radius: 3px; position: relative; }
            input, select { width: 100%; padding: 10px; margin: 5px 0; border: 1px solid #dbdbdb; }
            button { width: 100%; padding: 10px; background: #0095f6; color: white; border: none; font-weight: bold; margin-top: 10px; cursor: pointer; }
            a { color: #333; text-decoration: none; display: block; margin: 15px 0; font-weight: bold; }
            
            /* INSTAGRAM STORY BALONCUĞU STİLİ (SADECE PANEL İÇİN) */
            .ig-bubble {
                position: fixed; top: 20px; right: 20px;
                background: white; border-radius: 15px;
                padding: 15px; border: 1px solid #dbdbdb;
                display: flex; align-items: center; gap: 10px;
                box-shadow: 0 5px 15px rgba(0,0,0,0.1);
                opacity: 0; transform: translateY(-20px);
                transition: all 0.3s ease; z-index: 1000;
            }
            .ig-bubble.active { opacity: 1; transform: translateY(0); }
            .ig-thumb { width: 40px; height: 40px; border-radius: 50%; object-fit: cover; border: 2px solid #dbdbdb; }
            .ig-text { font-size: 0.9em; line-height: 1.2; color: #262626; }
            .ig-text-title { font-weight: bold; }
        </style>
    </head>
    <body>
        <div id="status-bubble" class="ig-bubble">
            <img id="status-thumb" class="ig-thumb" src="/uploads/yayin1_son.jpg?t=${Date.now()}" alt="">
            <div class="ig-text">
                <div class="ig-text-title" id="status-action">Yüklendi</div>
                <div id="status-content">Detaylar...</div>
            </div>
        </div>

        <div class="sidebar">
            <div style="font-weight:bold; margin-bottom:20px;">MENÜ</div>
            <a href="/admin">🖼 Resim Değiştir</a>
            <a href="/yazi-ayarlari">✍ Yazı Ekle/Düzenle</a>
        </div>
        <div style="flex:1; display:flex; justify-content:center; align-items:center;">
            <div class="card">
                <div style="font-size:1.5em; font-weight:bold; margin-bottom:20px;">Resul Müzik Mix Panel</div>
                ${content}
            </div>
        </div>

        <script>
            function showBubble(action, content, image) {
                const bubble = document.getElementById('status-bubble');
                const actionEl = document.getElementById('status-action');
                const contentEl = document.getElementById('status-content');
                const thumbEl = document.getElementById('status-thumb');

                actionEl.innerText = action;
                contentEl.innerText = content;
                if (image) thumbEl.src = image + '?t=' + new Date().getTime();

                bubble.classList.add('active');
                setTimeout(() => bubble.classList.remove('active'), 3000); // 3 saniye sonra kaybolur
            }
        </script>
    </body>
    </html>
`;

app.get('/api/yazi', (req, res) => res.json(yaziAyarlari));

app.get('/admin', (req, res) => res.send(layout(`
    <form action="/upload" method="POST" enctype="multipart/form-data" onsubmit="showBubble('RESİM YÜKLENDİ', 'Yayin1 story güncellendi', '/uploads/yayin1_son.jpg')">
        <input type="file" name="resim" required><button type="submit">Resmi Yükle</button>
    </form>
`)));

app.get('/yazi-ayarlari', (req, res) => res.send(layout(`
    <form action="/set-yazi" method="POST" onsubmit="showBubble('YAZI EKLENDİ', '${yaziAyarlari.metin} yayına girdi', '/uploads/yayin1_son.jpg')">
        <input type="text" name="metin" value="${yaziAyarlari.metin}" placeholder="Yazı">
        <label>Boyut: <span id="val">${yaziAyarlari.boyut.replace('px','')}</span>px</label>
        <input type="range" name="boyut" min="10" max="200" value="${yaziAyarlari.boyut.replace('px','')}" oninput="document.getElementById('val').innerText = this.value">
        <input type="color" name="renk" value="${yaziAyarlari.renk}" style="height:40px;">
        <select name="font">
            <option value="'Arial', sans-serif">Modern</option>
            <option value="'Courier New', monospace">Retro</option>
            <option value="'Impact', sans-serif">Kalın</option>
        </select>
        <select name="konum">
            <option value="top:20px; left:20px;">Sol Üst</option>
            <option value="bottom:50px; left:50px;">Sol Alt</option>
            <option value="bottom:50px; right:50px;">Sağ Alt</option>
        </select>
        <button type="submit">Güncelle</button>
    </form>
`)));

app.post('/set-yazi', (req, res) => {
    yaziAyarlari = { ...req.body, boyut: req.body.boyut + "px" };
    res.redirect('/yazi-ayarlari');
});

app.post('/upload', upload.single('resim'), (req, res) => res.redirect('/admin'));

// OBS EKRANI (DEĞİŞMEDİ)
app.get('/son-resim/:user', (req, res) => {
    res.send(`
        <html>
        <body style="margin:0; background:black; height:100vh; overflow:hidden;">
            <img id="img" src="/uploads/yayin1_son.jpg?t=${Date.now()}" style="width:100%; height:100%; object-fit:contain;">
            <div id="yazi-alani" style="position:absolute; font-weight:bold; text-shadow:2px 2px 10px black; padding:10px;"></div>
            <script>
                setInterval(async () => {
                    document.getElementById('img').src = '/uploads/yayin1_son.jpg?t=' + new Date().getTime();
                    const res = await fetch('/api/yazi');
                    const data = await res.json();
                    const y = document.getElementById('yazi-alani');
                    y.innerText = data.metin; y.style.fontSize = data.boyut; y.style.color = data.renk; 
                    y.style.fontFamily = data.font; y.style.cssText += data.konum;
                }, 1000);
            </script>
        </body>
        </html>
    `);
});

app.listen(process.env.PORT || 10000);
