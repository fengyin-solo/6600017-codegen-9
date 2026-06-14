import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { STARS, CONSTELLATIONS } from '../data/stars'
import type { Star, MoonPhaseInfo, MoonPhaseName } from '../types'

const SYNODIC_MONTH = 29.53058867  // 朔望月平均周期（天）
// 参考基准：2000年1月6日 18:14 UTC 是已知的新月时刻
const NEW_MOON_JD_2000 = 2451550.26

function dateToJD(d: Date): number {
  return d.getTime() / 86400000 + 2440587.5
}

function getMoonAge(d: Date): number {
  const jd = dateToJD(d)
  let daysSinceNew = (jd - NEW_MOON_JD_2000) % SYNODIC_MONTH
  if (daysSinceNew < 0) daysSinceNew += SYNODIC_MONTH
  return daysSinceNew
}

function getMoonPhaseInfo(d: Date): MoonPhaseInfo {
  const age = getMoonAge(d)
  // 照度：使用余弦函数近似，0=新月, 100=满月
  const illumination = (1 - Math.cos(2 * Math.PI * age / SYNODIC_MONTH)) / 2 * 100
  const isWaxing = age < SYNODIC_MONTH / 2

  let phase: MoonPhaseName
  let phaseNameCn: string
  let observationImpact: string
  let observationScore: number

  // 将周期划分为8个主要月相
  if (age < 1.84566 || age >= 27.6849) {
    phase = 'new'
    phaseNameCn = '新月'
    observationImpact = '夜空极为黑暗，最适合观测深空天体（星云、星团、星系）和暗弱星辰。'
    observationScore = 95
  } else if (age < 5.53699) {
    phase = 'waxingCrescent'
    phaseNameCn = '蛾眉月'
    observationImpact = '月相纤细，仅傍晚可见，夜晚后半段无月光干扰，适合深空观测。'
    observationScore = 85
  } else if (age < 9.22831) {
    phase = 'firstQuarter'
    phaseNameCn = '上弦月'
    observationImpact = '半轮明月，前半夜有中等月光干扰，建议观测远离月球方向的天体。'
    observationScore = 60
  } else if (age < 12.91963) {
    phase = 'waxingGibbous'
    phaseNameCn = '盈凸月'
    observationImpact = '月面大半明亮，月光影响显著，适合观测行星和亮星，不适合深空。'
    observationScore = 35
  } else if (age < 16.61096) {
    phase = 'full'
    phaseNameCn = '满月'
    observationImpact = '整轮明月当空，天空背景极亮，仅适合观测月球表面细节，深空观测不建议。'
    observationScore = 10
  } else if (age < 20.30228) {
    phase = 'waningGibbous'
    phaseNameCn = '亏凸月'
    observationImpact = '月面大半明亮，后半夜有月光干扰，可观测前半夜无月时段。'
    observationScore = 35
  } else if (age < 23.99361) {
    phase = 'lastQuarter'
    phaseNameCn = '下弦月'
    observationImpact = '半轮明月，后半夜升起有干扰，前半夜适合深空观测。'
    observationScore = 60
  } else {
    phase = 'waningCrescent'
    phaseNameCn = '残月'
    observationImpact = '月相纤细，仅黎明前可见，前半夜完全无月光，最佳观测时段。'
    observationScore = 85
  }

  return {
    phase,
    phaseNameCn,
    age,
    illumination,
    isWaxing,
    observationImpact,
    observationScore,
  }
}

export const useSkyStore = defineStore('sky', () => {
  const viewDate = ref(new Date())
  const zoom = ref(1.0)
  const panX = ref(0)
  const panY = ref(0)
  const showLabels = ref(true)
  const showConstLines = ref(true)
  const showGrid = ref(true)
  const selectedStar = ref<Star | null>(null)
  const searchQuery = ref('')
  const latitude = ref(39.9) // Beijing default

  const moonPhase = computed<MoonPhaseInfo>(() => getMoonPhaseInfo(viewDate.value))

  const localSiderealTime = computed(() => {
    const d = viewDate.value
    const jd = d.getTime() / 86400000 + 2440587.5
    const T = (jd - 2451545.0) / 36525.0
    let lst = 280.46061837 + 360.98564736629 * (jd - 2451545.0) + T * T * (0.000387933 - T / 38710000)
    lst = ((lst % 360) + 360) % 360
    return lst / 15 // convert to hours
  })

  const filteredStars = computed(() => {
    if (!searchQuery.value) return []
    const q = searchQuery.value.toLowerCase()
    return STARS.filter(s => s.name.toLowerCase().includes(q)).slice(0, 5)
  })

  function projectStar(ra: number, dec: number, cx: number, cy: number, scale: number): [number, number] {
    const ha = (localSiderealTime.value - ra) * 15 * Math.PI / 180
    const decRad = dec * Math.PI / 180
    const latRad = latitude.value * Math.PI / 180

    const alt = Math.asin(Math.sin(decRad) * Math.sin(latRad) + Math.cos(decRad) * Math.cos(latRad) * Math.cos(ha))
    const az = Math.atan2(-Math.cos(decRad) * Math.sin(ha), Math.sin(decRad) * Math.cos(latRad) - Math.cos(decRad) * Math.sin(latRad) * Math.cos(ha))

    if (alt < -0.1) return [-999, -999] // below horizon

    const r = (Math.PI / 2 - alt) * scale * 0.45
    const x = cx + panX.value + r * Math.sin(az)
    const y = cy + panY.value - r * Math.cos(az)
    return [x, y]
  }

  function starRadius(mag: number): number {
    return Math.max(1, 5 - mag) * zoom.value
  }

  function spectralColor(spectral: string): string {
    const colors: Record<string, string> = {
      'O': '#9bb0ff', 'B': '#aabfff', 'A': '#cad7ff',
      'F': '#f8f7ff', 'G': '#fff4ea', 'K': '#ffd2a1', 'M': '#ffcc6f'
    }
    return colors[spectral] || '#ffffff'
  }

  function selectStar(x: number, y: number, cx: number, cy: number, scale: number) {
    let closest: Star | null = null
    let minDist = 20
    for (const star of STARS) {
      const [sx, sy] = projectStar(star.ra, star.dec, cx, cy, scale)
      const dist = Math.hypot(sx - x, sy - y)
      if (dist < minDist) { minDist = dist; closest = star }
    }
    selectedStar.value = closest
  }

  return {
    viewDate, zoom, panX, panY, showLabels, showConstLines, showGrid,
    selectedStar, searchQuery, latitude, localSiderealTime, filteredStars,
    moonPhase,
    projectStar, starRadius, spectralColor, selectStar,
    STARS, CONSTELLATIONS
  }
})
