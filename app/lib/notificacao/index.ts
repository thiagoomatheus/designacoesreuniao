
import { getChaveSemana } from '../semana'
import { prisma } from './prisma'

async function enviarNotificacaoAgendada() {

    const chaveSemanaAtual = getChaveSemana(new Date())

    console.log(`Enviando notificação para semana ${chaveSemanaAtual}`)
    
    const designacoesParaNotificar = await prisma.designacao.findMany({
        where: {
            semana: chaveSemanaAtual,
            telefone: {
                not: null
            }
        },
        include: {
            semanaReference: true,
            usuarioReference: true,
            parteReference: true
        }
    })

    if (!designacoesParaNotificar || designacoesParaNotificar.length === 0) return console.log("Sem designações para notificar");

    await Promise.all(

        designacoesParaNotificar.map(async (designacao) => {
            
            const usuario = designacao.usuarioReference
    
            if (!usuario.instanciaWhatsApp) return console.log({
                error: {
                    code: 400,
                    designacao: designacao.id,
                    message: "Instância do WhatsApp não foi criada. Navegue até a seção minha conta para criar uma."
                }
            })

            try {
                
                const retryLimit = 3;
                let retryCount = 0;
                let resNotificarParticipante;
                let resultadoStatusIntanciaWhatsApp;

                while (retryCount < retryLimit) {

                    try {

                        const resStatusIntanciaWhatsApp = await fetch(`${process.env.EVOLUTION_API_URL}/instance/connectionState/${usuario.instanciaWhatsApp}`, {
                            headers: {
                                "Content-Type": "application/json",
                                "apiKey": process.env.AUTHENTICATION_API_KEY!
                            },
                            cache: "no-store"
                        })
                    
                        resultadoStatusIntanciaWhatsApp = await resStatusIntanciaWhatsApp.json()

                        if (resStatusIntanciaWhatsApp.status === 200) {
                            if (
                                resultadoStatusIntanciaWhatsApp.instance.state ===
                                'open'
                            ) {
                                // Instância está aberta, podemos prosseguir
                                break;
                            } else {
                                console.log({
                                    error: {
                                        code: 400,
                                        designacao: designacao.id,
                                        message: 'A instância do WhatsApp não está aberta. Verifique sua instância na seção Minha Conta.',
                                    },
                                });
                                return; // Abortar a notificação para esta designação
                            }
                        } else {
                            console.log({
                                error: {
                                    code: resultadoStatusIntanciaWhatsApp.status,
                                    designacao: designacao.id,
                                    message: resultadoStatusIntanciaWhatsApp.response.message,
                                },
                            });
                            return; // Abortar a notificação para esta designação
                        }
                        
                    } catch (error) {
                        
                        console.error('Erro ao verificar o status da instância do WhatsApp:', error);
                        retryCount++;
                        await new Promise((resolve) => setTimeout(resolve, 1000)); // Esperar 1 segundo antes de tentar novamente

                    }
                }

                // Se chegou aqui e retryCount atingiu o limite, abortar
                if (retryCount === retryLimit) {
                    console.log({
                        error: {
                            code: 500, // Ou outro código apropriado
                            designacao: designacao.id,
                            message:'Falha ao verificar o status da instância do WhatsApp após várias tentativas.',
                        },
                    });
                    return;
                }

                retryCount = 0; // Resetar o contador para as tentativas de envio da mensagem

                while (retryCount < retryLimit) {

                    try {
                        resNotificarParticipante = await fetch(`${process.env.EVOLUTION_API_URL}/message/sendText/${usuario.instanciaWhatsApp}`, {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                                "apiKey": process.env.AUTHENTICATION_API_KEY!
                            },
                            body: JSON.stringify({
                                number: `55${designacao.telefone}`,
                                textMessage: {
                                    text: `
${designacao.formaDeTratamento === "nenhum" && !designacao.nome ? "Olá, tudo bem?" : designacao.formaDeTratamento !== "nenhum" && !designacao.nome ? `Olá ${designacao.formaDeTratamento}, tudo bem?` : designacao.formaDeTratamento === "nenhum" && designacao.nome ? `Olá ${designacao.participante}, tudo bem?` : designacao.formaDeTratamento !== "nenhum" && designacao.nome ? `Olá ${designacao.formaDeTratamento} ${designacao.participante}, tudo bem?` : ""}

Passando para confirmar sua designação para o dia ${designacao.diaReuniao}:

*Designação: ${designacao.parteReference.nome}*

${!designacao.tempo && !designacao.obsText ? "" : designacao.tempo && !designacao.obsText ? `*Tempo: ${designacao.parteReference.tempo ? designacao.parteReference.tempo : "N/A"}*` : !designacao.tempo && designacao.obsText ? `*Obs.:* ${designacao.obsText}` : 
`*Tempo: ${designacao.parteReference.tempo ? designacao.parteReference.tempo : "N/A"}*

*Obs.:* ${designacao.obsText}`}

Por favor, confirme sua participação.

Obrigado!
`
                                }
                            })
                        })
                    
                        if (resNotificarParticipante.status === 201) {

                            await prisma.designacao.update({
                                where: {
                                    id: designacao.id
                                },
                                data: {
                                    telefone: null,
                                    notificado: true
                                }
                            })

                            console.log({
                                data: {
                                    code: resNotificarParticipante.status,
                                    designacao: designacao.id,
                                    message: 'Participante notificado com sucesso!',
                                },
                            });
                            break; // Sair do loop de retries em caso de sucesso
                        } else {
                            const error = await resNotificarParticipante.json();
                            console.log({
                                error: {
                                    code: resNotificarParticipante.status,
                                    designacao: designacao.id,
                                    message:
                                        error.response?.message ||
                                        'Erro ao notificar participante. Tente novamente mais tarde.',
                                },
                            });
                        }

                    } catch (error) {
                        
                        console.error('Erro ao enviar notificação para designação ' + designacao.id + ':', error);

                    }

                    retryCount++;
                    await new Promise((resolve) => setTimeout(resolve, 1000)); // Esperar 1 segundo antes de tentar novamente

                }

                // Se chegou aqui e retryCount atingiu o limite, logar o erro
                if (retryCount === retryLimit) {
                    console.log({
                        error: {
                            code: 500,
                            designacao: designacao.id,
                            message:
                                'Falha ao notificar participante após várias tentativas.',
                        },
                    });
                }

            } catch (error) {
                
                console.error('Erro inesperado ao processar designação ' + designacao.id + ':', error);
            }
             
        })
    )
}

enviarNotificacaoAgendada()