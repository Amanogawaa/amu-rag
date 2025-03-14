export interface ChatType {
	role: 'user' | 'assistant';
	content: string;
}

export interface BotResponse {
	model: string;
	created_at: string;
	response: string;
	done: boolean;
}

export interface StreamingMessage extends ChatType {
	isStreaming?: boolean;
}
