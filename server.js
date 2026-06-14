const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { MongoClient } = require('mongodb');
const app = express();

const uri = process.env.MONGO_URI || "mongodb+srv://resul3402:resul0234@cluster0.9jn6f7f.mongodb.net/?retryWrites=true&w=majority";
const client = new MongoClient(uri);

async function getDb() {
    try {
        if (!client.topology || !client.topology.isConnected()) await client.connect();
        return client.db("resul_muzik").collection("data");
    } catch (e) { return null; }
}

app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
const upload = multer({ dest: 'public/uploads/' });

const fontList = ['Arial', 'Roboto', 'Open Sans', 'Lato', 'Montserrat', 'Poppins', 'Oswald', 'Raleway', 'Bebas Neue', 'Lobster', 'Dancing Script', 'Pacifico', 'Anton', 'Playfair Display', 'Ubuntu', 'Merriweather', 'Nunito', 'Impact', 'Georgia', 'Courier New', 'Verdana', 'Tahoma', 'Comic Sans MS', 'Trebuchet MS'];

const layout = (content, user, isSidebar = false, isLogin = false, msg = "") => `
    <html>
    <head>
        <title>Resul Müzik Panel</title>
        <link href="https://fonts.googleapis.com/css2?family=Roboto&family=Open+Sans&family=Lato&family=Montserrat&family=Poppins&family=Oswald&family=Raleway&family=Bebas+Neue&family=Lobster&family=Dancing+Script&family=Pacifico&family=Anton&family=Playfair+Display&family=Ubuntu&family=Merriweather&family=Nunito&display=swap" rel="stylesheet">
        <style>
            body { font-family: 'Segoe UI', sans-serif; margin: 0; background: #f0f2f5; display: flex; ${isLogin ? 'justify-content: center; align-items: center; height: 100vh;' : ''} }
            .sidebar { width: 250px; background: #fff; height: 100vh; padding: 25px; border-right: 1px solid #ddd; }
            .content { flex: 1; padding: 40px; display: flex; justify-content: center; align-items: flex-start; }
            .card { background: white; padding: 30px; border-radius: 30px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); width: 100%; max-width: 500px; text-align: center; }
            .bubble-btn { display: block; padding: 15px; margin: 10px 0; border-radius: 50px; background: #0095f6; color: white; text-decoration: none; font-weight: bold; transition: 0.3s; }
            .bubble-btn:hover { opacity: 0.8; }
            input, select { width: 100%; padding: 15px; margin: 10px 0; border: 2px solid #eee; border-radius: 50px; box-sizing: border-box; outline: none; }
            button { width: 100%; padding: 15px; background: #0095f6; color: white; border: none; border-radius: 50px; font-weight: bold; cursor: pointer; }
            #toast { visibility: hidden; background: #333; color: white; padding: 15px 30px; border-radius: 50px; position: fixed; bottom: 30px; left: 50%; transform: translateX(-50%); }
            #toast.show { visibility: visible; }
        </style>
    </head>
    <body>
        ${isSidebar ? `<div class="sidebar"><h3>≡ PANEL</h3>
            ${user !== 'admin' ? `<a href="/panel?user=${user}" class="bubble-btn">🏠 Ana Sayfa</a>
            <a href="/panel?user=${user}&view=resim" class="bubble-btn">🖼 Resim Yükle</a>
            <a href="/panel?user=${user}&view=yazi" class="bubble-btn">✍ Yazı Ayarları</a>
            <a href="/panel?user=${user}&view=iletisim" class="bubble-btn" style="background:#25d366;">📞 İletişim</a>` : ''}
            ${user === 'admin' ? '<a href="/admin-paneli" class="bubble-btn" style="background:#e1306c;">👤 Kullanıcı Yönetimi</a>' : ''}
            <br><a href="/" style="color:red; text-decoration:none;">Çıkış Yap</a>
        </div>` : ''}
        <div class="content"><div class="card">${content}</div></div>
        <div id="toast">${msg}</div>
        <script>${msg ? "var x=document.getElementById('toast'); x.className='show'; setTimeout(()=>{x.className=''},3000);" : ""}</script>
    </body>
    </html>
`;

app.get('/', (req, res) => res.send(layout(`<h2>Resul Müzik</h2><form action="/login" method="POST"><input name="user" placeholder="Kullanıcı Adı" required><input name="pass" type="password" placeholder="Şifre" required><button type="submit">Giriş Yap</button></form>`, "", false, true)));

