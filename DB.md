## Example Usage

Here is how you can use the improved `CreateDB` class to create tables, create indices, and perform other database operations:

```typescript
import { CreateDB, DatabaseError } from './path/to/your/module'

try {
  // Create a database instance with WAL mode enabled
  const db = new CreateDB('example', true)

  // Set the table to 'urls'
  db.setTable('urls')

  // Create a table with indices
  db.createTable(
    'id INTEGER PRIMARY KEY AUTOINCREMENT, url TEXT NOT NULL UNIQUE, data TEXT, title TEXT, status INTEGER, timestamp DATETIME DEFAULT CURRENT_TIMESTAMP',
    [
      { name: 'INX_urls_status', columns: 'status' },
      { name: 'INX_urls_timestamp', columns: 'timestamp' },
      { name: 'INX_urls_status_timestamp', columns: 'status, timestamp' } // Example of a composite index
    ]
  )

  // Create single-column index
  db.createIndex('INX_urls_status', 'status')

  // Create composite index
  db.createIndex('INX_urls_status_timestamp', 'status, timestamp')

  // Insert a single record
  const insertedRow = db.insert({ url: 'https://example.com', data: 'Example data', title: 'Example', status: 1 })
  console.log('Inserted row:', insertedRow)

  // Bulk insert records
  const insertedRows = db.bulkInsert([
    { url: 'https://example.org', data: 'Example data org', title: 'Example Org', status: 2 },
    { url: 'https://example.net', data: 'Example data net', title: 'Example Net', status: 3 }
  ])
  console.log('Inserted rows:', insertedRows)

  // Select data
  const urls = db.select({ condition: 'status > ?', params: [1], orderBy: 'timestamp DESC' })
  console.log('URLs with status > 1:', urls)

  // Update data
  db.update({ status: 4 }, 'url = ?', ['https://example.com'])

  // Delete data
  db.delete('status < ?', [3])

  // Use transactions for multi-step operations
  db.beginTransaction()
  try {
    db.insert({ url: 'https://example.io', data: 'Example data io', title: 'Example IO', status: 5 })
    db.insert({ url: 'https://example.dev', data: 'Example data dev', title: 'Example Dev', status: 6 })
    db.commitTransaction()
  } catch (error) {
    console.error('Transaction error:', error)
    db.rollbackTransaction()
  }

  // Set PRAGMA
  db.setPragma('cache_size', 10000)

  // Execute a raw SQL command
  db.exec('VACUUM')

  // Close the database
  db.close()

} catch (error) {
  if (error instanceof DatabaseError) {
    console.error('Database error:', error.message)
  } else {
    console.error('Unexpected error:', error)
  }
}
```

### Detailed Explanation:

1. **Creating a Database Instance**:
   ```typescript
   const db = new CreateDB('example', true)
   ```
   Creates a database named `example.db` and enables Write-Ahead Logging (WAL) mode.

2. **Setting the Table**:
   ```typescript
   db.setTable('urls')
   ```
   Sets the current table to `urls`.

3. **Creating a Table with Indices**:
   ```typescript
   db.createTable(
     'id INTEGER PRIMARY KEY AUTOINCREMENT, url TEXT NOT NULL UNIQUE, data TEXT, title TEXT, status INTEGER, timestamp DATETIME DEFAULT CURRENT_TIMESTAMP',
     [
       { name: 'INX_urls_status', columns: 'status' },
       { name: 'INX_urls_timestamp', columns: 'timestamp' },
       { name: 'INX_urls_status_timestamp', columns: 'status, timestamp' } // Example of a composite index
     ]
   )
   ```
   Creates a table named `urls` with columns `id`, `url`, `data`, `title`, `status`, and `timestamp`. It also creates indices on `status`, `timestamp`, and a composite index on `status, timestamp`.

4. **Creating Single-Column Index**:
   ```typescript
   db.createIndex('INX_urls_status', 'status')
   ```
   Creates an index on the `status` column of the `urls` table.

5. **Creating Composite Index**:
   ```typescript
   db.createIndex('INX_urls_status_timestamp', 'status, timestamp')
   ```
   Creates a composite index on the `status` and `timestamp` columns of the `urls` table.

6. **Inserting a Single Record**:
   ```typescript
   const insertedRow = db.insert({ url: 'https://example.com', data: 'Example data', title: 'Example', status: 1 })
   console.log('Inserted row:', insertedRow)
   ```
   Inserts a single record into the `urls` table and logs the inserted row.

7. **Bulk Inserting Records**:
   ```typescript
   const insertedRows = db.bulkInsert([
     { url: 'https://example.org', data: 'Example data org', title: 'Example Org', status: 2 },
     { url: 'https://example.net', data: 'Example data net', title: 'Example Net', status: 3 }
   ])
   console.log('Inserted rows:', insertedRows)
   ```
   Bulk inserts multiple records into the `urls` table and logs the inserted rows.

8. **Selecting Data**:
   ```typescript
   const urls = db.select({ condition: 'status > ?', params: [1], orderBy: 'timestamp DESC' })
   console.log('URLs with status > 1:', urls)
   ```
   Selects records from the `urls` table where `status` is greater than 1, ordered by `timestamp` in descending order, and logs the results.

9. **Updating Data**:
   ```typescript
   db.update({ status: 4 }, 'url = ?', ['https://example.com'])
   ```
   Updates the `status` of the record where `url` is `'https://example.com'`.

10. **Deleting Data**:
    ```typescript
    db.delete('status < ?', [3])
    ```
    Deletes records from the `urls` table where `status` is less than 3.

11. **Using Transactions for Multi-Step Operations**:
    ```typescript
    db.beginTransaction()
    try {
      db.insert({ url: 'https://example.io', data: 'Example data io', title: 'Example IO', status: 5 })
      db.insert({ url: 'https://example.dev', data: 'Example data dev', title: 'Example Dev', status: 6 })
      db.commitTransaction()
    } catch (error) {
      console.error('Transaction error:', error)
      db.rollbackTransaction()
    }
    ```
    Uses transactions to insert multiple records. If an error occurs, the transaction is rolled back.

12. **Setting PRAGMA**:
    ```typescript
    db.setPragma('cache_size', 10000)
    ```
    Sets the SQLite cache size to 10000.

13. **Executing a Raw SQL Command**:
    ```typescript
    db.exec('VACUUM')
    ```
    Executes a raw SQL command to optimize the database.

14. **Closing the Database**:
    ```typescript
    db.close()
    ```
    Closes the database connection.