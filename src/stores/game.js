// stores/game.js
import { defineStore } from 'pinia'
import { buildingInfoList } from '../game/buildingInfoList'

export const useGameStore = defineStore('game', {
  state: () => ({
    user: null,
    coins: 888,
    farm: Array(25).fill(null), 
    lastSaveTime: null,       
    unlockedCrops: [10001],     
    unlockedBuildings: []       
  }),
  actions: {
    login(username) { this.user = username },

    plant(index, crop) {
      if (!this.farm[index] && this.coins >= 5) {
        if (this.unlockedCrops.includes(crop.id)) {
          this.farm[index] = crop
          this.coins -= 5
        } else {
          console.log(`植物 ${crop.name} 尚未解锁`)
        }
      }
    },

    harvest(index) {
      const crop = this.farm[index]
      if (crop && crop.isMature()) {
        const reward = crop.harvest()
        this.coins += reward
        this.farm[index] = null
      }
    },

    unlockCrop(cropId) {
      if (!this.unlockedCrops.includes(cropId)) {
        this.unlockedCrops.push(cropId)
        console.log(`解锁植物 ID: ${cropId}`)
      }
    },

    unlockBuilding(buildingId) {
      if (!this.unlockedBuildings.includes(buildingId)) {
        this.unlockedBuildings.push(buildingId)
        console.log(`解锁建筑 ID: ${buildingId}`)
      }
    },

    /** 购买建筑：金币检查 + 重复购买检查 */
    buyBuilding(buildingId) {
      const building = buildingInfoList.find(b => b.id === buildingId)
      if (!building) {
        return { success: false, msg: "未知建筑" }
      }
      if (this.unlockedBuildings.includes(buildingId)) {
        return { success: false, msg: "已拥有该建筑" }
      }
      if (this.coins < building.price) {
        return { success: false, msg: "金币不足" }
      }
      this.coins -= building.price
      this.unlockBuilding(buildingId)
      return { success: true, msg: `成功购买 ${building.name}` }
    }
  }
})
