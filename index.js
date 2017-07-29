const express = require('express')
const client = require('./db/client')

const app = express()

app.get('/', (req, res) => {

    let c = client.connect('test')

    c.query('SHOW DATABASES', (err, rows) => {
        if (err) {
            throw err;
        }

        res.send(rows)
    })

    c.end()

})

app.listen(3000, () => {
    console.log('app listening on port 3000')
})