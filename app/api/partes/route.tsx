"use server"

import { auth } from "@/app/lib/auth/auth"
import axios from "axios"
import * as cheerio from "cheerio"
import { add, endOfWeek, format, getWeek, isSameMonth, isSameYear, startOfWeek } from "date-fns"
import { ptBR } from "date-fns/locale"
import { redirect } from "next/navigation"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { Parte as ParteType, Partes } from "@/app/lib/types/types"
import { prisma } from "@/app/lib/prisma/prisma"
import { Funcao, Parte, Semana, TipoEvento } from "@prisma/client"

const sortPartes = (partes: Partes[]) => {
    partes.sort((a, b) => {
        
        const [semanaA, anoA] = a.semana.split("/").map(Number);
        
        const [semanaB, anoB] = b.semana.split("/").map(Number);
        
        if (anoA !== anoB) {
            return anoA - anoB;
        } else {
            
            return semanaA - semanaB;
        }
    })
}

async function getPartes(year: number, week: number, layout: number, cong: number) {
    const semanas: string[] = []

    for (let i = 0; i < layout; i++) {
        if (week + i > 52) {
            semanas.push(`${(week + i) - 52}/${year + 1}`)
            continue
        }
        semanas.push(`${week + i}/${year}`)
    }

    const semanaDb = await prisma.semana.findMany({
        where: {
            semana: {
                in: semanas
            }
        },
        include: {
            partes: true,
            designacao: {
                where: {
                    cong: cong
                },
                select: {
                    diaReuniao: true,
                    parteReference: true,
                    participante: true
                }
            },
            eventosEspeciais: {
                where: {
                    cong: cong
                },
                select: {
                    data: true,
                    tema: true,
                    tipo: true
                }
            },
            visitas: {
                where: {
                    cong: cong
                },
                select: {
                    tema: true
                }
            },
        }
    })

    if (!semanaDb) {
        return false
    }

    const partes: Partes[] = []

    semanaDb.map((
        semana: Semana &
        { partes: Parte[] } &
        { designacao: { diaReuniao: string, participante: string, parteReference: Parte }[] } &
        { visitas: { tema: string }[] } &
        { eventosEspeciais: { data: string, tema: string, tipo: TipoEvento }[] }
    ) => {
        partes.push({
            id: semana.id,
            semana: semana.semana,
            canticos: [semana.canticoInicial, semana.canticoMeio, semana.canticoFinal],
            capitulos: semana.capitulos,
            diaReuniao: semana.designacao.length ? semana.designacao[0].diaReuniao || semana.diaReuniao : semana.diaReuniao,
            outros: semana.partes.filter((parte) => !parte.secao).map((parte) => ({
                id: parte.id,
                nome: parte.nome,
                participante: semana.designacao ? semana.designacao.find((designacao) => designacao.parteReference.id === parte.id)?.participante : undefined
            })),
            tesouros: semana.partes.filter((parte) => parte.secao === "tesouros").map((parte) => ({
                id: parte.id,
                nome: parte.nome,
                tempo: parte.tempo!,
                participante: semana.designacao ? semana.designacao.find((designacao) => designacao.parteReference.id === parte.id)?.participante : undefined
            })),
            ministerio: semana.partes.filter((parte) => parte.secao === "ministerio").map((parte) => ({
                id: parte.id,
                nome: parte.nome,
                tempo: parte.tempo!,
                participante: semana.designacao ? semana.designacao.find((designacao) => designacao.parteReference.id === parte.id)?.participante : undefined
            })),
            vida: semana.partes.filter((parte) => parte.secao === "vida").map((parte) => ({
                id: parte.id,
                nome: parte.nome,
                tempo: parte.tempo!,
                participante: semana.designacao ? semana.designacao.find((designacao) => designacao.parteReference.id === parte.id)?.participante : undefined
            })),
            visita: semana.visitas.length ? (semana.visitas[0].tema || null) : null,
            eventosEspeciais: semana.eventosEspeciais.length ? semana.eventosEspeciais[0] : null
        })
    })

    sortPartes(partes)

    return partes
}

