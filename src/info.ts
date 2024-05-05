import { getIP, getPort } from "./utils"

const port = await getPort()

const server = Bun.serve({
  port,
  fetch(req, serve) {
    const userAgent = req.headers.get('user-agent') || 'Unknown user agent'
    const acceptLanguage = req.headers.get('accept-language') || 'Unknown language'

    const info = {
      ip: serve.requestIP(req),
      realIp: getIP(req.headers),
      userAgent,
      acceptLanguage,
      method: req.method,
      url: req.url,
      body: req.body,
      headers: req.headers.toJSON()
    }

    return new Response(JSON.stringify(info, null, 2), {
      headers: {
        'Content-Type': 'application/json'
      }
    })
  }
})

console.log(`Server running on ${server.url}`)
