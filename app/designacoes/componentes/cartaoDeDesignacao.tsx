"use client"

import { Designacao, Parte, Semana, Usuario } from "@prisma/client"
import { useReducer, useRef, useState } from "react"
import toast from "react-hot-toast"
import Modal from "@/app/componentes/modal"
import Textarea from "@/app/designar/componentes/textarea"
import Btn from "@/app/minha-conta/components/btn"
import { Contato } from "@/app/lib/types/types"
import AccordionContatoParticipante from "./accordionContatoParticipante"
import { editarParticipante, excluirDesignacao, notificarParticipante } from "../lib/actions/actions"
import { Badge } from "@/app/componentes/Badge"
import { Tooltip } from "@/app/componentes/Tooltip"

type ParametrosNotificacao = {
    telefone: string
    momentoDaNotificacao: "agora" | "semana"
    formaDeTratamento: "nenhum" | "irmão" | "irmã"
    obs: boolean
    obsText: string
    nome: boolean,
    tempo: boolean,
    modal: "telefone" | "mensagem" | undefined
}

const estadoInicial: ParametrosNotificacao = {
    telefone: "",
    momentoDaNotificacao: "agora",
    formaDeTratamento: "nenhum",
    obs: false,
    obsText: "",
    nome: false,
    tempo: false,
    modal: undefined
}

type NotificacoesReducerType = {
    type: "iniciandoNotificacao" | "adicionandoTelefoneEMomentoDaNotificacao" | "adicionandoFormaDeTratamento" | "adicionandoObs" | "resetandoParametros" | "adicionandoNome" | "adicionandoTempo"
    telefone?: string,
    momentoDaNotificacao?: "agora" | "semana",
    formaDeTratamento?: "nenhum" | "irmão" | "irmã",
    obs?: boolean,
    obsText?: string
    nome?: boolean,
    tempo?: boolean
}

function notificacoesReducer(state: ParametrosNotificacao, action: NotificacoesReducerType): ParametrosNotificacao {
    switch (action.type) {
        case "iniciandoNotificacao":
            return {
             ...state,
             modal: "telefone"
            }
        case "adicionandoTelefoneEMomentoDaNotificacao":
            return {
                ...state,
                telefone: action.telefone || state.telefone,
                momentoDaNotificacao: action.momentoDaNotificacao || state.momentoDaNotificacao,
                modal: "mensagem"
            }
        case "adicionandoFormaDeTratamento":
            return {
                ...state,
                formaDeTratamento: action.formaDeTratamento || state.formaDeTratamento
            }
        case "adicionandoObs":
            return {
                ...state,
                obs: action.obs !== undefined ? action.obs : state.obs,
                obsText: action.obsText || state.obsText
            }
        case "adicionandoNome":
            return {
                ...state,
                nome: action.nome !== undefined ? action.nome : state.nome
            }
        case "adicionandoTempo":
            return {
                ...state,
                tempo: action.tempo !== undefined ? action.tempo : state.tempo
            }
        case "resetandoParametros":
            return {
                ...estadoInicial
            }
        default:
            return state
    }
}

