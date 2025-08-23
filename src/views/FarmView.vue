<template>
  <div class="h-screen relative">
    <div ref="phaserContainer" class="w-full h-full"></div>


    <!-- 集市按钮 -->
    <div class="absolute top-3/4 left-4 flex flex-col items-center cursor-pointer" @click="showMarket = true">
      <span class="mt-1 text-white font-bold bg-black bg-opacity-50 px-2 py-0.5 rounded">集市</span>
      <img src="@/assets/market.png" class="w-16 h-16" />
    </div>

    <!-- 集市购买页面（模态框） -->
    <el-dialog v-model="showMarket" title="集市" width="650px" :close-on-click-modal="false" class="ui-layer">
      <MarketSysterm />
    </el-dialog>

    <!-- 农场按钮 -->
    <div class="absolute top-3/4 right-4 flex flex-col items-center cursor-pointer" @click="goHome">
      <span class="mt-1 text-white font-bold bg-black bg-opacity-50 px-2 py-0.5 rounded">家</span>
      <img src="@/assets/home.png" class="w-16 h-16" />
    </div>


    <!-- 背包按钮 -->
    <el-button class="absolute top-4 right-4 z-50 ui-layer" type="warning" @click="inventoryVisible = true" >
      仓库
    </el-button>

    <!-- 背包模态窗 -->
    <el-dialog v-model="inventoryVisible" title="我的仓库" width="460px" :close-on-click-modal="false">
      <Inventory />
    </el-dialog>

    <!-- 种植选择菜单 -->
    <div v-if="popoverVisible" class="absolute bg-black bg-opacity-90 text-white rounded p-3 w-64 z-50 shadow-lg ui-layer"
      :style="{ left: popoverPosition.x + 'px', top: popoverPosition.y + 'px' }" @click.stop>
      <p class="font-bold mb-2 text-center">选择要种植的作物:</p>
      <div class="grid grid-cols-3 gap-2">
        <div v-for="plant in pagedPlants" :key="plant.id"
          class="flex flex-col items-center cursor-pointer hover:bg-green-700 p-1 rounded"
          @click.stop="plantAt(selectedTileIndex, plant)">
          <img :src="plant.iconMature" class="w-12 h-10 mb-1" />
          <span class="text-xs text-center truncate">{{ plant.name }}</span>
          <span class="text-green-300 text-xs">💰{{ plant.price }}</span>
        </div>
      </div>
      <div class="flex justify-between mt-2">
        <el-button size="small" :disabled="currentPage === 1" @click="prevPage">上一页</el-button>
        <span class="text-xs">{{ currentPage }} / {{ totalPages }}</span>
        <el-button size="small" :disabled="currentPage === totalPages" @click="nextPage">下一页</el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted ,watch} from 'vue'
import Phaser from 'phaser'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'

import { useGameStore } from '../stores/game.js'
import { useInventoryStore } from '../stores/inventory.js'
import Inventory from '../components/InventorySysterm.vue'
import { Crop } from '../game/Crop.js'
import { cropInfoList } from '../game/cropInfoList.js'
import MarketSysterm from "@/components/MarketSysterm.vue" // 刚才写的购买页面

const showMarket = ref(false)
const router = useRouter()
const goHome = () => router.push('/home')

const game = useGameStore()
const inventory = useInventoryStore()
const inventoryVisible = ref(false)

const phaserContainer = ref(null)
let phaserGame = null

// 弹窗状态
const selectedTileIndex = ref(null)
const popoverVisible = ref(false)
const popoverPosition = ref({ x: 0, y: 0 })
let isPopoverActive = false

function closePopover() {
  popoverVisible.value = false
  selectedTileIndex.value = null
  isPopoverActive = false
}

// 分页
const currentPage = ref(1)
const pageSize = 6
const totalPages = computed(() => Math.ceil(cropInfoList.length / pageSize))
const pagedPlants = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return cropInfoList.slice(start, start + pageSize)
})
function nextPage() { if (currentPage.value < totalPages.value) currentPage.value++ }
function prevPage() { if (currentPage.value > 1) currentPage.value-- }