function formataPeriodo(dia: number, mes: number, ano: number) {

    console.log("Recebido:" + dia, mes, ano);

    let periodoApostilaFormatado: string = "";
    
    let mesApostila: "janeiro-fevereiro" | "marco-abril" | "maio-junho" | "julho-agosto" | "setembro-outubro" | "novembro-dezembro" = "janeiro-fevereiro";

    let periodoSemana: string = "";
    
    switch (mes + 1) {
        case 1:
            mesApostila = "janeiro-fevereiro";
            break;
        case 2:
            mesApostila = "janeiro-fevereiro";
            break;
        case 3:
            mesApostila = "marco-abril";
            break;
        case 4:
            mesApostila = "marco-abril";
            break;
        case 5:
            mesApostila = "maio-junho";
            break;
        case 6:
            mesApostila = "maio-junho";
            break;
        case 7:
            mesApostila = "julho-agosto";
            break;
        case 8:
            mesApostila = "julho-agosto";
            break;
        case 9:
            mesApostila = "setembro-outubro";
            break;
        case 10:
            mesApostila = "setembro-outubro";
            break;
        case 11:
            mesApostila = "novembro-dezembro";
            break;
        case 12:
            mesApostila = "novembro-dezembro";
        default:
            break;
    }

    const segundaData = startOfWeek(new Date(ano, mes, dia), { locale: ptBR, weekStartsOn: 1 });
    const domingoData = endOfWeek(new Date(ano, mes, dia), { locale: ptBR, weekStartsOn: 1 });
    
    const mesmoAno = isSameYear(segundaData, domingoData);
    const mesmoMes = isSameMonth(segundaData, domingoData);

    if (mesmoMes) {
        const mesApostila = format(segundaData, "MMMM", { locale: ptBR, weekStartsOn: 1 });
        periodoSemana = `${segundaData.getDate()}-${domingoData.getDate()}-de-${mesApostila}-de-${ano}`;
    } else {
        const domingoDiaPrimeiro = domingoData.getDate() === 1;
        if (!mesmoAno) {
            const segundaFormatado = format(segundaData, "d-'de'-MMMM-'de'-yyyy", { locale: ptBR, weekStartsOn: 1 });
            const domingoFormatado = format(domingoData, (domingoDiaPrimeiro ? "d'º'-'de'-MMMM-'de'-yyyy" : "d-'de'-MMMM-'de'-yyyy"), { locale: ptBR, weekStartsOn: 1 });
            periodoSemana = `${segundaFormatado}-${domingoFormatado}`;
        } else {
            const segundaFormatado = format(segundaData, "d-'de'-MMMM", { locale: ptBR, weekStartsOn: 1 });
            const domingoFormatado = format(domingoData, (domingoDiaPrimeiro ? "d'º'-'de'-MMMM" : "d-'de'-MMMM"), { locale: ptBR, weekStartsOn: 1 });
            periodoSemana = `${segundaFormatado}-${domingoFormatado}-de-${ano}`;
        }
    }

    periodoApostilaFormatado = `${mesApostila}-${ano}-mwb/Programação-da-Reunião-Vida-e-Ministério-para-${periodoSemana}`

    return periodoApostilaFormatado;
}

