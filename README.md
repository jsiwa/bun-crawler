# bun-scrapy

## Crawler simple example
```TypeScript
const crawler = new Crawler(3)
  .setProxy(["http://proxy1.com", "http://proxy2.com"])
  .setRetries(3)
  .beforeRequest(async (url) => {
    console.log(`Checking if request should proceed for: ${url}`)
    // Implement logic that might check a database, cache, or conditions
    return true;  // Return false to skip fetching this URL
  })
  .onError((error, url) => console.error(`Failed to fetch ${url}: ${error.message}`))
  .onItemProcess((html, url) => console.log(`Title from ${url}: ${html.match(/<title>(.*?)<\/title>/i)[1]}`))
  .onEnd(() => console.log("All crawling tasks completed."))
  .addTask("https://example.com")
  .addTask("https://example.org")
  .start();

setTimeout(() => crawler.stop(), 10000)  // Optional: stop after 10 seconds

```

## Crawler example
```TypeScript
import Crawler from "./crawler"
import { CreateDB } from "./db"
import { load } from "cheerio"
import { sleep } from 'bun'
import { isUrl } from './utils'

const tableName = 'site'
const db = new CreateDB('example', true)
db.setTable(tableName)
db.createTable('id INTEGER PRIMARY KEY AUTOINCREMENT,url TEXT NOT NULL UNIQUE,data TEXT,status TEXT,timestamp DATETIME DEFAULT CURRENT_TIMESTAMP')

const crawler = new Crawler(3)
  .addTask('https://example.com')
  .setProxy('http://user:password@proxyhost:port')
  .onError((error, url) => {
    console.error(error)
    try {
      db.insert({
        url,
        status: 'false'
      })
    } catch (e) { console.error(e) }
  })
  .onItemProcess(async (html, url) => {
    const remainingTasks = crawler.getTaskCount()
    console.log(`Crawling: ${url}, reamining tasks: ${remainingTasks}`)
    try {
      db.insert({
        url,
        status: 'success',
        data: html
      })
    } catch (e) { console.error(e) }
    const $ = load(html)
    $('a').each((_, el) => {
      const link = $(el).attr('href')
      if (link && isUrl(link)) {
        const item = db.select({
          condition: 'url = ?',
          params: [link]
        })
        if (item.length === 0) {
          crawler.addTask(link)
        }
      }
    })
    if (remainingTasks === 0) {
      crawler.stop()
      await sleep(1000)
      crawler.start()
    }
  })
  .start()
```

## setCookies and setHeaders
```TypeScript
const crawler = new Crawler(5);
crawler.setCookies('sessionid=abc123; secure')
crawler.setHeaders({
  'User-Agent': 'Mozilla/5.0',
  'Accept-Language': 'en-US,en;q=0.9',
});
crawler.addTask('https://example.com')
crawler.start()

```

## sqlite Serve example
```TypeScript
import { CreateDB } from "./db"

const db = new CreateDB('example')
const tableName = 'sites'

const server = Bun.serve({
  port: 5000,
  fetch(request) {
    const url = request.url
    const o = new URL(url).searchParams
    const pageNum = Number(o.get('pageNum')) || 1
    const pageSize = Number(o.get('pageSize')) || 20

    const list = db.select({
      condition: 'status = ? ORDER BY ID DESC',
      params: [1],
      offset: pageSize * (pageNum - 1),
      limit: pageSize
    })
    return new Response(JSON.stringify({
      pageNum,
      pageSize,
      list
    }, null, 2))
  },
})

console.log(`Listening on localhost:${server.port}`)
```

## db example
```TypeScript
// Example usage
const db = new CreateDB('example')
  .createTable('users', 'id INTEGER PRIMARY KEY, name TEXT, age INTEGER')
  .insert('users', { name: 'John Doe', age: 30 })
  .update('users', { name: 'Jane Doe' }, 'id = ?', [1])

// Using the new select method with options
const users = db.select({ condition: 'id > ?', params: [1] })
console.log(users)

// Using the exec method to run a custom query
db.exec('DELETE FROM users WHERE id = ?', [2])

db.close()
```
