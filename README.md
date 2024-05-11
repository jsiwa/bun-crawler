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

setTimeout(() => crawler.stop(), 10000);  // Optional: stop after 10 seconds

```

## Crawler example
```TypeScript
import Crawler from "./crawler"
import { CreateDB } from "./db"
import { load } from "cheerio"
import { sleep } from 'bun'
import { isUrl } from './utils'

const tableName = 'site'
const db = new CreateDB(tableName, true)
db.createTable(tableName, 'id INTEGER PRIMARY KEY AUTOINCREMENT,url TEXT NOT NULL UNIQUE,data TEXT,status TEXT,timestamp DATETIME DEFAULT CURRENT_TIMESTAMP')

const crawler = new Crawler(3)
  .addTask('https://example.com')
  .setProxy('http://user:password@proxyhost:port')
  .onError((error, url) => {
    console.error(error)
    try {
      db.insertData(tableName, {
        url,
        status: 'false'
      })
    } catch (e) { console.error(e) }
  })
  .onItemProcess(async (html, url) => {
    const remainingTasks = crawler.getTaskCount()
    console.log(`Crawling: ${url}, reamining tasks: ${remainingTasks}`)
    try {
      db.insertData(tableName, {
        url,
        status: 'success',
        data: html
      })
    } catch (e) { console.error(e) }
    const $ = load(html)
    $('a').each((_, el) => {
      const link = $(el).attr('href')
      if (link && isUrl(link)) {
        const item = db.findByCondition(tableName, 'url = ?', [link])
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

    const list = db.findByCondition(tableName, 'status = 0 ORDER BY ID DESC', [], pageSize * (pageNum - 1), pageSize)
    return new Response(JSON.stringify({
      pageNum,
      pageSize,
      list
    }, null, 2))
  },
})

console.log(`Listening on localhost:${server.port}`);
```
