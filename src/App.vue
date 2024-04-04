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
						<Welcome
							v-else-if="! original"
							@pick-files="addFiles"
						/>
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
								<textarea @click="focusMe" spellcheck="false" class="pl-2 h-96 w-full bg-transparent font-mono">{{ JSON.stringify(converted, null, 2) }}</textarea>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<script lang="ts">

import Welcome from './components/Welcome.vue';
import DropZone from './components/DropZone.vue';

import JSON5 from 'json5';

import { CCSSchema, CPSchema, convert } from './formats.ts';

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

export default {

	components: {
		Welcome,
		DropZone
	},

	data() {
		return {
			original: null,
			converted: null,
			file: null,
			generated_names: false,
			tiles: null,
			error: false,
			loading: false
		} as {
			original: CCSSchema | null,
			converted: CPSchema | null,
			error: boolean | string,
			generated_names: boolean,
			tiles: string[] | null,
			loading: boolean
		}
	},

	methods: {
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

			} catch(err) {
				console.error(err);
				this.error = String(err);
				this.loading = false;
				this.converted = null;
				this.tiles = null;
				this.generated_names = false;
				return;
			}

			this.original = data;
			this.converted = result;
			this.tiles = tiles;
			this.loading = false;

			console.log('got file', raw);
		}
	}

}

</script>

