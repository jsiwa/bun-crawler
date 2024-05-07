# bun-scrapy

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
  .setProxy([
    'http://proxyhost:port'
  ])
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
