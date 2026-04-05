import type { Product, ConditionResult, ConditionStatus } from '@/types'

interface ConditionRule {
  id: string
  label: string
  forbiddenAllergenTags: string[]
  forbiddenTraceTags: string[]
  nutrientCheck?: {
    nutrient: string
    operator: '<' | '>'
    threshold: number
  }
}

export const CONDITIONS: ConditionRule[] = [
  {
    id: 'lactose-free',
    label: 'Lactose-Free',
    forbiddenAllergenTags: ['en:milk'],
    forbiddenTraceTags: ['en:milk'],
  },
  {
    id: 'gluten-free',
    label: 'Gluten-Free',
    forbiddenAllergenTags: ['en:gluten', 'en:wheat', 'en:barley', 'en:rye', 'en:oats'],
    forbiddenTraceTags: ['en:gluten', 'en:wheat', 'en:barley', 'en:rye', 'en:oats'],
  },
  {
    id: 'nut-free',
    label: 'Nut-Free',
    forbiddenAllergenTags: ['en:nuts', 'en:peanuts', 'en:almonds', 'en:hazelnuts', 'en:walnuts', 'en:cashews', 'en:pistachios'],
    forbiddenTraceTags: ['en:nuts', 'en:peanuts', 'en:almonds', 'en:hazelnuts', 'en:walnuts', 'en:cashews', 'en:pistachios'],
  },
  {
    id: 'egg-free',
    label: 'Egg-Free',
    forbiddenAllergenTags: ['en:eggs'],
    forbiddenTraceTags: ['en:eggs'],
  },
  {
    id: 'vegan',
    label: 'Vegan',
    forbiddenAllergenTags: ['en:milk', 'en:eggs', 'en:fish', 'en:crustaceans', 'en:molluscs', 'en:meat'],
    forbiddenTraceTags: [],
  },
  {
    id: 'vegetarian',
    label: 'Vegetarian',
    forbiddenAllergenTags: ['en:fish', 'en:crustaceans', 'en:molluscs', 'en:meat'],
    forbiddenTraceTags: [],
  },
  {
    id: 'halal',
    label: 'Halal',
    forbiddenAllergenTags: ['en:pork', 'en:alcohol'],
    forbiddenTraceTags: [],
  },
  {
    id: 'keto',
    label: 'Keto-Friendly',
    forbiddenAllergenTags: [],
    forbiddenTraceTags: [],
    nutrientCheck: { nutrient: 'sugars_100g', operator: '<', threshold: 5 },
  },
  {
    id: 'low-sodium',
    label: 'Low-Sodium',
    forbiddenAllergenTags: [],
    forbiddenTraceTags: [],
    nutrientCheck: { nutrient: 'sodium_100g', operator: '<', threshold: 0.3 },
  },
]

export function evaluateCondition(rule: ConditionRule, product: Product): ConditionStatus {
  const allergens = product.allergens_tags ?? []
  const traces = product.traces_tags ?? []

  if (rule.forbiddenAllergenTags.some(tag => allergens.includes(tag))) return 'unsafe'
  if (rule.forbiddenTraceTags.some(tag => traces.includes(tag))) return 'uncertain'

  if (rule.nutrientCheck) {
    const { nutrient, operator, threshold } = rule.nutrientCheck
    const value = product.nutriments[nutrient]
    if (value === undefined) return 'uncertain'
    if (operator === '<' && value >= threshold) return 'unsafe'
    if (operator === '>' && value <= threshold) return 'unsafe'
  }

  return 'safe'
}

export function evaluateConditions(activeIds: string[], product: Product): ConditionResult[] {
  return CONDITIONS.filter(c => activeIds.includes(c.id)).map(rule => ({
    id: rule.id,
    label: rule.label,
    status: evaluateCondition(rule, product),
  }))
}
