<template>
  <div class="p-4 bg-blue-50 rounded shadow w-full max-w-[600px] relative mx-auto">

    <!-- 物品网格 -->
    <div class="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
      <el-tooltip v-for="item in pagedItems" :key="item.id" class="relative" :hide-after="0" :show-after="0" effect="dark" placement="top">
        <template #content>
          <div class="max-w-[100px]">
            {{ item.desc || '没有描述' }}
          </div>
        </template>

        <!-- 物品卡片 -->
        <div class="relative bg-white rounded-lg shadow p-2 cursor-pointer hover:shadow-lg transition"
          :class="getBgClass(item.level)" @click="selectItem(item)">
          <!-- 图片 -->
          <img :src="item.icon" alt="" class="w-16 h-16 mx-auto" />

          <!-- 名称 -->
          <div class="text-center text-sm mt-1 truncate">{{ item.name }}</div>

          <!-- 价格 -->
          <div class="absolute top-1 left-1 text-xs text-blue-700">
            💰{{ item.buyPrice }}
          </div>

          <!-- 购买数量微型控件 -->
          <div class="mt-1 flex justify-center items-center gap-1 text-sm">
            <button class="w-5 h-5 bg-gray-300 rounded text-xs" @click.stop="decrease(item)">-</button>
            <span class="w-6 text-center">{{ buySelections[item.id] || 0 }}</span>
            <button class="w-5 h-5 bg-gray-300 rounded text-xs" @click.stop="increase(item)">+</button>
          </div>
        </div>
      </el-tooltip>
    </div>

    <!-- 分页 -->
    <div class="flex justify-center mt-4">
      <el-pagination
        v-model:current-page="currentPage"
        :page-size="pageSize"
        :total="itemInfoList.length"
        layout="prev, pager, next"
        small
      />
    </div>

    <!-- 底部购买栏 -->
    <div class="mt-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
      <div class="font-bold text-blue-700 text-center sm:text-left">
        💰 预计花费: {{ totalBuyPrice }}
      </div>
      <div class="flex justify-center sm:justify-end gap-2">
        <el-button size="small" type="success" @click="confirmBuy">确认购买</el-button>
        <el-button size="small" @click="cancelBuy">清空</el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useInventoryStore } from '@/stores/inventory'
import { useGameStore } from '@/stores/game'
import { ElMessage } from "element-plus"
import { itemInfoList } from '@/game/itemInfoList.js'


const inventory = useInventoryStore()
const game = useGameStore()

const selectedItem = ref(null)
const buySelections = ref({})  // { itemId: 数量 }

const currentPage = ref(1)
const pageSize = 12  // 每页显示 12 个

// 当前页物品
const pagedItems = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return itemInfoList.slice(start, start + pageSize)
})

// 预计总价
const totalBuyPrice = computed(() => {
  return itemInfoList.reduce((sum, item) => {
    const count = buySelections.value[item.id] || 0
    return sum + (count * (item.buyPrice || 0))
  }, 0)
})

function selectItem(item) {
  selectedItem.value = item
}

// 微型加减控件
function increase(item) {
  if (!buySelections.value[item.id]) buySelections.value[item.id] = 0
  buySelections.value[item.id]++
}

function decrease(item) {
  if (!buySelections.value[item.id]) buySelections.value[item.id] = 0
  if (buySelections.value[item.id] > 0) buySelections.value[item.id]--
}

// 确认购买
function confirmBuy() {
  const totalCost = totalBuyPrice.value
  if (totalCost > game.coins) {
    ElMessage.error("金币不足，无法购买！")
    return
  }

  // 扣金币 & 加物品
  game.coins -= totalCost
  for (const item of itemInfoList) {
    const count = buySelections.value[item.id] || 0
    if (count > 0) {
      inventory.addItem({id:item.id, count:count}) // 需要 store 有 addItem 方法
    }
  }

  if (totalCost > 0) {
    ElMessage.success(`成功购买，花费 ${totalCost} 金币！`)
  }
  cancelBuy()
}

function cancelBuy() {
  buySelections.value = {}
}

function getBgClass(level) {
  switch (level) {
    case 1: return "bg-white border-2 border-gray-300"
    case 2: return "bg-green-100 border-2 border-green-500"
    case 3: return "bg-blue-100 border-2 border-blue-500"
    case 4: return "bg-purple-100 border-2 border-purple-500"
    case 5: return "bg-red-100 border-2 border-red-500"
    case 6: return "bg-amber-100 border-2 border-amber-500"
    default: return "bg-white border border-gray-300"
  }
}
</script>
