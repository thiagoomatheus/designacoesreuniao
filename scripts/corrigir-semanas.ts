import { PrismaClient } from "@prisma/client"
import { getChaveSemana, inicioDaSemana, parseChaveSemana } from "../app/lib/semana"

const prisma = new PrismaClient()
const aplicar = process.argv.includes("--apply")

const MESES: Record<string, number> = {
    janeiro: 1,
    fevereiro: 2,
    março: 3,
    marco: 3,
    abril: 4,
    maio: 5,
    junho: 6,
    julho: 7,
    agosto: 8,
    setembro: 9,
    outubro: 10,
    novembro: 11,
    dezembro: 12
}

function mesDaReuniao(diaReuniao: string): number | null {
    const texto = diaReuniao.toLowerCase()

    for (const [nome, numero] of Object.entries(MESES)) {
        if (texto.includes(nome)) return numero
    }

    return null
}

function chaveEhValida(chave: string): boolean {
    return getChaveSemana(inicioDaSemana(chave)) === chave
}

async function corrigirChaves53() {
    const semanas = await prisma.semana.findMany({ orderBy: { semana: "asc" } })

    const invalidas = semanas.filter(({ semana }) => {
        const { semana: numero } = parseChaveSemana(semana)

        return numero === 53 && !chaveEhValida(semana)
    })

    console.log(`Semanas no banco: ${semanas.length}`)
    console.log(`Chaves 53/AAAA inválidas: ${invalidas.length}`)

    for (const semana of invalidas) {
        const { ano } = parseChaveSemana(semana.semana)
        const corrigida = `53/${ano - 1}`

        if (!chaveEhValida(corrigida)) {
            console.log(`⚠️  ${semana.semana} → ${corrigida}: correção não é uma semana ISO válida. Revisar manualmente.`)
            continue
        }

        if (await prisma.semana.findUnique({ where: { semana: corrigida } })) {
            console.log(`⚠️  ${semana.semana} → ${corrigida}: a semana corrigida já existe. Revisar manualmente.`)
            continue
        }

        console.log(`${aplicar ? "Corrigindo" : "Encontrei"} ${semana.semana} (${semana.diaReuniao}) → ${corrigida}`)

        if (!aplicar) continue

        const { id, semana: chaveAntiga, ...dados } = semana

        await prisma.$transaction(async (tx) => {
            // Cria a semana com a chave certa, reponta os filhos e só então
            // remove a linha antiga — evita depender de ON UPDATE CASCADE.
            await tx.semana.create({ data: { ...dados, semana: corrigida } })
            await tx.parte.updateMany({ where: { semana: chaveAntiga }, data: { semana: corrigida } })
            await tx.designacao.updateMany({ where: { semana: chaveAntiga }, data: { semana: corrigida } })
            await tx.visita.updateMany({ where: { semana: chaveAntiga }, data: { semana: corrigida } })
            await tx.eventoEspecial.updateMany({ where: { semana: chaveAntiga }, data: { semana: corrigida } })
            await tx.semana.delete({ where: { semana: chaveAntiga } })
        })
    }
}

async function alertarSemanas1Suspeitas() {
    const designacoes = await prisma.designacao.findMany({
        where: { semana: { startsWith: "1/" } },
        select: { id: true, semana: true, diaReuniao: true }
    })

    const suspeitas = designacoes.filter(({ semana, diaReuniao }) => {
        const { semana: numero } = parseChaveSemana(semana)
        const segunda = inicioDaSemana(semana)

        // A semana 1/AAAA começa em janeiro; se a reunião foi marcada em
        // dezembro, a designação pode ter sido salva na semana errada.
        return numero === 1 && segunda.getMonth() === 0 && mesDaReuniao(diaReuniao) === 12
    })

    if (!suspeitas.length) return

    console.log("\nDesignações em 1/AAAA com reunião marcada em dezembro (revisar manualmente):")
    suspeitas.forEach(({ semana, diaReuniao }) => console.log(`  ${semana} — ${diaReuniao}`))
}

async function main() {
    await corrigirChaves53()
    await alertarSemanas1Suspeitas()

    console.log(aplicar ? "\nConclusão." : "\nSimulação. Rode com --apply para aplicar as correções.")
}

main()
    .catch((error) => {
        console.error(error)
        process.exitCode = 1
    })
    .finally(() => prisma.$disconnect())
