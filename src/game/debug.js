import { useGameStore } from '@/stores/game.js'
import { useInventoryStore } from '@/stores/inventory.js'
import { Item } from '@/game/inventoryItem.js'
import { saveManager } from '@/stores/saveManager.js'

// 暴露调试接口（仅用户 test 可用）
export function initDebug() {
    const gameStore = useGameStore()
    const inventoryStore = useInventoryStore()
    if (gameStore.user === 'test') {

        window.__DEBUG = {
            game: gameStore,
            save: () => saveManager.save(),
            load: () => saveManager.load(),
            resetFarm: () => {
                gameStore.farm = Array(gameStore.farm.length).fill(null)
                console.log('农田已清空')
            },
            addCoins: (amount) => {
                gameStore.coins += amount
                console.log(`金币 +${amount}, 当前: ${gameStore.coins}`)
            },
            addItem: (id, count = 1) => {
                const existing = inventoryStore.items.find(i => i.id === id)
                if (existing) {
                    existing.count += count
                } else {
                    inventoryStore.items.push(new Item({ id, count }))
                }
                console.log(`添加物品: ${id} ×${count}`)
            },
            clearSave: () => {
                localStorage.setItem('farmSave', '') // 这里 farm_save 替换成你 saveManager 用的 key
                console.log('存档已清空，请刷新或重新加载游戏')
            }
        }
        console.log('✅ 调试接口已启用，仅 test 用户可用')
    } else {
        console.log('⚠️ 非测试用户，无权限使用调试接口')
    }
}
