// src/game/inventoryItem.js
import { itemInfoList } from './itemInfoList.js'

export class Item {
  constructor({ id, count }) {
    this.id = id
    this.count = count

    // 根据 id 找到物品信息
    const info = itemInfoList.find(i => i.id === id)
    if (info) {
      this.name = info.name
      this.icon = info.icon
      this.desc = info.desc
      this.buyPrice = info.buyPrice
      this.sellPrice  = info.sellPrice
      this.level = info.level
      this.tradeLimit = info.tradeLimit
    } else {
      this.name = `未知物品(${id})`
      this.icon = '/assets/items/unknown.png'
    }
  }

  add(count) {
    this.count += count
  }

  remove(count) {
    this.count -= count
    if (this.count < 0) this.count = 0
  }

  isEmpty() {
    return this.count <= 0
  }
}
