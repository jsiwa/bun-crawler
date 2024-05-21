import { Database } from 'bun:sqlite'

export class DatabaseError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'DatabaseError'
  }
}

export class CreateDB {
  private db: Database
  private tableName: string = ''

  constructor(dbName: string, enableWAL: boolean = false) {
    this.db = new Database(`${dbName}.db`, { create: true })
    if (enableWAL) {
      this.setPragma('journal_mode', 'WAL')
    }
  }

  setTable(tableName: string) {
    this.checkTableName(tableName)
    this.tableName = tableName
    return this
  }

  createTable(fields: string, indices?: { name: string, columns: string }[]) {
    this.hasTableName()
    const createTableSQL = `CREATE TABLE IF NOT EXISTS ${this.tableName} (${fields})`
    this.run(createTableSQL)

    if (indices) {
      for (const index of indices) {
        this.createIndex(index.name, index.columns)
      }
    }

    return this
  }

  createIndex(indexName: string, columnNames: string) {
    this.hasTableName()
    this.checkTableName(indexName)
    this.checkColumnNames(columnNames)
    const createIndexSQL = `CREATE INDEX IF NOT EXISTS ${indexName} ON ${this.tableName} (${columnNames})`
    this.run(createIndexSQL)
    return this
  }

  bulkInsert(data: Record<string, any>[]) {
    this.hasTableName()
    if (data.length === 0) return []

    const keys = Object.keys(data[0])
    const placeholders = keys.map(() => '?').join(', ')
    const columns = keys.join(', ')
    const insertSQL = `INSERT INTO ${this.tableName} (${columns}) VALUES (${placeholders}) RETURNING *`

    const insertedRows: Record<string, any>[] = []

    try {
      this.beginTransaction()
      const statement = this.db.prepare(insertSQL)
      for (const row of data) {
        const insertedRow = statement.get(...Object.values(row)) as Record<string, any>
        insertedRows.push(insertedRow)
      }
      this.commitTransaction()
    } catch (error) {
      this.rollbackTransaction()
      console.error('Error executing bulk insert:', error)
      if (error instanceof Error)
        throw new DatabaseError(`Failed to execute bulk insert: ${error.message}`)
      throw error
    }

    return insertedRows
  }

  select(options: { condition?: string, params?: any[], orderBy?: string, limit?: number, offset?: number } = {}) {
    this.hasTableName()
    let querySQL = `SELECT * FROM ${this.tableName}`
    const { condition, params = [], offset } = options
    const limit = this.checkPositiveInteger(options.limit || 20)
    const orderBy = this.checkOrderBy(options.orderBy)

    if (condition) {
      this.sanitizeCondition(condition)
      querySQL += ` WHERE ${condition}`
    }
    if (orderBy) {
      querySQL += ` ORDER BY ${orderBy}`
    }
    querySQL += ` LIMIT ${limit}`
    if (offset !== undefined) {
      querySQL += ` OFFSET ${this.checkPositiveInteger(offset)}`
    }

    return this.all(querySQL, params)
  }

  insert(data: Record<string, any>) {
    this.hasTableName()
    const keys = Object.keys(data)
    const placeholders = keys.map(() => '?').join(', ')
    const columns = keys.join(', ')
    const values = Object.values(data)

    const insertSQL = `INSERT INTO ${this.tableName} (${columns}) VALUES (${placeholders}) RETURNING *`
    const insertedRow = this.runReturning(insertSQL, values)

    return insertedRow
  }

  count(condition?: string, params: any[] = []): number {
    this.hasTableName()
    let countSQL = `SELECT COUNT(*) as count FROM ${this.tableName}`
    if (condition) {
      this.sanitizeCondition(condition)
      countSQL += ` WHERE ${condition}`
    }
    const result = this.all(countSQL, params)
    return result[0]?.count || 0
  }

  update(data: Record<string, any>, condition: string, params: any[] = []) {
    this.hasTableName()
    if (!condition) {
      throw new DatabaseError('Update operation requires a condition to avoid updating all rows.')
    }
    this.sanitizeCondition(condition)

    const keys = Object.keys(data)
    const setClause = keys.map(key => `${key} = ?`).join(', ')
    const values = Object.values(data)

    let updateSQL = `UPDATE ${this.tableName} SET ${setClause}`
    updateSQL += ` WHERE ${condition}`

    this.run(updateSQL, [...values, ...params])
    return this
  }

  delete(condition: string, params: any[] = []) {
    this.hasTableName()
    if (!condition) {
      throw new DatabaseError('Delete operation requires a condition to avoid deleting all rows.')
    }
    this.sanitizeCondition(condition)

    let deleteSQL = `DELETE FROM ${this.tableName}`
    deleteSQL += ` WHERE ${condition}`

    this.run(deleteSQL, params)
    return this
  }

