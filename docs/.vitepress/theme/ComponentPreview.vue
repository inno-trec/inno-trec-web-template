<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { withBase } from 'vitepress';

/** One component running, from the gallery that scripts/build-gallery.mjs builds into docs/public/gallery/. */
const props = defineProps<{ name: string; height?: number }>();
const frame = ref<HTMLIFrameElement>();
const height = ref(props.height ?? 240);
const src = withBase(`/gallery/${props.name}.html`);

function onMessage(event: MessageEvent) {
  if (event.source !== frame.value?.contentWindow || event.data?.type !== 'inno-trec-preview') return;
  height.value = Math.max(props.height ?? 0, Math.ceil(event.data.height));
}
onMounted(() => window.addEventListener('message', onMessage));
onBeforeUnmount(() => window.removeEventListener('message', onMessage));
</script>

<template>
  <figure class="it-preview">
    <iframe ref="frame" :src="src" :title="`${name}, live example`" :style="{ height: `${height}px` }" loading="lazy" />
    <figcaption><a :href="src" target="_blank" rel="noopener">Open the {{ name }} example on its own page</a></figcaption>
  </figure>
</template>
