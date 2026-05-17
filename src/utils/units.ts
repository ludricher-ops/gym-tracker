// Conversions d'unités. Les données sont stockées en SI (kg, cm) ; la
// conversion n'intervient qu'à l'affichage (cahier section 7).

import type { MeasurementUnit, WeightUnit } from '../types'

const LB_PER_KG = 2.2046226218
const CM_PER_IN = 2.54

export function kgToLb(kg: number): number {
  return kg * LB_PER_KG
}
export function lbToKg(lb: number): number {
  return lb / LB_PER_KG
}
export function cmToIn(cm: number): number {
  return cm / CM_PER_IN
}
export function inToCm(inch: number): number {
  return inch * CM_PER_IN
}

/** Valeur d'un poids (stocké en kg) dans l'unité d'affichage. */
export function weightIn(kg: number, unit: WeightUnit): number {
  return unit === 'lb' ? kgToLb(kg) : kg
}

/** Valeur d'une longueur (stockée en cm) dans l'unité d'affichage. */
export function lengthIn(cm: number, unit: MeasurementUnit): number {
  return unit === 'in' ? cmToIn(cm) : cm
}

/** Poids formaté avec son unité, ex. "82.5 kg". */
export function formatWeight(kg: number, unit: WeightUnit): string {
  const v = weightIn(kg, unit)
  const rounded = Math.round(v * 100) / 100
  return `${rounded % 1 === 0 ? rounded : rounded.toFixed(1)} ${unit}`
}
