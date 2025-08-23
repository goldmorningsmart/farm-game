export const productionRecipes = [
  //石磨
  {
    id: 40101,
    name: "小麦粉",
    buildingId: 30001,       // 生产建筑
    materials: [              // 原材料 (物品id:数量)
      { id: 20101, count: 5 },  // 小麦 x5
    ],
    product: { id: 20201, count: 1 }, // 小麦粉 x1
    productionTime: 900       // 生产时间，单位秒
  },
  //烤箱
  {
    id: 40201,
    name: "面包",
    buildingId: 30002,
    materials: [
      { id: 20201, count: 1 },  // 小麦粉 x1
      { id: 20401, count: 1 },
    ],
    product: { id: 20301, count: 5 }, // 面包 x5
    productionTime: 1800
  },
  //烧烤架
  //锅
  //熔炉
  {
    id: 40501,
    name: "铁锭",
    buildingId: 30005,
    materials: [
      { id: 20401, count: 2 },
      { id: 20403, count: 10 },
    ],
    product: { id: 20405, count: 1 },
    productionTime: 3600
  },
  {
    id: 40502,
    name: "铜锭",
    buildingId: 30005,
    materials: [
      { id: 20401, count: 4 },
      { id: 20404, count: 10 },
    ],
    product: { id: 20406, count: 1 },
    productionTime: 7200
  },
  {
    id: 40503,
    name: "银锭",
    buildingId: 30005,
    materials: [
      { id: 20401, count: 8 },
      { id: 20408, count: 10 },
    ],
    product: { id: 20409, count: 1 },
    productionTime: 14400
  },
    {
    id: 40504,
    name: "金条",
    buildingId: 30005,
    materials: [
      { id: 20401, count: 12 },
      { id: 20412, count: 5 },
    ],
    product: { id: 20413, count: 1 },
    productionTime: 28800
  },
  //魔偶
    {
    id: 40601,
    name: "石头",
    buildingId: 30006,
    materials: [
      { id: 20410, count: 1 },
    ],
    product: { id: 20402, count: 100 },
    productionTime: 36000
  },
      {
    id: 40602,
    name: "铁矿石",
    buildingId: 30006,
    materials: [
      { id: 20410, count: 1 },
    ],
    product: { id: 20403, count: 60 },
    productionTime: 36000
  },
      {
    id: 40603,
    name: "铜矿石",
    buildingId: 30006,
    materials: [
      { id: 20410, count: 1 },
    ],
    product: { id: 20404, count: 40 },
    productionTime: 36000
  },
  {
    id: 40604,
    name: "银矿石",
    buildingId: 30006,
    materials: [
      { id: 20410, count: 1 },
    ],
    product: { id: 20408, count: 10 },
    productionTime: 36000
  },
    {
    id: 40605,
    name: "金矿石",
    buildingId: 30006,
    materials: [
      { id: 20410, count: 1 },
    ],
    product: { id: 20412, count: 1 },
    productionTime: 36000
  },
  //祭坛
  {
    id: 40701,
    name: "魔晶",
    buildingId: 30007,
    materials: [
      { id: 20104, count: 10 },
    ],
    product: { id: 20410, count: 1 },
    productionTime: 36000
  },
  //劈材坊
  {
    id: 40801,
    name: "木头",
    buildingId: 30008,
    materials: [
      { id: 20201, count: 1 },
    ],
    product: { id: 20401, count: 10 },
    productionTime: 3600
  },
  {
    id: 40802,
    name: "木头",
    buildingId: 30008,
    materials: [
      { id: 20104, count: 5 },
    ],
    product: { id: 20401, count: 10 },
    productionTime: 3600
  },
  {
    id: 40803,
    name: "木头",
    buildingId: 30008,
    materials: [
      { id: 20102, count: 5 },
    ],
    product: { id: 20401, count: 10 },
    productionTime: 3600
  }
]
