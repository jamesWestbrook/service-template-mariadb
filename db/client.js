const Client = require('mariasql')

const connect = (dbName) => {
        return new Client({
        host: '127.0.0.1',
        user: 'foo',
        password: '',
        db: dbName
    })
}

module.exports = { 
    connect: connect
}
