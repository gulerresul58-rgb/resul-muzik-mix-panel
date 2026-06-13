const express = require('express');
const app = express();
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));

// Yayıncıların resimlerini tutacak yer
let yayinVerileri = {
    "yayin1": "https://i.imgur.com/ornek1.jpg" // Başlangıç resmi
};

// 1. GİRİŞ EKRANI
app.get('/', (req, res) => {
    res.send(`<h1>Giriş Yap</h1><form action="/login" method="POST"><input type="text" name="user"><input type="password" name="pass"><button>Giriş</button></form>`);
});

// 2. YÖNETİM PANELİ (Resim Değiştirme)
app.post('/login', (req, res) => {
    if(req.body.user === "yayin1" && req.body.pass === "1234") {
        res.send(`<h1>Panel</h1><form action="/guncelle" method="POST"><input type="text" name="yeniResim" placeholder="Resim Linki"><button>Güncelle</button></form>`);
    } else { res.send("Hatalı!"); }
});

// 3. RESMİ GÜNCELLEME
app.post('/guncelle', (req, res) => {
    yayinVerileri["yayin1"] = req.body.yeniResim;
    res.send("Resim güncellendi! OBS'te değişecektir.");
});

// 4. OBS İÇİN ÖZEL LİNK (Bunu OBS Browser Source'a ekleyeceksin)
app.get('/overlay/yayin1', (req, res) => {
    res.send(`<img src="${yayinVerileri["yayin1"]}" style="width:100%;">`);
});

app.listen(10000);
