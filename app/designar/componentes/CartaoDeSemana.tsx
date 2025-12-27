"use client"

import { TdBase } from "./tdBase";
import Textarea from "./textarea";
import toast from 'react-hot-toast';
import { Partes } from "@/app/lib/types/types";
import Link from "next/link";
import { Tooltip } from "@/app/componentes/Tooltip";
import useForm from "../lib/hooks/useDesignacoes";
import { format, nextFriday, nextSaturday, nextSunday, setISOWeek, startOfISOWeek } from "date-fns";
import { useState } from "react";
import { TipoEvento } from "@prisma/client";

export default function CartaoDeSemana({dados, children, visualizacao, handleProximo, visita, eventosEspeciais}: {
    dados: Partes
    visualizacao: boolean
    handleProximo?: () => void
    children?: React.ReactNode
    eventosEspeciais: boolean
    visita: boolean
}) {

    const { adicionandoDesignacoes } = useForm()

    const [tipoEvento, setTipoEvento] = useState<TipoEvento>(dados.eventosEspeciais?.tipo || "assembleia")

    const buscaSegundaFeira = () => {
        const semana = parseInt(dados.semana.split("/")[0])
        const ano = parseInt(dados.semana.split("/")[1])

        let data = new Date(ano, 0, 1)

        data = setISOWeek(data, semana)

        return startOfISOWeek(data)
    }

    const dataSegundaFeira = buscaSegundaFeira()

    const dataSextaFeira = format(nextFriday(dataSegundaFeira), 'dd/MM');
    const dataSabado = format(nextSaturday(dataSegundaFeira), 'dd/MM');
    const dataDomingo = format(nextSunday(dataSegundaFeira), 'dd/MM');
    const diasCongresso = `${dataSextaFeira} a ${dataDomingo}`

    return (
        <form
            className="flex flex-col gap-3"
            action={(formData: FormData) => {
                const result = adicionandoDesignacoes(formData, dados)
<<<<<<< HEAD
                if (result !== true || !handleProximo) {
                    toast.error("Erro ao adicionar designações. Reinicie o processo!")
                    return
                }
                
                handleProximo?.()
=======
                if (result !== true || !handleProximo) return toast.error("Erro ao adicionar designações. Reinicie o processo!")
                handleProximo()
>>>>>>> 6ee3cb017fe46c964d3a22cf26aedeab7cc64dbb
            }}
        >
            <table className="w-full border-2 min-w-[781px] print:min-w-0" >

                {eventosEspeciais && (
                    <div className="flex flex-col justify-center items-center gap-3 p-4">
                        {!visualizacao && (
                            <>
                                <div className="flex flex-row gap-5">
                                    <label className="flex flex-col gap-2 p-2 justify-center items-center">
                                        Tipo de evento especial:
                                        <select
                                            name="tipo_evento_especial"
                                            onChange={(e) => setTipoEvento(e.target.value as TipoEvento)}
                                            defaultValue={tipoEvento}
                                            className="w-60"
                                            required
                                        >
                                            <option value="assembleia">Assembleia</option>
                                            <option value="congresso">Congresso</option>
                                        </select>
                                    </label>

                                    <label className="flex flex-col gap-2 p-2 justify-center items-center">
                                        Dia do evento:
                                        <select
                                            name="data_evento_especial"
                                            className="w-60"
                                            required
                                        >
                                            {tipoEvento === "assembleia" ? (
                                                <>
                                                    <option value={dataSabado}>Sábado ({dataSabado})</option>
                                                    <option value={dataDomingo}>Domingo ({dataDomingo})</option>
                                                </>
                                            ) : (
                                                <option value={diasCongresso}>Sexta, sábado e domingo</option>
                                            )}
                                        </select>
                                    </label>
                                </div>

                                <label className="flex flex-col gap-2 p-2 justify-center items-center">
                                    Tema do evento:
                                    <input
                                        type="text"
                                        name="tema_evento_especial"
                                        className="w-[500px]"
                                        defaultValue={dados.eventosEspeciais?.tema || ""}
                                        required
                                    />
                                </label>
                            </>
                        )}

                        {visualizacao && (
                            <div className="flex flex-col items-center justify-around gap-10">
                                <h3 className="">
                                    {dados.eventosEspeciais?.tipo === "congresso" ? "Congresso Regional" : "Assembleia de Circuito"} ({dados.eventosEspeciais?.data})
                                </h3>
                                <h2 className="text-center italic">
                                    "{dados.eventosEspeciais?.tema}"
                                </h2>
                                <footer className="flex flex-col items-center justify-center gap-1">
                                    <p className="text-[12px]">Não haverá reunião no meio de semana por conta {`${dados.eventosEspeciais?.tipo === "congresso" ? "do congresso" : "da assembleia"}`}.</p>
                                    <p className="text-[12px]">Considere a matéria pessoalmente ou com sua família.</p>
                                </footer>
                            </div>
                        )}
                    </div>
                )}

                {!eventosEspeciais && (
                    <tbody className="flex flex-col" >
                        <tr className="grid grid-cols-[0.2fr_0.13fr_0.3fr_0.42fr] print:grid-cols-[0.2fr_0.13fr_0.25fr_0.42fr] border-b" >
                            <TdBase className="border-r bg-[#d9d9d9] font-bold" >
                                {!visualizacao ?
                                    <Textarea
                                        required
                                        name="data_reuniao"
                                        defaultValue={dados?.diaReuniao}
                                        className="bg-transparent dark:bg-transparent dark:text-gray-900" 
                                    /> :
                                    <span className="dark:text-gray-900">{dados?.diaReuniao}</span>
                                }
                            </TdBase>

                            <TdBase className="border-r bg-[#d9d9d9] dark:text-gray-900 font-bold flex justify-center pl-0" >
                                <span className='dark:text-gray-900 flex justify-center' >
                                    {dados?.canticos[0]}
                                </span>
                            </TdBase>

                            <TdBase className="border-r flex items-center" >
                                Oração:{!visualizacao ? 
                                            <Textarea required name="oracao_inicial" defaultValue={dados?.outros.find((parte) => parte.nome === "Oração Inicial")?.participante} /> 
                                            : dados?.outros.find((parte) => parte.nome === "Oração Inicial")?.participante
                                        }
                            </TdBase>

                            <TdBase className="flex items-center" >
                                Comentários iniciais:{!visualizacao ? 
                                                        <Textarea required name="presidente" defaultValue={dados?.outros.find((parte) => parte.nome === "Presidente")?.participante} /> 
                                                        : dados?.outros.find((parte) => parte.nome === "Presidente")?.participante
                                                    }
                            </TdBase>
                        </tr>

                        <tr className="grid grid-cols-[0.4fr_0.2fr] gap-20 border-b" >
                            <TdBase className="flex items-center justify-center border-r bg-teal-700 font-bold text-white" >
                                <span className='print:text-white flex justify-center text-white' >
                                    TESOUROS DA PALAVRA DE DEUS
                                </span>
                            </TdBase>

                            <TdBase className="flex items-center justify-center px-2 border-x font-bold bg-[#7d4d98] text-white" >
                                <span className='print:text-white flex justify-center text-white' >
                                    {dados?.capitulos}
                                </span>
                            </TdBase>
                        </tr>

                        <tr className="grid grid-cols-[0.1fr_0.65fr_0.25fr] border-b pl-1" >
                            <>
                                {dados.tesouros.map((parte, index) => (
                                    <>
                                        <TdBase
                                            className="flex justify-center border-r"
                                            key={`tempo-${index}`}
                                        >
                                            {parte.tempo}
                                        </TdBase>

                                        <TdBase
                                            className="pl-1 border-r"
                                            key={`parte-${index}`}
                                        >
                                            {parte.nome}
                                        </TdBase>

                                        <TdBase className="pl-1 flex items-center" >
                                            -{!visualizacao ?
                                                <Textarea
                                                    required
                                                    key={`participante-${index}`}
                                                    name={parte.nome[0]}
                                                    defaultValue={parte.participante}
                                                /> :
                                                parte.participante
                                            }
                                        </TdBase>
                                    </>
                                ))}
                            </>
                        </tr>

                        <tr className="grid grid-cols-[0.4fr_0.6fr] gap-20 border-b">
                            <TdBase className="flex items-center justify-center border-r bg-yellow-600 font-bold text-white">
                                <span className='print:text-white flex justify-center text-white'>
                                    FAÇA SEU MELHOR NO MINISTÉRIO
                                </span>
                            </TdBase>
                        </tr>

                        <tr className="grid grid-cols-[0.1fr_0.65fr_0.25fr] border-b pl-1">
                            <>
                                {dados.ministerio.map((parte, index) => (
                                    <>
                                        <TdBase
                                            className="flex justify-center border-r"
                                            key={`tempo-${index}`}
                                        >
                                            {parte.tempo}
                                        </TdBase>

                                        <TdBase
                                            className="pl-1 border-r"
                                            key={`parte-${index}`}
                                        >
                                            {parte.nome}
                                        </TdBase>

                                        <TdBase className="pl-1 flex items-center">
                                            -{!visualizacao ?
                                                <Textarea
                                                    required
                                                    key={`participante-${index}`}
                                                    name={parte.nome[0]}
                                                    defaultValue={parte.participante}
                                                /> :
                                                parte.participante
                                            }
                                        </TdBase>
                                    </>
                                ))}
                            </>
                        </tr>

                        <tr className="grid grid-cols-[0.301fr_0.16fr] gap-56 border-b">
                            <TdBase className="flex items-center justify-center border-r bg-red-800 font-bold text-white">
                                <span className='print:text-white flex justify-center text-white'>
                                    NOSSA VIDA CRISTÃ
                                </span>
                            </TdBase>

                            <TdBase className="bg-[#d9d9d9] dark:text-gray-900 font-bold border-x pl-0 flex justify-center">
                                <span className='dark:text-gray-900 flex justify-center'>
                                    {dados?.canticos[1]}
                                </span>
                            </TdBase>
                        </tr>

                        <tr className="grid grid-cols-[0.1fr_0.65fr_0.25fr] border-b pl-1">
                            <>
                                {dados.vida.map((parte, index) => (
                                    <>
                                        <TdBase
                                            className="flex justify-center border-r"
                                            key={`tempo-${index}`}
                                        >
                                            {parte.tempo}
                                        </TdBase>

                                        <TdBase
                                            className="pl-1 border-r"
                                            key={`parte-${index}`}
                                        >
                                            {!visualizacao
                                                ? (visita && parte.nome.includes("Estudo bíblico de congregação"))
                                                    ? (
                                                        <>
                                                            {parte.nome.split(" ")[0]}{' '}
                                                            <Textarea
                                                                required
                                                                key={`visita-${index}`}
                                                                name="visita"
                                                                defaultValue={dados.visita || ""}
                                                                className="inline w-[450px]"
                                                            />
                                                        </>
                                                    )
                                                    : (
                                                        parte.nome
                                                    )
                                                : (visita && parte.nome.includes("Estudo bíblico de congregação"))
                                                    ? (
                                                        <>
                                                            {parte.nome.split(" ")[0]} {dados.visita}
                                                        </>
                                                    )
                                                    : (
                                                        parte.nome
                                                    )
                                            }
                                        </TdBase>
                                        
                                        <TdBase className="pl-1 flex items-center">
                                            -{!visualizacao ?
                                                <Textarea
                                                    required
                                                    key={`participante-${index}`}
                                                    name={parte.nome[0]}
                                                    defaultValue={parte.participante}
                                                /> :
                                                parte.participante
                                            }
                                        </TdBase>
                                    </>
                                ))}
                            </>
                        </tr>

                        <tr className="grid grid-cols-[0.13fr_0.25fr] justify-end border-b">
                            <TdBase className="border-x">
                                Leitor:
                            </TdBase>

                            <TdBase>
                                -{!visualizacao ? 
                                    <Textarea required name="leitor" defaultValue={dados?.outros.find((parte) => parte.nome === "Leitor")?.participante} /> 
                                    : dados?.outros.find((parte) => parte.nome === "Leitor")?.participante
                                }
                            </TdBase>
                        </tr>

                        <tr className="grid grid-cols-[0.62fr_0.13fr_0.25fr]">
                            <TdBase>
                                Recapitulação e visão geral da próxima semana
                            </TdBase>

                            <TdBase className="bg-[#d9d9d9] dark:text-gray-900 font-bold border-x pl-0 flex justify-center">
                                <span className='dark:text-gray-900 flex justify-center'>
                                    {dados?.canticos[2]}
                                </span>
                            </TdBase>

                            <TdBase className="flex items-center">
                                Oração: {!visualizacao ? 
                                            <Textarea required name="oracao_final" defaultValue={dados?.outros.find((parte) => parte.nome === "Oração Final")?.participante} /> 
                                            : dados?.outros.find((parte) => parte.nome === "Oração Final")?.participante
                                        }
                            </TdBase>
                        </tr>

                    </tbody>
                )}
            </table>

            {!visualizacao && (
                <>
                
                    <div className="flex">

                        <Tooltip content="Se achou algum erro nas designações, por favor, nos informe clicando no botão abaixo!"> 
                            <Link
                                target="_blank"
                                href={`mailto:thiagomatheus2001@hotmail.com?subject=Erro encontrado na semana ${dados.semana}&body=Encontrei o seguinte erro: (Coloque o erro encontrado aqui)`}
                                className="bg-red-500 hover:bg-red-600 p-2 rounded-lg dark:text-gray-900 shadow-lg font-bold cursor-pointer print:hidden flex flex-col items-center"
                            >
                                Comunicar erro
                            </Link>
                        </Tooltip>

                    </div>

                    {children}

                </>
            )}
        </form>
    );
}