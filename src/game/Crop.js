import { v4 as uuidv4 } from 'uuid'
import { cropInfoList } from './cropInfoList'

export class Crop {
  constructor({ id, tileIndex}) {
    // 查找作物信息
    const info = cropInfoList.find(c => c.id === id)
    if (!info) {
      throw new Error(`未找到作物 ID: ${id}`)
    }

    // 唯一标识符
    this.uuid = uuidv4()

    // 基础属性（从 cropInfoList 复制）
    this.id = info.id
    this.name = info.name
    this.type = info.type
    this.growthTime = info.growthTime
    this.productId = info.productId
    this.minProduct = info.minProduct
    this.maxProduct = info.maxProduct
    this.level = info.level
    this.upgradeCost = info.upgradeCost
    this.price = info.price
    this.iconYoung = info.iconYoung
    this.iconMature = info.iconMature

    // 运行时属性
    this.tileIndex = tileIndex
    this.elapsedTime = 0
    this.sprite = null
    this.fruitCount = this.getRandomInt(info.minProduct, info.maxProduct)
  }

  // 更新每帧或每秒调用
  update(delta) {
    this.elapsedTime += delta / 1000
    if (this.sprite) {
      if (!this.isMature()) {
        // 可以做小动画，例如摇摆、缩放
        // const scale = 1 + 0.03 * Math.sin(this.elapsedTime * 2)
        // this.sprite.setScale(scale)
      } else {
        this.sprite.setScale(1)
        if (this.sprite.texture.key !== this.iconMature) {
          this.sprite.setTexture(this.iconMature)
        }
      }
    }
  }

  // 离线更新：增加 elapsedTime
  offlineUpdate(seconds) {
    this.elapsedTime += seconds
    if (this.elapsedTime > this.growthTime) this.elapsedTime = this.growthTime
  }

  computeGrowthStage() {
    return Math.min(this.elapsedTime / this.growthTime, 1)
  }

  isMature() {
    return this.elapsedTime >= this.growthTime
  }

  getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min
  }
}
