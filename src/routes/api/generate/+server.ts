import { calculateStringSimilarity, findRelevantEntries, formatContext } from '$lib/data/data.me';
import type { RequestHandler } from '../$types';
import { json } from '@sveltejs/kit';

export const GET: RequestHandler = async () => {
	return new Response('Hello from the server!');
};

export const POST: RequestHandler = async ({ request }) => {
	const { message, model, context } = await request.json();

	const relevantEntries = findRelevantEntries(message);

	// If we have a strong match (e.g., exact variation or high score), return it directly
	if (relevantEntries.length > 0) {
		const topEntry = relevantEntries[0];
		// Check if the query matches a variation exactly or has a high score
		const variationMatch = topEntry.variations.some(
			(v) => calculateStringSimilarity(message.toLowerCase(), v) > 0.9
		);
		if (variationMatch) {
			return new Response(topEntry.answer, {
				headers: { 'Content-Type': 'text/plain' }
			});
		}
	}

	// Fallback to Ollama if no direct match
	const systemPrompt = `
        I’m your late-night, code-obsessed, bike-riding assistant. I’m here to troubleshoot, answer questions, or dig into whatever you throw my way. Coding and cycling are my things—don’t expect much warmth, just results. Ask what you want, and I’ll answer it concise. ${formatContext(relevantEntries)}
    `;

	// const systemPrompt = `
	// 	I’m your late-night, code-obsessed, bike-riding assistant. I’m here to troubleshoot, answer questions, or dig into whatever you throw my way. Coding and cycling are my things—don’t expect much warmth, just results. Ask what you want, and I’ll handle it. ${context ? context : ''}
	// `;

	const ollamaResponse = {
		model: model || 'llama3.2:1b',
		prompt: message,
		system: systemPrompt,
		stream: false,
		options: {
			temperature: 0.5,
			top_p: 0.9
		}
	};

	const stream = new ReadableStream({
		async start(controller) {
			try {
				// Connect to Ollama API
				const response = await fetch('http://localhost:11434/api/generate', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify(ollamaResponse)
				});

				if (!response.ok) {
					const errorText = await response.text();
					throw new Error(`Ollama API error: ${response.status} ${errorText}`);
				}

				const reader = response.body?.getReader();
				if (!reader) throw new Error('No reader available from Ollama API');

				let accumulatedResponse = '';
				let lastSentLength = 0;

				while (true) {
					const { done, value } = await reader.read();
					if (done) break;

					const chunk = new TextDecoder().decode(value);
					const lines = chunk.split('\n').filter((line) => line.trim());

					for (const line of lines) {
						try {
							const data = JSON.parse(line);
							if (data.response) {
								// Add to accumulated response
								accumulatedResponse += data.response;

								// Clean the entire accumulated response
								let cleanedResponse = accumulatedResponse.replace(/<think>[\s\S]*?<\/think>/g, '');

								// Also handle cases where the closing tag hasn't arrived yet
								cleanedResponse = cleanedResponse.replace(/<think>[\s\S]*$/, '');

								// Trim any leading/trailing whitespace that might be left after removal
								cleanedResponse = cleanedResponse.trim();

								// Only send the new part that hasn't been sent yet
								if (cleanedResponse.length > lastSentLength) {
									const newContent = cleanedResponse.substring(lastSentLength);
									controller.enqueue(new TextEncoder().encode(newContent));
									lastSentLength = cleanedResponse.length;
								}
							}
						} catch (e) {
							console.error('Error parsing JSON:', e);
						}
					}
				}

				controller.close();
			} catch (error) {
				console.error('Error in stream:', error);
				controller.error(error);
			}
		}
	});

	return new Response(stream, {
		headers: {
			'Content-Type': 'text/plain'
		}
	});
};
