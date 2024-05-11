import { Database } from 'bun:sqlite'

export class CreateDB {
  public db: Database

  constructor(dbName: string, enableWAL: boolean = false) {
    this.db = new Database(`${dbName}.db`, { create: true })
    if (enableWAL) {
      this.db.exec("PRAGMA journal_mode = WAL;")
    }
  }

  public createTable(tableName: string, fields: string): void {
    const createTableSQL = `CREATE TABLE IF NOT EXISTS ${tableName} (${fields})`
    try {
      this.db.exec(createTableSQL)
    } catch (error) {
      console.error("Error creating table:", error)
      throw error // Optionally rethrow or handle error differently
    }
  }

  public insertData(tableName: string, data: Record<string, any>): void {
    const keys = Object.keys(data)
    const values:any[] = keys.map(key => data[key])

    const placeholders = keys.map(() => '?').join(', ')
    const columns = keys.join(', ')

    const insertSQL = `INSERT INTO ${tableName} (${columns}) VALUES (${placeholders})`
    try {
      const statement = this.db.prepare(insertSQL)
      statement.run(...values)
    } catch (error) {
      console.error("Error inserting data:", error)
      throw error; // Optionally rethrow or handle error differently
    }
  }

  public findByCondition(tableName: string, condition: string, params: any[] = [], offset?: number, limit?: number) {
    try {
      let querySQL = `SELECT * FROM ${tableName} WHERE ${condition}`
  
      // Add LIMIT and OFFSET to the query if they are provided
      if (limit !== undefined) {
        querySQL += ` LIMIT ${limit}`
        if (offset !== undefined) {
          querySQL += ` OFFSET ${offset}`
        }
      }
      console.log(querySQL)
      const statement = this.db.prepare(querySQL)
      return statement.all(...params)
    } catch (error) {
      console.error("Error executing query:", error);
      throw error // Optionally rethrow or handle error differently
    }
  }

  public updateData(tableName: string, data: Record<string, any>, condition: string, params: any[]): void {
    // Construct the SQL update statement
    const keys = Object.keys(data)
    const setClause = keys.map(key => `${key} = ?`).join(', ')
    const values: any[] = keys.map(key => data[key]) // Values to set

    const updateSQL = `UPDATE ${tableName} SET ${setClause} WHERE ${condition}`;

    try {
      const statement = this.db.prepare(updateSQL)
      statement.run(...values, ...params) // Combine data values and condition parameters
    } catch (error) {
      console.error("Error updating data:", error)
      throw error; // Optionally rethrow or handle error differently
    }
  }

  public close(): void {
    this.db.close()
  }
}

// Example
// const db = new CreateDB('example')
// db.createTable('users', 'id INTEGER PRIMARY KEY, name TEXT, age INTEGER')
// db.insertData('users', { name: 'John Doe', age: 30 })
// db.updateData('users', { name: 'Jane Doe' }, 'id = ?', [2]) // Update name where id is 1
// const users = db.findByCondition('users', 'id > ?', [1])
// console.log(users)
// db.close()
