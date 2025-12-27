"use client";

import { Parte, Partes } from '@/app/lib/types/types';
import Btn from '@/app/minha-conta/components/btn';
import { EventoEspecial } from '@prisma/client';
import { Page, Text, View, Document, StyleSheet, PDFDownloadLink } from '@react-pdf/renderer';

export default function DownloadPDFBtn( { designacoes }: { designacoes: Partes[] } ) {

  const styles = StyleSheet.create({
    page: {
      flexDirection: 'column',
      backgroundColor: '#FFF',
      padding: 15,
      fontFamily: 'Helvetica',
      fontSize: "8pt",
    },
    canticos: {
      fontSize: "9pt",
      fontFamily: "Helvetica-Bold",
      borderRight: "1px solid black",
      borderLeft: "1px solid black",
      flexBasis: "12%",
      backgroundColor: "#d9d9d9",
      textAlign: "center",
    },
  });

  const TabelaDesignacoesSecao = ( { partes, visita }: { partes: Parte[], visita?: string } ) => (
    <View style={{width: "100%", display: "flex", flexDirection: "row", borderBottom: "1px solid black", flexWrap: "wrap"}}>
      {partes.map((parte, index) => (
        <>
          <Text
            key={`tempo-${index}`}
            style={{flexBasis: "10%", borderRight: "1px solid black", textAlign: "center", fontFamily: "Helvetica-Bold"}}
          >
            {parte.tempo?.trim()}
          </Text>

          <Text
            key={`parte-${index}`}
            style={{flexBasis: "65%", borderRight: "1px solid black", paddingLeft: "6px"}}
          >
            {(visita && parte.nome.includes("Estudo bíblico de congregação")) ? `${parte.nome.split(" ")[0]} ${visita}` : parte.nome?.trim()}
          </Text>

          <Text
            key={`participante-${index}`}
            style={{flexBasis: "25%", paddingLeft: "6px"}}
          >
            - {parte.participante?.trim()}
          </Text>
        </>
      ))}
    </View>
  )

  const TabelaDesignacoesCompleta = ( { designacoes }: {designacoes: Partes} ) => (
    <View style={{ width: "100%", border: "2px solid black"}} key={designacoes.diaReuniao}>

      <View style={{width: "100%", display: "flex", flexDirection: "row", justifyContent: "space-between", borderBottom: "1px solid black"}}>
        <Text style={{fontSize: "9pt", fontFamily: "Helvetica-Bold", flexBasis: "18%", backgroundColor: "#d9d9d9", paddingLeft: "6px"}}>
          {designacoes.diaReuniao.trim()}
        </Text>

        <Text style={styles.canticos}>
          {designacoes.canticos[0].trim()}
        </Text>

        <Text style={{borderRight: "1px solid black", flexBasis: "25%", paddingLeft: "6px"}}>
          Oração: {designacoes?.outros.find((parte) => parte.nome === "Oração Inicial")?.participante?.trim()}
        </Text>

        <Text style={{flexBasis: "45%", paddingLeft: "6px"}}>
          Comentários iniciais: {designacoes?.outros.find((parte) => parte.nome === "Presidente")?.participante?.trim()}
        </Text>
      </View>

      <View style={{width: "100%", display: "flex", flexDirection: "row", borderBottom: "1px solid black", gap: "80px"}}>
        <Text style={{fontFamily: "Helvetica-Bold", borderRight: "1px solid black", flexBasis: "30%", backgroundColor: "#0f766e", textAlign: "center", color: "white"}}>
          TESOUROS DA PALAVRA DE DEUS
        </Text>

        <Text style={{fontFamily: "Helvetica-Bold", backgroundColor: "#7d4d98", color: "white", textAlign: "center", flexBasis: "20%", borderRight: "1px solid black", borderLeft: "1px solid black"}}>
          {designacoes?.capitulos.trim()}
        </Text>
      </View>
      
      <TabelaDesignacoesSecao partes={designacoes.tesouros} />

      <View style={{width: "100%", display: "flex", flexDirection: "row", borderBottom: "1px solid black"}}>
        <Text style={{fontFamily: "Helvetica-Bold", borderRight: "1px solid black", flexBasis: "30%", backgroundColor: "#ca8a04", textAlign: "center", color: "white"}}>
          FAÇA SEU MELHOR NO MINISTÉRIO
        </Text>
      </View>

      <TabelaDesignacoesSecao partes={designacoes.ministerio} />

      <View style={{width: "100%", display: "flex", flexDirection: "row", borderBottom: "1px solid black", gap: "80px"}}>
        <Text style={{fontFamily: "Helvetica-Bold", borderRight: "1px solid black", flexBasis: "30%", backgroundColor: "#991b1b", textAlign: "center", color: "white"}}>
          NOSSA VIDA CRISTÃ
        </Text>

        <Text style={styles.canticos}>
          {designacoes?.canticos[1].trim()}
        </Text>
      </View>

      <TabelaDesignacoesSecao partes={designacoes.vida} visita={designacoes.visita || undefined} />

      <View style={{width: "100%", display: "flex", flexDirection: "row", borderBottom: "1px solid black", justifyContent: "flex-end"}}>
        <Text style={{flexBasis: "12%", borderRight: "1px solid black", borderLeft: "1px solid black", paddingLeft: "6px"}}>
          Leitor:
        </Text>

        <Text style={{flexBasis: "25%", paddingLeft: "6px"}}>
          - {designacoes?.outros.find((parte) => parte.nome === "Leitor")?.participante?.trim()}
        </Text>
      </View>

      <View style={{width: "100%", display: "flex", flexDirection: "row"}}>
        <Text style={{paddingLeft: "6px", flexBasis: "63%"}}>
          Recapitulação e visão geral da próxima semana
        </Text>

        <Text style={styles.canticos}>
          {designacoes?.canticos[2].trim()}
        </Text>

        <Text style={{flexBasis: "25%", paddingLeft: "6px"}}>
          Oração: {designacoes?.outros.find((parte) => parte.nome === "Oração Final")?.participante?.trim()}
        </Text>
      </View>
    </View>
  )

  const EventoEspecial = (eventoEspecial: Partial<EventoEspecial>) => {
    
    const gap = eventoEspecial.tema!.length > 40 ? "20px" : "40px";

    return (
      <View
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "space-around",
          gap: gap,
          width: "100%",
          marginBottom: "10px",
          padding: "10px",
          border: "2px solid black",
          backgroundColor: "#f3f4f6"
        }}
        key={eventoEspecial.data}
      >
        <Text style={{ fontSize: 14, fontFamily: "Helvetica-Bold" }}>
          {eventoEspecial.tipo === "congresso" ? "Congresso Regional" : "Assembleia de Circuito"} ({eventoEspecial.data})
        </Text>
        <Text style={{ fontSize: 24, lineHeight: "24pt", fontFamily: "Helvetica-Oblique", textAlign: "center" }}>
          "{eventoEspecial.tema}"
        </Text>
        <View style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "5px"
        }}>
          <Text style={{ fontSize: 8, fontFamily: "Helvetica" }}>Não haverá reunião no meio de semana por conta {`${eventoEspecial.tipo === "congresso" ? "do congresso" : "da assembleia"}`}.</Text>
          <Text style={{ fontSize: 8, fontFamily: "Helvetica" }}>Considere a matéria pessoalmente ou com sua família.</Text>
        </View>
      </View>
  )}
    
  const MyDocument = () => (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={{ backgroundColor: "#3b82f6", padding: 5, borderRadius: 5 }}>
          <Text style={{ fontSize: 20, fontFamily: "Helvetica-Bold", textAlign: "center", color: "white" }}>Reunião Nossa Vida e Ministério</Text>
        </View>
        <View style={{ width: "100%", marginTop: 10, lineHeight: "11pt", display: "flex", flexDirection: "column", gap: "10px"}}>
          {designacoes.map((designacao) => (
            <>
              {designacao.eventosEspeciais ? (
                <EventoEspecial {...designacao.eventosEspeciais} key={`designacoes_${designacao.semana}`} />
              ) : (
                <TabelaDesignacoesCompleta designacoes={designacao} key={`designacoes_${designacao.semana}`} />
              )}
            </>
          ))}
        </View>
      </Page>
    </Document>
  );

    return (
      <PDFDownloadLink document={<MyDocument />} fileName={`designacoes.pdf`}>
        <Btn>Download PDF</Btn>
      </PDFDownloadLink>
    )
}