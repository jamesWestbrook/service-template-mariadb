const express = require('express')
const migration = require('./migration/migration')
const app = express()



let init = () => {

    //replace with env vars
    let dbInfo = {
        host:       '127.0.0.1',
        user:       'foo',
        password:   '',
        name:     'test'
    }

    //replace with env vars
    let migrationDirectory = './tmp'

    migration.migrate(dbInfo, migrationDirectory)
    .then(() => {
        let port = 3000

        app.listen(port, () => {
            console.log('app listening on port ', port)
        })
    })
    .catch(err => {
        console.log(err)
    })
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







