// game/Building.js
import { productionRecipes } from "./productionRecipes.js"
import { itemInfoList } from "@/game/itemInfoList.js"

export class Building {
    constructor({
        id,
        name,
        level = 1,
        speedBonus = 0,
        productionBonus = 0,
        price,
        description = "",
        icon,
        limitQueue
    }) {
        this.id = id
        this.name = name
        this.level = level
        this.speedBonus = speedBonus
        this.price = price
        this.productionBonus = productionBonus
        this.description = description
        this.icon = icon
        this.limitQueue = limitQueue

        // 队列: 每个任务 { recipeId, name, remainingTime, count, productId, baseTime }
        this.productionQueue = []
    }

    /** 检查是否有足够材料生产 */
    canProduce(recipeId, inventoryStore) {
        const recipe = productionRecipes.find(
            r => r.id === recipeId && r.buildingId === this.id
        )
        if (!recipe) return false

        return recipe.materials.every(m => inventoryStore.getItemCount(m.id) >= m.count)
    }

    /** 开始生产（加入队列，单队列） */
    /** 开始生产（加入队列，最多5个） */
    startProduction(recipeId, inventoryStore) {
        // 队列已满，不能再加入
        if (this.productionQueue.length >= this.limitQueue) {
            return 3
        }

        const recipe = productionRecipes.find(
            r => r.id === recipeId && r.buildingId === this.id
        )
        if (!recipe) return 2

        // 检查材料
        for (const m of recipe.materials) {
            if (inventoryStore.getItemCount(m.id) < m.count) return 2
            inventoryStore.removeItem(m.id, m.count)
        }
        const item  = itemInfoList.find(
                    r => r.id === recipe.product.id 
                )
        // 计算生产时间和产量
        const baseTime = recipe.productionTime || 60
        const adjustedTime = Math.floor(baseTime * (1 - this.speedBonus))
        const productCount = Math.ceil(recipe.product.count * (1 + this.productionBonus))

        // 加入队列
        this.productionQueue.push({
            recipeId: recipe.id,
            name: recipe.name,
            remainingTime: adjustedTime,
            count: productCount,
            productId: recipe.product.id,
            baseTime: adjustedTime,
            productIcon: item.icon,
        })

        console.log(`${this.name} 开始生产: ${recipe.name} ×${productCount}`)
        return 1
    }
    cancelProduction(index, inventoryStore) {
        if (index < 0 || index >= this.productionQueue.length) {
            return false
        }

        const task = this.productionQueue[index]
        const recipe = productionRecipes.find(r => r.id === task.recipeId)

        if (!recipe) return false

        // 返还材料
        for (const m of recipe.materials) {
            // 返还材料 *生产数量倍数*，否则用户亏了
            const returnCount = m.count * task.count
            inventoryStore.addItem({ id: m.id, count: returnCount })
        }

        // 移除任务
        this.productionQueue.splice(index, 1)

        console.log(`${this.name} 取消生产: ${task.name} ×${task.count} (已返还材料)`)
        return true
    }
    /**
     * 更新队列
     * @param {Number} deltaTime 秒数
     * @param {Object} inventoryStore 背包 store
     * @returns 完成的物品列表 [{id, count}]
     */
    update(deltaTime, inventoryStore) {
        const finishedItems = []

        if (!this.productionQueue.length) return finishedItems

        // 只处理队列头部任务
        const task = this.productionQueue[0]
        task.remainingTime -= deltaTime

        if (task.remainingTime <= 0) {
            const produced = { id: task.productId, count: task.count }
            inventoryStore.addItem(produced)
            finishedItems.push(produced)

            console.log(`${this.name} 完成生产: ${task.name} ×${task.count}`)
            this.productionQueue.shift()
        }

        return finishedItems
    }

    /** 获取队列状态，用于 UI 显示 */
    getQueueStatus() {
        return this.productionQueue.map(task => ({
            name: task.name,
            remainingTime: task.remainingTime,
            progress: 1 - task.remainingTime / task.baseTime
        }))
    }

    /** 获取保存用数据 */
    getSaveData() {
        return {
            id: this.id,
            name: this.name,
            level: this.level,
            speedBonus: this.speedBonus,
            productionBonus: this.productionBonus,
            description: this.description,
            productionQueue: this.productionQueue.map(task => ({ ...task }))
        }
    }
}
