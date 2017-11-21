const fs = require('fs')
const cs = require('checksum')
const _ = require('lodash')
const sql = require('./sql')

const migrate = (directory, client, databaseName) => {

    //gather migration files
    //if no migration files exist error out
    gatherMigrationFilesFromFs(directory)
    .then((migrationFiles) => {

        //read for schema table
        checkForSchemaTable(client, databaseName)
        .then(
            (result) => {

                console.log(result)

                //if table does exist, read it and compare migration data 
                // if(result) {

                // } 

                // //if it does not exist, create it and write migration data
                // else {

                // }
            })
        .catch(error => {
            console.error(error)
        })

    })
    .catch(error => {
        console.error(error)
    })
}

const checkForSchemaTable = (client, databaseName) => {

    return new Promise((resovle, reject) => {

        client.query(
            sql.checkForShcemaTable, 
            { db: databaseName },
            (err, rows) => {
                resovle(rows.length === 1)
            }
        )

        
    })
}

const createSchemaIfNotExist = (client) => {
    return new Promise((resovle) => {
         client.query(sql.createSchema, handleNoResultErr)
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

const compareFilesToDb = (fromDB, fromFs) => {

    if (fromDb.name !== fromFile.name) {
        throw 'previous migration files have been removed or renamed. expected' + 
        fromDb.name + ' to equal ' + fromFile.name
    }

    if (fromDb.checksum !== fromFile.checksum) {
        throw 'previous migration files have been removed or modified. expected checksum from' + 
        fromDb.name + '('+ fromDb.checksum +')' + ' to equal ' + 
        fromFile.name + '('+ fromFile.checksum +')'
    }
}

const handleNoResultErr = (err) => {
     if (err) {
        console.error(err)
    }   
}

module.exports = {
    migrate: migrate
}