app.post('/login', async (req, res) => {
    const db = await getDb();
    const doc = await db.findOne({ id: "veriler" });
    if (doc?.kullanicilar?.[req.body.user] === req.body.pass) res.redirect('/panel?user=' + req.body.user);
    else res.send("Hatalı giriş!");
});

app.get('/panel', async (req, res) => {
    const { user, view, msg } = req.query;
    const db = await getDb();
    const doc = await db.findOne({ id: "veriler" });
    const d = doc?.ayarlari?.[user] || { metin: "Resul Müzik", boyut: 40, renk: "#000000", dikey: 50, yatay: 50, font: "Arial" };
    const ileti = doc?.iletisim || { wp: "", insta: "" };
    
    let content = "";
    if (!view) {
        content = `<h2>Hoş geldin, ${user}</h2>
        ${user !== 'admin' ? `
            <p>OBS Yayın Linkin:</p>
            <input value="https://${req.headers.host}/yayin/${user}" readonly onclick="this.select()">
            <p>Canlı Yayın Önizlemesi:</p>
            <div onclick="document.getElementById('modal').style.display='flex'" style="width:100px; height:100px; border-radius:50%; border:4px solid #0095f6; margin:20px auto; cursor:pointer; overflow:hidden; background:url('/uploads/${user}_son.jpg') center/cover;"></div>
            <div id="modal" onclick="this.style.display='none'" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.8); z-index:999; justify-content:center; align-items:center;">
                <iframe src="/yayin/${user}" style="width:854px; height:480px; border:none; background:#000;"></iframe>
            </div>` : '<h3>Yönetim Paneli</h3>'}`;
    } else if (view === 'yazi') {
        content = `<h3>Yazı Ayarları</h3>
        <div id="p-box" style="width:100%; height:200px; background:#e0e0e0; position:relative; border-radius:20px; overflow:hidden; margin-bottom:20px; border:2px dashed #bbb;">
            <div id="p-text" style="position:absolute; transform:translate(-50%,-50%); top:${d.dikey}%; left:${d.yatay}%; font-size:${d.boyut}px; color:${d.renk}; font-family:${d.font}; white-space:nowrap; pointer-events:none;">${d.metin}</div>
        </div>
        <form action="/update-yayin" method="POST" oninput="u()">
            <input type="hidden" name="user" value="${user}">
            <input name="metin" value="${d.metin}" id="i-metin" placeholder="Yazı">
            <select name="font" id="i-font">${fontList.map(f => `<option value="${f}" ${d.font==f?'selected':''}>${f}</option>`).join('')}</select>
            <input name="renk" type="color" value="${d.renk}" id="i-renk">
            <label>Boyut</label><input name="boyut" type="range" min="10" max="100" value="${d.boyut}" id="i-boyut">
            <label>Dikey</label><input name="dikey" type="range" min="0" max="100" value="${d.dikey}" id="i-dikey">
            <label>Yatay</label><input name="yatay" type="range" min="0" max="100" value="${d.yatay}" id="i-yatay">
            <button type="submit">Kaydet</button>
        </form>
        <script>function u(){const t=document.getElementById('p-text');t.innerText=document.getElementById('i-metin').value;t.style.color=document.getElementById('i-renk').value;t.style.fontFamily=document.getElementById('i-font').value;t.style.fontSize=document.getElementById('i-boyut').value+'px';t.style.top=document.getElementById('i-dikey').value+'%';t.style.left=document.getElementById('i-yatay').value+'%';}</script>`;
    } else if (view === 'iletisim') {
        content = `<h3>İletişim</h3>
        <a href="https://wa.me/${ileti.wp}" class="bubble-btn" style="background:#25d366;" target="_blank">WhatsApp'a Git</a>
        <a href="https://instagram.com/${ileti.insta}" class="bubble-btn" style="background:#e1306c;" target="_blank">Instagram'a Git</a>`;
    } else {
        content = `<h3>Resim Yükle</h3><form action="/upload" method="POST" enctype="multipart/form-data"><input type="hidden" name="user" value="${user}"><input type="file" name="resim"><button type="submit">Yükle</button></form>`;
    }
    res.send(layout(content, user, true, false, msg));
});

app.post('/upload', upload.single('resim'), (req, res) => { 
    if(req.file) fs.renameSync(req.file.path, path.join('public/uploads/', req.body.user + '_son.jpg')); 
    res.redirect('/panel?user=' + req.body.user + '&msg=Resim Yüklendi'); 
});

