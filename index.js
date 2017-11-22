const express = require('express')
const migration = require('./migration/migration')
const Client = require('mariasql')
const app = express()

let init = () => {

    dbName = 'test'

    let client = new Client({
        host: '127.0.0.1',
        user: 'foo',
        password: '',
        db: dbName        
    })

    migration.migrate('./tmp', client, dbName)
    .then(() => {
        console.log('done with migration')
        console.log('starting app')

        app.listen(3000, () => {
            console.log('app listening on port 3000')
        })

        client.end()
    })        
    .catch(err => { console.error(err)})
}

app.get('/', (req, res) => {

    res.send('hello')

    // let c = client.connect('test')

    // c.query('SHOW DATABASES', (err, rows) => {
    //     if (err) {
    //         throw err;
    //     }

    //     res.send(rows)
    // })

    // c.end()
})

init()







