import { Database } from 'bun:sqlite'

class DatabaseError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'DatabaseError'
  }
}

export class CreateDB {
  private db: Database

  constructor(dbName: string, enableWAL: boolean = false) {
    this.db = new Database(`${dbName}.db`, { create: true })
    if (enableWAL) {
      this.db.exec('PRAGMA journal_mode = WAL;')
    }
  }

  createTable(tableName: string, fields: string): this {
    const createTableSQL = `CREATE TABLE IF NOT EXISTS ${tableName} (${fields})`
    try {
      this.db.exec(createTableSQL)
    } catch (error) {
      console.error('Error creating table:', error)
      if (error instanceof Error)
        throw new DatabaseError(`Failed to create table ${tableName}: ${error.message}`)
      throw error
    }
    return this
  }

  insert(tableName: string, data: Record<string, any>): this {
    const keys = Object.keys(data)
    const placeholders = keys.map(() => '?').join(', ')
    const columns = keys.join(', ')
    const values = Object.values(data)

    const insertSQL = `INSERT INTO ${tableName} (${columns}) VALUES (${placeholders})`
    this.run(insertSQL, values)
    return this
  }

  select(
    tableName: string,
    options: { condition?: string, params?: any[], limit?: number, offset?: number } = {}
  ): any[] {
    let querySQL = `SELECT * FROM ${tableName}`
    const { condition, params = [], limit, offset } = options

    if (condition) {
      querySQL += ` WHERE ${condition}`
    }
    if (limit !== undefined) {
      querySQL += ` LIMIT ${limit}`
    }
    if (offset !== undefined) {
      querySQL += ` OFFSET ${offset}`
    }

    return this.all(querySQL, params)
  }

  update(
    tableName: string,
    data: Record<string, any>,
    condition?: string,
    params: any[] = []
  ): this {
    const keys = Object.keys(data)
    const setClause = keys.map(key => `${key} = ?`).join(', ')
    const values = Object.values(data)

    let updateSQL = `UPDATE ${tableName} SET ${setClause}`
    if (condition) {
      updateSQL += ` WHERE ${condition}`
    }
    this.run(updateSQL, [...values, ...params])
    return this
  }

  delete(tableName: string, condition?: string, params: any[] = []): this {
    let deleteSQL = `DELETE FROM ${tableName}`
    if (condition) {
      deleteSQL += ` WHERE ${condition}`
    }
    this.run(deleteSQL, params)
    return this
  }

  exec(sql: string, params: any[] = []): void {
    this.run(sql, params)
  }

  private run(sql: string, params: any[] = []): void {
    try {
      const statement = this.db.prepare(sql)
      statement.run(...params)
    } catch (error) {
      console.error('Error executing query:', error)
      if (error instanceof Error)
        throw new DatabaseError(`Failed to execute query: ${error.message}`)
      throw error
    }
  }

  private all(sql: string, params: any[] = []): any[] {
    try {
      const statement = this.db.prepare(sql)
      return statement.all(...params)
    } catch (error) {
      console.error('Error executing query:', error)
      if (error instanceof Error)
        throw new DatabaseError(`Failed to execute query: ${error.message}`)
      throw error
    }
  }

  close(): void {
    this.db.close()
  }
}
