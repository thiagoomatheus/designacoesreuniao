"use client"

import { useContext } from "react"
import toast from "react-hot-toast"
import { z } from "zod"
import { Partes } from "../../../lib/types/types"
import { DesignarContext, DesignarDispatch } from "../contexts/DesignarContext"
import { TipoEvento } from "@prisma/client"

export default function useDesignacaoes() {

    const { layout } = useContext(DesignarContext)!
    const dispatch = useContext(DesignarDispatch)!

    function comecar() {
        dispatch({type: "comecar"})
        toast("Selecione o layout", {icon: "📐📌"})
    }

    function inserirLayout(formData:FormData) {
        const layoutSchema = z.string().refine((value) => value === "unico" ||value === "quinzenal" || value === "mensal_padrao", {
            message: "Selecione um layout"
        })

        const layout = formData.get("layout") as "unico" | "quinzenal" | "mensal_padrao"

        const result = layoutSchema.safeParse(layout)

        if (!result.success) {
            toast.error(result.error.message)
            return
        }

        dispatch({type: "inserirLayout", layout})
        toast("Selecione a semana inicial", {icon: "📅"})
    }

    async function getPartes(formData:FormData) {
        const weekAndYearSchema = z.object({
            dateFrom: z.string()
        })
        const dateFrom = formData.get("dateFrom") as string
        const resultZod = weekAndYearSchema.safeParse({dateFrom})
        if (!resultZod.success) return "Dados recebidos incorretos"
        const result = await fetch(`/api/partes?dateFrom=${dateFrom.replaceAll("/", "")}&layout=${layout === "quinzenal" ? 2 : layout === "mensal_padrao" ? 4 : 1}`)

        const { partes, error }: {partes?: Partes[], error?: {message: string} } = await result.json()
        if (error) return error.message

        dispatch({type: "adicionandoDados", semanas: partes})
    }

    function adicionandoDesignacoes(formData: FormData, data: Partes) {
        
        const designacoes: Partes = {
            ...data,
            diaReuniao: formData.get("data_reuniao") as string || "",
            tesouros: data.tesouros.map((parte) => {
                return {
                    ...parte,
                    participante: formData.get(parte.nome[0]) as string || ""
                }
            }),
            ministerio: data.ministerio.map((parte) => {
                return {
                    ...parte,
                    participante: formData.get(parte.nome[0]) as string || ""
                }
            }),
            vida: data.vida.map(parte => {
                return {
                    ...parte,
                    participante: formData.get(!parte.nome[0].includes("1") ? parte.nome[0] : parte.nome.slice(0, 2)) as string || ""
                }
            }),
            outros: data.outros.map(parte => {
                return {
                    ...parte,
                    participante: formData.get(parte.nome.toLowerCase().replaceAll(" ", "_").replaceAll("çã", "ca")) as string || ""
                }
            }),
            visita: formData.get("visita") as string || null,
            eventosEspeciais: {
                data: formData.get("data_evento_especial") as string || undefined,
                tipo: formData.get("tipo_evento_especial") as TipoEvento || null,
                tema: formData.get("tema_evento_especial") as string || undefined,
            }
        }
        
        if (!designacoes.eventosEspeciais?.data || !designacoes.eventosEspeciais?.tipo || !designacoes.eventosEspeciais?.tema) {
            designacoes.eventosEspeciais = null
        }

        const designacoesSchema = z.object({
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
            visita: z.string().nullable(),
            eventosEspeciais: z.object({
                data: z.string(),
                tipo: z.enum([ "assembleia", "congresso" ]),
                tema: z.string()
            }).nullable()
        })

        const resultZod = designacoesSchema.safeParse(designacoes)

        if (!resultZod.success) return toast.error(resultZod.error.message)
            
        dispatch({type: "adicionandoDesignacoes", id: resultZod.data.id, designacoes: resultZod.data})

        return true
    }

    async function salvandoDesignacoes(designacoes: Partes[], setSalvo: React.Dispatch<React.SetStateAction<boolean>>) {

        const toastId = toast.loading("Salvando designações...")

        if (!designacoes.length) return toast.error("Nenhuma designação foi salva", { id: toastId })

        const resutl = await fetch("/api/partes", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(designacoes)
        })
        
        if (resutl.status !== 200) return toast.error((await resutl.json()).error, { id: toastId })

        setSalvo(true)

        return toast.success("Designações salvas com sucesso!", { id: toastId })
        
    }
    
    return {
        comecar,
        inserirLayout,
        getPartes,
        adicionandoDesignacoes,
        salvandoDesignacoes
    }
    
}