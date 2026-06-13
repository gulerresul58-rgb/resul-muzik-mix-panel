const multer = require('multer');

// Dosya ismini sabitleyen ayar
const storage = multer.diskStorage({
    destination: 'public/uploads/',
    filename: (req, file, cb) => {
        // Kullanıcı adını al ve dosya ismini ona göre kaydet (örn: yayin1.jpg)
        cb(null, req.body.user + '.jpg'); 
    }
});

const upload = multer({ storage: storage });
