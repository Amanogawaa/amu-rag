<script>
	import { Paperclip, ArrowUp } from '@lucide/svelte';
</script>

<main
	class="w-full min-h-svh h-full mx-auto flex flex-col items-center p-10 justify-center bg-primary-d"
>
	<div class=" max-w-3xl mx-auto w-full flex-grow">
		<div class="chat chat-start">
			<div class="chat-bubble rounded-full bg-tertiary-d"></div>
		</div>
		<div class="chat chat-end">
			<div class="chat-bubble bg-tertiary-d">You underestimate my power!</div>
		</div>
	</div>
	<div
		class="w-full flex flex-col max-w-3xl mx-auto items-center justify-center min-h-28 h-full bg-secondary-d px-2 py-3 rounded-4xl"
	>
		<input
			type="text"
			placeholder="Hey there!, how can i help you?
				"
			class="input w-full placeholder:text-lg text-base border-none focus:border-none focus:outline-none focus:ring-0 active:border-none active:outline-0 active:ring-0 bg-transparent text-white outline-0 ring-0"
		/>
		<div class="w-full flex justify-end gap-1 items-center mr-10">
			<button class="btn bg-tertiary-d rounded-full">
				<Paperclip class="w-4 h-4 text-white" />
			</button>

			<button class="btn btn-soft rounded-full">
				<ArrowUp class="w-4 h-4 text-white" />
			</button>
		</div>
	</div>
</main>
