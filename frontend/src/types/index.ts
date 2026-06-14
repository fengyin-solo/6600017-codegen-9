export interface Star {
  name: string
  ra: number   // right ascension in hours (0-24)
  dec: number  // declination in degrees (-90 to +90)
  mag: number  // apparent magnitude (lower = brighter)
  spectral: string
}

export interface Constellation {
  name: string
  nameCn: string
  stars: number[]  // indices into star array
  lines: [number, number][]  // pairs of star indices
}

export type MoonPhaseName =
  | 'new'        // 新月
  | 'waxingCrescent'  // 蛾眉月（盈）
  | 'firstQuarter'    // 上弦月
  | 'waxingGibbous'   // 盈凸月
  | 'full'       // 满月
  | 'waningGibbous'   // 亏凸月
  | 'lastQuarter'     // 下弦月
  | 'waningCrescent'  // 残月（亏）

export interface MoonPhaseInfo {
  phase: MoonPhaseName
  phaseNameCn: string      // 中文月相名
  age: number              // 月龄 (0 - ~29.53天)
  illumination: number     // 照度百分比 (0 - 100)
  isWaxing: boolean        // 是否处于盈月阶段
  observationImpact: string  // 观测影响提示
  observationScore: number   // 观测条件评分 (0-100, 越高越好)
}
