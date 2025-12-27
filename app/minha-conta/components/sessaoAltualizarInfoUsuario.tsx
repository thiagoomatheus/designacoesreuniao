"use client"

import React from "react"
import { useState } from "react"
import toast from "react-hot-toast"
import Btn from "./btn"
import AlterarInfoUsuario from "../lib/actions/alterarInfoUsuario"

export default function SessaoAltualizarInfoUsuario( { cong, funcao }: {
    cong: number | null
    funcao: "participar" | "designar" | null
} ) {

    const [update, setUpdate] = useState<"cong" | "funcao" | false>()
    const [valueCong, setValueCong] = useState<number>(cong ?? 0)
    const [valueFuncao, setValueFuncao] = useState<"participar" | "designar" | null>(funcao)

    return (
        <>
            {!cong && !funcao && (
                <form className="flex flex-col gap-5" action={async (formData) => {
                    const res = await AlterarInfoUsuario(parseInt(formData.get("cong") as string), formData.get("funcao") as "participar" | "designar")
                    if (res !== 201) return toast.error("Ocorreu um erro. Por favor, tente mais tarde")
                    toast.success("Alterado com sucesso")
                    return setUpdate(false)
                }}>
                    <p>Para idenficarmos futuramente as suas designações criadas e participantes, será necessário informar o número de sua congregação.</p>
                    <label className="flex flex-col gap-3">
                        Informe o número da sua Congregação:
                        <input className="max-w-40" type="number" name="cong" required />
                    </label>
                    <p>Por favor, selecione sua função.</p>
                    <label className="flex flex-col gap-3">
                        Minha função:
                        <select name="funcao" defaultValue="default" required>
                            <option disabled value='default'>Selecione uma função</option>
                            <option value="participar">Participar</option>
                            <option value="designar">Designar</option>
                        </select>
                    </label>
                    <input className="bg-blue-500 cursor-pointer p-2 rounded-lg shadow-lg font-bold max-w-32" type="submit" value="Salvar" />
                </form>
            )}
            {cong && funcao && (
                <>
                    {!update && 
                        <>
                            <p><span className="font-bold">Minha congregação:</span> {cong}</p>
                            <p><span className="font-bold">Minha função:</span> {funcao.toUpperCase()}</p>
                            <div className="flex gap-3">
                                <Btn onClick={() => setUpdate("cong")}>
                                    Alterar Congregação
                                </Btn>
                                <Btn onClick={() => setUpdate("funcao")}>
                                    Alterar Função
                                </Btn>
                            </div>
                        </>
                    }
                    {update === "cong" && 
                        <div className="flex flex-col gap-7">
                            <p>Minha nova congregação: {valueCong !== cong && valueCong !== 0 ? valueCong : ""}</p>
                            <div className="flex flex-col gap-3">
                                <input className="max-w-32 dark:text-white" type="text" onChange={(e) => setValueCong(Number(e.target.value))} />
                                <Btn onClick={() => {
                                    setUpdate(false)
                                    setValueCong(cong)
                                }}>
                                    Cancelar
                                </Btn>
                                <Btn onClick={async () => {
                                    if (cong === 0) return toast.error("Insira um valor")
                                    if (valueCong === cong) return toast.error("Insira um valor diferente")
                                    const res = await AlterarInfoUsuario(valueCong)
                                    if (res !== 201) return toast.error("Ocorreu um erro. Por favor, tente mais tarde")
                                    toast.success("Alterado com sucesso")
                                    return setUpdate(false)
                                }} >
                                    Salvar
                                </Btn>
                            </div>
                        </div>
                    }
                    {update === "funcao" && 
                        <div className="flex flex-col gap-7">
                            <p>Minha nova funçao: {valueFuncao !== funcao && valueFuncao !== null ? valueFuncao : ""}</p>
                            <div className="flex flex-col gap-3">
                                <label className="flex flex-col gap-3">
                                    <select required name="funcao" onChange={(e) => setValueFuncao(e.target.value as "participar" | "designar")}>
                                        <option disabled selected>Selecione uma função</option>
                                        <option value="participar">Participar</option>
                                        <option value="designar">Designar</option>
                                    </select>
                                </label>
                                <Btn onClick={() => {
                                    setUpdate(false)
                                    setValueFuncao(funcao)
                                }}>
                                    Cancelar
                                </Btn>
                                <Btn onClick={async () => {
                                    if (!valueFuncao) return toast.error("Insira um valor")
                                    if (valueFuncao === funcao) return toast.error("Insira um valor diferente")
                                    const res = await AlterarInfoUsuario(undefined, valueFuncao as "participar" | "designar")
                                    if (res !== 201) return toast.error("Ocorreu um erro. Por favor, tente mais tarde")
                                    toast.success("Alterado com sucesso")
                                    return setUpdate(false)
                                }} >
                                    Salvar
                                </Btn>
                            </div>
                        </div>
                    }
                </>
            )}
            
        </>
    )
}