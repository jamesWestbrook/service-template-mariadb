const fs = require('fs')
const cs = require('checksum')
const _ = require('lodash')
const Client = require('mariasql')
const sql = require('./sql')

const migrate = (dbInfo, migrationDirectory) => {

    return openConnection(dbInfo)
    .then(client => {
        //return nested promise, otherwise things execute out of order
        return gatherMigrationFilesFromFs(migrationDirectory)
        .then(fromFs => doMigration(fromFs, client, dbInfo))
        .catch(err => handleError(err))
        .then(() => {
            if (client) { 
                client.end() 
            }
        })
    })
    .catch(err => handleError(err))
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
            migrationFiles.push({ fileName: fileName, checksum: cs(file), content: file })
        })

        migrationFiles =  _.sortBy(migrationFiles, (f) => {
            console.log('\n * '+f.fileName)
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

const doMigration = (fromFs, client, dbInfo) => {

    return new Promise((resolve, reject) => {
        checkForSchemaTable(client, dbInfo.name)
        .then(schemaExists => {

            if (schemaExists) {
                gatherMigrationFilesFromDb(client)
                .then(fromDb => compareFilesToDb(fromDb, fromFs))
                .then(newFiles => {

                    if (newFiles) {
                        executeNewMigration(newFiles, client)
                        .then(recordNewMigration(newFiles, client))
                        .then(resolve())
                        .catch(err => handleError(err))
                    }

                })
                .catch(err => handleError)
            }

            else {
                createSchema(client)
                .then(executeNewMigration(fromFs, client))
                .then(recordNewMigration(fromFs, client))
                .then(resolve())
                .catch(err => handleError(err))
            }
        })
        .catch(err => handleError(err))

    })

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

        for (i = 0; i < fromDb.length; i++) {
            dbRecord = fromDb[i]
            fsRecord = fromFs[i]

            if (dbRecord.name !== fsRecord.name
                || dbRecord.checksum != fsRecord.checksum) {
                reject(createMismatchMessage(dbRecord, fsRecord))
            }
        }

        //resolves with new files to be migrated
        if (fromFs.length > fromDb.length) {
            resolve(fromFs.splice(fromDb.length))
        }

        //when nothing needs to be migrated
        resolve(undefined)
    })
}

const executeNewMigration = (newFiles, client) => {
    return new Promise((resolve, reject) => {

        console.log('migration executing...')

        newFiles.forEach((file) => {
            client.query(file.content, (err, rows) => {

                if(err) {
                    reject(err)
                }

            })
        })

        resolve(newFiles)
    })
}

const recordNewMigration = (newFiles, client) => {
    return new Promise((resolve, reject) => {

        console.log('recording migration...')

        resolve(newFiles)        
    })
}

const handleError = (err) => {
    console.log('something went wrong...\n')
    console.log(err)
    throw err
}

const createMismatchMessage = (dbRecord, fsRecord) => {
    return  'a migration file appears to have changed... cannot proceed with migration\n' +
    'DB Record: ' + dbRecord.name + ' - ' + dbRecord.checksum + '\n' +
    'FS Record: ' + fsRecord.name + ' - ' + fsRecord.checksum
}

const openConnection = (dbInfo) => {
    return new Promise((resolve, reject) => {
        
        let client = new Client({
            host: dbInfo.host,
            user: dbInfo.user,
            password: dbInfo.password,
            db: dbInfo.name
        })

        resolve(client)

    })
}

module.exports = {
    migrate     : migrate
}



