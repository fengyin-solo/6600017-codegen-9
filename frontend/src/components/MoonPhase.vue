<template>
  <div class="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-4 border border-gray-700">
    <div class="flex items-center justify-between mb-3">
      <h3 class="text-sm font-bold text-blue-400 flex items-center gap-1.5">
        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
        </svg>
        今日月相
      </h3>
      <span class="text-xs px-2 py-0.5 rounded-full"
        :class="scoreBadgeClass">
        观测评分 {{ moon.observationScore }}
      </span>
    </div>

    <div class="flex items-start gap-4">
      <div class="flex-shrink-0">
        <svg :width="80" :height="80" viewBox="-55 -55 110 110">
          <defs>
            <radialGradient id="moonGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stop-color="#fffacd" stop-opacity="0.4"/>
              <stop offset="100%" stop-color="#fffacd" stop-opacity="0"/>
            </radialGradient>
            <clipPath id="moonMask">
              <circle cx="0" cy="0" r="48"/>
            </clipPath>
          </defs>

          <circle cx="0" cy="0" r="52" fill="url(#moonGlow)"/>

          <circle cx="0" cy="0" r="48" fill="#1a1a2e"/>

          <g clip-path="url(#moonMask)">
            <path :d="terminatorPath" fill="#f5f3ce"/>
          </g>

          <circle cx="0" cy="0" r="48" fill="none" stroke="#6b7280" stroke-width="0.5" opacity="0.5"/>

          <g v-if="craters.length" clip-path="url(#moonMask)">
            <circle v-for="(c, i) in craters" :key="i"
              :cx="c.x" :cy="c.y" :r="c.r"
              fill="#d4d1a8" opacity="0.25"/>
            <circle v-for="(c, i) in craters" :key="'h'+i"
              :cx="c.x + 1" :cy="c.y + 1" :r="c.r * 0.7"
              fill="#000" opacity="0.08"/>
          </g>
        </svg>
      </div>

      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2 mb-1">
          <span class="text-lg font-bold text-white">{{ moon.phaseNameCn }}</span>
          <span class="text-xs" :class="moon.isWaxing ? 'text-emerald-400' : 'text-amber-400'">
            {{ moon.isWaxing ? '↑ 盈' : '↓ 亏' }}
          </span>
        </div>

        <div class="space-y-1 text-xs text-gray-300 mb-2">
          <p>月龄：{{ moon.age.toFixed(1) }} / 29.5 天</p>
          <p>照度：{{ moon.illumination.toFixed(0) }}%</p>
        </div>

        <div class="space-y-1">
          <div class="flex justify-between text-xs text-gray-400">
            <span>观测条件</span>
            <span>{{ observationLevel }}</span>
          </div>
          <div class="h-2 bg-gray-700 rounded-full overflow-hidden">
            <div class="h-full rounded-full transition-all duration-500"
              :class="scoreBarClass"
              :style="{ width: moon.observationScore + '%' }">
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="mt-3 p-2.5 rounded-lg text-xs leading-relaxed"
      :class="impactBgClass">
      <span class="font-bold mr-1" :class="impactTextClass">观测提示：</span>
      {{ moon.observationImpact }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { MoonPhaseInfo } from '../types'

const props = defineProps<{
  moon: MoonPhaseInfo
}>()

const SYNODIC_MONTH = 29.53058867

const terminatorPath = computed(() => {
  const age = props.moon.age
  const phaseAngle = (age / SYNODIC_MONTH) * 2 * Math.PI

  const cosA = Math.cos(phaseAngle)
  const R = 48

  const ellipseA = R * Math.abs(cosA)

  let d = ''

  if (age < SYNODIC_MONTH / 2) {
    if (cosA >= 0) {
      d = `
        M 0 -${R}
        A ${ellipseA} ${R} 0 0 1 0 ${R}
        A ${R} ${R} 0 0 1 0 -${R}
        Z
      `
    } else {
      d = `
        M 0 -${R}
        A ${ellipseA} ${R} 0 0 0 0 ${R}
        A ${R} ${R} 0 0 1 0 -${R}
        Z
      `
    }
  } else {
    if (cosA < 0) {
      d = `
        M 0 -${R}
        A ${R} ${R} 0 0 0 0 ${R}
        A ${ellipseA} ${R} 0 0 0 0 -${R}
        Z
      `
    } else {
      d = `
        M 0 -${R}
        A ${R} ${R} 0 0 0 0 ${R}
        A ${ellipseA} ${R} 0 0 1 0 -${R}
        Z
      `
    }
  }

  return d
})

const craters = computed(() => {
  const age = props.moon.age
  const illu = props.moon.illumination
  if (illu < 5) return []

  const allCraters = [
    { x: -15, y: -10, r: 6 },
    { x: 10, y: -18, r: 5 },
    { x: 5, y: 8, r: 7 },
    { x: -8, y: 18, r: 4 },
    { x: 20, y: 5, r: 5 },
    { x: -25, y: 5, r: 3 },
    { x: 15, y: 25, r: 3.5 },
    { x: -5, y: -28, r: 3 },
  ]

  const phaseAngle = (age / SYNODIC_MONTH) * 2 * Math.PI
  const cosA = Math.cos(phaseAngle)

  return allCraters.filter(c => {
    const xNorm = c.x / 48
    if (age < SYNODIC_MONTH / 2) {
      if (cosA >= 0) {
        const xBoundary = Math.sqrt(Math.max(0, 1 - (c.y / 48) ** 2)) * 48 * cosA
        return c.x < xBoundary + 1
      } else {
        const xBoundary = -Math.sqrt(Math.max(0, 1 - (c.y / 48) ** 2)) * 48 * Math.abs(cosA)
        return c.x > xBoundary - 1
      }
    } else {
      if (cosA < 0) {
        const xBoundary = -Math.sqrt(Math.max(0, 1 - (c.y / 48) ** 2)) * 48 * Math.abs(cosA)
        return c.x > xBoundary - 1
      } else {
        const xBoundary = Math.sqrt(Math.max(0, 1 - (c.y / 48) ** 2)) * 48 * cosA
        return c.x < xBoundary + 1
      }
    }
    return xNorm * cosA < 0.8
  })
})

const scoreBadgeClass = computed(() => {
  const s = props.moon.observationScore
  if (s >= 80) return 'bg-emerald-500/20 text-emerald-400'
  if (s >= 60) return 'bg-sky-500/20 text-sky-400'
  if (s >= 40) return 'bg-yellow-500/20 text-yellow-400'
  return 'bg-red-500/20 text-red-400'
})

const scoreBarClass = computed(() => {
  const s = props.moon.observationScore
  if (s >= 80) return 'bg-gradient-to-r from-emerald-500 to-emerald-400'
  if (s >= 60) return 'bg-gradient-to-r from-sky-500 to-sky-400'
  if (s >= 40) return 'bg-gradient-to-r from-yellow-500 to-yellow-400'
  return 'bg-gradient-to-r from-red-500 to-red-400'
})

const observationLevel = computed(() => {
  const s = props.moon.observationScore
  if (s >= 90) return '极佳'
  if (s >= 80) return '优秀'
  if (s >= 60) return '良好'
  if (s >= 40) return '一般'
  return '较差'
})

const impactBgClass = computed(() => {
  const s = props.moon.observationScore
  if (s >= 80) return 'bg-emerald-500/10 border border-emerald-500/20'
  if (s >= 60) return 'bg-sky-500/10 border border-sky-500/20'
  if (s >= 40) return 'bg-yellow-500/10 border border-yellow-500/20'
  return 'bg-red-500/10 border border-red-500/20'
})

const impactTextClass = computed(() => {
  const s = props.moon.observationScore
  if (s >= 80) return 'text-emerald-400'
  if (s >= 60) return 'text-sky-400'
  if (s >= 40) return 'text-yellow-400'
  return 'text-red-400'
})
</script>
