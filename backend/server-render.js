
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

if (!process.env.DATABASE_URL) {
  console.error('Falta configurar la variable DATABASE_URL');
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL.includes('localhost')
    ? false
    : { rejectUnauthorized: false }
});

async function inicializarBaseDatos() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS empresas (
      id SERIAL PRIMARY KEY,
      "nombreComercial" TEXT NOT NULL,
      "razonSocial" TEXT NOT NULL,
      telefono TEXT NOT NULL,
      correo TEXT NOT NULL UNIQUE,
      nit TEXT NOT NULL,
      estado TEXT NOT NULL CHECK (estado IN ('Activo', 'Inactivo')),
      direccion TEXT NOT NULL
    )
  `);
}

function validarEmpresa(empresa) {
  const campos = [
    'nombreComercial',
    'razonSocial',
    'telefono',
    'correo',
    'nit',
    'estado',
    'direccion'
  ];

  if (!empresa || campos.some(campo =>
    typeof empresa[campo] !== 'string' || !empresa[campo].trim()
  )) {
    return 'Todos los campos son obligatorios.';
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(empresa.correo)) {
    return 'El correo electrónico no es válido.';
  }

  if (!['Activo', 'Inactivo'].includes(empresa.estado)) {
    return 'El estado debe ser Activo o Inactivo.';
  }

  return null;
}

app.get('/api/empresas', async (req, res) => {
  try {
    const resultado = await pool.query(
      'SELECT * FROM empresas ORDER BY id'
    );
    res.json(resultado.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al consultar las empresas.' });
  }
});

app.get('/api/empresas/:id', async (req, res) => {
  try {
    const resultado = await pool.query(
      'SELECT * FROM empresas WHERE id = $1',
      [req.params.id]
    );

    if (resultado.rows.length === 0) {
      return res.status(404).json({ mensaje: 'Empresa no encontrada.' });
    }

    res.json(resultado.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al consultar la empresa.' });
  }
});

app.post('/api/empresas', async (req, res) => {
  const errorValidacion = validarEmpresa(req.body);

  if (errorValidacion) {
    return res.status(400).json({ mensaje: errorValidacion });
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
    const resultado = await pool.query(
      `INSERT INTO empresas
       ("nombreComercial", "razonSocial", telefono, correo, nit, estado, direccion)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [nombreComercial.trim(), razonSocial.trim(), telefono.trim(),
       correo.trim(), nit.trim(), estado, direccion.trim()]
    );

    res.status(201).json(resultado.rows[0]);
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ mensaje: 'Ese correo ya está registrado.' });
    }

    console.error(error);
    res.status(500).json({ mensaje: 'Error al crear la empresa.' });
  }
});

app.put('/api/empresas/:id', async (req, res) => {
  const errorValidacion = validarEmpresa(req.body);

  if (errorValidacion) {
    return res.status(400).json({ mensaje: errorValidacion });
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
    const resultado = await pool.query(
      `UPDATE empresas
       SET "nombreComercial" = $1,
           "razonSocial" = $2,
           telefono = $3,
           correo = $4,
           nit = $5,
           estado = $6,
           direccion = $7
       WHERE id = $8
       RETURNING *`,
      [nombreComercial.trim(), razonSocial.trim(), telefono.trim(),
       correo.trim(), nit.trim(), estado, direccion.trim(), req.params.id]
    );

    if (resultado.rows.length === 0) {
      return res.status(404).json({ mensaje: 'Empresa no encontrada.' });
    }

    res.json(resultado.rows[0]);
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ mensaje: 'Ese correo ya está registrado.' });
    }

    console.error(error);
    res.status(500).json({ mensaje: 'Error al actualizar la empresa.' });
  }
});

app.delete('/api/empresas/:id', async (req, res) => {
  try {
    const resultado = await pool.query(
      'DELETE FROM empresas WHERE id = $1 RETURNING id',
      [req.params.id]
    );

    if (resultado.rows.length === 0) {
      return res.status(404).json({ mensaje: 'Empresa no encontrada.' });
    }

    res.status(204).end();
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al eliminar la empresa.' });
  }
});

async function iniciarServidor() {
  try {
    await inicializarBaseDatos();

    app.listen(PORT, () => {
      console.log(`API disponible en el puerto ${PORT}`);
    });
  } catch (error) {
    console.error('No se pudo iniciar la API:', error);
    process.exit(1);
  }
}

iniciarServidor();
