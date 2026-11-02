<script setup lang="ts">
import { GalleryVerticalEnd, Grid3x3, MoveHorizontal, Play, RotateCcw, Save, Star, TriangleAlert } from '@lucide/vue'
import { computed, ref } from 'vue'
import { I18nT, useI18n } from 'vue-i18n'
import ConfirmDialog from '../components/ConfirmDialog.vue'
import CreditLink from '../components/CreditLink.vue'
import LanguageSwitcher from '../components/LanguageSwitcher.vue'
import { useGame } from '../composables/useGame'

const { t } = useI18n()
const game = useGame()

const hasSavedGame = computed(() => game.hasPausedGame.value || game.hasSavedResults.value)
const confirmOpen = ref(false)

/**
 * Each rule gets an icon so the steps are easy to scan.
 * The swipe and star icons match the ones the game and the board use.
 */
const rules = [
  { icon: GalleryVerticalEnd, key: 'welcome.rule1' },
  { icon: MoveHorizontal, key: 'welcome.rule2' },
  { icon: Grid3x3, key: 'welcome.rule3' },
  { icon: Star, key: 'welcome.rule4' },
] as const

/** Starting over throws away a saved game, so ask first. */
function requestStart() {
  if (hasSavedGame.value) confirmOpen.value = true
  else game.start()
}

function confirmStart() {
  confirmOpen.value = false
  game.start()
}
</script>

<template>
  <main class="page welcome">
    <div class="topbar topbar--end">
      <LanguageSwitcher />
    </div>

    <section class="hero">
      <h1 class="hero__title">
        <span class="hero__brand brand-script">{{ t('app.brand') }}</span>
        <span class="hero__bingo">{{ t('app.bingo') }}</span>
      </h1>
      <p class="hero__tagline">{{ t('welcome.tagline') }}</p>
      <p class="hero__instructions">{{ t('welcome.instructions') }}</p>

      <p v-if="game.hasPausedGame.value" class="hero__resume" data-testid="resume-hint">
        <Save aria-hidden="true" />
        {{ t('welcome.resumeHint', { answered: game.answeredCount.value, total: game.totalQuestions }) }}
      </p>
      <p v-else-if="game.hasSavedResults.value" class="hero__resume" data-testid="results-hint">
        <Save aria-hidden="true" />
        {{ t('welcome.resultsHint') }}
      </p>

      <p v-if="game.loadedCorruptedData.value" class="hero__notice" role="status" data-testid="corrupted-notice">
        <TriangleAlert aria-hidden="true" />
        {{ t('errors.corruptedState') }}
      </p>
      <p v-else-if="!game.storageAvailable" class="hero__notice" role="status" data-testid="storage-notice">
        <TriangleAlert aria-hidden="true" />
        {{ t('errors.storageUnavailable') }}
      </p>

      <div class="hero__actions">
        <button
          v-if="hasSavedGame"
          type="button"
          class="btn btn-primary"
          data-testid="btn-resume"
          @click="game.resume()"
        >
          <Play aria-hidden="true" />
          {{ game.hasSavedResults.value ? t('welcome.viewResults') : t('welcome.resume') }}
        </button>
        <button
          type="button"
          class="btn"
          :class="hasSavedGame ? 'btn-secondary' : 'btn-primary'"
          data-testid="btn-start"
          @click="requestStart"
        >
          <RotateCcw v-if="hasSavedGame" aria-hidden="true" />
          <Play v-else aria-hidden="true" />
          {{ hasSavedGame ? t('welcome.newGame') : t('welcome.start') }}
        </button>
      </div>
    </section>

    <section class="rules" :aria-label="t('welcome.rulesTitle')">
      <h2 class="rules__title">{{ t('welcome.rulesTitle') }}</h2>
      <!-- role="list" keeps list semantics in Safari once list-style is removed. -->
      <ol class="rules__list" role="list">
        <li v-for="rule in rules" :key="rule.key" class="rules__item">
          <component :is="rule.icon" class="rules__icon" aria-hidden="true" />
          <span>{{ t(rule.key) }}</span>
        </li>
      </ol>
    </section>

    <div class="notices">
      <p class="notice"><span aria-hidden="true">&#128286;</span> {{ t('welcome.matureNotice') }}</p>
      <p class="notice"><span aria-hidden="true">&#128274;</span> {{ t('welcome.privacyNotice') }}</p>
      <p class="notice" data-testid="credit">
        <span aria-hidden="true">&#127908;</span> <I18nT keypath="welcome.credit" tag="span">
          <template #name><CreditLink credit="artist" /></template>
        </I18nT>
      </p>
      <p class="notice" data-testid="unofficial-notice">
        <span aria-hidden="true">&#8505;&#65039;</span> <I18nT keypath="welcome.unofficialNotice" tag="span">
          <template #venue><CreditLink credit="venue" /></template>
        </I18nT>
      </p>
    </div>

    <ConfirmDialog
      :open="confirmOpen"
      :message="t('welcome.startOverConfirm')"
      :icon="TriangleAlert"
      :confirm-label="t('results.confirm')"
      :cancel-label="t('results.cancel')"
      @confirm="confirmStart"
      @cancel="confirmOpen = false"
    />
  </main>
