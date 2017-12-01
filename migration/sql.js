const createSchema = `CREATE TABLE IF NOT EXISTS schema_version (
    execution_order INT UNSIGNED NOT NULL AUTO_INCREMENT,
    file_name VARCHAR(100) NOT NULL,
    checksum CHAR(40) NOT NULL,
    PRIMARY KEY (execution_order)
)`

const writeToSchema = `INSERT INTO schema_version 
    ( file_name, checksum ) VALUES ( :name, :checksum )`


const readSchema = `SELECT * FROM schema_version ORDER BY execution_order`

const checkForShcemaTable = `SELECT * 
    FROM information_schema.tables 
    WHERE table_schema = :db
    AND table_name = 'schema_version'
    LIMIT 1;`

module.exports = {
    createSchema        : createSchema,
    readSchema          : readSchema,
    checkForShcemaTable : checkForShcemaTable,
    writeToSchema       : writeToSchema
}