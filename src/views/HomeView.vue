<template>
  <div class="h-screen bg-gradient-to-b from-green-100 to-green-300 p-6">
    <!-- 返回按钮 -->
    <el-button type="primary" @click="router.push('/farm')" class="mb-4">🏡 返回农场</el-button>

    <!-- 玩家信息 -->
    <div class="flex items-center space-x-4 mb-6">
      <div>
        <h1 class="text-xl font-bold">👤 {{ game.user }}</h1>
        <p class="text-lg">
          💰 金币: <span class="font-bold text-yellow-600">{{ game.coins }}</span>
        </p>
      </div>
      <el-button type="warning" class="ml-auto" @click="inventoryVisible = true">仓库</el-button>
    </div>

    <!-- 外层：固定高度上下文 + 禁止横向溢出 -->
    <div class="flex flex-col h-[70vh] min-h-0 overflow-x-hidden">
      <!-- 标题固定在顶部，不随内容滚动 -->
      <h2 class="text-lg font-bold mb-4 flex-none">🏠 我的建筑物</h2>

      <!-- 仅列表区域滚动 -->
      <el-scrollbar class="flex-1 min-h-0" height="100%" wrap-class="overflow-x-hidden"
        view-class="max-w-full overflow-x-hidden">
        <!-- 用与 gutter/2 相同的左右 padding 来“抵消” el-row 的负外边距 -->
        <div class="px-2 sm:px-2"> <!-- gutter = 16 => 16/2 = 8px ≈ px-2 -->
          <el-row :gutter="16" class="w-full" style="margin-left:0;margin-right:0">
            <el-col v-for="building in buildings" :key="building.id" :xs="24" :sm="12" :md="8" :lg="6" :xl="4"
              class="mb-4">
              <div
                class="bg-white rounded-xl shadow hover:shadow-lg transition cursor-pointer flex flex-col items-center p-4 h-96"
                @click="openRecipes(building)">
                <img v-if="building.icon" :src="building.icon" class="w-16 h-16 mb-2 object-contain"
                  alt="building icon" />
                <h3 class="text-lg font-bold text-center">
                  {{ building.name }} (Lv.{{ building.level }})
                </h3>
                <p class="text-xs text-gray-600 text-center">
                  {{ building.description }}
                </p>

                <div v-if="building.productionQueue.length" class="mt-2 w-full">
                  <h4 class="text-sm font-semibold text-gray-700 mb-1">生产中:</h4>

                  <div v-for="(task, index) in building.productionQueue.slice(0, 5)" :key="task.recipeId + '-' + index"
                    class="flex items-center gap-2 p-2 mb-1 bg-gray-50 rounded-lg shadow-sm">
                    <!-- 配方图标 -->
                    <img v-if="task.productIcon" :src="task.productIcon" class="w-6 h-6 object-contain"
                      alt="task icon" />

                    <!-- 名称 + 数量 -->
                    <div class="flex-1">
                      <div class="text-xs font-bold text-gray-800 truncate">
                        {{ task.name }} ×{{ task.count }}
                      </div>

                      <!-- 剩余时间 + 进度条 -->
                      <div class="flex items-center gap-1 text-[10px] text-gray-500">
                        <span>{{ formatTime(task.remainingTime) }}</span>
                        <el-progress
                          :percentage="Math.max(0, Math.round(((task.baseTime - task.remainingTime) / task.baseTime) * 100))"
                          :stroke-width="6" status="" class="flex-1" />
                      </div>
                    </div>

                    <!-- 取消按钮 -->
                    <el-button type="danger" size="small" circle plain @click.stop="cancelTask(building, index)">
                      x
                    </el-button>
                  </div>

                  <!-- 超过 5 个的提示 -->
                  <div v-if="building.productionQueue.length > 5" class="text-xs text-gray-500 italic">
                    还有 {{ building.productionQueue.length - 5 }} 个任务排队中...
                  </div>
                </div>


              </div>
            </el-col>
          </el-row>
        </div>
      </el-scrollbar>
    </div>


    <!-- 配方窗口 -->
    <el-dialog v-model="recipeVisible" :title="selectedBuilding?.name ? selectedBuilding.name + ' 配方' : '配方'"
      width="400px" :close-on-click-modal="false">
      <div v-if="pagedRecipes.length">
        <div v-for="recipe in pagedRecipes" :key="recipe.id"
          class="flex items-center bg-gray-50 p-3 rounded-lg mb-3 shadow">
          <img :src="recipe.productIcon" class="w-14 h-14 rounded border" />
          <div class="flex-1 px-3">
            <div class="font-bold">{{ recipe.productName }} x{{ recipe.productCount }}</div>
            <div class="text-xs text-gray-600 mt-1">
              <span v-for="mat in recipe.materialList" :key="mat.id" class="mr-2">
                <img :src="mat.icon" class="inline w-5 h-5 align-middle mr-1" />
                {{ mat.name }} x{{ mat.count }}
              </span>
            </div>
          </div>
          <el-button type="success" size="small" @click="produce(recipe)">生产</el-button>
        </div>

        <div class="flex justify-between items-center mt-2">
          <el-button size="small" :disabled="currentPage === 1" @click="prevPage">上一页</el-button>
          <span class="text-xs">{{ currentPage }} / {{ totalPages }}</span>
          <el-button size="small" :disabled="currentPage === totalPages" @click="nextPage">
            下一页
          </el-button>
        </div>
      </div>
      <p v-else class="text-gray-500">暂无配方</p>
    </el-dialog>

    <!-- 背包模态框 -->
    <el-dialog v-model="inventoryVisible" title="我的仓库" width="460px" :close-on-click-modal="false">
      <Inventory />
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, watch } from "vue"
import Inventory from "@/components/InventorySysterm.vue"
import { productionRecipes } from "@/game/productionRecipes.js"
import { itemInfoList } from "@/game/itemInfoList.js"
import { useGameStore } from "../stores/game.js"
import { useInventoryStore } from "@/stores/inventory.js"
import { useBuildingStore } from "@/stores/buildingStore.js"
import { ElMessage } from "element-plus"
import { useRouter } from "vue-router"

