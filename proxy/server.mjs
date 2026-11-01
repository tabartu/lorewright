#!/usr/bin/env node
/**
 * Worldledger local AI proxy (optional, zero dependencies).
 *
 * Some AI services refuse requests made directly from a web page (CORS).
 * Run this on your own computer and turn on "Use local proxy" for that
 * provider in Worldledger's settings. Requests then go:
 *
 *   browser → http://localhost:8787/https://api.example.com/v1/... → service
 *
 * It listens on 127.0.0.1 only, forwards your API key unchanged, stores
 * nothing and logs no request bodies.
 *
 *   npm run proxy                      # port 8787
 *   PORT=9000 npm run proxy            # another port
 *   ALLOW_HOSTS=api.groq.com,api.mistral.ai npm run proxy   # restrict targets
 */
import http from 'node:http'
import { Readable } from 'node:stream'

const PORT = Number(process.env.PORT ?? 8787)
const ALLOW = (process.env.ALLOW_HOSTS ?? '').split(',').map((h) => h.trim()).filter(Boolean)
const HOP = new Set(['host', 'origin', 'referer', 'connection', 'content-length', 'accept-encoding', 'cookie', 'sec-fetch-mode', 'sec-fetch-site', 'sec-fetch-dest'])

function cors(req, res) {
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin ?? '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', req.headers['access-control-request-headers'] ?? '*')
  res.setHeader('Access-Control-Allow-Private-Network', 'true')
  res.setHeader('Access-Control-Max-Age', '600')
  res.setHeader('Vary', 'Origin')
}

const server = http.createServer(async (req, res) => {
  cors(req, res)
  if (req.method === 'OPTIONS') {
    res.writeHead(204).end()
    return
  }
  const target = decodeURIComponent((req.url ?? '/').slice(1))
  let url
  try {
    url = new URL(target)
    if (!/^https?:$/.test(url.protocol)) throw new Error('protocol')
  } catch {
    res.writeHead(400, { 'Content-Type': 'application/json' }).end(JSON.stringify({ error: { message: 'Use http://localhost:PORT/<full https URL>' } }))
    return
  }
  if (ALLOW.length && !ALLOW.includes(url.hostname)) {
    res.writeHead(403, { 'Content-Type': 'application/json' }).end(JSON.stringify({ error: { message: `Host ${url.hostname} is not in ALLOW_HOSTS` } }))
    return
  }
  const headers = {}
  for (const [k, v] of Object.entries(req.headers)) if (!HOP.has(k) && typeof v === 'string') headers[k] = v
  const chunks = []
  for await (const c of req) chunks.push(c)
  try {
    const upstream = await fetch(url, {
      method: req.method,
      headers,
      body: ['GET', 'HEAD'].includes(req.method ?? 'GET') ? undefined : Buffer.concat(chunks),
    })
    const out = { 'Content-Type': upstream.headers.get('content-type') ?? 'application/octet-stream', 'Cache-Control': 'no-cache' }
    res.writeHead(upstream.status, out)
    console.log(`${req.method} ${url.origin}${url.pathname} → ${upstream.status}`)
    if (upstream.body) Readable.fromWeb(upstream.body).pipe(res)
    else res.end()
  } catch (err) {
    console.error(`${req.method} ${url.origin}${url.pathname} failed: ${err.message}`)
    res.writeHead(502, { 'Content-Type': 'application/json' }).end(JSON.stringify({ error: { message: `Proxy could not reach ${url.host}: ${err.message}` } }))
  }
})

server.listen(PORT, '127.0.0.1', () => {
  console.log(`Worldledger AI proxy on http://localhost:${PORT}${ALLOW.length ? ` (allowed: ${ALLOW.join(', ')})` : ''}`)
})
