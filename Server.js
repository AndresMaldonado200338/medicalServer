const express = require('express');
const file = require('fs');
const path = require('path');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const cors = require('cors');

const app = express();
const port = 3000;

app.use(express.json());
app.use(cors());

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/images');
    },

    filename: (req, file, cb) => {
        const uniqueSuffix = `${uuidv4()}${path.extname(file.originalname)}`;
        cb(null, uniqueSuffix);
    }
});

const upload = multer({ storage: storage });

app.post('/citas/data', upload.single('file'), (req, res) => {
    const nuevaCita = req.body;
    nuevaCita.Id = uuidv4();
    nuevaCita.Estado = nuevaCita.Estado || 'activa';


    if (req.file) {
        nuevaCita.ImageFile = req.file.filename;
    }

    file.readFile('Data/citas.json', 'utf-8', (err, data) => {
        let citas;
        if (err) {
            if (err.code === 'ENOENT') {
                citas = [];
            } else {
                res.status(500).send('Error al leer el archivo de citas');
                return;
            }
        } else {
            try {
                citas = JSON.parse(data);
                if (!Array.isArray(citas)) {
                    throw new Error('El contenido de citas no es un array');
                }
            } catch (parseErr) {
                citas = [];
            }
        }
        citas.push(nuevaCita);
        file.writeFile('Data/citas.json', JSON.stringify(citas, null, 2), (err) => {
            if (err) {
                res.status(500).send('Error al guardar la nueva cita');
            } else {
                res.status(201).json({ message: 'Cita creada exitosamente', Id: nuevaCita.Id });
            }
        });
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

app.get('/citas/data/rango', (req, res) => {
    const fechaInicio = req.query.fechaInicio;
    const fechaFin = req.query.fechaFin;

    file.readFile('Data/citas.json', 'utf-8', (err, data) => {
        if (err) {
            console.error('Error al leer el archivo de citas:', err);
            res.status(500).send('Error al leer el archivo de citas');
        } else {
            try {
                const citas = JSON.parse(data);
                const citasEnRango = citas.filter(cita => {
                    return cita.Fecha >= fechaInicio && cita.Fecha <= fechaFin;
                });
                res.json(citasEnRango);
            } catch (parseError) {
                console.error('Error al analizar el JSON:', parseError);
                res.status(500).send('Error al analizar el archivo de citas');
            }
        }
    });
});

app.get('/citas/data/:Id', (req, res) => {
    const id = req.params.Id;
    file.readFile('Data/citas.json', 'utf-8', (err, data) => {
        if (err) {
            res.status(500).send('Error al leer el archivo de citas');
        } else {
            const citas = JSON.parse(data);
            const cita = citas.find(cita => cita.Id === id);
            if (cita) {
                res.json(cita);
            } else {
                res.status(404).send('Cita no encontrada');
            }
        }
    });
});

app.put('/citas/data/:Id', (req, res) => {
    const Id = req.params.Id;
    const nuevoEstado = req.body.Estado;
    file.readFile('Data/citas.json', 'utf-8', (err, data) => {
        if (err) {
            res.status(500).send('Error al leer el archivo de citas');
        } else {
            const citas = JSON.parse(data);
            const cita = citas.find(cita => cita.Id === Id);
            if (cita) {
                cita.Estado = nuevoEstado;
                file.writeFile('Data/citas.json', JSON.stringify(citas, null, 2), (err) => {
                    if (err) {
                        res.status(500).send('Error al guardar la nueva cita');
                    } else {
                        res.status(200).send('Estado de la cita actualizado');
                    }
                });
            } else {
                res.status(404).send('Cita no encontrada');
            }
        }
    });
});

app.listen(port, () => {
    console.log(`Servidor escuchando en http://localhost:${port}`);
});
