# opencode-voice STT Worker shim

A tiny Cloudflare Worker that lets the
[bojackduy/opencode-voice](https://github.com/bojackduy/opencode-voice) plugin
use **Cloudflare Workers AI** as its speech-to-text backend.

The plugin's API transcription mode speaks the OpenAI-compatible
`POST /v1/audio/transcriptions` protocol (multipart form: `file`, `model`,
`response_format`), but Workers AI's OpenAI-compatible layer does not serve
that route. This Worker translates between the two:

```
plugin (multipart) ──▶ /v1/audio/transcriptions ──▶ env.AI.run("@cf/openai/whisper", { audio }) ──▶ { text }
```

## Deploy

```sh
wrangler deploy
wrangler secret put API_TOKEN          # token the plugin must send as Bearer
```

## Plugin options

In `cli.json` under the voice plugin's `options`:

```json
{
  "sttEndpoint": "https://<your-worker>.<subdomain>.workers.dev/v1",
  "sttModel": "@cf/openai/whisper",
  "sttApiKeyEnv": "CLOUDFLARE_API_TOKEN"
}
```

- `sttApiKeyEnv` names an environment variable holding the Bearer token sent
  to the Worker. Set the Worker's `API_TOKEN` secret to the same value.
- Auth is required: the Worker rejects requests without a matching Bearer
  token, so the public workers.dev URL can't be abused.
