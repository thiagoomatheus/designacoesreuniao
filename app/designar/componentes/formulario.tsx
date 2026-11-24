"use client"

import React, { useContext } from "react";
import "react-day-picker/style.css";
import useForm from "../lib/hooks/useDesignacoes"
import SectionTitle from "./sectionTitle"
import { Calendar } from "./calendar";
import Instrucoes from "../../componentes/instrucoes";
import toast from "react-hot-toast";
import OpcaoDeLayout from "./opcaoDeLayout";
import { DesignarContext } from "../lib/contexts/DesignarContext";
import SecaoDeDesignacoes from "./SecaoDeDesignacoes";

export default function Formulario() {

    const { comecar, inserirLayout, getPartes } = useForm()

    const { semanas, layout } = useContext(DesignarContext)!
    
    return (
        <div className="flex flex-col w-full gap-3 p-3 rounded-lg" >
            {!semanas && layout === null && (
                <>
                    <p className="text-center">
                        Começe a designar as partes da reunião Vida e Ministério agora mesmo. A baixo estão as instruções para você relembrar.
                    </p>
                    <p className="text-center">
                        Quando estiver pronto, clique no botão Iniciar.
                    </p>
                    <Instrucoes />
                    <button
                        className="bg-blue-500 hover:bg-blue-600 p-2 rounded-lg text-white shadow-lg font-bold"
                        onClick={comecar}
                    >
                        Iniciar
                    </button>
                </>
            )}
            {!semanas && layout === undefined &&
                <SectionTitle
                    title="Layout"
                    classname="bg-yellow-400"
                >
                    <form
                        className="flex flex-col items-center w-full gap-3"
                        action={inserirLayout}
                    >
                        <p>
                            Selecione o layout que deseja:
                        </p>
                        <div className="flex flex-col md:flex-row gap-5">
                            <OpcaoDeLayout quantidadeDeSemanas={1} />
                            <OpcaoDeLayout quantidadeDeSemanas={2} />
                            <OpcaoDeLayout quantidadeDeSemanas={4} />
                        </div>
                        <button
                            className="bg-yellow-400 px-3 py-2 rounded-lg text-white dark:text-gray-900 shadow-lg w-fit font-bold self-end hover:bg-yellow-500"
                            type="submit"
                            value="Próximo"
                        >
                            Próximo
                        </button>
                    </form>
                </SectionTitle>
            }
            {!semanas && layout &&
                <SectionTitle
                    title="Semana Inicial"
                    classname="bg-purple-400"
                >
                    <div className="flex flex-col w-full items-center justify-center gap-5">
                        <p>
                            Agora, selecione a semana em que as designações vão comecar.
                        </p>
                        <form
                            className="flex flex-col items-center w-full gap-3"
                            action={async (formData: FormData) => {
                            const toastLoading = toast.loading("Buscando partes na apostila...")
                            getPartes(formData)
                            .then(result => {
                                if (result === undefined) return toast.success("Dados encontrados", { id: toastLoading })
                                toast.error(result, { id: toastLoading })
                            })
                        }}>
                            <label className="flex flex-col gap-5">
                                <Calendar />
                            </label>
                            <button
                                className="bg-purple-400 hover:bg-purple-500 px-3 py-2 rounded-lg text-white dark:text-gray-900 shadow-lg w-fit font-bold self-end"
                                type="submit"
                                value="Próximo"
                            >
                                Próximo
                            </button>
                        </form>
                    </div>
                </SectionTitle>
            }
            {semanas &&
                <SectionTitle
                    classname="bg-blue-400"
                    title="Participantes"
                >
                    <p>
                        Muito bom! Nós já temos todas as partes das semanas selecionadas e é nesse momento que você entra em ação. Para ficar mais fácil a visualização, vamos ir designanado uma semana por vez.
                    </p>
                    <p>
                        Veja que temos campos digitáveis para cada parte, assim, você poderá digitar o nome dos participantes. Os campos digitáveis estão indicados com uma borda pontilhada como o exemplo abaixo 👇👇
                    </p>
                    <div className="border-2 border-dashed w-52 h-7 rounded border-teal-700 dark:border-teal-500" />
                        <p>
                            Caso esteja num dispositivo com tela menor você terá de rolar para a direita a fim de escontrar os campos digitáveis das partes. Para voltar, basta rolar para a esquerda.
                        </p>
                    <div className="md:hidden flex justify-between">
                        <p>👈👈👈</p>
                        <p>👉👉👉</p>
                    </div>
                    <SecaoDeDesignacoes />
                </SectionTitle>
            }
        </div>
    )
}