import { describe, expect, it } from 'vitest'
import { fromHttp } from '../errors'
import { readEvents } from './sse'

function streamOf(chunks: string[]) {
  const enc = new TextEncoder()
  return new ReadableStream<Uint8Array>({
    start(c) {
      for (const ch of chunks) c.enqueue(enc.encode(ch))
      c.close()
    },
  })
}

async function collect(chunks: string[]) {
  const out: string[] = []
  for await (const e of readEvents(streamOf(chunks))) out.push(e)
  return out
}

describe('readEvents', () => {
  it('handles events split across chunks', async () => {
    expect(await collect(['data: {"a":', '1}\n\ndata: [DO', 'NE]\n\n'])).toEqual(['{"a":1}', '[DONE]'])
  })
  it('handles CRLF, event names and a final event without blank line', async () => {
    expect(await collect(['event: x\r\ndata: one\r\n\r\n', 'data: two'])).toEqual(['one', 'two'])
  })
  it('passes NDJSON lines through', async () => {
    expect(await collect(['{"x":1}\n{"x":2}\n'])).toEqual(['{"x":1}', '{"x":2}'])
  })
})

describe('fromHttp', () => {
  it('maps common provider errors', () => {
    expect(fromHttp(401, '{"error":{"message":"bad key"}}').code).toBe('invalid_key')
    expect(fromHttp(429, '{"error":{"type":"insufficient_quota"}}').code).toBe('quota_exceeded')
    expect(fromHttp(429, 'slow down').code).toBe('rate_limited')
    expect(fromHttp(404, '').code).toBe('model_not_found')
    expect(fromHttp(400, '{"error":{"message":"model gpt-x does not exist"}}').code).toBe('model_not_found')
    expect(fromHttp(400, 'prompt is too long: 300000 tokens').code).toBe('context_too_long')
    expect(fromHttp(503, '').code).toBe('server_error')
  })
})
