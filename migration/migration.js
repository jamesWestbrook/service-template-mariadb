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
        //behaves as finally
        .then(() => {
            if (client) { 
                client.end() 
            }
        })
        .catch(err => handleError(err)) //feels like java
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
            migrationFiles.push({ name: fileName, checksum: cs(file), content: file })
        })

        migrationFiles =  _.sortBy(migrationFiles, (f) => {
            console.log('\n * '+f.name)
                return f.name
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
                    } else {
                        resolve()
                    }

                })
                .catch(err => handleError(err))
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

                if (rows.length === 1) {
                    console.log('\nexisting migration schema found')
                    resovle(true)
                } else {
                    console.log('\nno migration schema found')
                    resovle(false)
                }

            }
        )
    })
}

const createSchema = (client) => {

    console.log('creating new migration schema')

    return new Promise((resovle) => {
         client.query(sql.createSchema, (err) => { if (err) { throw err }})
    })
}

const gatherMigrationFilesFromDb = (client) => {
    return new Promise((resolve, reject) => {
        client.query(sql.readSchema, null, { useArray: false, metadata: false }, 
            (err, rows) => {
            
                if (err) {
                    throw err
                }

                resolve(rows)
            }
        )
    })
}

//TODO comparison can be done by a stricter query and compairing record counts
const compareFilesToDb = (fromDb, fromFs) => {

    return new Promise((resolve, reject) => {

        console.log('comparting migration files to historical migration data')

        //comparison
        for (i = 0; i < fromDb.length; i++) {
            dbRecord = fromDb[i]
            fsRecord = fromFs[i]

            if (dbRecord.file_name !== fsRecord.name
                || dbRecord.checksum != fsRecord.checksum) {
                reject(createMismatchMessage(dbRecord, fsRecord))
            } else {
                console.log('record (',i+1,'/',fromDb.length,') match')
            }
        }

        //resolves with new files to be migrated
        if (fromFs.length > fromDb.length) {
            console.log('new files found for migration!')
            resolve(fromFs.splice(fromDb.length))
        }

        //nothing needs to be migrated
        console.log('nothing needs migrating...')
        resolve()
    })
}

const executeNewMigration = (newFiles, client) => {
    return new Promise((resolve, reject) => {

        console.log('migration executing...')

        newFiles.forEach((file) => {
            client.query(file.content, (err) => { if (err) { throw err }})
        })

        resolve(newFiles)
    })
}

const recordNewMigration = (newFiles, client) => {
    return new Promise((resolve, reject) => {

        console.log('recording newly migrated files...')

        newFiles.forEach((file) => {
            client.query(sql.writeToSchema, { name: file.name, checksum: file.checksum }, handleError)
        })

        resolve()
    })
}

const handleError = (err) => {

    if (err) {
        console.log('something went wrong...')
        console.log(err)
        throw err
    }
}

const createMismatchMessage = (dbRecord, fsRecord) => {

    return  'a migration file appears to have changed... cannot proceed with migration\n' +
    'DB Record: ' + dbRecord.file_name + ' - ' + dbRecord.checksum + '\n' +
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
    migrate: migrate
}



