// stores/buildingStore.js
import { defineStore } from 'pinia'
import { reactive } from 'vue'
import { Building } from '@/game/Building.js'
import { buildingInfoList } from '@/game/buildingInfoList.js'

export const useBuildingStore = defineStore('building', {
  state: () => ({
    buildings: []
  }),

  actions: {
    /** 初始化建筑列表，支持加载存档 */
    initBuildings(savedBuildings = null) {
      const savedMap = new Map()
      if (savedBuildings && savedBuildings.length > 0) {
        savedBuildings.forEach(b => savedMap.set(b.id, b))
      }

      // 遍历所有静态建筑信息，自动补齐缺失的建筑
      this.buildings = buildingInfoList.map(info => {
        const b = savedMap.get(info.id)

        // 存档优先，没有则用默认配置
        const building = new Building({
          ...info,
          level: b?.level || info.level || 1,
        })

        building.productionQueue = reactive((b?.productionQueue || []).map(t => ({ ...t })))
        building.experience = b?.experience || 0
        building.expToNextLevel = b?.expToNextLevel || 100

        return building
      })

      // 检查存档里是否有未知建筑（可能以后删掉或替换用的）
      const extraBuildings = []
      savedMap.forEach((b, id) => {
        if (!buildingInfoList.find(info => info.id === id)) {
          extraBuildings.push(b)
        }
      })
      if (extraBuildings.length > 0) {
        console.warn("存档包含未知建筑，已忽略：", extraBuildings.map(b => b.id))
      }

      if (!savedBuildings || savedBuildings.length === 0) {
        console.log("没有存档，已创建默认建筑列表")
      } else {
        console.log("已从存档恢复建筑，并补齐缺失建筑")
      }
    },

    /** 实时更新建筑生产 */
    updateAll(deltaTime, inventoryStore) {
      this.buildings.forEach(b => b.update(deltaTime, inventoryStore))
    },

    /** 返回可保存的数据（只存动态部分） */
    getSaveData() {
      return this.buildings.map(b => ({
        id: b.id,
        level: b.level,
        experience: b.experience,
        expToNextLevel: b.expToNextLevel,
        productionQueue: b.productionQueue.map(task => ({ ...task }))
      }))
    },

    /**
     * 离线时间顺序抵扣生产队列
     * @param {Number} offlineSeconds 离线时间（秒）
     * @param {Object} inventoryStore 背包 store，用于产出物品
     */
    applyOfflineTime(offlineSeconds, inventoryStore) {
      this.buildings.forEach(building => {
        if (!building.productionQueue || building.productionQueue.length === 0) return

        let remainingTime = offlineSeconds

        // 顺序消耗生产队列
        for (let i = 0; i < building.productionQueue.length; i++) {
          const task = building.productionQueue[i]
          const timeLeft = task.remainingTime

          if (remainingTime >= timeLeft) {
            // 任务完成
            remainingTime -= timeLeft

            inventoryStore.addItem({ id: task.productId, count: task.count })
            console.log(task.productId)
            // 移除已完成任务
            building.productionQueue.splice(i, 1)
            i-- // 删除后数组索引回退
          } else {
            // 当前任务未完成，减少剩余时间
            task.remainingTime -= remainingTime
            remainingTime = 0
            break
          }
        }
      })
    }
  }
})
