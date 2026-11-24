"use server"

import { auth } from "@/app/lib/auth/auth"
import { prisma } from "@/app/lib/prisma/prisma"
import { comparaChavesSemana, getChaveSemana } from "@/app/lib/semana"
import { Contato } from "@/app/lib/types/types"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { z } from "zod"

export async function receberContatos(instanciaWhatsApp: string | null): Promise<Contato[]> {

    if (!instanciaWhatsApp) return []

    const contatos: Contato[] = await fetch(`${process.env.EVOLUTION_API_URL}/chat/findContacts/${instanciaWhatsApp}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "apiKey": process.env.AUTHENTICATION_API_KEY!
        },
    })
    .then(async (res) => {
        return await res.json()
    })
    
    return contatos
}

export async function editarParticipante(participante: string, parte_id: string) {

    const schema = z.object({
        participante: z.string(),
        parte_id: z.string()
    }, {
        message: "Dados recebidos incorretos"
    })

    const validacao = schema.safeParse({participante, parte_id})

    if (!validacao.success) return { 
        error: {
            code: 401,
            message: validacao.error.message
        }
    }

    await prisma.designacao.update({
        where: {
            id: validacao.data.parte_id
        },
        data: {
            participante: validacao.data.participante
        }
    })

    revalidatePath("/designacoes")

    return {
        data: {
            code: 200,
            message: "Participante editado com sucesso"
        }
    }
}

export async function excluirDesignacao(idDesignacao: string, idCriadorDesignacao: string) {

    const schema = z.object({
        idDesignacao: z.string(),
        idCriadorDesignacao: z.string()
    }, {
        message: "Dados recebidos incorretos"
    })

    const validacao = schema.safeParse({
        idDesignacao,
        idCriadorDesignacao
    })

    if (!validacao.success) return {
        error: {
            code: 401,
            message: validacao.error.message
        }
    }

    const sessao = await auth()
    
    if (!sessao?.user) return redirect("/login")

    const usuario = await prisma.usuario.findUnique({ where: { email: sessao.user?.email! } })

    if (!usuario) return redirect("/login")

    if (usuario.id !== idCriadorDesignacao) return { error: {
        code: 400,
        message: "Não foi você criou essa designação. Você só pode excluir as designações que você criou."
    }}

    await prisma.designacao.delete({
        where: {
            id: validacao.data.idDesignacao
        }
    })

    revalidatePath("/designacoes")

    return {
        data: {
            code: 200,
            message: "Designação excluída"
        }
    }
    
}

export async function notificarParticipante(designacaoId: string, parametrosDaMensagem: {
    telefone: string
    momentoDaNotificacao: "agora" | "semana",
    formaDeTratamento: "nenhum" | "irmão" | "irmã",
    obs: boolean,
    obsText: string
    nome: boolean,
    tempo: boolean,
}) {

    const sessao = await auth()
    
    if (!sessao?.user) return redirect("/login")

    const usuario = await prisma.usuario.findUnique({ where: { email: sessao.user?.email! } })

    if (!usuario) return redirect("/login")

    const designacao = await prisma.designacao.findUnique({ where: { id: designacaoId }, include: { usuarioReference: true, semanaReference: true, parteReference: true } })

    if (usuario.id !== designacao?.usuarioReference.id) return { error: {
        code: 400,
        message: "Não foi você criou essa designação. Você só pode notificar as designações que você criou."
    }}

    if (!usuario.instanciaWhatsApp) return { error: {
        code: 400,
        message: "Instância do WhatsApp não foi criada. Navegue até a seção minha conta para criar uma."
    }}

    const resStatusIntanciaWhatsApp = await fetch(`${process.env.EVOLUTION_API_URL}/instance/connectionState/${usuario.instanciaWhatsApp}`, {
        headers: {
            "Content-Type": "application/json",
            "apiKey": process.env.AUTHENTICATION_API_KEY!
        },
        cache: "no-store"
    })

    const resultadoStatusIntanciaWhatsApp = await resStatusIntanciaWhatsApp.json()

    if (resStatusIntanciaWhatsApp.status !== 200) return { error: {
        code: resultadoStatusIntanciaWhatsApp.status,
        message: resultadoStatusIntanciaWhatsApp.response.message
    }}

    if (resultadoStatusIntanciaWhatsApp.instance.state !== "open") return { error: {
        code: 400,
        message: "A instância do WhatsApp não está aberta. Verifique sua instância na seção Minha Conta."
    }}

    if (parametrosDaMensagem.momentoDaNotificacao === "semana") {

        const comparacao = comparaChavesSemana(getChaveSemana(new Date()), designacao.semana)

        if (comparacao === 0) return { error: {
            code: 400,
            message: "A semana selecionada é a atual. Não é possível agendar a notificação para esta semana."
        }}

        if (comparacao > 0) return { error: {
            code: 400,
            message: "A semana selecionada já passou. Não é possível agendar a notificação para esta semana."
        }}

        await prisma.designacao.update({
            where: { id: designacao.id },
            data: {
                telefone: parametrosDaMensagem.telefone,
                formaDeTratamento: parametrosDaMensagem.formaDeTratamento,
                nome: parametrosDaMensagem.nome,
                tempo: parametrosDaMensagem.tempo,
                obsText: parametrosDaMensagem.obsText
            }
        })

        return { data: {
            code: 201,
            message: "Notificação agendada com sucesso!"
        }}
    }

    let saudacao = ""

    if (parametrosDaMensagem.formaDeTratamento === "nenhum" && !parametrosDaMensagem.nome) {
        saudacao = "Olá, tudo bem?";
    } else if (parametrosDaMensagem.formaDeTratamento !== "nenhum" && !parametrosDaMensagem.nome) {
        saudacao = `Olá ${parametrosDaMensagem.formaDeTratamento}, tudo bem?`;
    } else if (parametrosDaMensagem.formaDeTratamento === "nenhum" && parametrosDaMensagem.nome) {
        saudacao = `Olá ${designacao.participante}, tudo bem?`;
    } else if (parametrosDaMensagem.formaDeTratamento !== "nenhum" && parametrosDaMensagem.nome) {
        saudacao = `Olá ${parametrosDaMensagem.formaDeTratamento} ${designacao.participante}, tudo bem?`;
    }

    let corpo = ""

    if (parametrosDaMensagem.tempo && !parametrosDaMensagem.obs) {
        corpo = `*Tempo: ${designacao.parteReference.tempo ? designacao.parteReference.tempo : "N/A"}*
        `
    } else if (!parametrosDaMensagem.tempo && parametrosDaMensagem.obs && parametrosDaMensagem.obsText) {
        corpo = `*Obs.:* ${parametrosDaMensagem.obsText}
        `    
    } else if (parametrosDaMensagem.tempo && parametrosDaMensagem.obs && parametrosDaMensagem.obsText) {
        corpo = `*Tempo: ${designacao.parteReference.tempo ? designacao.parteReference.tempo : "N/A"}*

*Obs.:* ${parametrosDaMensagem.obsText}
`
    }

    console.log("Instância WhatsApp:", usuario.instanciaWhatsApp);
    console.log("Número de Telefone:", parametrosDaMensagem.telefone);


    const retryLimit = 3;
    let retryCount = 0;
    let resNotificarParticipante;

    while (retryCount < retryLimit) {
      try {
        resNotificarParticipante = await fetch(`${process.env.EVOLUTION_API_URL}/message/sendText/${usuario.instanciaWhatsApp}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "apiKey": process.env.AUTHENTICATION_API_KEY!
            },
            body: JSON.stringify({
                number: `55${parametrosDaMensagem.telefone}`,
                textMessage: {
                    text: `
${saudacao}

Passando para confirmar sua designação para o dia ${designacao.diaReuniao}:

*Designação: ${designacao.parteReference.nome}*

${corpo ? corpo : `Por favor, confirme sua participação.

Obrigado!`}
${corpo ? `Por favor, confirme sua participação.

Obrigado!`: ``}
`
                }
            })
        });

        console.log("Status HTTP da Evolution:", resNotificarParticipante.status);

        if (resNotificarParticipante.status === 201) {
          // Sucesso!

          await prisma.designacao.update({
            where: {
                id: designacao.id
            },
            data: {
                notificado: true
            }
          })

          return { data: {
              code: resNotificarParticipante.status,
              message: "Participante notificado com sucesso!"
          }};
        } else {
          // Erro
          const error = await resNotificarParticipante.json();
          console.error("Erro da API Evolution:", error);
          console.log(error.response?.message); // Tentativa de log mais específico

          // Adicione tratamento específico para diferentes códigos de status
          if (resNotificarParticipante.status === 401) {
            // Não autorizado - pode indicar problema na chave da API
            return { error: {
                code: 401,
                message: "Erro de autenticação na API do WhatsApp. Verifique sua chave de API."
            }};
          } else if (resNotificarParticipante.status >= 500) {
            // Erro no servidor da Evolution - tentar novamente
            console.warn(`Erro no servidor da Evolution. Tentando novamente (${retryCount + 1}/${retryLimit}).`);
          } else {
            // Outro erro (e.g., 400 Bad Request) - não tentar novamente
            return { error: {
                code: 401, // ou o código correto
                message: "Erro ao notificar participante. Tente novamente mais tarde."
            }};
          }
        }
      } catch (error) {
          console.error("Erro inesperado ao chamar a API Evolution:", error);
          console.warn(`Tentando novamente (${retryCount + 1}/${retryLimit}).`);
      }

      retryCount++;
      await new Promise(resolve => setTimeout(resolve, 1000)); // Espera 1 segundo antes de tentar novamente
    }

    // Se chegou aqui, todas as tentativas falharam
    return { error: {
        code: 401, // ou um código mais apropriado
        message: "Erro ao notificar participante após várias tentativas. Tente novamente mais tarde."
    }};
}