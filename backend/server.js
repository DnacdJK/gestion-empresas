
const express = require('express');
const cors = require('cors');
const Database = require('better-sqlite3');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

const db = new Database(path.join(__dirname, 'empresas.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS empresas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombreComercial TEXT NOT NULL,
    razonSocial TEXT NOT NULL,
    telefono TEXT NOT NULL,
    correo TEXT NOT NULL UNIQUE,
    nit TEXT NOT NULL,
    estado TEXT NOT NULL CHECK (estado IN ('Activo', 'Inactivo')),
    direccion TEXT NOT NULL
  )
`);

function validarEmpresa(datos, incluirCorreo = true) {
  const campos = [
    'nombreComercial',
    'razonSocial',
    'telefono',
    'nit',
    'direccion'
  ];

  for (const campo of campos) {
    if (typeof datos[campo] !== 'string' || !datos[campo].trim()) {
      return 'Todos los campos son obligatorios';
    }
  }

  if (incluirCorreo) {
    if (typeof datos.correo !== 'string' || !datos.correo.trim()) {
      return 'El correo electrónico es obligatorio';
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(datos.correo.trim())) {
      return 'El correo electrónico no es válido';
    }
  }

  if (!/^[0-9+\-\s()]{7,20}$/.test(datos.telefono.trim())) {
    return 'El teléfono no tiene un formato válido';
  }

  if (!/^[0-9-]{5,15}$/.test(datos.nit.trim())) {
    return 'El NIT debe contener números y, opcionalmente, guiones';
  }

  if (!['Activo', 'Inactivo'].includes(datos.estado)) {
    return 'Selecciona un estado válido';
  }

  return null;
}

app.get('/api/empresas', (req, res) => {
  const empresas = db.prepare(
    'SELECT * FROM empresas ORDER BY id DESC'
  ).all();

  res.json(empresas);
});

app.get('/api/empresas/:id', (req, res) => {
  const empresa = db.prepare(
    'SELECT * FROM empresas WHERE id = ?'
  ).get(req.params.id);

  if (!empresa) {
    return res.status(404).json({
      mensaje: 'Empresa no encontrada'
    });
  }

  res.json(empresa);
});

app.post('/api/empresas', (req, res) => {
  const error = validarEmpresa(req.body);

  if (error) {
    return res.status(400).json({ mensaje: error });
  }

  const {
    nombreComercial,
    razonSocial,
    telefono,
    correo,
    nit,
    estado,
    direccion
  } = req.body;

  try {
    const resultado = db.prepare(`
      INSERT INTO empresas (
        nombreComercial, razonSocial, telefono,
        correo, nit, estado, direccion
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      nombreComercial.trim(),
      razonSocial.trim(),
      telefono.trim(),
      correo.trim(),
      nit.trim(),
      estado,
      direccion.trim()
    );

    const empresa = db.prepare(
      'SELECT * FROM empresas WHERE id = ?'
    ).get(resultado.lastInsertRowid);

    res.status(201).json(empresa);
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(409).json({
        mensaje: 'Ese correo electrónico ya está registrado'
      });
    }

    res.status(500).json({
      mensaje: 'Error al registrar la empresa'
    });
  }
});

app.put('/api/empresas/:id', (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ mensaje: 'ID no válido' });
  }

  const actual = db.prepare(
    'SELECT * FROM empresas WHERE id = ?'
  ).get(id);

  if (!actual) {
    return res.status(404).json({
      mensaje: 'Empresa no encontrada'
    });
  }

  const error = validarEmpresa(req.body, false);

  if (error) {
    return res.status(400).json({ mensaje: error });
  }

  const {
    nombreComercial,
    razonSocial,
    telefono,
    nit,
    estado,
    direccion
  } = req.body;

  db.prepare(`
    UPDATE empresas
    SET nombreComercial = ?,
        razonSocial = ?,
        telefono = ?,
        nit = ?,
        estado = ?,
        direccion = ?
    WHERE id = ?
  `).run(
    nombreComercial.trim(),
    razonSocial.trim(),
    telefono.trim(),
    nit.trim(),
    estado,
    direccion.trim(),
    id
  );

  res.json(
    db.prepare('SELECT * FROM empresas WHERE id = ?').get(id)
  );
});

app.delete('/api/empresas/:id', (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ mensaje: 'ID no válido' });
  }

  const resultado = db.prepare(
    'DELETE FROM empresas WHERE id = ?'
  ).run(id);

  if (resultado.changes === 0) {
    return res.status(404).json({
      mensaje: 'Empresa no encontrada'
    });
  }

  res.status(204).end();
});

app.listen(PORT, () => {
  console.log(`API disponible en http://localhost:${PORT}`);
});
