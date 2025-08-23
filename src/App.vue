<template>
  <div id="app">
    <router-view />
  </div>
</template>

<script setup>
import { onMounted, onBeforeUnmount, onUnmounted } from 'vue'
import { saveManager } from '@/stores/saveManager.js'
import { useBuildingStore } from '@/stores/buildingStore.js'
import { useGameStore } from '@/stores/game.js'
import { useInventoryStore } from '@/stores/inventory.js'
import router from '@/router'

const buildingStore = useBuildingStore()
const gameStore = useGameStore()
const inventoryStore = useInventoryStore()

let saveTimer = null
let updateTimer = null

onMounted(async () => {

  updateTimer = setInterval(() => {
    if (gameStore.user == null) {
      router.push('/login')
    } else {
      buildingStore.updateAll(1, inventoryStore)
    }

  }, 1000)

  // 每 10 秒自动保存存档
  saveTimer = setInterval(() => {
    if (gameStore.user == null) {
      router.push('/login')
    } else {
      saveManager.save()
    }
  }, 10000)

  // 页面关闭时保存
  window.addEventListener('beforeunload', saveManager.save)
})

onBeforeUnmount(() => {
  if (updateTimer) clearInterval(updateTimer)
  if (saveTimer) clearInterval(saveTimer)
  window.removeEventListener('beforeunload', saveManager.save)
})


function handleVisibilityChange() {
  if (document.hidden) {
    saveManager.exit();
    router.push('/login')
  }
}

onMounted(() => {
  document.addEventListener("visibilitychange", handleVisibilityChange)
})

onUnmounted(() => {
  document.removeEventListener("visibilitychange", handleVisibilityChange)
})

</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  height: 100%;
  width: 100%;
}
</style>
