const express = require('express')
const pg = require('pg')
const client = new pg.Client(process.env.DATABASE_URL || 'postgres://localhost/acme_hr_directory_db')
const app = express()

app.use(express.json())
app.use(require('morgan')('dev'))
//GET departments
app.get('/api/departments', async (req, res, next) => {
    try {
        const SQL = `
        SELECT * from departments
        `
        const response = await client.query(SQL)
        res.send(response.rows)

    } catch(error) {
        next(error)
    }
})

//GET Employees
app.get('/api/employees', async (req, res, next) => {
    try{
        const SQL = `
        SELECT * from employees
        `
        const response = await client.query(SQL)
        res.send(response.rows)

    } catch(error) {
        next(error)
    }
})
//CREATE employee
app.post('/api/employees', async (req, res, next)=>{
    try {
    const SQL = `
    INSERT INTO employees(name, department_id) VALUES($1, $2)
    RETURNING *
    `
    const response = await client.query(SQL, [req.body.name, req.body.department_id])
    res.send(response.rows[0])
    } catch(error) {
        next(error)
    }
})
//UPDATE employees
app.put('/api/employees/:id', async (req, res, next)=>{
    try {
        const SQL = `
        UPDATE employees
        SET name=$1, department_id=$2, updated_at=now()
        WHERE id=$3 RETURNING *
        `
        const response = await client.query(SQL, [req.body.name, req.body.department_id, req.params.id])
        res.send(response.rows[0])

    } catch(error) {
        next(error)
    }
})
//DELETES
app.delete('/api/employees/:id', async (req, res, next) => {
    try {
        const SQL = `
        DELETE from employees
        WHERE id=$1
        `
        const response = await client.query(SQL, [req.params.id])
        res.sendStatus(204)

    } catch (error) {
        next(error)
    }
})
const init = async() => {
    await client.connect()
    console.log('connected to database')
    let SQL = `
        DROP TABLE IF EXISTS employees;
        DROP TABLE IF EXISTS departments;
        CREATE TABLE departments(
            id SERIAL PRIMARY KEY,
            name VARCHAR(255)
        );
        CREATE TABLE employees(
            id SERIAL PRIMARY KEY,
            name VARCHAR(255),
            created_at TIMESTAMP DEFAULT now(),
            updated_at TIMESTAMP DEFAULT now(),
            department_id INTEGER REFERENCES departments(id) NOT NULL
            );
    `
    console.log('tables created')
    await client.query(SQL) 
            SQL = `
            INSERT INTO departments(name) VALUES('HR');
            INSERT INTO departments(name) VALUES('IT');
            INSERT INTO departments(name) VALUES('Creative');
            INSERT INTO departments(name) VALUES('UX');
            INSERT INTO departments(name) VALUES('EHS');
            INSERT INTO employees(name, department_id) VALUES('John', (SELECT id FROM departments WHERE name='IT'));
            INSERT INTO employees(name, department_id) VALUES('Joe', (SELECT id FROM departments WHERE name='UX'));
            INSERT INTO employees(name, department_id) VALUES('Frank', (SELECT id FROM departments WHERE name='EHS'));
            INSERT INTO employees(name, department_id) VALUES('Sarah', (SELECT id FROM departments WHERE name='IT'));
            INSERT INTO employees(name, department_id) VALUES('Diego', (SELECT id FROM departments WHERE name='Creative'));
            INSERT INTO employees(name, department_id) VALUES('Harry', (SELECT id FROM departments WHERE name='HR'));

            `

    await client.query(SQL)
    console.log('data seeded')
    const port = process.env.PORT || 3000
    app.listen(port, () => console.log(`listening on port ${port}`))
    
}
init()