  exec(sql: string, params: any[] = []) {
    this.run(sql, params)
  }

  private run(sql: string, params: any[] = []) {
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

  private runReturning(sql: string, params: any[] = []) {
    try {
      const statement = this.db.prepare(sql)
      const result = statement.get(...params) as Record<string, any>
      return result
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
      const results = statement.all(...params)
      return results
    } catch (error) {
      console.error('Error executing query:', error)
      if (error instanceof Error)
        throw new DatabaseError(`Failed to execute query: ${error.message}`)
      throw error
    }
  }

  beginTransaction() {
    this.run('BEGIN TRANSACTION')
    return this
  }

  commitTransaction() {
    this.run('COMMIT')
    return this
  }

  rollbackTransaction() {
    this.run('ROLLBACK')
    return this
  }

  setPragma(pragma: string, value: string | number) {
    this.run(`PRAGMA ${pragma} = ${value}`)
    return this
  }

  close() {
    this.db.close()
  }

  private hasTableName() {
    if (!this.tableName) {
      throw new DatabaseError('Table name must be set before performing this operation.')
    }
  }

  private checkTableName(tableName: string) {
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(tableName)) {
      throw new DatabaseError(`Invalid table name: ${tableName}`)
    }
  }

  private checkColumnNames(columnNames: string) {
    const columns = columnNames.split(',').map(col => col.trim())
    for (const col of columns) {
      if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(col)) {
        throw new DatabaseError(`Invalid column name: ${col}`)
      }
    }
  }

  private checkOrderBy(orderBy?: string) {
    if (!orderBy) return undefined
    const orderRegex = /^[a-zA-Z_][a-zA-Z0-9_]*(\s+(ASC|DESC))?$/i
    if (!orderRegex.test(orderBy)) {
      throw new DatabaseError(`Invalid order by clause: ${orderBy}`)
    }
    return orderBy
  }

  private sanitizeCondition(condition: string) {
    const forbiddenKeywords = [
      'DROP', 'TRUNCATE', 'INSERT', 'UPDATE', 'DELETE',
      '--', ';', '\\/\\*', '\\*\\/', 'xp_'
    ]

    // Check for forbidden keywords using specific regex patterns to avoid false positives
    for (const keyword of forbiddenKeywords) {
      const regex = new RegExp(keyword, 'gi')
      if (regex.test(condition)) {
        console.log(`Found forbidden keyword: ${keyword} in condition: ${condition}`)
        throw new DatabaseError(`Invalid condition containing forbidden keyword: ${keyword}`)
      }
    }

    // Check for consecutive special characters (excluding spaces)
    const specialCharsPattern = /[=><!'"]{2,}/
    if (specialCharsPattern.test(condition)) {
      throw new DatabaseError(`Invalid condition format with consecutive special characters`)
    }
  }

  private checkPositiveInteger(value: any) {
    const parsed = Number(value)
    if (!Number.isInteger(parsed) || parsed <= 0) {
      throw new DatabaseError(`Invalid positive integer: ${value}`)
    }
    return parsed
  }

  // Helper Methods

  public findById(id: number) {
    this.hasTableName()
    const query = `SELECT * FROM ${this.tableName} WHERE id = ?`
    const result = this.runReturning(query, [this.checkPositiveInteger(id)])
    return result
  }

  public findMany(page: number, limit: number, orderBy?: string) {
    this.hasTableName()
    const offset = (this.checkPositiveInteger(page) - 1) * this.checkPositiveInteger(limit)
    const orderClause = this.checkOrderBy(orderBy) || ''
    let query = `SELECT * FROM ${this.tableName} LIMIT ? OFFSET ?`
    if (orderClause) {
      query += ` ORDER BY ${orderClause}`
    }
    return this.all(query, [limit, offset])
  }

  public renameTable(newTableName: string) {
    this.hasTableName()
    this.checkTableName(newTableName)
    const renameTableSQL = `ALTER TABLE ${this.tableName} RENAME TO ${newTableName}`
    this.run(renameTableSQL)
    this.tableName = newTableName
    return this
  }

  public getAllTables() {
    const stmt = this.db.prepare("SELECT name FROM sqlite_master WHERE type='table';")
    const tables = stmt.all().map(row => (row as { name: string }).name)
    return tables
  }

  public getTableCreationSQL(tableName: string) {
    this.checkTableName(tableName)
    const stmt = this.db.prepare(`SELECT sql FROM sqlite_master WHERE type='table' AND name=?;`)
    const result = stmt.get(tableName) as { sql: string } | undefined
    const createSQL = result ? result.sql : `No table named ${tableName}`
    return createSQL
  }
}
