```typescript
import { CreateDB, DatabaseError } from './db'

try {
  // Create a database instance with WAL mode enabled
  const db = new CreateDB('example', true)

  // Create a table
  db.createTable('users', 'id INTEGER PRIMARY KEY, name TEXT, age INTEGER')

  // Insert a single record
  db.insert('users', { name: 'Alice', age: 30 })
  db.insert('users', { name: 'Bob', age: 25 })

  // Bulk insert records
  db.bulkInsert('users', [
    { name: 'Charlie', age: 35 },
    { name: 'David', age: 40 },
    { name: 'Eve', age: 28 }
  ])

  // Select data
  const users = db.select('users', { condition: 'age > ?', params: [30], orderBy: 'age DESC' })
  console.log('Users older than 30:', users)

  // Update data
  db.update('users', { age: 29 }, 'name = ?', ['Eve'])

  // Delete data
  db.delete('users', 'age < ?', [30])

  // Use transactions for multi-step operations
  db.beginTransaction()
  try {
    db.insert('users', { name: 'Frank', age: 50 })
    db.insert('users', { name: 'Grace', age: 60 })
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

1. **Create a Database Instance**:
   ```typescript
   const db = new CreateDB('example', true)
   ```
   Creates a database named `example.db` and enables Write-Ahead Logging (WAL) mode.

2. **Create a Table**:
   ```typescript
   db.createTable('users', 'id INTEGER PRIMARY KEY, name TEXT, age INTEGER')
   ```
   Creates a table named `users` with columns `id`, `name`, and `age`.

3. **Insert a Single Record**:
   ```typescript
   db.insert('users', { name: 'Alice', age: 30 })
   db.insert('users', { name: 'Bob', age: 25 })
   ```
   Inserts two user records.

4. **Bulk Insert Records**:
   ```typescript
   db.bulkInsert('users', [
     { name: 'Charlie', age: 35 },
     { name: 'David', age: 40 },
     { name: 'Eve', age: 28 }
   ])
   ```
   Inserts three user records in bulk.

5. **Select Data**:
   ```typescript
   const users = db.select('users', { condition: 'age > ?', params: [30], orderBy: 'age DESC' })
   console.log('Users older than 30:', users)
   ```
   Selects users older than 30, orders by age in descending order, and prints the results.

6. **Update Data**:
   ```typescript
   db.update('users', { age: 29 }, 'name = ?', ['Eve'])
   ```
   Updates the age of the user `Eve` to 29.

7. **Delete Data**:
   ```typescript
   db.delete('users', 'age < ?', [30])
   ```
   Deletes users younger than 30.

8. **Transaction Operations**:
   ```typescript
   db.beginTransaction()
   try {
     db.insert('users', { name: 'Frank', age: 50 })
     db.insert('users', { name: 'Grace', age: 60 })
     db.commitTransaction()
   } catch (error) {
     console.error('Transaction error:', error)
     db.rollbackTransaction()
   }
   ```
   Inserts two records within a transaction. If an error occurs, the transaction is rolled back.

9. **Set PRAGMA**:
   ```typescript
   db.setPragma('cache_size', 10000)
   ```
   Sets the SQLite cache size to 10000.

10. **Close the Database**:
    ```typescript
    db.close()
    ```
    Closes the database connection.