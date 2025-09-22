<template>
    <div class="w-full h-screen relative bg-gray-900">
        <!-- 游戏容器 -->
        <div ref="phaserContainer" class="absolute inset-0"></div>

        <!-- 简易 UI -->
        <div class="absolute top-2 left-2 bg-black/60 text-white p-3 rounded-lg space-y-1 text-sm pointer-events-auto">
            <div>🎮 操作：
                <ul class="list-disc pl-5">
                    <li>左键点击地面：移动</li>
                    <li>左键点击怪物：靠近并攻击</li>
                    <li>左键点击资源：靠近并采集</li>
                </ul>
            </div>
            <div>玩家 HP: {{ ui.hp }}/{{ ui.maxHp }} | 资源：木 {{ ui.wood }} / 石 {{ ui.stone }}</div>
            <div>目标：{{ ui.targetText }}</div>
        </div>
    </div>
</template>

<script setup>
import { onMounted, onBeforeUnmount, ref, reactive } from 'vue'
import Phaser from 'phaser'

// ====== 可调整路径（建议用你自己的资源）======
// 1) 使用 Tiled 导出的 JSON（嵌入式 tileset 图片）：/assets/maps/mapEmbedded.json
// 2) 角色 spritesheet：/assets/player.png （帧大小 32x32，仅示例）
// 3) 怪物 spritesheet：/assets/slime.png （帧大小 32x32，仅示例）
// 4) 若没有素材，可先用 createGeneratedTextures() 生成占位图

import mapJsonUrl from '@/assets/map/main.json'
import playerImg from '@/assets/player.png'
import monsterImg from '@/assets/slime.png'
// 先 import 或使用 public 文件夹
// 方法 A：import
import floorImg from '@/assets/map/resource/floor.png'
import plantImg from '@/assets/map/resource/plant.png'



const MAP_KEY = 'map-embedded'
const MAP_JSON_URL = mapJsonUrl
const PLAYER_IMG = playerImg
const MONSTER_IMG = monsterImg


const phaserContainer = ref(null)
const gameRef = ref(null)

const ui = reactive({ hp: 100, maxHp: 100, wood: 0, stone: 0, targetText: '空闲' })

// ====== Phaser 自定义对象类型 ======
class BootScene extends Phaser.Scene {
    constructor() { super('Boot') }
    preload() {
        this.load.tilemapTiledJSON(MAP_KEY, MAP_JSON_URL)

        // tileset 图片要在这里加载
        this.load.image('floor_tex', floorImg)
        this.load.image('plant_tex', plantImg)

        this.load.spritesheet('player', PLAYER_IMG, { frameWidth: 45, frameHeight: 45 })
        this.load.spritesheet('monster', MONSTER_IMG, { frameWidth: 32, frameHeight: 32 })
    }
    create() {
        createGeneratedTextures(this)
        this.scene.start('Game')
    }
}


class GameScene extends Phaser.Scene {
    constructor() {
        super('Game')
        this.player = null
        this.cursors = null
        this.layers = {}
        this.target = null // { type: 'point'|'monster'|'resource', x, y, ref }
        this.moveSpeed = 80
        this.attackRange = 42
        this.gatherRange = 42
        this.attackCooldown = false
        this.resources = null // 资源组
        this.monsters = null // 怪物组
        this.spawnConfig = {
            resourceRespawnMs: 10000,
            monsterRespawnMs: 12000,
        }
    }

