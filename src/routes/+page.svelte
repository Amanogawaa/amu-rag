<script lang="ts">
	import { Paperclip, ArrowUp } from '@lucide/svelte';
	import { onMount } from 'svelte';

	import type { StreamingMessage } from '$lib/types/types';
	import { findRelevantEntries, formatContext } from '$lib/data/data.me';


	let messages: StreamingMessage[] = [];
    let input = '';
    let loading = false;
    let selectedModel = 'llama3.2:1b';
    
    const models = [
        { id: 'llama3.2:1b', name: 'Llama 3.1' },
        { id: 'deepseek-r1:1.5b', name: 'DeepSeek R1' }
    ];

    function addMessage(role: 'user' | 'assistant', content: string, isStreaming = false) {
        messages = [...messages, { role, content, isStreaming }];
    }

	
    async function onSubmit() {
        if (!input.trim()) return;
        
        const userMessage = input.trim();
        addMessage('user', userMessage);
        input = '';
        loading = true;

        const relevantEntries = findRelevantEntries(userMessage);
        const context = formatContext(relevantEntries);
        
        try {
            const response = await fetch('/api/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    message: userMessage, 
                    context,
                    model: selectedModel
                })
            });

            if (!response.ok) throw new Error('Failed to get response');
            
            addMessage('assistant', '', true);
            
            const reader = response.body?.getReader();
            if (!reader) throw new Error('No reader available');
            
            let accumulatedResponse = '';
            
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                
                const chunk = new TextDecoder().decode(value);
                accumulatedResponse += chunk;
                
                messages = messages.map((msg, i) => 
                    i === messages.length - 1 
                        ? { ...msg, content: accumulatedResponse } 
                        : msg
                );
            }
            
            messages = messages.map((msg, i) => 
                i === messages.length - 1 
                    ? { ...msg, isStreaming: false } 
                    : msg
            );
        } catch (error) {
            console.error('Error:', error);
            addMessage('assistant', 'Sorry, I encountered an error while processing your request.');
        } finally {
            loading = false;
        }
    }

	


</script>

<main
	class="w-full min-h-svh h-full mx-auto flex flex-col items-center px-10 pt-10 pb-2 justify-center bg-primary-d"
>
	<div class="max-w-3xl mx-auto w-full flex-grow flex flex-col justify-center gap-5">
		{#if messages.length === 0}
			<div class="w-full text-center  text-base mb-">
					{loading ? 'witaminit...' : 'Wilcom back!'}
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
						<div class="w-full text-justify text-base">
								{msg.content}
						</div>
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
		class="w-full flex flex-col max-w-3xl mx-auto items-center justify-center min-h-28 h-fit bg-secondary-d px-2 py-3 rounded-4xl"
	>
		<input
			type="text"
			bind:value={input}
			onkeypress={(e) => e.key === 'Enter' && onSubmit()}
			placeholder="Hey there!, how can I help you?"
			aria-label="Type your message here"
			class="input w-full placeholder:text-lg text-base border-none focus:border-none focus:outline-none focus:ring-0 active:border-none active:outline-0 active:ring-0 bg-transparent text-white outline-0 ring-0"
		/>
		<div class="w-full flex justify-end gap-1 items-center mr-10">
			{#if models.length > 0}
				<select bind:value={selectedModel}>
					{#each models as model}
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