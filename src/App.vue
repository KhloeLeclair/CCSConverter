<template>
	<div>
		<DropZone
			v-if="! original && ! error && ! loading"
			id="overlay"
			class="flex flex-col justify-center items-center"
			:global="true"
			@files-dropped="addFiles"
		>
			<div class="bg-pink-200 dark:bg-pink-800 text-black dark:text-white p-8 rounded-full w-fit text-2xl">
				<div class="when-valid">
					<div>drop to convert this file</div>
				</div>
				<div class="when-invalid">
					<div>invalid file</div>
				</div>
			</div>
		</DropZone>
		<div class="min-h-screen bg-gray-100 dark:bg-gray-800 py-6 flex flex-col justify-center sm:py-12">
			<div class="relative py-3 sm:max-w-xl sm:mx-auto">
				<div class="absolute inset-0 bg-gradient-to-r from-pink-300 to-pink-600 shadow-lg transform -skew-y-6 sm:skew-y-0 sm:-rotate-6 sm:rounded-3xl"></div>
				<div class="relative px-4 py-4 bg-white text-black shadow-lg sm:rounded-3xl sm:p-10">
					<div class="max-w-md mx-auto">
						<div v-if="loading" class="flex flex-col justify-center items-center p-20">
							<div><i class="fa fa-refresh fa-spin text-2xl" /></div>
							<div class="font-thin text-xl mt-4">Loading...</div>
						</div>
						<div v-if="error" class="flex flex-col justify-center items-center p-20">
							<div class="text-2xl"><i class="fa fa-exclamation mr-2" /> Oh No!</div>
							<div class="font-thin text-xl mt-4">
								There was an error reading your content file.
							</div>
							<div v-if="(typeof error === 'string')" class="font-thin text-xl mt-4">
								{{ error }}
							</div>
						</div>
						<div v-else-if="! original">
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
						<div v-else-if="need_names">
							<div class="mb-4">
								<h1 class="text-2xl font-semibold">
									Better Crafting
								</h1>
								<h2 class="text-xl font-thin">
									Quick Question!
								</h2>
							</div>
							<p class="text-justify mb-4">
								Your content file has big craftable references, which Custom Crafting station
								handled by name. Content Patcher requires Ids to target big craftables correctly,
								so please enter the Ids for each big craftable here:
							</p>
							<div v-for="(entry, idx) in craftable_names" class="mt-8 mb-4 relative">
								<input
									autocomplete="off"
									:id="`input_${idx}`"
									v-model="entry[1]"
									:placeholder="entry[0]"
									class="peer placeholder-transparent h-10 w-full border-b-2 border-gray-300 text-gray-900 focus:outline-none focus:borer-rose-600"
								/>
								<label :for="`input_${idx}`" class="absolute left-0 -top-3.5 text-gray-600 text-sm peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-440 peer-placeholder-shown:top-2 transition-all peer-focus:-top-3.5 peer-focus:text-gray-600 peer-focus:text-sm font-mono">{{ entry[0] }}</label>
							</div>
							<div class="mt-10 flex justify-center">
								<button @click="need_names = false" class="bg-pink-300 hover:bg-pink-600 focus:bg-pink-600 hover:text-white focus:text-white p-2 rounded-full px-4">
									Done
								</button>
							</div>
						</div>
						<div v-else-if="converted">
							<div class="mb-4">
								<h1 class="text-2xl font-semibold">
									Better Crafting
								</h1>
								<h2 class="text-xl font-thin">
									Your Stations Await...
								</h2>
							</div>
							<p v-if="generated_names" class="text-justify mb-2">
								Not all your stations had names set with <code>TileData</code>, so we had to generate
								a few names. They all have <code>CHANGEME</code> on the end, so make sure you rename
								those before publishing your mod.
							</p>
							<template v-if="tiles?.length">
								<p class="text-justify mb-2">
									We used your <code>TileData</code> names as Ids for your stations. If you're using
									tile actions anywhere to open a crafting station, make sure you update your actions
									for Better Crafting.
								</p>
								<p class="text-justify mb-2">Here's an example map action to open a crafting station:</p>
								<div class="bg-gray-100 p-2 rounded-sm font-mono mb-4">{{ `leclair.bettercrafting_OpenMenu FALSE FALSE ${tiles[0]}` }}</div>
							</template>
							<p class="text-justify mb-4">
								Without further adieu, here's a content file for Content Patcher. Go ahead
								and copy this and save it into a JSON file for a Content Patcher content pack.
							</p>
							<div class="min-w-96 bg-gray-200 py-2 rounded-xl">
								<textarea @click="focusMe" spellcheck="false" class="pl-2 h-96 w-full bg-transparent font-mono">{{ output }}</textarea>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<script lang="ts">

