<script>
	import { Paperclip, ArrowUp } from '@lucide/svelte';

	let input = $state('');
	let response = $state('');
	let loading = $state(false);

	/** @type {{ input: string, response: string }[]} */
	let conversation = [];

	async function sendMessage() {
		if (!input.trim()) return;
		const userInput = input;
		loading = true;
		input = ''; // Clear input immediately for better UX
		try {
			const res = await fetch('http://localhost:11434/api/generate', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					model: 'llama3.2:1b',
					prompt: userInput,
					stream: true
				})
			});

			if (!res.ok) throw new Error('Failed to fetch response from Ollama');

			const data = await res.json();
			response = data.response;
			conversation = [...conversation, { input: userInput, response }];
		} catch (error) {
			console.error('Error:', error);
			response =
				error.message === 'Failed to fetch response from Ollama'
					? 'Server unavailable. Is Ollama running?'
					: 'Sorry, something went wrong!';
			conversation = [...conversation, { input: userInput, response }];
		} finally {
			loading = false;
		}
	}
</script>

<main
	class="w-full min-h-svh h-full mx-auto flex flex-col items-center px-10 pt-10 pb-2 justify-center bg-primary-d"
>
	<div class="max-w-3xl mx-auto w-full flex-grow flex flex-col justify-center gap-5">
		{#if conversation.length === 0}
			<div class="chat chat-start w-full">
				<div class="w-full text-justify text-base">
					{loading ? 'Thinking...' : 'Ask me anything!'}
				</div>
			</div>
		{:else}
			{#each conversation as con}
				<div class="chat chat-end">
					<div
						class="p-5 rounded-tl-3xl text-base rounded-tr-3xl rounded-bl-3xl rounded-br-md bg-tertiary-d"
					>
						{con.input}
					</div>
				</div>
				<div class="chat chat-start w-full">
					<div class="w-full text-justify text-base">
						{con.response}
					</div>
				</div>
			{/each}
			{#if loading}
				<div class="chat chat-start w-full">
					<div class="w-full text-justify text-base">Thinking...</div>
				</div>
			{/if}
			<div class="w-full h-[2px] bg-secondary-d rounded-full my-3.5"></div>
		{/if}
	</div>
	<div
		class="w-full flex flex-col max-w-3xl mx-auto items-center justify-center min-h-28 h-full bg-secondary-d px-2 py-3 rounded-4xl"
	>
		<input
			type="text"
			bind:value={input}
			disabled={loading}
			placeholder="Hey there!, how can I help you?"
			aria-label="Type your message here"
			class="input w-full placeholder:text-lg text-base border-none focus:border-none focus:outline-none focus:ring-0 active:border-none active:outline-0 active:ring-0 bg-transparent text-white outline-0 ring-0"
			onkeydown={(e) => e.key === 'Enter' && sendMessage()}
		/>
		<div class="w-full flex justify-end gap-1 items-center mr-10">
			<button class="rounded-full bg-tertiary-d p-3.5 cursor-pointer hover:bg-tertiary-hover">
				<Paperclip class="w-4 h-4 text-white" />
			</button>
			<button
				onclick={sendMessage}
				disabled={loading}
				class={input && !loading
					? 'rounded-full p-3.5 cursor-pointer hover:bg-tertiary-hover bg-white text-black'
					: 'rounded-full bg-tertiary-d p-3.5 cursor-not-allowed hover:bg-tertiary-hover'}
			>
				<ArrowUp class={input && !loading ? 'w-4 h-4 text-black' : 'w-4 h-4 text-white'} />
			</button>
		</div>
	</div>
</main>
