"use client"

import { Usuario } from "@prisma/client"
import toast from "react-hot-toast"
import { z } from "zod"

export default function FormularioFeedback( { usuario }: { usuario:Usuario | null } ) {
    
    async function enviarFeedback(dados:FormData) {

        const toastId = toast.loading("Enviando feedback...")

        const nome = dados.get("name") as string
        const email = dados.get("email") as string
        const tipo = dados.get("tipo") as string
        const sobre = dados.get("sobre") as string
        const feedback = dados.get("feedback") as string

        const dadosSchema = z.object({
            nome: z.string(),
            email: z.string(),
            tipo: z.string(),
            sobre: z.string(),
            feedback: z.string()
        })

        const validacao = dadosSchema.safeParse({
            nome: nome,
            email: email,
            tipo: tipo,
            sobre: sobre,
            feedback: feedback
        })

        if (!validacao.success) {
            toast.error(validacao.error.message, { id: toastId })
            return
        }

        const resultado = await fetch("/api/feedback", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                nome: nome,
                email: email,
                feedback: feedback,
                sobre: sobre,
                tipo: tipo
            })
        })

        const resposta = await resultado.json()

        if (resposta.error) {
            toast.error(resposta.error, { id: toastId })
            return
        }

        toast.success(resposta.data, { id: toastId })
        return
    }

    return (
        <form className="flex flex-col gap-3 w-full neumorphism dark:shadow-none dark:border p-3 rounded-lg" action={enviarFeedback}>
            <label className="flex flex-col">
                <p>Seu nome:</p>
                <input required name="name" type="text" {...(usuario ? { defaultValue: usuario?.nome } : {})} />
            </label>
            <label className="flex flex-col">
                <p>Seu email:</p>
                <input required name="email" type="text" {...(usuario ? { defaultValue: usuario?.email } : {})} />
            </label>
            <label className="flex flex-col">
                <p>Tipo de feedback:</p>
                <select className="bg-gray-200 dark:bg-gray-700 p-2 rounded-lg" required defaultValue={"default"} name="tipo">
                    <option disabled value={"default"}>Selecione uma opção</option>
                    <option value="elogio">Elogio</option>
                    <option value="sugestao">Sugestão</option>
                    <option value="correcao">Correção</option>
                </select>
            </label>
            <label className="flex flex-col">
                <p>Sobre:</p>
                <select className="bg-gray-200 dark:bg-gray-700 p-2 rounded-lg" required defaultValue={"default"} name="sobre">
                    <option disabled value={"default"}>Selecione uma opção</option>
                    <option value="designacoes">Designações</option>
                    <option value="notificacoes">Notificações</option>
                    <option value="impressao">Impressão</option>
                    <option value="design">Design</option>
                    <option value="ui">UI</option>
                    <option value="ux">UX</option>
                    <option value="outros">Outros</option>
                </select>
            </label>
            <label className="flex flex-col">
                <p>Descreva seu feedback:</p>
                <textarea required className="w-full border-black dark:border-white border-solid border dark:bg-gray-700 p-2 h-40 rounded-lg" name="feedback" />
            </label>
            <button className="bg-blue-500 p-2 rounded-lg text-white shadow-lg font-bold hover:bg-blue-700" type="submit">Enviar</button>
        </form>
    )
}