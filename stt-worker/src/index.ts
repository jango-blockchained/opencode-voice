// OpenCode voice STT shim.
//
// Translates the OpenAI-compatible `/audio/transcriptions` request that the
// opencode-voice plugin sends (multipart form: file + model + response_format)
// into a Workers AI binding call (`@cf/openai/whisper`), returning `{ text }`.
//
// Auth: requires `Authorization: Bearer <API_TOKEN>` (Worker secret) so the
// public workers.dev URL cannot be used by third parties.

interface Env {
	AI: { run: (model: string, input: { audio: ArrayBuffer }) => Promise<{ text?: string }> };
	API_TOKEN?: string;
}

export default {
	async fetch(request, env): Promise<Response> {
		const url = new URL(request.url);
		if (url.pathname !== "/v1/audio/transcriptions" && url.pathname !== "/audio/transcriptions") {
			return Response.json({ error: "Not found" }, { status: 404 });
		}
		if (request.method !== "POST") {
			return Response.json({ error: "Method not allowed" }, { status: 405 });
		}
		const auth = request.headers.get("Authorization") ?? "";
		if (!env.API_TOKEN || auth !== `Bearer ${env.API_TOKEN}`) {
			return Response.json({ error: "Unauthorized" }, { status: 401 });
		}

		try {
			const form = await request.formData();
			const file = form.get("file");
			if (!(file instanceof File)) {
				return Response.json({ error: "Missing audio file" }, { status: 400 });
			}
			const bytes = await file.arrayBuffer();
			const result = await env.AI.run("@cf/openai/whisper", { audio: Array.from(new Uint8Array(bytes)) });
			return Response.json({ text: result.text ?? "" });
		} catch (err) {
			return Response.json(
				{ error: `Transcription failed: ${err instanceof Error ? err.message : String(err)}` },
				{ status: 502 },
			);
		}
	},
} satisfies ExportedHandler<Env>;
