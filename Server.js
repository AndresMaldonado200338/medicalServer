const express = require('express');
const file = require('fs');
const path = require('path'); 
const multer = require('multer'); 
const { v4: uuidv4 } = require('uuid'); 
const app = express(); 
const port = 3000; 

app.use(express.json()); 
app.use(express.static('public')); 


const storage = multer.diskStorage({
    destination: (req, file, cb) => { 
        cb(null, 'public/images'); 
    },
    filename: (req, file, cb) => { 
        cb(null, file.originalname); 
    }
});

const upload = multer({ storage: storage });


app.post('/citas/images', upload.single('file'), (req, res) => {
    res.send('Archivo subido');
});


app.get('/citas/images', (req, res) => {
    file.readdir(path.join(__dirname, 'public/images'), (err, files) => {
        if (err) {
            res.status(500).send('Error al leer la carpeta de imágenes');
        } else {
            res.send(files);
        }
    });
});


app.get('/citas/images/:filename', (req, res) => {
    const filename = req.params.filename;
    res.sendFile(path.join(__dirname, 'public/images', filename));
});


app.get('/citas/data', (req, res) => {
    file.readFile('Data/citas.json', 'utf-8', (err, data) => {
        if (err) {
            res.status(500).send('Error al leer el archivo de citas');
        } else {
            const citas = JSON.parse(data);
            res.json(citas);
        }
    });
});


app.post('/citas/data', (req, res) => {
    const nuevaCita = req.body;
    nuevaCita.id = uuidv4();

    file.readFile('Data/citas.json', 'utf-8', (err, data) => {
        if (err) {
            res.status(500).send('Error al leer el archivo de citas');
        } else {
            let citas = [];
            try {
                citas = JSON.parse(data); 
                if (!Array.isArray(citas)) {
                    throw new Error('El contenido de citas no es un array');
                }
            } catch (parseErr) {
                citas = [];
            }
            citas.push(nuevaCita);
            file.writeFile('Data/citas.json', JSON.stringify(citas, null, 2), (err) => {
                if (err) {
                    res.status(500).send('Error al guardar la nueva cita');
                } else {
                    res.status(201).send('Cita creada exitosamente');
                }
            });
        }
    });
});

app.listen(port, () => {
    console.log(`Servidor escuchando en http://localhost:${port}`);
});