async function scrapePartes(data: Date,numeroSemana: number, diaReuniao: string) {

    const dia = data.getDate();
    const mes = data.getMonth();
    const ano = data.getFullYear();

    const periodo = formataPeriodo(dia, mes, ano)

    const url: string = `https://www.jw.org/pt/biblioteca/jw-apostila-do-mes/${periodo}`;

    const response = await axios.get(url)
    const html = response.data
    const tempo: string[] = []
    const $ = cheerio.load(html)

    const partes: Partes = {
        canticos: [],
        capitulos: "",
        semana: `${numeroSemana}/${periodo.slice(-4)}`,
        diaReuniao: diaReuniao,
        outros: [
            {nome: "Presidente", participante: ""},
            {nome: "Oração inicial", participante: ""},
            {nome: "Oração final", participante: ""},
            {nome: "Leitor", participante: ""},
        ],
        tesouros: [
          {nome: "", tempo: "10 min", participante: ""},
          {nome: '2. Joias Espirituais', tempo:"10 min", participante: ""},
          {nome: "", tempo: "4 min", participante: ""},
        ],
        ministerio: [],
        vida: [],
        visita: null,
        eventosEspeciais: null
    }

    partes.capitulos = $("#p2").text()

    $('.dc-icon--music').each(function () {
        const cantico = $(this).text().split(" e")[0]
        partes.canticos.push(cantico)
    })

    partes.tesouros[0].nome = $(".pub-mwb #p5").text()

    partes.tesouros[2].nome = `3. Leitura da Bíblia - ${$(`p:contains("(4 min)")`).text().split(") ")[1].split(" (")[0]}`

    $("h3.du-color--gold-700").each(function () {
        const ministerio = $(this).text()
        partes.ministerio.push({
            nome: ministerio,
            participante: "",
            tempo: ""
        })
    })

    $(".du-color--maroon-600:contains(.)").each(function () {
        const vida = $(this).text().trim()

        const firstChar = vida.charAt(0)
        if (parseInt(firstChar).toString() === "NaN") {
            console.log('reject: ' + vida);
            return
        }
        
        partes.vida.push({
            nome: vida.length > 62 ? `${vida.slice(0, 62)}...` : vida,
            tempo: "",
            participante: ""
        })
    })

    $(`p:contains(min)`).each(function () {
        let time = $(this).text()
        if (!time.startsWith("(")) return
        time = time.split("(")[1].split(")")[0]
        tempo.push(time)
    })

    for (let i = 0; i < partes.ministerio.length; i++) {
        partes.ministerio[i].tempo = tempo[3 + i]
    }

    for (let i = 0; i < partes!.vida.length; i++) {
        partes.vida[i].tempo = tempo[3 + partes!.ministerio.length + i]
    }

    const semanaCreated = await prisma.semana.create({
        data: {
            semana: partes.semana,
            diaReuniao: partes.diaReuniao,
            canticoInicial: partes.canticos[0],
            canticoMeio: partes.canticos[1],
            canticoFinal: partes.canticos[2],
            capitulos: partes.capitulos,
        }
    })

    const partesDb: {
        semana: string,
        nome: string,
        tempo?: string
        secao?: "tesouros" | "ministerio" | "vida"
    }[] = [
        {
            semana: partes.semana,
            nome: "Presidente"
        },
        {
            semana: partes.semana,
            nome: "Oração Inicial"
        },
        {
            semana: partes.semana,
            nome: "Oração Final"
        },
        {
            semana: partes.semana,
            nome: "Leitor"
        }
    ]

    partes.tesouros.map(parte => {
        partesDb.push({
            semana: partes.semana,
            nome: parte.nome,
            tempo: parte.tempo,
            secao: "tesouros"
        })
    }),
    partes.ministerio.map(parte => {
        partesDb.push({
            semana: partes.semana,
            nome: parte.nome,
            tempo: parte.tempo,
            secao: "ministerio"
        })
    }),
    partes.vida.map(parte => {
        partesDb.push({
            semana: partes.semana,
            nome: parte.nome,
            tempo: parte.tempo,
            secao: "vida"
        })
    })

    const partesCreated = await prisma.parte.createManyAndReturn({
        data: partesDb
    })

    const partesReturn: Partes = {
        ...partes,
        id: semanaCreated.id,
        tesouros: partesCreated.filter((parte) => parte.secao === "tesouros").map((parte) => ({
            id: parte.id,
            nome: parte.nome,
            tempo: parte.tempo!
        })),
        ministerio: partesCreated.filter((parte) => parte.secao === "ministerio").map((parte) => ({
            id: parte.id,
            nome: parte.nome,
            tempo: parte.tempo!
        })),
        vida: partesCreated.filter((parte) => parte.secao === "vida").map((parte) => ({
            id: parte.id,
            nome: parte.nome,
            tempo: parte.tempo!
        })),
        outros: partesCreated.filter((parte) => !parte.secao).map((parte) => ({
            id: parte.id,
            nome: parte.nome
        }))
    }
    
    return partesReturn
}