app.post('/update-yayin', async (req, res) => {
    const db = await getDb();
    await db.updateOne({ id: "veriler" }, { $set: { [`ayarlari.${req.body.user}`]: req.body } }, { upsert: true });
    res.redirect('/panel?user=' + req.body.user + '&msg=Ayarlar Kaydedildi');
});

app.get('/yayin/:user', (req, res) => res.send(`
    <html><head><link href="https://fonts.googleapis.com/css2?family=Roboto&family=Open+Sans&family=Lato&family=Montserrat&family=Poppins&family=Oswald&family=Raleway&family=Bebas+Neue&family=Lobster&family=Dancing+Script&family=Pacifico&family=Anton&family=Playfair+Display&family=Ubuntu&family=Merriweather&family=Nunito&display=swap" rel="stylesheet"><style>body{margin:0;overflow:hidden;background:#000;width:854px;height:480px;} #img{position:absolute;width:854px;height:480px;object-fit:cover;z-index:1;} #y{position:absolute;z-index:2;transform:translate(-50%,-50%);text-shadow:2px 2px 4px #000;font-weight:bold;white-space:nowrap;}</style></head>
    <body><img id="img" src="/uploads/${req.params.user}_son.jpg"><div id="y"></div><script>setInterval(async()=>{try{const r=await fetch('/api/ayarlar/${req.params.user}');const d=await r.json();const y=document.getElementById('y');y.innerText=d.metin;y.style.fontSize=d.boyut+'px';y.style.color=d.renk;y.style.fontFamily=d.font;y.style.top=d.dikey+'%';y.style.left=d.yatay+'%';}catch(e){}},2000)</script></body></html>
`));

app.get('/api/ayarlar/:user', async (req, res) => {
    const db = await getDb();
    const doc = await db.findOne({ id: "veriler" });
    res.json(doc?.ayarlari?.[req.params.user] || { metin: "Resul Müzik", boyut: 40, renk: "#000000", dikey: 50, yatay: 50, font: "Arial" });
});

app.get('/admin-paneli', async (req, res) => {
    const db = await getDb();
    const doc = await db.findOne({ id: "veriler" });
    const ileti = doc?.iletisim || { wp: "", insta: "" };
    let list = Object.keys(doc?.kullanicilar || {}).map(u => `
        <div style="display:flex; justify-content:space-between; align-items:center; padding:10px; border-bottom:1px solid #eee;">
            <span>${u}</span>
            <form action="/kisi-sil" method="POST" style="margin:0;"><input type="hidden" name="user" value="${u}"><button style="background:red; border:none; color:white; padding:5px 15px; border-radius:10px; cursor:pointer;">Sil</button></form>
        </div>`).join('');
    res.send(layout(`<h3>Kullanıcılar</h3><form action="/kisi-ekle" method="POST"><input name="yeniUser" placeholder="İsim" required><input name="yeniPass" placeholder="Şifre" required><button>Ekle</button></form>
    <hr><h3>İletişim Bilgilerini Düzenle</h3>
    <form action="/update-iletisim" method="POST"><input name="wp" placeholder="WhatsApp (905...)" value="${ileti.wp}" required><input name="insta" placeholder="Instagram Kullanıcı Adı" value="${ileti.insta}" required><button style="background:#555;">Kaydet</button></form>${list}`, "admin", true));
});

app.post('/kisi-ekle', async (req, res) => {
    const db = await getDb();
    await db.updateOne({ id: "veriler" }, { $set: { [`kullanicilar.${req.body.yeniUser}`]: req.body.yeniPass } }, { upsert: true });
    res.redirect('/admin-paneli');
});

app.post('/update-iletisim', async (req, res) => {
    const db = await getDb();
    await db.updateOne({ id: "veriler" }, { $set: { iletisim: { wp: req.body.wp, insta: req.body.insta } } }, { upsert: true });
    res.redirect('/admin-paneli?msg=Bilgiler Güncellendi');
});

app.post('/kisi-sil', async (req, res) => {
    const db = await getDb();
    await db.updateOne({ id: "veriler" }, { $unset: { [`kullanicilar.${req.body.user}`]: "", [`ayarlari.${req.body.user}`]: "" } });
    res.redirect('/admin-paneli');
});

app.listen(process.env.PORT || 10000);