export default function CartaoDeDesignacao( { designacao, excluir, autorizadoParaAcoes, contatos }: {
    designacao: (Designacao & { parteReference: Parte; semanaReference: Semana; usuarioReference: Usuario })
    excluir: (id: string) => void
    autorizadoParaAcoes: boolean
    contatos: Contato[]
} ) {

    const [dadosDesignacao, setDadosDesignacao] = useState(designacao)
    const [editar, setEditar] = useState<boolean>(false)
    const [parametros, dispatch] = useReducer(notificacoesReducer, estadoInicial)

    const nomeInputRef = useRef<HTMLInputElement>(null)
    const tempoInputRef = useRef<HTMLInputElement>(null)
    const obsInputRef = useRef<HTMLInputElement>(null)

    return (
        <>
            {parametros.modal === "telefone" && autorizadoParaAcoes && (
                <Modal>
                    <h3>Notifique o participante</h3>
                    <form
                        className="flex flex-col gap-3"
                        action={async (dados: FormData) => {

                            const toastId = toast.success("Escolha os parâmetros da mensagem")

                            const telefoneBruto = dados.get("telefone") as string
                            if (!telefoneBruto) {
                                toast.error("Digite um telefone", { id: toastId })
                                return
                            }

                            const telefone = telefoneBruto.startsWith("+55") ? telefoneBruto.slice(3).trim().replace(/[^0-9]/g, "") : telefoneBruto.trim().replace(/[^0-9]/g, "")

                            const regexPhone: RegExp = /^([14689][0-9]|2[12478]|3([1-5]|[7-8])|5([13-5])|7[193-7])9[0-9]{8}$/

                            if (!telefone || !regexPhone.test(telefone)) {
                                toast.error("Telefone inválido", { id: toastId })
                                return
                            }
                            
                            const momentoDaNotificacao = dados.get("momento_da_notificacao") as "agora" | "semana"
                            if (!momentoDaNotificacao) {
                                toast.error("Selecione quando irá notificar", { id: toastId })
                                return
                            }

                            dispatch({
                                type: "adicionandoTelefoneEMomentoDaNotificacao",
                                telefone: telefone,
                                momentoDaNotificacao: momentoDaNotificacao
                            })
                        }}
                    >
                        <AccordionContatoParticipante
                            contatos={contatos}
                        />
                        <p>Selecione quando irá notificar:</p>
                        <div
                            className="flex flex-row gap-3"
                        >
                            <label
                                className="w-full flex border p-2 border-blue-300 rounded-lg flex-row gap-2 justify-between cursor-pointer"
                            >
                                <p>Agora</p>
                                <input
                                    required
                                    className="border border-blue-400 appearance-none rounded-full cursor-pointer checked:bg-blue-300 dark:checked:bg-blue-300 p-3"
                                    type="radio"
                                    name="momento_da_notificacao"
                                    value="agora"
                                />
                            </label>
                            {((!dadosDesignacao.telefone && !dadosDesignacao.notificado) || (!dadosDesignacao.telefone && dadosDesignacao.notificado)) &&
                                <label
                                    className="w-full flex border p-2 border-blue-300 rounded-lg flex-row gap-2 justify-between cursor-pointer"
                                >
                                    <p>Na semana</p>
                                    <input
                                        required
                                        className="border border-blue-400 appearance-none rounded-full cursor-pointer checked:bg-blue-300 dark:checked:bg-blue-300 p-3"
                                        type="radio"
                                        name="momento_da_notificacao"
                                        value="semana"
                                    />
                                </label>
                            }
                        </div>
                        <p
                            className="text-[8px] lg:text-[10px]"
                        >
                            Atenção: Ao selecionar a opção &quot;Na semana&quot; é necessário salvar o número do participante em nosso banco de dados. Assim, ao selecionar essa opção entendemos que você tem o consentimento dele para isso.
                        </p>
                        <div
                            className="flex gap-3"
                        >
                            <Btn
                                className="bg-red-500 hover:bg-red-400"
                                onClick={() => dispatch({ type: "resetandoParametros" })}
                            >
                                Cancelar
                            </Btn>
                            <Btn
                                className="bg-green-500 hover:bg-green-400"
                                type="submit"
                            >
                                Continuar
                            </Btn>
                        </div>
                    </form>
                </Modal>
            )}
            {parametros.modal === "mensagem" && autorizadoParaAcoes && (
                <Modal>
                    <h3>Mensagem</h3>
                    <p>Selecione alguns parâmetros da mensagem:</p>
                    <form
                        action={async () => {
                            const toastId = toast.success("Notificando ...")
                            const resultado = await notificarParticipante(dadosDesignacao.id, parametros)
                            if (resultado.error) {
                                toast.error(resultado.error.message, { id: toastId })
                                return
                            }
                            setDadosDesignacao({
                                ...dadosDesignacao,
                                telefone: parametros.momentoDaNotificacao === "semana" ? parametros.telefone : null,
                                notificado: parametros.momentoDaNotificacao === "agora" && true
                            })
                            toast.success(resultado.data.message, { id: toastId })
                            dispatch({ type: "resetandoParametros" })
                        }}
                        className="flex flex-col w-full gap-3"
                    >
                        <fieldset
                            className="flex flex-row gap-3 justify-between border border-blue-300 p-2 rounded-md"
                        >
                            <legend>Forma de tratamento:</legend>
                            <label
                                className="flex flex-col justify-center items-center gap-1"
                            >
                                <p>Irmão</p>
                                <input
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                        dispatch({ type: "adicionandoFormaDeTratamento", formaDeTratamento: e.target.value as "irmão" })
                                    }}
                                    type="radio"
                                    name="formaDeTratamento"
                                    value="irmão"
                                />
                            </label>
                            <label
                                className="flex flex-col justify-center items-center gap-1"
                            >
                                <p>Irmã</p>
                                <input
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                        dispatch({ type: "adicionandoFormaDeTratamento", formaDeTratamento: e.target.value as "irmã" })
                                    }}
                                    type="radio"
                                    name="formaDeTratamento"
                                    value="irmã"
                                />
                            </label>
                            <label
                                className="flex flex-col justify-center items-center gap-1"
                            >
                                <p>Nenhum</p>
                                <input
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                        dispatch({ type: "adicionandoFormaDeTratamento", formaDeTratamento: e.target.value as "nenhum" })
                                    }}
                                    type="radio"
                                    name="formaDeTratamento"
                                    value="nenhum"
                                    defaultChecked
                                />
                            </label>
                        </fieldset>
                        <fieldset
                            className="flex flex-row gap-3 justify-between border border-blue-300 p-2 rounded-md"
                        >
                            <legend>Selecione o que incluir na mensagem:</legend>
                            <label
                                className="flex flex-col justify-center items-center gap-1"
                            >
                                <p>Observação</p>
                                <input
                                    onChange={() => dispatch({ type: "adicionandoObs", obs: obsInputRef.current?.checked })}
                                    type="checkbox"
                                    name="obs"
                                    ref={obsInputRef}
                                />
                            </label>
                            <label
                                className="flex flex-col justify-center items-center gap-1"
                            >
                                <p>Nome</p>
                                <input
                                    onChange={() => dispatch({ type: "adicionandoNome", nome: nomeInputRef.current?.checked })}
                                    type="checkbox"
                                    name="nome"
                                    ref={nomeInputRef}
                                />
                            </label>
                            <label
                                className="flex flex-col justify-center items-center gap-1"
                            >
                                <p>Tempo</p>
                                <input
                                    onChange={() => dispatch({ type: "adicionandoTempo", tempo: tempoInputRef.current?.checked })}
                                    type="checkbox"
                                    name="tempo"
                                    ref={tempoInputRef}
                                />
                            </label>
                        </fieldset>
                        <fieldset
                            className={`flex flex-row gap-3 justify-between border border-blue-300 p-2 rounded-md ${!parametros.obs && "opacity-50"}`}
                        >
                            <legend>Observação:</legend>
                            <label
                                className="flex flex-col justify-center items-center gap-1 w-full"
                            >
                                <p>Insira a observação</p>
                                <textarea
                                    placeholder="Máximo de 150 caracteres"
                                    maxLength={150} name="obsText" {...(!parametros.obs && { disabled: true })}
                                    className="border-solid border border-blue-300 w-full p-2 bg-transparent"
                                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => dispatch({ type: "adicionandoObs", obsText: e.target.value })} value={parametros.obsText}
                                />
                            </label>
                        </fieldset>
                        <fieldset
                            className="flex flex-col gap-3 justify-between border border-blue-300 p-2 rounded-md w-full"
                        >
                            <legend>Confira a mensagem:</legend>

                            {parametros.formaDeTratamento === "nenhum" && !parametros.nome && <p>Olá, tudo bem?</p>}
                            {parametros.formaDeTratamento !== "nenhum" && !parametros.nome && <p>Olá {parametros.formaDeTratamento}, tudo bem?</p>}
                            {parametros.formaDeTratamento === "nenhum" && parametros.nome && <p>Olá {dadosDesignacao.participante}, tudo bem?</p>}
                            {parametros.formaDeTratamento !== "nenhum" && parametros.nome && <p>Olá {parametros.formaDeTratamento} {dadosDesignacao.participante}, tudo bem?</p>}

                            <p>Passando para confirmar sua designação para o dia {dadosDesignacao.diaReuniao}:</p>
                            <p className="font-bold">Designação: {dadosDesignacao.parteReference.nome}</p>
                            {parametros.tempo && <p className="font-bold">Tempo: {dadosDesignacao.parteReference.tempo ? dadosDesignacao.parteReference.tempo : "N/A"}</p>}
                            {parametros.obs && parametros.obsText && <p><span className="font-bold">Obs.:</span> {parametros.obsText}</p>}
                            <p>Por favor, confirme sua participação.</p>
                            <p>Obrigado!</p>

                        </fieldset>
                        <div
                            className="flex gap-3"
                        >
                            <Btn
                                className="bg-red-500 hover:bg-red-400"
                                onClick={() => dispatch({ type: "resetandoParametros" })}
                            >
                                Cancelar
                            </Btn>
                            <Btn
                                className="bg-green-500 hover:bg-green-400"
                                type="submit"
                            >
                                Enviar
                            </Btn>
                        </div>
                    </form>
                </Modal>
            )}
            <div 
                className={`flex flex-col gap-5 border-t-4 rounded-lg shadow-lg bg-white dark:bg-gray-800 p-6 ${dadosDesignacao.parteReference.secao === "ministerio" ? "border-yellow-700" : dadosDesignacao.parteReference.secao === "vida" ? "border-red-700" : dadosDesignacao.parteReference.secao === "tesouros" ? "border-gray-700" : "dark:border-white border-blue-400"}`}
            >

                <div className="flex flex-row justify-between items-center">
                    <p>
                        <span className="font-bold">Data:</span> {dadosDesignacao.diaReuniao}
                    </p>

                    <div className="flex flex-row gap-2">
                        {dadosDesignacao.telefone && (
                            <Tooltip content="Notificação agendada na semana">
                                <Badge className="w-fit self-end text-xs" variant="warning">Agendado</Badge>
                            </Tooltip>
                        )}
                        {dadosDesignacao.notificado && (
                            <Tooltip content="Participante notificado">
                                <Badge className="w-fit self-end text-xs" variant="success">Notificado</Badge>
                            </Tooltip>
                        )}
                    </div>
                </div>

                <p>
                    <span className="font-bold">Descrição:</span> {dadosDesignacao.parteReference.nome}
                </p>
                <p
                    className="flex"
                >
                    <span className="font-bold">Participante:</span> <Textarea className={`dark:bg-gray-800 ${editar ? "border" : "border-none"}`} value={dadosDesignacao.participante} {...!editar ? { disabled: true } : { disabled: false }} onChange={(e) => setDadosDesignacao({ ...dadosDesignacao, participante: e.target.value })} />

                </p>
                <p>
                    Tempo: {dadosDesignacao.parteReference.tempo ? dadosDesignacao.parteReference.tempo : "N/A"}
                </p>
                <p>
                    Criada por: {dadosDesignacao.usuarioReference.nome}
                </p>
                {autorizadoParaAcoes && 
                    <div className="flex gap-5">
                        {!editar && (
                            <>
                                <Btn
                                    className="bg-green-500 hover:bg-green-400"
                                    onClick={() => dispatch({ type: "iniciandoNotificacao" })}
                                >
                                    {dadosDesignacao.notificado ? "Reenviar" : "Notificar"}
                                </Btn>

                                {!dadosDesignacao.notificado && !dadosDesignacao.telefone && 
                                    <Btn
                                        onClick={() => setEditar(true)}
                                    >
                                        Editar
                                    </Btn>
                                }

                                <Btn
                                    className="bg-red-500 hover:bg-red-400"
                                    onClick={async () => {
                                        const resultado = await excluirDesignacao(dadosDesignacao.id, dadosDesignacao.usuarioReference.id)
                                        if (resultado.error) return toast.error(resultado.error.message)
                                        excluir(dadosDesignacao.id)
                                        return toast.success(resultado.data.message)
                                    }}
                                >
                                    Excluir
                                </Btn>
                            </>
                        )}
                        {editar && (
                            <>
                                <Btn
                                    className="bg-red-500 hover:bg-red-400"
                                    onClick={() => {
                                        setDadosDesignacao({
                                            ...dadosDesignacao,
                                            participante: designacao.participante
                                        })
                                        setEditar(false)
                                    }}
                                >
                                    Cancelar
                                </Btn>
                                <Btn
                                    onClick={async () => {
                                        const resultado = await editarParticipante(dadosDesignacao.participante, dadosDesignacao.id)
                                        if (resultado.error) {
                                            setEditar(false)
                                            setDadosDesignacao({
                                                ...dadosDesignacao,
                                                participante: designacao.participante
                                            })
                                            return toast.error(resultado.error.message)
                                        }
                                        setEditar(false)

                                        return toast.success(resultado.data.message)
                                    }}
                                >
                                    Salvar
                                </Btn>
                            </>
                        )}
                    </div>
                }
            </div>
        </>
    )
}