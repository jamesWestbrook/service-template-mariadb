const express = require('express')
const migration = require('./migration/migration')
const Client = require('mariasql')

let init = () => {

    dbName = 'test'

    let client = new Client({
        host: '127.0.0.1',
        user: 'foo',
        password: '',
        db: dbName        
    })

    migration.migrate('./tmp', client, dbName)

    client.end()
}

init()

// const app = express()

// app.get('/', (req, res) => {

//     let c = client.connect('test')

//     c.query('SHOW DATABASES', (err, rows) => {
//         if (err) {
//             throw err;
//         }

//         res.send(rows)
//     })

//     c.end()

// })

// app.listen(3000, () => {
//     console.log('app listening on port 3000')
// })