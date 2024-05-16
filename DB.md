## Example Usage

Here is how you can use the improved `CreateDB` class to create tables, create indices, and perform other database operations:

```typescript
import { CreateDB, DatabaseError } from './path/to/your/module'

try {
  // Create a database instance with WAL mode enabled
  const db = new CreateDB('example', true)

  // Create a table with indices
  db.createTable(
    'urls', 
    'id INTEGER PRIMARY KEY AUTOINCREMENT, url TEXT NOT NULL UNIQUE, data TEXT, title TEXT, status INTEGER, timestamp DATETIME DEFAULT CURRENT_TIMESTAMP',
    [
      { name: 'INX_urls_status', columns: 'status' },
      { name: 'INX_urls_timestamp', columns: 'timestamp' },
      { name: 'INX_urls_status_timestamp', columns: 'status, timestamp' } // Example of a composite index
    ]
  )

  // Create single-column index
  db.createIndex('urls', 'INX_urls_status', 'status')

  // Create composite index
  db.createIndex('urls', 'INX_urls_status_timestamp', 'status, timestamp')

  // Insert a single record
  db.insert('urls', { url: 'https://example.com', data: 'Example data', title: 'Example', status: 1 })

  // Bulk insert records
  db.bulkInsert('urls', [
    { url: 'https://example.org', data: 'Example data org', title: 'Example Org', status: 2 },
    { url: 'https://example.net', data: 'Example data net', title: 'Example Net', status: 3 }
  ])

  // Select data
  const urls = db.select('urls', { condition: 'status > ?', params: [1], orderBy: 'timestamp DESC' })
  console.log('URLs with status > 1:', urls)

  // Update data
  db.update('urls', { status: 4 }, 'url = ?', ['https://example.com'])

  // Delete data
  db.delete('urls', 'status < ?', [3])

  // Use transactions for multi-step operations
  db.beginTransaction()
  try {
    db.insert('urls', { url: 'https://example.io', data: 'Example data io', title: 'Example IO', status: 5 })
    db.insert('urls', { url: 'https://example.dev', data: 'Example data dev', title: 'Example Dev', status: 6 })
    db.commitTransaction()
  } catch (error) {
    console.error('Transaction error:', error)
    db.rollbackTransaction()
  }

  // Set PRAGMA
  db.setPragma('cache_size', 10000)

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

2. **Creating a Table with Indices**:
   ```typescript
   db.createTable(
     'urls', 
     'id INTEGER PRIMARY KEY AUTOINCREMENT, url TEXT NOT NULL UNIQUE, data TEXT, title TEXT, status INTEGER, timestamp DATETIME DEFAULT CURRENT_TIMESTAMP',
     [
       { name: 'INX_urls_status', columns: 'status' },
       { name: 'INX_urls_timestamp', columns: 'timestamp' },
       { name: 'INX_urls_status_timestamp', columns: 'status, timestamp' } // Example of a composite index
     ]
   )
   ```
   Creates a table named `urls` with columns `id`, `url`, `data`, `title`, `status`, and `timestamp`. It also creates indices on `status`, `timestamp`, and a composite index on `status, timestamp`.

3. **Inserting a Single Record**:
   ```typescript
   db.insert('urls', { url:

 'https://example.com', data: 'Example data', title: 'Example', status: 1 })
   ```
   Inserts a single record into the `urls` table.

4. **Bulk Inserting Records**:
   ```typescript
   db.bulkInsert('urls', [
     { url: 'https://example.org', data: 'Example data org', title: 'Example Org', status: 2 },
     { url: 'https://example.net', data: 'Example data net', title: 'Example Net', status: 3 }
   ])
   ```
   Bulk inserts multiple records into the `urls` table.

5. **Selecting Data**:
   ```typescript
   const urls = db.select('urls', { condition: 'status > ?', params: [1], orderBy: 'timestamp DESC' })
   console.log('URLs with status > 1:', urls)
   ```
   Selects records from the `urls` table where `status` is greater than 1, ordered by `timestamp` in descending order.

6. **Updating Data**:
   ```typescript
   db.update('urls', { status: 4 }, 'url = ?', ['https://example.com'])
   ```
   Updates the `status` of the record where `url` is `'https://example.com'`.

7. **Deleting Data**:
   ```typescript
   db.delete('urls', 'status < ?', [3])
   ```
   Deletes records from the `urls` table where `status` is less than 3.

8. **Using Transactions for Multi-Step Operations**:
   ```typescript
   db.beginTransaction()
   try {
     db.insert('urls', { url: 'https://example.io', data: 'Example data io', title: 'Example IO', status: 5 })
     db.insert('urls', { url: 'https://example.dev', data: 'Example data dev', title: 'Example Dev', status: 6 })
     db.commitTransaction()
   } catch (error) {
     console.error('Transaction error:', error)
     db.rollbackTransaction()
   }
   ```
   Uses transactions to insert multiple records. If an error occurs, the transaction is rolled back.

9. **Setting PRAGMA**:
   ```typescript
   db.setPragma('cache_size', 10000)
   ```
   Sets the SQLite cache size to 10000.

10. **Closing the Database**:
    ```typescript
    db.close()
    ```
    Closes the database connection.
