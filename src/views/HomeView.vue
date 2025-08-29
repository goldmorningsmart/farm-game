<template>
  <div class="h-screen bg-gradient-to-b from-green-100 to-green-300 p-6">
    <!-- 返回按钮 -->
    <el-button type="primary" @click="router.push('/farm')"
      class="absolute bottom-1 flex flex-col items-center cursor-pointer">🏡 农场</el-button>

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

      <el-scrollbar class="flex-1 min-h-0" height="100%" wrap-class="overflow-x-hidden"
        view-class="max-w-full overflow-x-hidden">
        <div class="px-2 sm:px-2">

          <!-- 桌面端：网格布局 -->
          <div v-if="!isMobile">
            <el-row :gutter="16" class="w-full" style="margin-left:0;margin-right:0">
              <el-col v-for="b in buildings" :key="b.id" :xs="24" :sm="12" :md="8" :lg="6" :xl="4" class="mb-4">
                <BuildingCard :building="b" @open-recipes="openRecipes" @cancel-task="cancelTask" />
              </el-col>
            </el-row>
          </div>

          <!-- 手机端：轮播单卡片 -->
          <div v-else>
            <el-carousel :interval="0" arrow="always" height="420px" indicator-position="outside" indicator-type="dot">
              <el-carousel-item v-for="b in buildings" :key="b.id">
                <BuildingCard :building="b" @open-recipes="openRecipes" @cancel-task="cancelTask" />
              </el-carousel-item>
            </el-carousel>

          </div>

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
    <el-dialog v-model="inventoryVisible" title="我的仓库" :close-on-click-modal="false" class="market-dialog">
      <Inventory />
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from "vue"
import Inventory from "@/components/InventorySysterm.vue"
import { productionRecipes } from "@/game/productionRecipes.js"
import { itemInfoList } from "@/game/itemInfoList.js"
import { useGameStore } from "@/stores/game.js"
import { useInventoryStore } from "@/stores/inventory.js"
import { useBuildingStore } from "@/stores/buildingStore.js"
import { ElMessage } from "element-plus"
import { useRouter } from "vue-router"
import BuildingCard from "@/components/BuildingCard.vue"
const isMobile = ref(false)
onMounted(() => {
  const check = () => {
    isMobile.value = window.innerWidth < 640 // Tailwind sm 断点
  }
  check()
  window.addEventListener("resize", check)
})

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
function cancelTask(task) {

  task.building.cancelProduction(task.index, inventoryStore)
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


function nextPage() {
  if (currentPage.value < totalPages.value) currentPage.value++
}
function prevPage() {
  if (currentPage.value > 1) currentPage.value--
}



</script>

<style>
/* ≥640px（Tailwind 的 sm 断点）后 60% */
@media (min-width: 768px) {
  .market-dialog {
    --el-dialog-width: 80% !important;
  }
}

@media (min-width: 1080px) {
  .market-dialog {
    --el-dialog-width: 60% !important;
  }
}

.custom-carousel .el-carousel__indicators {
  bottom: 10px;
  /* 底部距离 */
  justify-content: center;
  /* 居中 */
}

.custom-carousel .el-carousel__indicator button {
  width: 40px;
  /* 导航条宽度 */
  height: 4px;
  /* 导航条高度，加粗 */
  border-radius: 2px;
  background-color: #ccc;
  opacity: 0.6;
  transition: all 0.3s;
}

.custom-carousel .el-carousel__indicator.is-active button {
  background-color: #333;
  /* 选中颜色 */
  opacity: 1;
}
</style>