"use client"

import { useContext, useState } from "react"
import { DesignarContext } from "../lib/contexts/DesignarContext"
import CartaoDeSemana from "./CartaoDeSemana"
import Btn from "@/app/minha-conta/components/btn"
import Link from "next/link"
import useDesignacaoes from "../lib/hooks/useDesignacoes"
import DownloadPDFBtn from "./DownloadPDFBtn"
import toast from "react-hot-toast"
import { Badge } from "@/app/componentes/Badge"

export default function SecaoDeDesignacoes() {

    const { semanas } = useContext(DesignarContext)!

    const [semana, setSemana] = useState<number>(1)
    const [salvo, setSalvo] = useState<boolean>(false)
    const { salvandoDesignacoes } = useDesignacaoes()

    if (!semanas || !semanas.length) return <p>Ocorreu um erro! Por favor, tente mais tarde.</p>
    
    const dados = semanas[semana-1]

    const [eventosEspeciais, setEventosEspeciais] = useState<boolean>(dados ? !!dados.eventosEspeciais?.tema : false)
    const [visita, setVisita] = useState<boolean>(dados ? !!dados.visita : false)

    console.log(dados);

    return (
        <div className="flex flex-col gap-5 print:gap-[10px] overflow-auto pb-3 md:pb-0 impressao">
            {semana <= semanas.length && (
                <>
                    <div className="flex flex-row items-center justify-between">
                        <div className="flex flex-row items-center gap-10">
                            <h3>Semana {semana} / {semanas.length}</h3>
                            {(dados.outros.find((parte) => parte.participante) || dados.tesouros.find((parte) => parte.participante) || dados.ministerio.find((parte) => parte.participante)) && <Badge variant="warning">Semana contém designações</Badge>}
                        </div>
                        <div className="flex flex-col items-end gap-2">
                            <label className="flex items-center gap-4">
                                <span>Evento Especial</span>
                                <input
                                    type="checkbox"
                                    name="assembleia"
                                    checked={eventosEspeciais ? true : false}
                                    onChange={(e) => setEventosEspeciais(e.target.checked)}
                                />
                            </label>
                            <label className="flex items-center gap-4">
                                <span>Visita</span>
                                <input
                                    type="checkbox"
                                    name="visita"
                                    checked={visita ? true : false}
                                    onChange={(e) => setVisita(e.target.checked)}
                                />
                            </label>
                        </div>
                    </div>
                    <CartaoDeSemana
                        key={semanas[semana-1].semana}
                        dados={dados}
                        visualizacao={false}
                        handleProximo={() => {
                            setSemana(semana + 1)
                            if (semana === semanas.length) {
                                return toast.success("Salve suas designações para poder notificar os participantes ou faça o download do PDF.")
                            }
                            setEventosEspeciais(false)
                            setVisita(false)
                        }}
                        eventosEspeciais={eventosEspeciais}
                        visita={visita}
                    >
                        <div className={`flex flex-row gap-5 ${semana === 1 ? "justify-end" : "justify-between"} items-center w-full`}>
                            {semana > 1 && <Btn onClick={() => setSemana(semana - 1)}>Anterior</Btn>}
                            <Btn className="cursor-pointer">
                                <input className="cursor-pointer" type="submit" value="Próximo" />
                            </Btn>
                        </div>
                    </CartaoDeSemana>
                    
                </>
            )}
            {semana > semanas.length && (
                <>
                    <h1 className="hidden print:block rounded-lg text-center">Reunião Nossa Vida e Ministério</h1>
                    {salvo && 
                        <div className="absolute -m-6 p-2 flex justify-center rounded-xl bg-green-200 text-green-800">
                            Salvo
                        </div>
                    }
                    {semanas.map((semana) => (
                        <CartaoDeSemana
                            key={semana.semana}
                            dados={semana}
                            visualizacao={true}
                            eventosEspeciais={!!semana.eventosEspeciais?.tema}
                            visita={!!semana.visita}
                        />
                    ))}
                    <div className="flex flex-row gap-5 justify-end print:hidden">
                        {!salvo && (
                            <Btn 
                                onClick={async () => await salvandoDesignacoes(semanas, setSalvo)} 
                                className="bg-blue-500 hover:bg-blue-400 p-2 rounded-lg shadow-lg font-bold cursor-pointer print:hidden flex flex-col items-center"
                            >
                                Salvar
                            </Btn>
                        )}

                        {salvo &&
                            <Link
                                href={`/designacoes`}
                                className="bg-blue-500 hover:bg-blue-400 p-2 rounded-lg dark:text-gray-900 shadow-lg font-bold cursor-pointer w-1/3 print:hidden flex flex-col items-center"
                            >
                                Ir para designações
                            </Link>
                        }
                        {semanas && <DownloadPDFBtn designacoes={semanas} />}
                    </div>
                </>
            )}
        </div>
    )
}