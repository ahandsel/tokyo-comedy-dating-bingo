<script setup lang="ts">
import { Check, Star, X } from '@lucide/vue'
import { useI18n } from 'vue-i18n'
import type { GameStats } from '../types/game'

defineProps<{
  hasBingo: boolean
  stats: GameStats
}>()

const { t } = useI18n()
</script>

<template>
  <section class="summary" :class="{ 'summary--bingo': hasBingo }" aria-live="polite">
    <span class="summary__icon" aria-hidden="true">{{ hasBingo ? '🎉' : '💔' }}</span>
    <h1 class="summary__title" data-testid="result-title">
      {{ hasBingo ? t('results.bingoTitle') : t('results.noBingoTitle') }}
    </h1>
    <p class="summary__subtitle" data-testid="result-subtitle">
      {{ hasBingo ? t('results.bingoSubtitle') : t('results.noBingoSubtitle') }}
    </p>
    <dl class="stats" :aria-label="t('results.statsTitle')">
      <div class="stat">
        <dt>{{ t('results.yesCount') }}</dt>
        <dd data-testid="stat-yes"><Check class="stat__icon" aria-hidden="true" />{{ stats.yes }}</dd>
      </div>
      <div class="stat">
        <dt>{{ t('results.noCount') }}</dt>
        <dd data-testid="stat-no"><X class="stat__icon" aria-hidden="true" />{{ stats.no }}</dd>
      </div>
      <div class="stat">
        <dt>{{ t('results.lineCount') }}</dt>
        <dd data-testid="stat-lines">
          <Star class="stat__icon stat__icon--star" fill="currentColor" aria-hidden="true" />{{ stats.winningLines }}
        </dd>
      </div>
    </dl>
  </section>
</template>

<style scoped>
.summary {
  text-align: center;
  display: grid;
  gap: 6px;
}

.summary__icon {
  font-size: 2.2rem;
  line-height: 1;
}

.summary__title {
  margin: 0;
  font-size: clamp(2.4rem, 12vw, 3.6rem);
  font-weight: 900;
  letter-spacing: 0.06em;
  line-height: 1.1;
  color: var(--berry);
}

.summary--bingo .summary__title {
  color: var(--rose);
  text-shadow:
    0 3px 0 var(--white),
    0 8px 22px rgba(168, 63, 112, 0.3);
}

.summary__subtitle {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--ink-soft);
}

.stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  margin: 10px 0 0;
}

.stat {
  display: flex;
  flex-direction: column-reverse;
  align-items: center;
  gap: 2px;
  padding: 10px 6px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.75);
  box-shadow: var(--shadow-soft);
}

.stat dt {
  font-size: 0.72rem;
  font-weight: 700;
  color: var(--ink-soft);
  line-height: 1.2;
}

/* The same marks as the board squares, so the stats double as a legend. */
.stat__icon {
  width: 1.1rem;
  height: 1.1rem;
  stroke-width: 3;
}

.stat__icon--star {
  stroke-width: 2;
  color: var(--gold-deep);
}

.stat dd {
  display: flex;
  align-items: center;
  gap: 4px;
  margin: 0;
  font-size: 1.8rem;
  font-weight: 900;
  color: var(--berry);
  line-height: 1;
}
</style>
