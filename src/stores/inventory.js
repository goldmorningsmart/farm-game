import { defineStore } from 'pinia'
import { Item } from '../game/inventoryItem.js'
import { useGameStore } from '@/stores/game.js'

export const useInventoryStore = defineStore('inventory', {
  state: () => ({
    items: []  // Item 实例数组
  }),
  actions: {
    addItem(itemData) {
      const exist = this.items.find(i => i.id === itemData.id)
      if (exist) {
        exist.add(itemData.count)
      } else {
        this.items.push(new Item(itemData))
      }
      console.log(this.items)
    },

    removeItem(id, count = 1) {
      const item = this.items.find(i => i.id === id)
      if (item) {
        item.remove(count)
        if (item.isEmpty()) {
          this.items = this.items.filter(i => i.id !== id)
        }
      }
    },

    getItemCount(id) {
      const item = this.items.find(i => i.id === id)
      return item ? item.count : 0
    },

    // 购买物品
    buyItem(id, count = 1, pricePerUnit = 10) {
      const game = useGameStore()
      const totalPrice = pricePerUnit * count

      if (game.coins < totalPrice) {
        console.log(`金币不足，购买 ${id} 需要 ${totalPrice}，当前 ${game.coins}`)
        return false
      }

      game.coins -= totalPrice
      this.addItem({ id, count })
      console.log(`购买 ${id} ×${count}, 花费 ${totalPrice} 金币, 余额 ${game.coins}`)
      return true
    },

    // 出售物品
    sellItem(id, count = 1, pricePerUnit = 5) {
      const game = useGameStore()
      const item = this.items.find(i => i.id === id)

      if (!item || item.count < count) {
        console.log(`库存不足，无法出售 ${id} ×${count}`)
        return false
      }

      this.removeItem(id, count)
      const totalEarn = pricePerUnit * count
      game.coins += totalEarn
      console.log(`出售 ${id} ×${count}, 获得 ${totalEarn} 金币, 余额 ${game.coins}`)
      return true
    }
  }
})
