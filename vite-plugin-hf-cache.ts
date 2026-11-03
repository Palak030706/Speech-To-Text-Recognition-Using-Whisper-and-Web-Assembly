import type { Plugin } from 'vite'
import type { IncomingMessage, ServerResponse } from 'node:http'
import fs from 'node:fs'
import fsp from 'node:fs/promises'
import path from 'node:path'
import { pipeline as streamPipeline } from 'node:stream/promises'

const CACHE_DIR = 'model-cache'
const PROXY_PREFIX = '/hf-proxy/'
const HF_ORIGIN = 'https://huggingface.co/'

/** In-flight fetch deduplication: URL → Promise<local path> */
const inflight = new Map<string, Promise<string>>()

function getMimeType(filePath: string): string {
  if (filePath.endsWith('.json')) return 'application/json'
  if (filePath.endsWith('.onnx')) return 'application/octet-stream'
  if (filePath.endsWith('.txt')) return 'text/plain'
  return 'application/octet-stream'
}

async function handleRequest(req: IncomingMessage, res: ServerResponse, next: () => void) {
  const url = req.url
  if (!url || !url.startsWith(PROXY_PREFIX)) {
    next()
    return
  }

  const hfPath = url.slice(PROXY_PREFIX.length)
  const localPath = path.join(CACHE_DIR, hfPath)

  // Cache hit — serve from disk
  if (fs.existsSync(localPath)) {
    const stat = fs.statSync(localPath)
    res.writeHead(200, {
      'Content-Type': getMimeType(localPath),
      'Content-Length': stat.size,
      'Cache-Control': 'public, max-age=31536000, immutable',
    })
    fs.createReadStream(localPath).pipe(res)
    return
  }

  // Cache miss — fetch from HuggingFace, write to disk, then serve
  const remoteUrl = HF_ORIGIN + hfPath

  try {
    // Deduplicate concurrent requests for the same file
    let fetchPromise = inflight.get(hfPath)
    if (!fetchPromise) {
      fetchPromise = fetchAndCache(remoteUrl, localPath, hfPath)
      inflight.set(hfPath, fetchPromise)
    }

    const cachedPath = await fetchPromise

    const stat = fs.statSync(cachedPath)
    res.writeHead(200, {
      'Content-Type': getMimeType(cachedPath),
      'Content-Length': stat.size,
      'Cache-Control': 'public, max-age=31536000, immutable',
    })
    fs.createReadStream(cachedPath).pipe(res)
  } catch (err) {
    console.error(`[hf-cache] Failed to fetch ${remoteUrl}:`, err)
    res.writeHead(502, { 'Content-Type': 'text/plain' })
    res.end('Failed to fetch from HuggingFace')
  }
}

async function fetchAndCache(remoteUrl: string, localPath: string, hfPath: string): Promise<string> {
  try {
    const response = await fetch(remoteUrl)
    if (!response.ok || !response.body) {
      throw new Error(`HTTP ${response.status} ${response.statusText}`)
    }

    // Ensure directory exists
    await fsp.mkdir(path.dirname(localPath), { recursive: true })

    // Atomic write: write to .tmp then rename
    const tmpPath = localPath + '.tmp'
    const fileStream = fs.createWriteStream(tmpPath)
    await streamPipeline(response.body, fileStream)
    await fsp.rename(tmpPath, localPath)

    console.log(`[hf-cache] Cached: ${hfPath}`)
    return localPath
  } finally {
    inflight.delete(hfPath)
  }
}

export default function hfCachePlugin(): Plugin {
  return {
    name: 'hf-cache-proxy',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        handleRequest(req, res, next)
      })
    },
    configurePreviewServer(server) {
      server.middlewares.use((req, res, next) => {
        handleRequest(req, res, next)
      })
    },
  }
}
