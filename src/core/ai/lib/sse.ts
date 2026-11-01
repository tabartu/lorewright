/**
 * Read a server-sent-events (or newline-delimited JSON) body and yield the
 * payload of each event. Handles chunks that split lines anywhere.
 */
export async function* readEvents(body: ReadableStream<Uint8Array>, signal?: AbortSignal): AsyncGenerator<string> {
  const reader = body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let data: string[] = []
  try {
    while (true) {
      if (signal?.aborted) throw new DOMException('Aborted', 'AbortError')
      const { value, done } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      let nl: number
      while ((nl = buffer.indexOf('\n')) >= 0) {
        const line = buffer.slice(0, nl).replace(/\r$/, '')
        buffer = buffer.slice(nl + 1)
        if (line === '') {
          if (data.length) yield data.join('\n')
          data = []
        } else if (line.startsWith('data:')) {
          data.push(line.slice(5).replace(/^ /, ''))
        } else if (line.startsWith('{')) {
          // NDJSON (e.g. Ollama native API)
          yield line
        }
      }
    }
    buffer += decoder.decode()
    if (buffer.startsWith('data:')) data.push(buffer.slice(5).trim())
    else if (buffer.trim().startsWith('{')) yield buffer.trim()
    if (data.length) yield data.join('\n')
  } finally {
    reader.releaseLock()
  }
}
