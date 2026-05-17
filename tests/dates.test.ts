import { describe, it, expect } from 'vitest'
import {
  localDayKey, startOfLocalDay, sameLocalDay, daysBetween,
  addDays, addWeeks, weekRange,
} from '../src/utils/dates'

describe('localDayKey', () => {
  it('formate en YYYY-MM-DD', () => {
    expect(localDayKey(new Date(2026, 4, 17, 14, 30))).toBe('2026-05-17')
  })
  it('zéro-pad le mois et le jour', () => {
    expect(localDayKey(new Date(2026, 0, 3))).toBe('2026-01-03')
  })
})

describe('startOfLocalDay', () => {
  it('ramène à minuit local', () => {
    const d = startOfLocalDay(new Date(2026, 4, 17, 23, 59))
    expect(d.getHours()).toBe(0)
    expect(d.getMinutes()).toBe(0)
    expect(localDayKey(d)).toBe('2026-05-17')
  })
})

describe('sameLocalDay', () => {
  it('vrai à des heures différentes du même jour', () => {
    expect(sameLocalDay(new Date(2026, 4, 17, 1), new Date(2026, 4, 17, 23))).toBe(true)
  })
  it('faux à cheval sur minuit', () => {
    expect(sameLocalDay(new Date(2026, 4, 17, 23), new Date(2026, 4, 18, 0))).toBe(false)
  })
})

describe('daysBetween', () => {
  it('compte les jours locaux entiers', () => {
    expect(daysBetween(new Date(2026, 4, 17), new Date(2026, 4, 20))).toBe(3)
  })
  it('zéro le même jour', () => {
    expect(daysBetween(new Date(2026, 4, 17, 2), new Date(2026, 4, 17, 22))).toBe(0)
  })
})

describe('addDays / addWeeks', () => {
  it('ajoute des jours en franchissant les mois', () => {
    expect(localDayKey(addDays(new Date(2026, 4, 30), 3))).toBe('2026-06-02')
  })
  it('addWeeks = 7 jours', () => {
    expect(localDayKey(addWeeks(new Date(2026, 4, 17), 2))).toBe('2026-05-31')
  })
})

describe('weekRange', () => {
  // 2026-05-17 est un dimanche.
  it('semaine démarrant lundi → lundi 11 au lundi 18', () => {
    const { start, end } = weekRange(new Date(2026, 4, 17), 'monday')
    expect(localDayKey(start)).toBe('2026-05-11')
    expect(localDayKey(end)).toBe('2026-05-18')
  })
  it('semaine démarrant dimanche → dimanche 17 au dimanche 24', () => {
    const { start, end } = weekRange(new Date(2026, 4, 17), 'sunday')
    expect(localDayKey(start)).toBe('2026-05-17')
    expect(localDayKey(end)).toBe('2026-05-24')
  })
  it('un jour en milieu de semaine retombe sur le même lundi', () => {
    const wed = weekRange(new Date(2026, 4, 13), 'monday') // mercredi
    expect(localDayKey(wed.start)).toBe('2026-05-11')
  })
})
