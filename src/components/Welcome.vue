<template>
	<div>
		<div class="mb-4">
			<h1 class="text-2xl font-semibold">
				Better Crafting
			</h1>
			<h2 class="text-xl font-thin">
				Custom Crafting Station Converter
			</h2>
		</div>
		<p class="mb-2 text-justify">
			Hello! This is a quick utility to convert content packs for the
			<a class="text-pink-600 hover:underline focus:underline" href="https://www.nexusmods.com/stardewvalley/mods/6293" rel="noopener noreferrer">Custom Crafting Stations</a>
			mod to a format usable by Better Crafting.
		</p>
		<p class="text-justify">
			To use this, just drag the <code class="bg-gray-100 p-1">content.json</code>
			from a Custom Crafting Stations content pack here, and I'll do the rest.
		</p>
		<div class="mt-10 flex justify-center">
			<button @click="pickFile" class="bg-pink-300 hover:bg-pink-600 focus:bg-pink-600 hover:text-white focus:text-white p-2 rounded-full px-4">
				<i class="mx-1 fa fa-upload" />
				Open File
			</button>
		</div>
	</div>
</template>

<script type="ts">

export function openFile(contentType, multiple) {
	return new Promise(resolve => {
		const input = document.createElement('input');
		input.type = 'file';
		input.accept = contentType;
		input.multiple = multiple;

		let resolved = false;

		input.onchange = () => {
			if ( ! resolved ) {
				resolved = true;
				const files = Array.from(input.files);
				resolve(multiple ? files : files[0])
			}
		}

		input.click();
	})
}

export default {

	emits: ['pick-files'],

	methods: {
		async pickFile() {
			const file = await openFile('application/json', false);
			this.$emit('pick-files', [file]);
		}
	}

}

</script>
