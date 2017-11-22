const fs = require('fs')
const cs = require('checksum')
const _ = require('lodash')
const sql = require('./sql')

const migrate = (directory, client, databaseName) => {

    return gatherMigrationFilesFromFs(directory)
    .then((fromFs) => {

        return checkForSchemaTable(client, databaseName)
        .then((schemaExists) => {

            if (schemaExists) {

                gatherMigrationFilesFromDb(client)
                .then(fromDb => compareFilesToDb(fromDb, fromFs))
                .then((results) => {

                    if (results.match && results.newMigration) {
                        writeNewFiles(results)
                        .then(recordNewMigration(results))
                        .catch(err => handleError(err))
                    } 
                })
                .catch(err => handleError(err))
            } 

            else {
                createSchema(client)
            }
        })
        .catch(err => handleError(err))
    })
    .catch(err => handleError(err))

}

const checkForSchemaTable = (client, databaseName) => {

    return new Promise((resovle, reject) => {

        client.query(
            sql.checkForShcemaTable, 
            { db: databaseName },
            (err, rows) => {
                
                if (err) {
                    reject(err)
                }

                resovle(rows.length === 1)
            }
        )

        
    })
}

const createSchema = (client) => {
    return new Promise((resovle) => {
         client.query(sql.createSchema, handleError)
    })
}

const gatherMigrationFilesFromFs = (directory) => {

    return new Promise((resolve, reject) => {

        if (!directory) {
            reject('no migration directory provided to gatherMigrationFilesFromFs(directory)')
        }

        console.log(
            'loading files to migrate...\n',
            'files will be sorted by name\n',
            'executing migration in the following order:'
        )

        let migrationFiles = []

        fs.readdirSync(directory).forEach((fileName) => {        
            let file = fs.readFileSync(directory + '/' + fileName, 'utf8')    
            migrationFiles.push({ fileName: fileName, checksum: cs(file) })
        })

        migrationFiles =  _.sortBy(migrationFiles, (f) => {
            console.log('\t'+f.fileName)
                return f.fileName
            }
        )        

        if(migrationFiles.length > 0) {
            resolve(migrationFiles)    
        } else {
            reject('no migration files found in directory: ' + directory)
        }       
    }) 
}

const gatherMigrationFilesFromDb = (client) => {
    return new Promise((resolve, reject) => {
        client.query(sql.readSchema, null, { useArray: true, metadata: false }, function(err, rows) {
            
            if (err) {
                reject(err)
            }

            resolve(rows)
        });
    })
}

const compareFilesToDb = (fromDb, fromFs) => {

    return new Promise((resolve) => {

        results = {}

        results.match = false

        resolve(results)

    })


    // if (fromDb.name !== fromFs.name) {
    //     throw 'previous migration files have been removed or renamed. expected' + 
    //     fromDb.name + ' to equal ' + fromFs.name
    // }

    // if (fromDb.checksum !== fromFs.checksum) {
    //     throw 'previous migration files have been removed or modified. expected checksum from' + 
    //     fromDb.name + '('+ fromDb.checksum +')' + ' to equal ' + 
    //     fromFs.name + '('+ fromFs.checksum +')'
    // }
}

const handleError = (err) => {
    if (err) {
        console.error(err)
    }
}

module.exports = {
    migrate: migrate
}