    create() {
        this.load.image('floor_tex', floorImg)
        this.load.image('plant_tex', plantImg)
        // --- 创建地图 ---
        const map = this.make.tilemap({ key: MAP_KEY })

        // 注意第一个参数是 JSON 中 name，第二个参数是 preload 的 key
        const floorTiles = map.addTilesetImage('floor', 'floor_tex', 32, 32, 0, 0)

        const plantTiles = map.addTilesetImage('plant', 'plant_tex', 32, 32, 0, 0)
        const tilesets = [floorTiles, plantTiles]



        // 逐层创建
        map.layers.forEach(layerData => {
            const layer = map.createLayer(layerData.name, tilesets, 0, 0)
            this.layers[layerData.name] = layer
            // 若 Tiled 中设置 collides=true，启用碰撞
            layer.setCollisionByProperty({ collides: true })
        })


        // 世界边界
        this.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
        this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
        console.log(map.width, map.height); // tile 数
        console.log(map.widthInPixels, map.heightInPixels); // 像素数



        // --- 创建玩家 ---
        this.player = this.physics.add.sprite(100, 100, this.textures.exists('player') ? 'player' : 'player_gen', 0)
        this.player.setCollideWorldBounds(true)
        this.player.maxHp = 100
        this.player.hp = 100
        this.player.body.setSize(20, 14)   // 宽 20，高 14，只覆盖脚底
        this.player.body.setOffset(12, 31) // 向右偏移 12px，向下偏移到脚底


        // 动画（若用占位图也可播放）
        // --- 玩家动画 ---
        if (!this.anims.exists('down-walk')) {
            // 向下
            this.anims.create({ key: 'down-walk', frames: this.anims.generateFrameNumbers('player', { start: 0, end: 3 }), frameRate: 8, repeat: -1 })
            this.anims.create({ key: 'down-idle', frames: [{ key: 'player', frame: 0 }], frameRate: 1 })

            // 向左
            this.anims.create({ key: 'left-walk', frames: this.anims.generateFrameNumbers('player', { start: 4, end: 7 }), frameRate: 8, repeat: -1 })
            this.anims.create({ key: 'left-idle', frames: [{ key: 'player', frame: 4 }], frameRate: 1 })

            // 向右
            this.anims.create({ key: 'right-walk', frames: this.anims.generateFrameNumbers('player', { start: 8, end: 11 }), frameRate: 8, repeat: -1 })
            this.anims.create({ key: 'right-idle', frames: [{ key: 'player', frame: 8 }], frameRate: 1 })

            // 向上
            this.anims.create({ key: 'up-walk', frames: this.anims.generateFrameNumbers('player', { start: 12, end: 15 }), frameRate: 8, repeat: -1 })
            this.anims.create({ key: 'up-idle', frames: [{ key: 'player', frame: 12 }], frameRate: 1 })
        }


        // 玩家与地形碰撞
        Object.values(this.layers).forEach(layer => {
            this.physics.add.collider(this.player, layer)
        })

        // --- 创建资源与怪物 ---
        this.resources = this.physics.add.group()
        this.monsters = this.physics.add.group()

        // 你可以在 Tiled 的 object layer 中放置资源/怪物点，这里演示手动放几个
        this.spawnResourceNode(220, 180, 'wood')
        this.spawnResourceNode(320, 260, 'stone')
        this.spawnMonster(420, 220)
        this.spawnMonster(520, 320)

        // 点击地面/目标
        this.input.on('pointerdown', (pointer) => {
            const worldPoint = pointer.positionToCamera(this.cameras.main)
            const hit = this.pickEntityAt(worldPoint.x, worldPoint.y)
            if (hit) {
                if (hit.type === 'monster') {
                    ui.targetText = '攻击怪物'
                    this.setTarget({ type: 'monster', x: hit.ref.x, y: hit.ref.y, ref: hit.ref })
                } else if (hit.type === 'resource') {
                    ui.targetText = '采集资源'
                    this.setTarget({ type: 'resource', x: hit.ref.x, y: hit.ref.y, ref: hit.ref })
                }
            } else {
                ui.targetText = `移动到 (${Math.round(worldPoint.x)}, ${Math.round(worldPoint.y)})`
                this.setTarget({ type: 'point', x: worldPoint.x, y: worldPoint.y })
            }
        })

        // 摄像机跟随
        this.cameras.main.startFollow(this.player, true, 0.1, 0.1)
        this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels)
    }

    update() {
        // 简易“朝目标移动”逻辑
        if (this.target) {
            const { x: tx, y: ty } = this.target
            const dx = tx - this.player.x
            const dy = ty - this.player.y
            const dist = Math.hypot(dx, dy)

            // 判断交互范围
            if (this.target.type === 'monster') {
                const ref = this.target.ref
                if (!ref?.active) { this.clearTarget(); return }
                const tdx = ref.x - this.player.x
                const tdy = ref.y - this.player.y
                const tdist = Math.hypot(tdx, tdy)
                if (tdist <= this.attackRange) {
                    this.player.body.setVelocity(0, 0)
                    this.player.play('player-idle', true)
                    this.attack(ref)
                    return
                }
            } else if (this.target.type === 'resource') {
                const ref = this.target.ref
                if (!ref?.active) { this.clearTarget(); return }
                const tdx = ref.x - this.player.x
                const tdy = ref.y - this.player.y
                const tdist = Math.hypot(tdx, tdy)
                if (tdist <= this.gatherRange) {
                    this.player.body.setVelocity(0, 0)
                    this.player.play('player-idle', true)
                    this.gather(ref)
                    return
                }
            } else if (this.target.type === 'point') {
                if (dist < 8) { // 到达
                    this.player.body.setVelocity(0, 0)
                    this.player.play('player-idle', true)
                    this.clearTarget()
                    return
                }
            }

            // 继续朝目标移动
            if (dist > 1) {
                const vx = (dx / dist) * this.moveSpeed
                const vy = (dy / dist) * this.moveSpeed
                this.player.body.setVelocity(vx, vy)
                if (Math.abs(dx) > Math.abs(dy)) {
                    // 横向为主
                    if (dx > 0) this.player.play('right-walk', true)
                    else this.player.play('left-walk', true)
                } else {
                    // 纵向为主
                    if (dy > 0) this.player.play('down-walk', true)
                    else this.player.play('up-walk', true)
                }

            }
        } else {
            this.player.body.setVelocity(0, 0)
            this.player.body.setVelocity(0, 0)

            const prev = this.player.anims.currentAnim?.key
            if (prev?.includes('left')) this.player.play('left-idle')
            else if (prev?.includes('right')) this.player.play('right-idle')
            else if (prev?.includes('up')) this.player.play('up-idle')
            else this.player.play('down-idle')

        }
    }

    setTarget(t) { this.target = t }
    clearTarget() { this.target = null; ui.targetText = '空闲' }

    pickEntityAt(x, y) {
        // 粗略用边界盒判断点击命中（也可以用 physics.overlapPoint）
        const hitMonster = this.monsters.getChildren().find(m => m.active && m.getBounds().contains(x, y))
        if (hitMonster) return { type: 'monster', ref: hitMonster }
        const hitRes = this.resources.getChildren().find(r => r.active && r.getBounds().contains(x, y))
        if (hitRes) return { type: 'resource', ref: hitRes }
        return null
    }

    attack(monster) {
        if (this.attackCooldown) return
        this.attackCooldown = true
        this.time.delayedCall(400, () => { this.attackCooldown = false })

        // 简单伤害
        monster.hp = (monster.hp ?? 20) - 10
        monster.setTintFill(0xffffff)
        this.time.delayedCall(60, () => monster.clearTint())

        if (monster.hp <= 0) {
            // 击杀
            monster.disableBody(true, true)
            // 掉落：木或石随便掉一个
            if (Math.random() < 0.5) ui.wood += 1; else ui.stone += 1
            // 经验/其他逻辑...

            // 复活
            this.time.delayedCall(this.spawnConfig.monsterRespawnMs, () => {
                monster.enableBody(true, monster.spawnX, monster.spawnY, true, true)
                monster.hp = 20
            })

            this.clearTarget()
        }
    }

    gather(node) {
        if (node.gathering) return
        node.gathering = true

        this.time.delayedCall(600, () => {
            node.gathering = false
            node.amount = (node.amount ?? 3) - 1
            node.setAlpha(0.8)
            if (node.resourceType === 'wood') ui.wood += 1
            if (node.resourceType === 'stone') ui.stone += 1
            if (node.amount <= 0) {
                // 清空并隐藏
                node.disableBody(true, true)
                // 计时恢复
                this.time.delayedCall(this.spawnConfig.resourceRespawnMs, () => {
                    node.enableBody(true, node.spawnX, node.spawnY, true, true)
                    node.amount = 3
                    node.setAlpha(1)
                })
                this.clearTarget()
            }
        })
    }

    spawnResourceNode(x, y, type = 'wood') {
        const key = type === 'wood' ? (this.textures.exists('tree_gen') ? 'tree_gen' : 'player_gen') : (this.textures.exists('rock_gen') ? 'rock_gen' : 'player_gen')
        const node = this.resources.create(x, y, key)
        node.setImmovable(true)
        node.resourceType = type
        node.amount = 3
        node.spawnX = x
        node.spawnY = y
        node.setDepth(1)
        node.setCircle(12) // 简易点击体积
        return node
    }

    spawnMonster(x, y) {
        const key = this.textures.exists('monster') ? 'monster' : 'slime_gen'
        const m = this.monsters.create(x, y, key, 0)
        m.setCollideWorldBounds(true)
        m.spawnX = x
        m.spawnY = y
        m.hp = 20

        // 怪物与地形碰撞
        Object.values(this.layers).forEach(layer => {
            this.physics.add.collider(m, layer)
        })

        // 简易巡逻（来回移动）
        const patrol = () => {
            if (!m.active) return
            const dir = Math.random() < 0.5 ? -1 : 1
            m.setVelocity(dir * 40, 0)
            this.time.delayedCall(1200, () => {
                if (!m.active) return
                m.setVelocity(0, 0)
                this.time.delayedCall(800, patrol)
            })
        }
        patrol()

        return m
    }
}

