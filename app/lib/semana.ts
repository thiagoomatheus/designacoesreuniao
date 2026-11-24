import { getISOWeek, getISOWeekYear, setISOWeek, startOfISOWeek } from "date-fns"

/**
 * A chave de uma semana é sempre `semana/ano`, onde o ano é o ano da
 * numeração ISO 8601 — não necessariamente o ano civil da data.
 *
 * Exemplo: 28/12/2026 a 03/01/2027 é a semana 53/2026 (e não 01/2027).
 */

export function getChaveSemana(data: Date): string {
    return `${getISOWeek(data)}/${getISOWeekYear(data)}`
}

export function parseChaveSemana(chave: string): { semana: number, ano: number } {
    const [semana, ano] = chave.split("/").map(Number)
    return { semana, ano }
}

export function comparaChavesSemana(a: string, b: string): number {
    const semanaA = parseChaveSemana(a)
    const semanaB = parseChaveSemana(b)

    if (semanaA.ano !== semanaB.ano) return semanaA.ano - semanaB.ano

    return semanaA.semana - semanaB.semana
}

export function inicioDaSemana(chave: string): Date {
    const { semana, ano } = parseChaveSemana(chave)

    // 4 de janeiro pertence sempre à semana 1 do seu próprio ano ISO.
    const data = new Date(ano, 0, 4)

    return startOfISOWeek(setISOWeek(data, semana))
}
