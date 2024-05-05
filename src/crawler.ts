import http from 'node:http'
import https from 'node:https'

interface ErrorHandler {
  (error: Error, url?: string): void;
}

interface ItemProcessor {
  (html: string, url: string): void;
}

class Crawler {
  private taskQueue: string[] = [];
  private active: boolean = false;
  private concurrency: number;
  private activeRequests: number = 0;
  private errorHandler: ErrorHandler;
  private itemProcessor: ItemProcessor;

  constructor(concurrency: number = 1) {
    this.concurrency = concurrency;
    this.errorHandler = (error, url) => {
      console.error(`Error fetching ${url}:`, error);
    };
    this.itemProcessor = (html, url) => {
      console.log(`Processing content from ${url}`);
    };
  }

  public addTask(url: string): this {
    this.taskQueue.push(url);
    if (this.active) {
      this.checkQueue();
    }
    return this;
  }

  public start(): this {
    this.active = true;
    this.checkQueue();
    console.log('Crawler started.');
    return this;
  }

  public stop(): this {
    this.active = false;
    console.log('Crawler stopped.');
    return this;
  }

  private async checkQueue(): Promise<void> {
    while (this.active && this.activeRequests < this.concurrency && this.taskQueue.length > 0) {
      const url = this.taskQueue.shift();
      if (url) {
        this.activeRequests++;
        this.fetchPage(url).finally(() => {
          this.activeRequests--;
          if (this.active) {
            this.checkQueue();
          }
        });
      }
    }
  }

  private async fetchPage(url: string): Promise<void> {
    try {
      const html = await this.fetchUrl(url);
      console.log(`Page fetched: ${url}`);
      this.itemProcessor(html, url);
    } catch (error) {
      this.errorHandler(error, url);
    }
  }

  private fetchUrl(url: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const protocol = url.startsWith('https') ? https : http;
      protocol.get(url, response => {
        if (response.statusCode && response.statusCode >= 200 && response.statusCode < 300) {
          let data = '';
          response.on('data', chunk => data += chunk);
          response.on('end', () => resolve(data));
        } else {
          reject(new Error(`Request Failed. Status Code: ${response.statusCode}`));
        }
      }).on('error', error => {
        reject(error);
      });
    });
  }

  public onError(handler: ErrorHandler): this {
    this.errorHandler = handler;
    return this;
  }

  public onItemProcess(processor: ItemProcessor): this {
    this.itemProcessor = processor;
    return this;
  }
}

export default Crawler;