// ====== 生成占位纹理（没有素材也能跑起来）======
function createGeneratedTextures(scene) {
    if (!scene.textures.exists('player_gen')) {
        const g = scene.make.graphics({ x: 0, y: 0, add: false })
        g.fillStyle(0x4ade80)
        g.fillRect(0, 0, 32, 32)
        g.fillStyle(0x166534)
        g.fillRect(8, 8, 16, 16)
        g.generateTexture('player_gen', 32, 32)
        g.destroy()
    }
    if (!scene.textures.exists('slime_gen')) {
        const g = scene.make.graphics({ x: 0, y: 0, add: false })
        g.fillStyle(0x60a5fa)
        g.fillEllipse(16, 16, 28, 22)
        g.fillStyle(0x1e3a8a)
        g.fillRect(10, 14, 4, 4)
        g.fillRect(18, 14, 4, 4)
        g.generateTexture('slime_gen', 32, 32)
        g.destroy()
    }
    if (!scene.textures.exists('tree_gen')) {
        const g = scene.make.graphics({ x: 0, y: 0, add: false })
        g.fillStyle(0x166534)
        g.fillTriangle(16, 0, 0, 24, 32, 24)
        g.fillTriangle(16, 8, 4, 28, 28, 28)
        g.fillStyle(0x8b5a2b)
        g.fillRect(14, 24, 4, 8)
        g.generateTexture('tree_gen', 32, 32)
        g.destroy()
    }
    if (!scene.textures.exists('rock_gen')) {
        const g = scene.make.graphics({ x: 0, y: 0, add: false })
        g.fillStyle(0x9ca3af)
        g.fillRoundedRect(4, 8, 24, 18, 6)
        g.generateTexture('rock_gen', 32, 32)
        g.destroy()
    }
}

// ====== Vue 生命周期：挂载 Phaser ======
onMounted(() => {
    const config = {
        type: Phaser.AUTO,
        width: phaserContainer.value.clientWidth,
        height: phaserContainer.value.clientHeight,
        parent: phaserContainer.value,
        backgroundColor: '#333',
        physics: { default: 'arcade', arcade: { gravity: { y: 0 }, debug: false } },
        scene: [BootScene, GameScene],
        scale: { mode: Phaser.Scale.RESIZE, autoCenter: Phaser.Scale.CENTER_BOTH },
    }

    gameRef.value = new Phaser.Game(config)
})

onBeforeUnmount(() => {
    if (gameRef.value) {
        gameRef.value.destroy(true)
        gameRef.value = null
    }
})
</script>

<style scoped>
</style>
