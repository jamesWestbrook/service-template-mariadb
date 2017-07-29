const express = require('express')
const Client = require('mariasql')

const app = express()

const c = new Client({
    host: '127.0.0.1',
    user: 'foo',
    password: ''
})


app.get('/', function(req, res) {



    c.query('SHOW DATABASES', function(err, rows) {
        if (err) {
            throw err;
        }

        res.send(rows)
    })


    c.end()

})

app.listen(3000, function() {
    console.log('Example app listening on port 3000!')
})