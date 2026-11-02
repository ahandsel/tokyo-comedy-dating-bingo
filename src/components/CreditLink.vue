<script setup lang="ts">
import { ExternalLink } from '@lucide/vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps<{ credit: 'artist' | 'venue' }>()

const { t } = useI18n()

/** Credit links open in a new tab so the game stays where the player left it. */
const links = {
  artist: { href: 'https://linktr.ee/babypinkhaus', labelKey: 'welcome.creditName' },
  venue: { href: 'https://www.tokyocomedybar.com/', labelKey: 'welcome.creditVenue' },
} as const

const link = computed(() => links[props.credit])
const label = computed(() => t(link.value.labelKey))
</script>

<template>
  <a
    class="credit-link"
    :href="link.href"
    target="_blank"
    rel="noopener noreferrer"
    :aria-label="t('welcome.newTabLink', { label })"
    :data-testid="`credit-${credit}-link`"
  >{{ label }}<ExternalLink class="credit-link__icon" aria-hidden="true" /></a>
</template>

<style scoped>
.credit-link {
  color: var(--berry);
  font-weight: 700;
  text-decoration: underline;
  text-underline-offset: 2px;
  /* Keep each linked name on one line. */
  white-space: nowrap;
}

/* Shows that the link opens a new tab; the link's aria-label says the same to screen readers. */
.credit-link__icon {
  width: 0.95em;
  height: 0.95em;
  margin-left: 2px;
  vertical-align: -0.1em;
}
</style>