const game = useGameStore()
const inventoryStore = useInventoryStore()
const buildingStore = useBuildingStore()

const buildings = computed(() => buildingStore.buildings)
const router = useRouter()
const inventoryVisible = ref(false)
const recipeVisible = ref(false)
const selectedBuilding = ref(null)

// 配方分页
const currentPage = ref(1)
const pageSize = 5
const totalPages = computed(() => Math.ceil(buildingRecipes.value.length / pageSize))
const pagedRecipes = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return buildingRecipes.value.slice(start, start + pageSize)
})

// 打开配方窗口时重置分页
watch(recipeVisible, (val) => {
  if (val) currentPage.value = 1
})

// 根据当前建筑过滤配方
const buildingRecipes = computed(() => {
  if (!selectedBuilding.value?.name) return []
  return productionRecipes
    .filter((r) => r.buildingId === selectedBuilding.value.id)
    .map((r) => ({
      ...r,
      productName: itemInfoList.find((i) => i.id === r.product.id)?.name || "未知物品",
      productCount: r.product.count,
      productIcon: itemInfoList.find((i) => i.id === r.product.id)?.icon || "",
      materialList: r.materials.map((m) => {
        const item = itemInfoList.find((i) => i.id === m.id)
        return {
          ...m,
          name: item?.name || "未知物品",
          icon: item?.icon || "",
        }
      }),
    }))
})

// 打开配方窗口
function openRecipes(building) {
  if (!building) return
  selectedBuilding.value = building
  recipeVisible.value = true
}
function cancelTask(building, index) {
  building.cancelProduction(index, inventoryStore)
}
// 点击生产按钮
function produce(recipe) {
  if (!selectedBuilding.value) {
    ElMessage.error("建筑未正确初始化")
    return
  }
  const success = selectedBuilding.value.startProduction(recipe.id, inventoryStore)
  if (success == 1) {
    ElMessage({
      message: `${selectedBuilding.value.name} 开始生产 ${recipe.productName}`,
      type: "success",
    })
    recipeVisible.value = false
  } else if (success == 2) {
    ElMessage({
      message: `材料不足，无法生产 ${recipe.productName}`,
      type: "warning",
    })
  }
  else if (success == 3) {
    ElMessage({
      message: `生产队列已满，无法生产 ${recipe.productName}`,
      type: "warning",
    })
  }
  else {
    ElMessage({
      message: `未知原因，无法生产 ${recipe.productName}`,
      type: "warning",
    })
  }
}

function formatTime(seconds) {
  if (seconds <= 0) return "0s"
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  const pad = (n) => String(n).padStart(2, "0")
  if (h > 0) return `${pad(h)}:${pad(m)}:${pad(s)}`
  else if (m > 0) return `${pad(m)}:${pad(s)}`
  else return `${s}s`
}

function nextPage() {
  if (currentPage.value < totalPages.value) currentPage.value++
}
function prevPage() {
  if (currentPage.value > 1) currentPage.value--
}



</script>
