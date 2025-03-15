export interface DataEntry {
	id: string;
	question: string;
	answer: string;
	category: string;
	keywords: string[];
	variations: string[];
}

const myData: DataEntry[] = [
	{
		id: '1',
		question: "Who's your creator?",
		answer:
			'My creator is Dominic Molino, a 3rd-year Computer Science student who coded me as his AI assistant.',
		category: 'personal',
		keywords: ['creator', 'who', 'programmer', 'Computer Science', 'Dominic'],
		variations: ['who made you', "who's your creator", 'who built you', "who's behind you"]
	},
	{
		id: '2',
		question: 'What are my hobbies?',
		answer:
			'You write messy code, ride as a carefree cyclist at night, draw traditionally, and sleep all day.',
		category: 'hobbies',
		keywords: ['hobbies', 'interests', 'pastime', 'activities'],
		variations: [
			'what do i do for fun',
			'what are my interests',
			'what are my preferred activities'
		]
	},
	{
		id: '3',
		question: 'What is my favorite programming language?',
		answer: 'You favor JavaScript for its web versatility and Python for its clean simplicity.',
		category: 'programming',
		keywords: ['programming', 'language', 'favorite', 'JavaScript', 'Python'],
		variations: [
			'what programming language do i like',
			'what is my preferred language',
			"what's my top coding language"
		]
	},
	{
		id: '4',
		question: 'What is my favorite food?',
		answer: "You claim pizza's the ultimate creation and tolerate burgers.",
		category: 'food',
		keywords: ['food', 'favorite', 'pizza', 'burgers'],
		variations: ['what is my favorite food', 'what do i like to eat']
	},
	{
		id: '5',
		question: 'What are my skills?',
		answer: 'You code frontend websites, debug with decent skill, and know web dev basics.',
		category: 'skills',
		keywords: ['skills', 'abilities', 'capabilities', 'knowledge'],
		variations: ['what can i do', 'what im capable of', 'what skills do i have']
	},
	{
		id: '6',
		question: 'What projects have i worked on?',
		answer:
			"You've built a personal website, a chatbot, some web apps, and currently, you're coding me, your AI assistant.",
		category: 'projects',
		keywords: ['projects', 'work', 'experience', 'personal website', 'chatbot', 'web applications'],
		variations: ['what have i worked on', 'what projects have i done', 'what experience do i have']
	}
];

export function calculateStringSimilarity(str1: string, str2: string): number {
	str1 = str1.toLowerCase();
	str2 = str2.toLowerCase();

	if (str1 === str2) return 1;

	if (str1.includes(str2) || str2.includes(str1)) return 0.8;

	const words1 = new Set(str1.split(/\s+/));
	const words2 = str2.split(/\s+/);
	const commonWords = words2.filter((word) => words1.has(word));

	return commonWords.length / Math.max(words1.size, words2.length);
}

function findMatchingKeywords(query: string, keywords: string[]): number {
	if (keywords.length === 0) return 0;

	query = query.toLowerCase();
	const queryWords = new Set(query.split(/\s+/));

	let matches = 0;
	for (const keyword of keywords) {
		const keywordLower = keyword.toLowerCase();
		for (const word of queryWords) {
			if (word.includes(keywordLower) || keywordLower.includes(word)) {
				matches++;
				break;
			}
		}
	}

	return matches;
}

// Cache for recent queries to avoid recalculation
const queryCache = new Map<string, DataEntry[]>();
const CACHE_SIZE = 20;

export function findRelevantEntries(query: string): DataEntry[] {
	query = query.toLowerCase().trim();

	if (queryCache.has(query)) {
		return queryCache.get(query)!;
	}

	if (!query) return [];

	const scoredEntries = myData.map((entry) => {
		let score = 0;

		for (const variation of entry.variations) {
			const similarity = calculateStringSimilarity(query, variation);
			if (similarity > 0.7) {
				score += similarity * 5;
			}
		}

		const keywordMatches = findMatchingKeywords(query, entry.keywords);
		score += keywordMatches * 2;

		if (query.includes(entry.category.toLowerCase())) score += 2;

		const questionSimilarity = calculateStringSimilarity(query, entry.question);
		if (questionSimilarity > 0.5) {
			score += questionSimilarity * 3;
		}

		return { entry, score };
	});

	const relevantEntries = scoredEntries
		.filter(({ score }) => score > 1.0)
		.sort((a, b) => b.score - a.score)
		.map(({ entry }) => entry);

	const result = relevantEntries.slice(0, 5);

	queryCache.set(query, result);

	if (queryCache.size > CACHE_SIZE) {
		const firstKey = queryCache.keys().next().value;
		queryCache.delete(firstKey!);
	}

	return result;
}

// Helper function to format the context based on matched entries
export function formatContext(entries: DataEntry[]): string {
	if (entries.length === 0) return '';

	let context = 'Here is some relevant information:\n\n';
	entries.forEach((entry) => {
		context += `Q: ${entry.question}\nA: ${entry.answer}\n\n`;
	});
	return context;
}

// generate flexible answers combining the knowledge base and the confidence level
export function generateFlexibleAnswer(query: string): { answer: string; confidence: number } {
	const relevantEntries = findRelevantEntries(query);

	if (
		relevantEntries.length > 0 &&
		calculateStringSimilarity(query, relevantEntries[0].question) > 0.85
	) {
		return { answer: relevantEntries[0].answer, confidence: 1 };
	}

	// return message if no relevant entries are found
	if (relevantEntries.length === 0) {
		return {
			answer: "I don't have enough information to answer that question accurately.",
			confidence: 0
		};
	}

	// Group entries by category to understand context
	const categoryGroups = new Map<string, DataEntry[]>();
	relevantEntries.forEach((entry) => {
		if (!categoryGroups.has(entry.category)) {
			categoryGroups.set(entry.category, []);
		}
		categoryGroups.get(entry.category)?.push(entry);
	});

	// Calculate overall confidence based on relevance scores
	const avgSimilarity =
		relevantEntries.reduce(
			(acc, entry) => acc + calculateStringSimilarity(query, entry.question),
			0
		) / relevantEntries.length;

	let combinedAnswer = '';
	const categories = Array.from(categoryGroups.keys());

	if (categories.length === 1) {
		combinedAnswer = relevantEntries[0].answer;
	} else {
		combinedAnswer =
			'Based on what I know: ' +
			relevantEntries.map((entry) => entry.answer.replace(/^You/g, 'you')).join(' Also, ');
	}

	return {
		answer: combinedAnswer,
		confidence: avgSimilarity
	};
}
