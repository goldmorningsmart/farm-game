// shopList.js
export const shopList = [
  {
    id: 1,
    name: "种子商店",
    level: 1,
    icon: "./assets/shops/seed_shop.png",
    items: [
      { id: "wheat_seed", name: "小麦种子", price: 5 },
      { id: "corn_seed", name: "玉米种子", price: 8 },
      { id: "rice_seed", name: "水稻种子", price: 10 }
    ]
  },
  {
    id: 2,
    name: "农具商店",
    level: 1,
    icon: "./assets/shops/tool_shop.png",
    items: [
      { id: "hoe", name: "锄头", price: 50 },
      { id: "watering_can", name: "水壶", price: 30 },
      { id: "scythe", name: "镰刀", price: 40 }
    ]
  },
  {
    id: 3,
    name: "面包商店",
    level: 1,
    icon: "./assets/buildings/bread_shop.png",
    items: [
      { id: "fertilizer",price: 20 },
      { id: "fence",  price: 15 },
      { id: "lamp",  price: 25 }
    ]
  }
]