</template>

<style scoped>
.welcome {
  gap: 20px;
}

.topbar--end {
  justify-content: flex-end;
}

.hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 12px;
  padding: 24px 20px 28px;
  border-radius: 28px;
  background: rgba(255, 255, 255, 0.72);
  box-shadow: var(--shadow);
  position: relative;
  overflow: hidden;
}

.hero::before,
.hero::after {
  content: '\2764\FE0F';
  position: absolute;
  opacity: 0.12;
  font-size: 5rem;
  pointer-events: none;
}

.hero::before {
  top: -12px;
  left: -8px;
  transform: rotate(-18deg);
}

.hero::after {
  bottom: -18px;
  right: -8px;
  transform: rotate(16deg);
}

.hero__title {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  margin: 0;
  line-height: 1.05;
}

.hero__brand {
  font-size: clamp(1.9rem, 8vw, 2.7rem);
}

.hero__bingo {
  font-size: clamp(3.4rem, 17vw, 5.4rem);
  font-weight: 900;
  letter-spacing: 0.12em;
  color: var(--rose);
  text-shadow:
    0 3px 0 var(--white),
    0 8px 22px rgba(168, 63, 112, 0.3);
}

.hero__tagline {
  margin: 0;
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--berry);
}

.hero__instructions {
  margin: 0;
  max-width: 34ch;
  color: var(--ink-soft);
}

.hero__resume {
  margin: 0;
  padding: 8px 14px;
  border-radius: 12px;
  background: var(--blush);
  color: var(--berry);
  font-size: 0.9rem;
  font-weight: 700;
}

.hero__notice {
  margin: 0;
  padding: 8px 14px;
  border-radius: 12px;
  background: var(--muted);
  color: var(--ink-soft);
  font-size: 0.85rem;
}

.hero__actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 10px;
  margin-top: 8px;
}

.hero__actions .btn {
  min-width: 200px;
  font-size: 1.1rem;
}

.rules {
  padding: 18px 20px;
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.55);
}

.rules__title {
  margin: 0 0 8px;
  font-size: 1rem;
  color: var(--berry);
}

.rules__list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: 8px;
  color: var(--ink-soft);
}

.rules__item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

/* The top margin centers the icon on the first line of text. */
.rules__icon {
  width: 1.25em;
  height: 1.25em;
  margin-top: 0.125em;
  color: var(--berry);
}

.notices {
  display: grid;
  gap: 4px;
}

.notice {
  margin: 0;
  text-align: center;
  font-size: 0.8rem;
  color: var(--muted-text);
}
</style>
