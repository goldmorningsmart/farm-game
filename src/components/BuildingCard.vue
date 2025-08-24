<template>
    <div class="bg-white rounded-xl shadow hover:shadow-lg transition cursor-pointer flex flex-col items-center p-4 h-96"
        @click="emit('open-recipes', building)">
        <!-- 图标 -->
        <img v-if="building.icon" :src="building.icon" class="w-16 h-16 mb-2 object-contain" alt="building icon" />

        <!-- 名称 + 等级 -->
        <h3 class="text-lg font-bold text-center">
            {{ building.name }} (Lv.{{ building.level }})
        </h3>

        <!-- 描述 -->
        <p class="text-xs text-gray-600 text-center">
            {{ building.description }}
        </p>
        <div v-if="building.productionQueue.length==0" class="mt-2 w-full">
                <h4 class="text-sm font-semibold text-gray-700 mb-1">没有物品正在生产</h4>
        </div>
        <!-- 生产队列 -->
        <div v-if="building.productionQueue.length" class="mt-2 w-full">
            <h4 class="text-sm font-semibold text-gray-700 mb-1">生产中:</h4>

            <div v-for="(task, index) in building.productionQueue.slice(0, 5)" :key="task.recipeId + '-' + index"
                class="flex items-center gap-2 p-2 mb-1 bg-gray-50 rounded-lg shadow-sm w-[70%] sm:w-full mx-auto">
                <!-- 配方图标 -->
                <img v-if="task.productIcon" :src="task.productIcon" class="w-6 h-6 object-contain" alt="task icon" />

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
                <el-button type="danger" size="small" circle plain
                    @click.stop="emit('cancel-task', { building, index })">
                    x
                </el-button>
            </div>

            <!-- 超过 5 个的提示 -->
            <div v-if="building.productionQueue.length > 5" class="text-xs text-gray-500 italic">
                还有 {{ building.productionQueue.length - 5 }} 个任务排队中...
            </div>
        </div>
    </div>
</template>

<script setup>
import { defineProps, defineEmits } from "vue"

defineProps({
    building: { type: Object, required: true },
})


const emit = defineEmits(["open-recipes", "cancel-task"])

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
</script>