// 格式化剩余时间
function formatTime(seconds) {
  if (seconds < 60) return `${Math.floor(seconds)}s`
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

// 种植作物
function plantAt(index, plantInfo) {
  if (!plantInfo || game.coins < plantInfo.price) {
    ElMessage({ message: `金币不足！`, type: 'warning', duration: 2000 })
    return
  }

  const tile = phaserGame.scene.keys.FarmScene.tiles[index]
  const newCrop = new Crop({
    id: plantInfo.id,
    tileIndex: index
  })

  // 作物精灵
  const img = phaserGame.scene.keys.FarmScene.add.image(tile.x, tile.y - 10, plantInfo.iconYoung).setOrigin(0.5, 0.5)
  img.displayWidth = phaserGame.scene.keys.FarmScene.config.tileWidth
  img.displayHeight = phaserGame.scene.keys.FarmScene.config.tileHeight
  newCrop.sprite = img

  // 名称+剩余时间
  const label = phaserGame.scene.keys.FarmScene.add.text(tile.x, tile.y - 40,
    `${newCrop.name}\n${formatTime(newCrop.growthTime)}`, {
    font: '12px Arial',        // 改成更小的文字，例如 8px
    fill: '#ffffff',
    align: 'center',
    stroke: '#000',
    strokeThickness: 1
  }).setOrigin(0.5, 0.5)
  newCrop.label = label

  // 设置成熟作物可点击收获
  img.setInteractive()
  img.on('pointerdown', () => {
    if (newCrop.isMature()) harvestCropAt(index)
  })
  img.on('pointerover', () => { if (newCrop.isMature()) phaserGame.canvas.style.cursor = 'pointer' })
  img.on('pointerout', () => { phaserGame.canvas.style.cursor = 'default' })

  game.farm[index] = newCrop
  game.coins -= plantInfo.price
  closePopover()
}

function harvestCropAt(index) {
  const crop = game.farm[index]
  if (!crop || !crop.isMature()) return
  const cropInfo = cropInfoList.find(c => c.name === crop.name)
  if (!cropInfo) return

  // 计算作物产量
  const count = Math.floor(Math.random() * (cropInfo.maxProduct - cropInfo.minProduct + 1)) + cropInfo.minProduct
  inventory.addItem({ id: cropInfo.productId, count })

  // 如果是树，额外收获随机木头
  if (crop.type === 'tree') {
    const woodCount = Math.floor(Math.random() * 3) + 1
    inventory.addItem({ id: 20401, count: woodCount })
    ElMessage({ message: `收获 ${crop.name} ×${count} + 木头 ×${woodCount}`, type: 'success' })
  } else {
    ElMessage({ message: `收获 ${crop.name} ×${count}`, type: 'success' })
  }

  // 删除农田上的作物
  if (crop.sprite) crop.sprite.destroy()
  if (crop.label) crop.label.destroy()
  game.farm[index] = null
}

import farmBg from '@/assets/farm_bg.png'
import farmTile from '@/assets/farm_tile.png'
// Phaser 场景
class FarmScene extends Phaser.Scene {
  constructor() {
    super({ key: 'FarmScene' })
    this.config = { rows: 3, cols: 4, tileWidth: 100, tileHeight: 60 }
    this.tiles = []
  }

  preload() {
    this.load.image('farmBg', farmBg)
    this.load.image('farmTile', farmTile)
    cropInfoList.forEach(c => {
      this.load.image(c.iconYoung, c.iconYoung)
      this.load.image(c.iconMature, c.iconMature)
    })
  }

  create() {
    const { rows, cols, tileWidth, tileHeight } = this.config
    const canvasWidth = this.cameras.main.width
    const canvasHeight = this.cameras.main.height
    const bg = this.add.image(canvasWidth / 2, canvasHeight / 2, 'farmBg').setOrigin(0.5, 0.5)
    bg.setScale(canvasWidth / bg.width, canvasHeight / bg.height)

    const originX = this.game.config.width / 2 - tileWidth / 2
    const originY = this.game.config.height / 2 - tileHeight / 2

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x = originX + (col - row) * (tileWidth / 2)
        const y = originY + (col + row) * (tileHeight / 2)
        const tileSprite = this.add.image(x, y, 'farmTile').setOrigin(0.5, 0.5).setInteractive()
        tileSprite.displayWidth = tileWidth
        tileSprite.displayHeight = tileHeight
        const index = row * cols + col
        this.tiles.push({ x, y, sprite: tileSprite })

        // 点击空白位置弹出种植菜单
        tileSprite.on('pointerdown', () => {
          const crop = game.farm[index]
          if (!crop) {
            popoverPosition.value = {
              x: tileSprite.x + phaserContainer.value.getBoundingClientRect().left,
              y: tileSprite.y + phaserContainer.value.getBoundingClientRect().top
            }
            popoverVisible.value = true
            selectedTileIndex.value = index
            currentPage.value = 1
            isPopoverActive = true
          }
        })

        // 恢复存档作物
        const crop = game.farm[index]
        if (crop) {
          const icon = crop.isMature() ? crop.iconMature : crop.iconYoung
          const img = this.add.image(x, y - 10, icon).setOrigin(0.5, 0.5)
          img.displayWidth = tileWidth
          img.displayHeight = tileHeight
          crop.sprite = img

          const remainingTime = crop.isMature() ? 0 : Math.max(crop.growthTime - crop.elapsedTime, 0)
          const label = this.add.text(x, y - 40, `${crop.name}${remainingTime > 0 ? '\n' + formatTime(remainingTime) : ''}`, {
            font: '12px Arial', fill: '#fff', align: 'center', stroke: '#000', strokeThickness: 1
          }).setOrigin(0.5, 0.5)
          crop.label = label

          // 成熟作物可点击收获
          img.setInteractive()
          img.on('pointerdown', () => { if (crop.isMature()) harvestCropAt(index) })
          img.on('pointerover', () => { if (crop.isMature()) phaserGame.canvas.style.cursor = 'pointer' })
          img.on('pointerout', () => { phaserGame.canvas.style.cursor = 'default' })
        }
      }
    }

    // 点击空白关闭弹窗
    this.input.on('pointerdown', (pointer, currentlyOver) => {
      if (currentlyOver.length === 0 && isPopoverActive) closePopover()
    })
  }

  update(time, delta) {
    game.farm.forEach(crop => {
      if (!crop) return
      crop.update(delta)
      if (crop.label && crop.sprite) {
        const remaining = Math.max(crop.growthTime - crop.elapsedTime, 0)
        crop.label.setText(`${crop.name}${crop.isMature() ? '' : '\n' + formatTime(remaining)}`)
        crop.label.x = crop.sprite.x
        crop.label.y = crop.sprite.y - 40
      }
    })
  }
}

onMounted(() => {
    phaserGame = new Phaser.Game({
      type: Phaser.AUTO,
      width: phaserContainer.value.clientWidth,
      height: phaserContainer.value.clientHeight,
      parent: phaserContainer.value,
      backgroundColor: 0xa7d177,
      scene: FarmScene
    })
})

// 组件卸载时清除
onUnmounted(() => {
  if (phaserGame) {
    phaserGame.destroy(true)
    phaserGame = null
  }
})


watch(
  () => router.path,
  (newPath) => {
    if (newPath !== "/farm" && phaserGame) {
      phaserGame.destroy(true)
      phaserGame = null
    }
  }
)
</script>

<style>
.phaser-container {
  width: 100%;
  height: 100%;
  display: block;
}

.ui-layer {
  pointer-events: auto;
}
</style>
