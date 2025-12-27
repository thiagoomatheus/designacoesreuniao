import { EventoEspecial } from "@prisma/client"

export type Partes = {
  id?: string
  semana: string
  canticos: string[]
  capitulos: string
  diaReuniao: string
  outros: Parte[]
  tesouros: Parte[]
  ministerio: Parte[]
  vida: Parte[]
  visita: string | null
  eventosEspeciais: Partial<EventoEspecial> | null
}

export type Parte = {
  id?: string
  nome: string
  tempo?: string
  participante?: string
}

export type Contato = {
  id: string
  pushName: string
  profilePictureUrl: null,
  owner: string
}