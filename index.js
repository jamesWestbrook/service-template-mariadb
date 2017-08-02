const express = require('express')
const migration = require('./migration/migration')
const client = require('./db/client')

let init = () => {
   migration.migrate('./tmp', { client: client, db: 'test'})
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