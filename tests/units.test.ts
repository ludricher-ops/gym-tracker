import { describe, it, expect } from 'vitest'
import {
  kgToLb, lbToKg, cmToIn, inToCm, weightIn, lengthIn, formatWeight,
} from '../src/utils/units'

describe('conversions de poids', () => {
  it('100 kg ≈ 220.46 lb', () => {
    expect(kgToLb(100)).toBeCloseTo(220.462, 2)
  })
  it('aller-retour kg → lb → kg stable', () => {
    expect(lbToKg(kgToLb(82.5))).toBeCloseTo(82.5, 6)
  })
})

describe('conversions de longueur', () => {
  it('2.54 cm = 1 in', () => {
    expect(cmToIn(2.54)).toBeCloseTo(1, 6)
  })
  it('aller-retour cm → in → cm stable', () => {
    expect(inToCm(cmToIn(180))).toBeCloseTo(180, 6)
  })
})

describe('valeurs d’affichage', () => {
  it('weightIn respecte l’unité', () => {
    expect(weightIn(100, 'kg')).toBe(100)
    expect(weightIn(100, 'lb')).toBeCloseTo(220.462, 2)
  })
  it('lengthIn respecte l’unité', () => {
    expect(lengthIn(180, 'cm')).toBe(180)
    expect(lengthIn(180, 'in')).toBeCloseTo(70.866, 2)
  })
})

describe('formatWeight', () => {
  it('omet la décimale pour un entier', () => {
    expect(formatWeight(80, 'kg')).toBe('80 kg')
  })
  it('garde une décimale pour un demi-kilo', () => {
    expect(formatWeight(82.5, 'kg')).toBe('82.5 kg')
  })
})
