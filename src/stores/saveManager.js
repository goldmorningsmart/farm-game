import { useGameStore } from './game.js'
import { useInventoryStore } from './inventory.js'
import { useBuildingStore } from './buildingStore.js'
import { Crop } from '../game/Crop.js'
import { Item } from '../game/inventoryItem.js'
import router from '../router'
import config from "@/config/index.js";


export const saveManager = {
    // 缓存上一次存档的 JSON 字符串
    lastSaveCache: null,

    /** 保存存档到服务器 */
    async save() {
        try {
            const game = useGameStore()
            const inventory = useInventoryStore()
            const buildingStore = useBuildingStore()

            if (!game.user) {
                console.warn('未登录，跳转到登录页')
                router.push('/login')
                return
            }

            // 更新时间
            game.lastSaveTime = new Date().toISOString()

            const saveData = {
                coins: game.coins,
                farm: game.farm.map(crop => crop ? {
                    uuid: crop.uuid,
                    id:crop.id,
                    elapsedTime: crop.elapsedTime || 0,
                    fruitCount: crop.fruitCount,
                    tileIndex: crop.tileIndex,
                } : null),
                inventory: inventory.items.map(item => ({
                    id: item.id,
                    count: item.count
                })),
                buildings: buildingStore.getSaveData(),
                lastSaveTime: game.lastSaveTime
            }

            // 生成字符串缓存
            const saveStr = JSON.stringify(saveData)

            // 如果和上次一样，就不上传
            if (this.lastSaveCache === saveStr) {
                console.log('⚡ 存档无变化，跳过上传')
                return
            }

            const res = await fetch(config.apiUrl + 'api/save.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: game.user,
                    save: saveData
                })
            })

            const result = await res.json()
            if (result.success) {
                this.lastSaveCache = saveStr // 更新缓存
                console.log('✅ 存档已保存到服务器', saveData)
            } else {
                console.error('❌ 保存失败', result.message)
            }
        } catch (err) {
            console.error('保存存档失败', err)
        }
    },

    /** 从服务器加载存档 */
    async load() {
        try {
            const game = useGameStore()
            const inventory = useInventoryStore()
            const buildingStore = useBuildingStore()

            if (!game.user) {
                console.warn('未登录，跳转到登录页')
                router.push('/login')
                return false
            }

            const res = await fetch(config.apiUrl + 'api/load.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: game.user })
            })

            const data = await res.json()
            if (!data.success) {
                console.warn('没有存档，使用默认数据')
                return false
            }

            // 恢复金币
            game.coins = data.save.coins || 888

            // 恢复背包
            inventory.items = (data.save.inventory || []).map(i => new Item(i))

            // 恢复存档时间
            game.lastSaveTime = data.save.lastSaveTime || null

            // 初始化建筑
            buildingStore.initBuildings(data.save.buildings || null)

            // 离线秒数
            const offlineSeconds = data.save.lastSaveTime
                ? Math.floor((Date.now() - new Date(data.save.lastSaveTime).getTime()) / 1000)
                : 0

            // 农田作物离线生长
            game.farm = (data.save.farm || []).map(c => {
                if (!c) return null
                const crop = new Crop({
                    id: c.id,
                    fruitCount: c.fruitCount,
                    tileIndex: c.tileIndex,
                    uuid: c.uuid
                })
                crop.elapsedTime = c.elapsedTime || 0
                if (offlineSeconds > 0) crop.offlineUpdate(offlineSeconds)
                return crop
            })

            // 建筑离线生产
            if (offlineSeconds > 0) {
                buildingStore.applyOfflineTime(offlineSeconds, inventory)
            }

            // 同步缓存，避免刚加载后第一次保存又重复上传
            this.lastSaveCache = JSON.stringify(data.save)

            console.log('✅ 存档已从服务器加载', data.save)
            return true
        } catch (err) {
            console.error('加载存档失败', err)
            return false
        }
    },
    /** 清除本地存档（不会影响服务器） */
    exit() {
        const game = useGameStore()
        const inventory = useInventoryStore()
        const buildingStore = useBuildingStore()
        game.user = null
        game.coins = null
        game.farm = []
        game.lastSaveTime = null
        inventory.items = []
        buildingStore.initBuildings(null)
        this.lastSaveCache = null

        console.log('🗑️ 本地存档已清除（服务器数据未变动）')
    }
}
