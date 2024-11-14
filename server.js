const express = require('express')
const app = express()
const pg = require('pg')
const client = new pg.Client(
  process.env.DATABASE_URL || 'postgres://localhost/acme_notes_categories_db'
)
const port = process.env.PORT || 3000

app.use(express.json())
app.use(require('morgan')('dev'))


app.get('/api/employees', async (req, res, next) => {
    try {
      const SQL = `
        SELECT * from employees
      `
      const response = await client.query(SQL)
      res.send(response.rows)
    } catch (err) {
      next(err)
    }
  })
  
  app.get('/api/departments', async (req, res, next) => {
    try {
      const SQL = `
        SELECT * from departments;
      `
      const response = await client.query(SQL)
      res.send(response.rows)
    } catch (err) {
      next(err)
    }
  })
  
  app.post('/api/employees', async (req, res, next) => {
    try {
      const SQL = `
        INSERT INTO employees(name, department_id)
        VALUES($1, $2)
        RETURNING *
      `
      const response = await client.query(SQL, [req.body.name, req.body.department_id])
      res.send(response.rows[0])
    } catch (err) {
      next(err)
    }
  })
  
  
  app.delete('/api/employees/:id', async (req, res, next) => {
    try {
      const SQL = `
        DELETE from employees
        WHERE id = $1
      `
      const response = await client.query(SQL, [req.params.id])
      res.sendStatus(204)
    } catch (err) {
      next(err)
    }
  })

  app.put('/api/employees/:id', async (req, res, next) => {
    try {
      const SQL = `
        UPDATE employees
        SET name=$1, department_id=$2, updated_at= now()
        WHERE id=$3 RETURNING *
      `
      const response = await client.query(SQL, [
        req.body.name,
        req.body.department_id,
        req.params.id
      ])
      res.send(response.rows[0])
    } catch (err) {
      next(err)
    }
  })
  app.use((err, req, res, next) => {
    res.status(500).json({ error: err.message });
  });
  
  const init = async () => {
    await client.connect()
    let SQL = `
      DROP TABLE IF EXISTS employees;
      DROP TABLE IF EXISTS departments;
      CREATE TABLE departments(
        id SERIAL PRIMARY KEY,
        name VARCHAR(100)
      );
      CREATE TABLE employees(
        id SERIAL PRIMARY KEY,
        name VARCHAR(100),
        created_at TIMESTAMP DEFAULT now(),
        updated_at TIMESTAMP DEFAULT now(),
        department_id INTEGER REFERENCES departments(id) NOT NULL
      );
    `
    await client.query(SQL)
    console.log('tables created')
    SQL = `
      INSERT INTO departments(name) VALUES('Customer Service');
      INSERT INTO departments(name) VALUES('Finance');
      INSERT INTO departments(name) VALUES('Research and development');
      INSERT INTO employees(name, department_id) VALUES('Tim', (SELECT id FROM departments WHERE name='Customer Service'));
      INSERT INTO employees(name, department_id) VALUES('Jim', (SELECT id FROM departments WHERE name='Finance'));
      INSERT INTO employees(name, department_id) VALUES('John', (SELECT id FROM departments WHERE name='Research and development'));
      INSERT INTO employees(name, department_id) VALUES('James', (SELECT id FROM departments WHERE name='Research and development'));
      INSERT INTO employees(name, department_id) VALUES('Clark', (SELECT id FROM departments WHERE name='Customer Service'));
    `
    await client.query(SQL)
    console.log('data seeded')
    app.listen(port, () => console.log(`listening on port ${port}`))
  }
  
  init()