<script lang="ts">
	import type { Chat } from '$lib/types/types';
	import dataFetch from '$lib/utils/service';
	import { Paperclip, ArrowUp } from '@lucide/svelte';
	import { onMount } from 'svelte';

	let input = $state('');
	let options = $state<Chat[]>([]);
	let messages = $state<{ role: string; content: string }[]>([]);
	let loading = $state(false);
	let selectedModel = $state('');

	onMount(async () => {
		try {
			const response = await dataFetch('models', 'GET');
			options = response.models;
			if (options.length > 0) selectedModel = options[0].name;
		} catch (error) {
			console.error('Error fetching models:', error);
		}
	});

	async function onSubmit() {
		if (!input.trim()) return;
		
		const userMessage = { role: 'user', content: input };
		messages = [...messages, userMessage];
		loading = true;

		const payload = {
			model: selectedModel ,
			messages: [...messages],
			stream: false 
		};
		console.table(payload);

		try {
			const res = await dataFetch('chat', 'POST', payload);
			console.log('Response:', res);

			if (res && res.message) {
				messages = [...messages, { role: 'assistant', content: res.message }];
			} else {
				messages = [...messages, { role: 'assistant', content: 'No response content' }];
			}
		} catch (error) {
			console.error('Error:', error);
			messages = [...messages, { role: 'assistant', content: 'Error: Could not get response' }];
		} finally {
			input = '';
			loading = false;
		}
	}
</script>

<main
	class="w-full min-h-svh h-full mx-auto flex flex-col items-center px-10 pt-10 pb-2 justify-center bg-primary-d"
>
	<div class="max-w-3xl mx-auto w-full flex-grow flex flex-col justify-center gap-5">
		{#if messages.length === 0}
			<div class="chat chat-start w-full">
				<div class="w-full text-justify text-base">
					{loading ? 'Thinking...' : 'Ask me anything!'}
				</div>
			</div>
		{:else}
			{#each messages as msg}
				{#if msg.role === 'user'}
					<div class="chat chat-end">
						<div
							class="p-5 rounded-tl-3xl text-base rounded-tr-3xl rounded-bl-3xl rounded-br-md bg-tertiary-d"
						>
							{msg.content}
						</div>
					</div>
				{:else if msg.role === 'assistant'}
					<div class="chat chat-start w-full">
						<div class="w-full text-justify text-base">{msg.content}</div>
					</div>
				{/if}
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
			placeholder="Hey there!, how can I help you?"
			aria-label="Type your message here"
			class="input w-full placeholder:text-lg text-base border-none focus:border-none focus:outline-none focus:ring-0 active:border-none active:outline-0 active:ring-0 bg-transparent text-white outline-0 ring-0"
		/>
		<div class="w-full flex justify-end gap-1 items-center mr-10">
			{#if options.length > 0}
				<select bind:value={selectedModel}>
					{#each options as model}
						<option value={model.name}>{model.name}</option>
					{/each}
				</select>
			{:else}
				<p>Loading models...</p>
			{/if}
			<button class="rounded-full bg-tertiary-d p-3.5 cursor-pointer hover:bg-tertiary-hover">
				<Paperclip class="w-4 h-4 text-white" />
			</button>
			<button
				disabled={loading}
				onclick={onSubmit}
				class={input && !loading
					? 'rounded-full p-3.5 cursor-pointer hover:bg-tertiary-hover bg-white text-black'
					: 'rounded-full bg-tertiary-d p-3.5 cursor-not-allowed hover:bg-tertiary-hover'}
			>
				<ArrowUp class={input && !loading ? 'w-4 h-4 text-black' : 'w-4 h-4 text-white'} />
			</button>
		</div>
	</div>
</main>