export async function GET(req:NextRequest) {

    const sessao = await auth()

    if (!sessao || !sessao.user ) return redirect("/login")

    const usuario = await prisma.usuario.findUnique({ where: { email: sessao.user.email! } })

    if (!usuario) return redirect("/login")

    if (usuario.cong === null) {
        return NextResponse.json({ error: { message: "Defina a congregação nas configurações" } }, { status: 500 })
    }

    const getPartesSchema = z.object({
        dateFrom: z.string(),
        layout: z.number(),
    }, {
        message: "Dados recebidos incorretos"
    })

    const searchParams = req.nextUrl.searchParams

    const dateFrom = searchParams.get("dateFrom") as string
    const layout = parseFloat(searchParams.get("layout") as string)
    const day = parseInt(dateFrom.slice(0, 2))
    const month = parseInt(dateFrom.slice(2, 4))
    const year = parseInt(dateFrom.slice(4, 8))
    
    const result = getPartesSchema.safeParse({
        dateFrom,
        layout
    })

    if(!result.success) {
        return NextResponse.json({ error: result.error }, { status: 500 })
    }

    try {

        const week = getWeek(new Date(year, (month - 1), day), { weekStartsOn: 1 })

        const result = await getPartes(week !== 1 ? year : month !== 12 ? year : year + 1, week, layout, usuario.cong)

        if (result !== false && result.length === layout) return NextResponse.json({ partes: result }, { status: 200 })

        const dataBase = new Date(year, (month - 1), day)
        const partes: Partes[] = []
        const semanasDb: string[] = []

        if (result !== false && result.length) {
            result.map((parte) => {
                semanasDb.push(parte.semana)
                partes.push(parte)
            })
        }
        
        for (let i = 0; i < layout; i++) {
            let data = add(dataBase, { days: 7 * i })
            let ano = data.getFullYear()
            const numeroSemana = getWeek(data, { weekStartsOn: 1 })
            if (numeroSemana === 1 && data.getMonth() === 11) {
                ano++
            }
            if (!semanasDb.includes(`${numeroSemana}/${ano}`)) {
                partes.push(await scrapePartes(data, numeroSemana, format(data, "dd 'de' MMMM", { locale: ptBR })))
            }
        }

        sortPartes(partes)

        return NextResponse.json({ partes }, { status: 200 })
    } catch (error) {
        console.log(error);
        return NextResponse.json({ error }, { status: 500 })
    }
}

