interface ErrorHandler {
  (error: Error, url?: string): void;
}

interface ItemProcessor {
  (html: string, url: string): void;
}

class Crawler {
  private taskQueue: string[] = []
  private active: boolean = false
  private concurrency: number
  private activeRequests: number = 0
  private errorHandler: ErrorHandler
  private itemProcessor: ItemProcessor
  private proxy: string | string[]

  constructor(concurrency: number = 1) {
    this.concurrency = concurrency;
    this.errorHandler = (error, url) => {
      console.error(`Error fetching ${url}:`, error)
    }
    this.itemProcessor = (html, url) => {
      console.log(`Processing content from ${url}`)
    }
    this.proxy = ''
  }

  public setProxy(proxy: string | string[]) {
    this.proxy = proxy
    return this
  }

  public addTask(url: string) {
    this.taskQueue.push(url)
    if (this.active) {
      this.checkQueue()
    }
    return this
  }

  public start() {
    this.active = true
    this.checkQueue()
    console.log('Crawler started.')
    return this
  }

  public stop() {
    this.active = false;
    console.log('Crawler stopped.')
    return this
  }

  private async checkQueue(): Promise<void> {
    while (this.active && this.activeRequests < this.concurrency && this.taskQueue.length > 0) {
      const url = this.taskQueue.shift()
      if (url) {
        this.activeRequests++
        this.fetchPage(url).finally(() => {
          this.activeRequests--
          if (this.active) {
            this.checkQueue()
          }
        })
      }
    }
  }

  private async fetchPage(url: string): Promise<void> {
    try {
      const html = await this.fetchUrl(url)
      console.log(`Page fetched: ${url}`)
      this.itemProcessor(html, url)
    } catch (error) {
      if (error instanceof Error) {
        this.errorHandler(error, url)
      } else {
        console.error(error)
      }
    }
  }

  private async fetchUrl(url: string): Promise<string> {
    let options: FetchRequestInit = {
      method: 'GET'
    }

    if (this.proxy) {
      if (typeof this.proxy === 'string') {
        options.proxy = this.proxy
      } else if (Array.isArray(this.proxy)) {
        const proxy = this.proxy[Math.floor(Math.random() * this.proxy.length)]
        if (proxy) {
          options.proxy = proxy
        }
      }
    }

    const response = await fetch(url, options)
    if (response.ok) {
      const data = await response.text()
      return data
    } else {
      throw new Error(`Request Failed. Status Code: ${response.status}`)
    }
  }

  public onError(handler: ErrorHandler) {
    this.errorHandler = handler
    return this
  }

  public onItemProcess(processor: ItemProcessor) {
    this.itemProcessor = processor
    return this
  }
}

export default Crawler
