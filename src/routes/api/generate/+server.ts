import {
	calculateStringSimilarity,
	findRelevantEntries,
	formatContext,
	generateFlexibleAnswer
} from '$lib/data/data.me';
import type { RequestHandler } from '../$types';

export const POST: RequestHandler = async ({ request }) => {
	const { message, model, context } = await request.json();

	const { answer, confidence } = generateFlexibleAnswer(message);

	if (confidence > 0.7) {
		return new Response(answer, {
			headers: { 'Content-Type': 'text/plain' }
		});
	}

	const relevantEntries = findRelevantEntries(message);
	const systemPrompt = `
        I am an AI assistant with knowledge about Dominic Molino. I provide direct, concise, and professional answers without roleplay or narrative elements. ${formatContext(relevantEntries)}
    `;

	const ollamaResponse = {
		model: 'llama3.2:1b',
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
							// streaming response
							const data = JSON.parse(line);
							if (data.response) {
								accumulatedResponse += data.response;

								let cleanedResponse = accumulatedResponse.replace(/<think>[\s\S]*?<\/think>/g, '');

								cleanedResponse = cleanedResponse.replace(/<think>[\s\S]*$/, '');

								cleanedResponse = cleanedResponse.trim();

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