export async function POST(req:NextRequest) {

    const sessao = await auth()

    if (!sessao || !sessao.user ) return redirect("/login")

    const usuario = await prisma.usuario.findUnique({ where: { email: sessao.user.email! } })

    if (!usuario) return redirect("/login")

    if (!usuario.cong || usuario.funcao !== Funcao.designar) return redirect("/minha-conta")

    const partes: Partes[] = await req.json()

    const designacoesSchema = z.array(z.object({
        id: z.string(),
        semana: z.string(),
        canticos: z.array(z.string()),
        capitulos: z.string(),
        diaReuniao: z.string(),
        tesouros: z.array(z.object({
            id: z.string(),
            nome: z.string(),
            tempo: z.string(),
            participante: z.string()
        })),
        ministerio: z.array(z.object({
            id: z.string(),
            nome: z.string(),
            tempo: z.string(),
            participante: z.string()
        })),
        vida: z.array(z.object({
            id: z.string(),
            nome: z.string(),
            tempo: z.string(),
            participante: z.string()
        })),
        outros: z.array(z.object({
            id: z.string(),
            nome: z.string(),
            participante: z.string()
        }, {message: "Dados recebidos incorretos"})),
        eventosEspeciais: z.object({
            id: z.string().optional(),
            tema: z.string(),
            data: z.string(),
            tipo: z.enum(["assembleia", "congresso"])
        }).nullable(),
        visita: z.string().nullable()
    }))

    const resultZod = designacoesSchema.safeParse(partes)

    if (!resultZod.success) {
        console.log(resultZod.error)
        return NextResponse.json({error: resultZod.error}, { status: 500 })
    }

    const semanasSalvas: string[] = []

    for (let i = 0; i < resultZod.data.length; i++) {

        const designacoesExistentes = await prisma.designacao.findMany({
            where: {
                semana: resultZod.data[i].semana,
                criadoPor: usuario.id
            }
        })

        const visita = await prisma.visita.findFirst({
            where: {
                semana: resultZod.data[i].semana,
                cong: usuario.cong
            }
        })

        const eventoEspecial = await prisma.eventoEspecial.findFirst({
            where: {
                semana: resultZod.data[i].semana,
                cong: usuario.cong
            }
        })

        const temDesignacao = designacoesExistentes.length > 0

        if (temDesignacao) {

            if (designacoesExistentes.length > 6) {
                try {
                    await prisma.designacao.deleteMany({
                        where: {
                            semana: resultZod.data[i].semana,
                            criadoPor: usuario.id
                        }
                    })

                    if (!!visita) {
                        await prisma.visita.delete({
                            where: {
                                id: visita.id
                            }
                        })
                    }

                    if (!!eventoEspecial) {
                        await prisma.eventoEspecial.delete({
                            where: {
                                id: eventoEspecial.id
                            }
                        })
                    }
                    continue
                } catch (error) {
                    console.warn(error);
                    return NextResponse.json({ error: 'Erro ao atualizar designações existentes' }, { status: 401 })
                }
            }

            if (!!resultZod.data[0].eventosEspeciais) {
                await prisma.eventoEspecial.create({
                    data: {
                        cong: usuario.cong,
                        semana: resultZod.data[i].semana,
                        tema: resultZod.data[i].eventosEspeciais!.tema,
                        data: resultZod.data[i].eventosEspeciais!.data,
                        tipo: resultZod.data[i].eventosEspeciais!.tipo
                    }
                })

                return NextResponse.json({ message: "Designações salvas com sucesso" }, { status: 200 })
            }

            const designacoesASalvar: ParteType[] = [...resultZod.data[i].outros, ...resultZod.data[i].tesouros, ...resultZod.data[i].ministerio, ...resultZod.data[i].vida]

            try {

                for (const parte of designacoesASalvar) {
                    await prisma.designacao.upsert({
                        where: {
                            id: parte.id
                        },
                        update: {
                            participante: parte.participante,
                            criadoPor: usuario.id,
                            diaReuniao: resultZod.data[i].diaReuniao
                        },
                        create: {
                            semana: resultZod.data[i].semana,
                            parte: parte.id!,
                            participante: parte.participante!,
                            criadoPor: usuario.id,
                            cong: usuario.cong!,
                            diaReuniao: resultZod.data[i].diaReuniao
                        }
                    })
                }

                if (resultZod.data[i].visita !== null) {
                    await prisma.visita.create({
                        data: {
                            cong: usuario.cong,
                            semana: resultZod.data[i].semana,
                            tema: resultZod.data[i].visita as string
                        }
                    })
                }
                
            } catch (error) {
                console.warn(error);
                return NextResponse.json({ error: 'Erro ao atualizar designações existentes' }, { status: 401 })
            }

            semanasSalvas.push(resultZod.data[i].semana)
        }
    }

    if (semanasSalvas.length === resultZod.data.length) {
        return NextResponse.json({ message: "Designações salvas com sucesso" }, { status: 200 })
        
    }
    
    const designacoes: {
        semana: string
        parte: string
        participante: string
        criadoPor: string
        cong: number
        diaReuniao: string
    }[] = partes
    .filter((semana) => !semanasSalvas.includes(semana.semana))
    .flatMap((semana) => {
        const todasAsPartesDaSemana = [
            ...semana.outros,
            ...semana.tesouros,
            ...semana.ministerio,
            ...semana.vida
        ];

        return todasAsPartesDaSemana.map(parte => ({
            semana: semana.semana,
            participante: parte.participante!,
            parte: parte.id!,
            criadoPor: usuario.id!,
            cong: usuario.cong!,
            diaReuniao: semana.diaReuniao
        }));
    });

    await prisma.designacao.createMany({
        data: designacoes
    })

    const visitas = partes
    .filter((semana) => !semanasSalvas.includes(semana.semana))
    .filter(semana => semana.visita !== null)

    if (visitas.length > 0) {

        const data = visitas.flatMap(semana => {
            return {
                semana: semana.semana as string,
                cong: usuario.cong as number,
                tema: semana.visita as string
            }
        })

        if (visitas.length > 1) {
            await prisma.visita.createMany({
                data: data
            })
        } else {
            await prisma.visita.create({
                data: data[0]
            })
        }

    }

    const assembleia = partes
    .filter((semana) => !semanasSalvas.includes(semana.semana))
    .filter(semana => semana.eventosEspeciais !== null && semana.eventosEspeciais.tema && semana.eventosEspeciais.tipo)

    if (assembleia.length > 0) {

        const data = assembleia.flatMap(semana => {
            return {
                semana: semana.semana as string,
                cong: usuario.cong as number,
                tema: semana.eventosEspeciais!.tema as string,
                data: semana.eventosEspeciais!.data!,
                tipo: semana.eventosEspeciais!.tipo === "assembleia" ? TipoEvento.assembleia : TipoEvento.congresso
            }
        })

        if (assembleia.length > 1) {
            await prisma.eventoEspecial.createMany({
                data: data
            })
        } else {
            console.log(data[0]);
            
            await prisma.eventoEspecial.create({
                data: data[0]
            })
        }
        
    }

    return NextResponse.json({ message: "Designações salvas com sucesso" }, { status: 200 })
}