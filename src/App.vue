<script setup lang="ts">
import { computed } from 'vue'
import { useGame } from './composables/useGame'
import { useLocaleSideEffects } from './composables/useLocale'
import GameView from './views/GameView.vue'
import ResultsView from './views/ResultsView.vue'
import WelcomeView from './views/WelcomeView.vue'

useLocaleSideEffects()
const game = useGame()

const view = computed(() => {
  switch (game.state.phase) {
    case 'playing':
      return GameView
    case 'results':
      return ResultsView
    default:
      return WelcomeView
  }
})
</script>

<template>
  <Transition name="view" mode="out-in">
    <component :is="view" :key="game.state.phase" />
  </Transition>
</template>
