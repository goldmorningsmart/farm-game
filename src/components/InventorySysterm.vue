<template>
  <div class="p-4 bg-blue-50 rounded shadow w-full relative mx-auto">

    <div v-if="inventory.items.length === 0" class="text-gray-500 text-center">
      空空如也...
    </div>

    <!-- 网格布局（手机 2 列，平板 3 列，桌面 4 列） -->
    <div class="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 xl:grid-cols-6">
      <el-tooltip v-for="item in pagedItems" :key="item.id" class="relative " :hide-after="0" :show-after="0"
        effect="dark" placement="top">
        <template #content>
          <div class="max-w-[100px]">
            {{ item.desc || '没有描述' }}
          </div>
        </template>

        <!-- 物品卡片 -->
        <div class="relative bg-white rounded-lg shadow p-2 cursor-pointer hover:shadow-lg transition"
          :class="getBgClass(item.level)" @click="!sellMode && selectItem(item)">
          <!-- 图片 -->
          <img :src="item.icon" alt="" class="w-16 h-16 mx-auto" />

          <!-- 名称 -->
          <div class="text-center text-xs mt-1 truncate">{{ item.name }}</div>

          <!-- 数量角标 -->
          <span class="absolute top-1 right-1 bg-green-600 text-white text-xs px-1 rounded-full">
            {{ item.count }}
          </span>
          <!-- 价格信息 -->
          <div v-if="sellMode" class="absolute top-1 left-1 text-xs text-yellow-700">
            💰{{ item.sellPrice }}
          </div>
          <!-- 出售数量微型控件 -->
          <div v-if="sellMode" class="mt-1 flex justify-center items-center gap-1 text-sm">
            <button class="w-5 h-5 bg-gray-300 rounded text-xs"
              :disabled="item.tradeLimit === 2 || item.tradeLimit === 3" @click.stop="decrease(item)">-</button>
            <span class="w-6 text-center">{{ sellSelections[item.id] || 0 }}</span>
            <button class="w-5 h-5 bg-gray-300 rounded text-xs"
              :disabled="item.tradeLimit === 2 || item.tradeLimit === 3" @click.stop="increase(item)">+</button>
          </div>


        </div>
      </el-tooltip>
    </div>

    <!-- 分页 -->
    <div class="flex justify-center mt-4">
      <el-pagination v-model:current-page="currentPage" :page-size="pageSize" :total="inventory.items.length"
        layout="prev, pager, next" size="small" />
    </div>

    <!-- 底部出售栏 -->
    <div class="mt-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2" v-if="sellMode">
      <div class="font-bold text-green-700 text-center sm:text-left">
        💰 预计收入: {{ totalSellPrice }}
      </div>
      <div class="flex justify-center sm:justify-end gap-2">
        <el-button size="small" type="success" @click="confirmSell">确认出售</el-button>
        <el-button size="small" @click="cancelSell">取消</el-button>
      </div>
    </div>

    <!-- 右下角出售按钮 -->
    <el-button v-if="!sellMode" class="absolute bottom-2 right-2" size="small" type="danger" @click="startSell">
      出售
    </el-button>
  </div>
</template>


<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useInventoryStore } from '@/stores/inventory'
import { useGameStore } from '@/stores/game'
import { ElMessage } from "element-plus"

const inventory = useInventoryStore()
const game = useGameStore()

const selectedItem = ref(null)
const sellMode = ref(false)
const sellSelections = ref({})  // { itemId: 数量 }

const currentPage = ref(1)
const pageSize = ref(12)  // 每页显示 12 个（4x3）
function syncPageSize() {
  if (window.innerWidth < 768) { pageSize.value = 4 }
  else if (window.innerWidth < 1280) { pageSize.value = 12 }
  else { pageSize.value = 18 }
  const maxPage = Math.ceil(inventory.items.length / pageSize.value) - 1
  if (currentPage.value > maxPage) currentPage.value = Math.max(maxPage, 0)
}
// 监听窗口大小变化
let timer = null
const onResize = () => {
  clearTimeout(timer)
  timer = setTimeout(syncPageSize, 100) // 简单防抖
}

onMounted(() => {
  syncPageSize()
  window.addEventListener('resize', onResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', onResize)
})
// 当前页物品
const pagedItems = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return inventory.items.slice(start, start + pageSize.value)
})


// 预计总价
const totalSellPrice = computed(() => {
  return inventory.items.reduce((sum, item) => {
    const count = sellSelections.value[item.id] || 0
    return sum + (count * (item.sellPrice || 0))
  }, 0)
})

function selectItem(item) {
  selectedItem.value = item
}

// 出售模式控制
function startSell() {
  sellMode.value = true
  sellSelections.value = {}
}

function cancelSell() {
  sellMode.value = false
  sellSelections.value = {}
}

// 微型加减控件
function increase(item) {
  const max = item.count
  if (!sellSelections.value[item.id]) sellSelections.value[item.id] = 0
  if (sellSelections.value[item.id] < max) sellSelections.value[item.id]++
}

function decrease(item) {
  if (!sellSelections.value[item.id]) sellSelections.value[item.id] = 0
  if (sellSelections.value[item.id] > 0) sellSelections.value[item.id]--
}

// 确认出售
function confirmSell() {
  let totalCoins = 0
  for (const item of inventory.items) {
    const count = sellSelections.value[item.id] || 0
    if (count > 0) {
      inventory.removeItem(item.id, count)
      totalCoins += count * (item.sellPrice || 0)
    }
  }
  if (totalCoins > 0) {
    game.coins += totalCoins
    ElMessage.success(`成功出售，获得 ${totalCoins} 金币！`)
  }
  cancelSell()
}
function getBgClass(level) {
  switch (level) {
    case 1:
      return "bg-white border-2 border-gray-300" // 白
    case 2:
      return "bg-green-100 border-2 border-green-500" // 绿
    case 3:
      return "bg-blue-100 border-2 border-blue-500"   // 蓝
    case 4:
      return "bg-purple-100 border-2 border-purple-500" // 紫
    case 5:
      return "bg-red-100 border-2 border-red-500"     // 红
    case 6:
      return "bg-amber-100 border-2 border-amber-500" // 金
    default:
      return "bg-white border border-gray-300"
  }
}


</script>