import DropZone from './components/DropZone.vue';

import JSON5 from 'json5';

import { CCSSchema, CPSchema, convert } from './formats.ts';

function openFile(contentType: string, multiple: boolean) {
	return new Promise<File[]>(resolve => {
		const input = document.createElement('input') as HTMLInputElement;
		input.type = 'file';
		input.accept = contentType;
		input.multiple = multiple;

		let resolved = false;

		input.onchange = () => {
			if ( ! resolved ) {
				resolved = true;
				const files = Array.from(input.files as unknown as File[]);
				resolve( files );
			}
		}

		input.click();
	})
}

function readFile(file: File) {

	return new Promise<string>((s, f) => {
		const reader = new FileReader();

		reader.addEventListener('load', event => {
			s(event.target?.result as string);
		});

		reader.addEventListener('error', event => {
			f(event);
		});

		reader.readAsText(file);
	});

}

function escapeRegex(input: string): string {
	return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export default {

	components: {
		DropZone
	},

	data() {
		return {
			original: null,
			converted: null,
			file: null,
			generated_names: false,
			craftable_names: null,
			need_names: false,
			tiles: null,
			error: false,
			loading: false
		} as {
			original: CCSSchema | null,
			converted: CPSchema | null,
			error: boolean | string,
			craftable_names: Record<string, [string, string]> | null,
			generated_names: boolean,
			need_names: boolean,
			tiles: string[] | null,
			loading: boolean
		}
	},

	computed: {
		output() {
			if ( this.converted == null )
				return '';

			let result = JSON.stringify(this.converted, null, 2);

			if (this.craftable_names)
				for(const [key, val] of Object.entries(this.craftable_names)) {
					let replacement = val[1] && val[1].trim().length > 0 ? val[1] : val[0];
					result = result.replace(new RegExp(escapeRegex(key), 'g'), replacement);
				}

			return result;
		}
	},

	methods: {
		async pickFile() {
			const files = await openFile('application/json', false);
			this.addFiles(files);
		},

		focusMe(event: MouseEvent) {
			const target = event.target as HTMLTextAreaElement;
			target.focus();
			target.select();
		},

		async addFiles(files: File[]) {
			if ( this.loading )
				return;

			this.generated_names = false;
			this.tiles = null;
			this.error = false;
			this.loading = true;
			this.converted = null;
			this.need_names = false;
			this.craftable_names = null;

			let raw: string,
				data: CCSSchema,
				tiles: string[],
				result: CPSchema;

			try {
				raw = await readFile(files[0]);
				const res = CCSSchema.safeParse(JSON5.parse(raw));
				if (! res.success)
					throw new Error(JSON.stringify(res.error, null, '\t'));
				data = res.data;

				const output = convert(data);
				result = output.schema;
				tiles = output.tiles;
				this.generated_names = output.generated;
				this.craftable_names = output.bcnames;
				this.need_names = Object.keys(output.bcnames).length > 0;

			} catch(err) {
				console.error(err);
				this.error = String(err);
				this.loading = false;
				return;
			}

			this.original = data;
			this.converted = result;
			this.tiles = tiles;
			this.loading = false;
		}
	}

}

</script>

