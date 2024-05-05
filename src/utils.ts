import { serve } from 'bun'

export const getIP = (headers: Headers) => {
  const headerKeys = [
    "x-real-ip",
    "x-client-ip",
    "cf-connecting-ip",
    "fastly-client-ip",
    "x-cluster-client-ip",
    "x-forwarded",
    "forwarded-for",
    "forwarded",
    "x-forwarded",
    "appengine-user-ip",
    "true-client-ip",
    "cf-pseudo-ipv4"
  ]

  for (const key of headerKeys) {
    const value = headers.get(key)
    if (value) {
      // If the header contains multiple IP addresses (common with x-forwarded-for), return the first one.
      const firstIp = value.split(',')[0].trim()
      if (firstIp) return firstIp
    }
  }

  return null // Return null if no IP address is found in the checked headers
}

export function checkPort(port: number): Promise<number | undefined> {
  return new Promise((resolve) => {
    try {
      const server = serve({
        fetch(req: Request) {
          return new Response()
        },
        port: port,
      })
      resolve(port)
      server.stop()
    } catch (e) {
      resolve(undefined)
    }
  })
}

export async function getPort(port: number = 3000) {
  const maxLoop = 100
  let count = 0
  let stop = false
  while (!stop && count < maxLoop) {
    try {
      const canUsePort = await checkPort(port)
      if (canUsePort) {
        stop = true
        return canUsePort
      }
    } catch (error) { }
    count++
    port++
  }
}

export function parseArgs() {
  const args = Bun.argv

  const argsMap: Record<string, string | boolean> = {}
  for (let i = 2; i < args.length; i++) {
    const arg = args[i]
    if (arg.startsWith('--')) {
      const [key, value] = arg.slice(2).split('=')
      argsMap[key] = value || true
    } else {
      argsMap[`arg${i - 1}`] = arg
    }
  }
  return argsMap
}

export function isUrl(urlString: string) {
  const pattern = new RegExp('^(https?:\\/\\/)?' + // protocol
    '(localhost|' + // adding localhost
    '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,})|' + // domain name
    '((\\d{1,3}\\.){3}\\d{1,3}))' + // OR ip (v4) address
    '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // port and path
    '(\\?[;&a-z\\d%_.~+=-]*)?' + // query string
    '(\\#[-a-z\\d_]*)?$', 'i') // fragment locator
  return !!pattern.test(urlString);
}