<template>
	<div
		ref="container"
		:class="{active: isDragging, invalid: badDrag}"
	>
		<slot></slot>
	</div>
</template>

<script lang="ts">

export default {

	props: {
		global: {
			type: Boolean,
			default: false
		}
	},

	emits: [
		'files-dropped'
	],

	data() {
		return {
			active: null,
			isDragging: false,
			badDrag: false
		} as {
			active: HTMLElement | null,
			isDragging: boolean,
			badDrag: boolean
		};
	},

	watch: {
		global() {
			this.install();
		}
	},

	created() {
		this.onDrop = this.onDrop.bind(this);
		this.onDragEnter = this.onDragEnter.bind(this);
		this.onDragOver = this.onDragOver.bind(this);
		this.onDragLeave = this.onDragLeave.bind(this);
	},

	mounted() {
		this.install();
	},

	unmounted() {
		this.uninstall();
	},

	methods: {
		install() {
			const target = this.global
				? document.querySelector<HTMLElement>('html')
				: this.$refs.container as HTMLElement;

			if ( this.active !== target )
				this.uninstall();

			if ( ! target )
				return;

			target.addEventListener('drop', this.onDrop);
			target.addEventListener('dragenter', this.onDragEnter);
			target.addEventListener('dragleave', this.onDragLeave);
			target.addEventListener('dragover', this.onDragOver);

			this.active = target;
		},

		uninstall() {
			if ( ! this.active )
				return;

			this.active.removeEventListener('drop', this.onDrop);
			this.active.removeEventListener('dragenter', this.onDragEnter);
			this.active.removeEventListener('dragleave', this.onDragLeave);
			this.active.removeEventListener('dragover', this.onDragOver);

			this.active = null;
		},

		validate(evt: DragEvent) {
			if( evt.dataTransfer?.items ) {
				for(const item of evt.dataTransfer.items) {
					if ( item?.kind === 'file' && (! item.type?.length || /^application\/json$/.test(item.type)) )
						return true;
				}

				return false;
			}

			// Fallback
			return evt?.dataTransfer?.types && evt.dataTransfer.types.includes('Files');
		},

		onDragEnter(evt: DragEvent) {
			evt.preventDefault();
		},

		onDragLeave(evt: DragEvent) {
			this.isDragging = false;
			evt.preventDefault();
		},

		onDragOver(evt: DragEvent) {
			if ( evt?.dataTransfer?.types && ! evt.dataTransfer.types.includes('Files') ) {
				this.isDragging = false;
				return;
			}

			this.isDragging = true;
			this.badDrag = ! this.validate(evt);
			evt.preventDefault();
		},

		onDrop(evt: DragEvent) {
			this.isDragging = false;
			evt.preventDefault();

			const files: File[] = [];
			if (evt.dataTransfer?.files )
				for(const file of evt.dataTransfer.files) {
					if ( file?.type && /^application\/json$/.test(file.type) )
						files.push(file);
				}

			if ( ! files.length )
				return;

			this.$emit('files-dropped', files);
		}
	}
}

</script>
