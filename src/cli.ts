import { curl } from "./curl"
import { randomUserAgent } from './userAgents'
import { parseArgs, isUrl } from './utils'
import { sleep } from 'bun'

const args = parseArgs()
const endTime = typeof args.endTime === 'number' ? args.endTime : new Date().getTime() + 60 * 60 * 1000
const delay = typeof args.delay === 'number' ? args.delay : 1000
const maxLoop = typeof args.maxLoop === 'number' ? args.maxLoop : 2

const url = checkUrl()

let count = 0
while (count < maxLoop && new Date().getTime() < endTime) {
  try {
    const result = await curl({
      url,
      userAgent: randomUserAgent(),
    }).text()
    console.log(result)
  } catch (e) {
    console.error(e)
  }

  count++
  console.log(count)
  if (delay) await sleep(delay)
}

function checkUrl() {
  if (!args.url) throw new Error('No URL found. Please use --url=http://example.com to specify a URL.')
  if (typeof args.url !== 'string') throw new Error('The URL provided is not a string. Please ensure the URL is correctly formatted.')
  if (!isUrl(args.url)) throw new Error('The URL provided is invalid. Please enter a valid URL including the protocol (e.g., http:// or https://).')
  return args.url
}