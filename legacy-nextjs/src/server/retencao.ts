import 'server-only';
import { prisma } from '@/lib/prisma';
import { excluirArquivo } from '@/lib/storage';

/**
 * Política de retenção da LGPD: candidatos reprovados ou desistentes são
 * anonimizados após X meses (padrão 6, configurável em RETENCAO_MESES).
 * Quem está no banco de talentos é preservado.
 *
 * A anonimização apaga os dados pessoais e os arquivos do storage, mas mantém
 * o registro para as estatísticas e o log de auditoria.
 */
export async function anonimizarVencidos(referencia = new Date()): Promise<number> {
  const config = await prisma.configuracao.findUnique({ where: { chave: 'RETENCAO_MESES' } });
  const meses = Number(config?.valor ?? 6);
  if (!Number.isFinite(meses) || meses <= 0) return 0;

  const limite = new Date(referencia);
  limite.setMonth(limite.getMonth() - meses);

  const candidatos = await prisma.candidato.findMany({
    where: {
      etapa: { in: ['REPROVADO', 'DESISTIU'] },
      anonimizadoEm: null,
      etapaAtualizadaEm: { lt: limite },
    },
    include: { documentos: { include: { arquivos: true } } },
  });

  for (const candidato of candidatos) {
    for (const documento of candidato.documentos) {
      for (const arquivo of documento.arquivos) {
        await excluirArquivo(arquivo.chave).catch(() => undefined);
      }
    }

    await prisma.$transaction([
      prisma.arquivoDocumento.deleteMany({
        where: { documento: { candidatoId: candidato.id } },
      }),
      prisma.filho.deleteMany({ where: { candidatoId: candidato.id } }),
      prisma.referencia.deleteMany({ where: { candidatoId: candidato.id } }),
      prisma.empregoAnterior.deleteMany({ where: { candidatoId: candidato.id } }),
      prisma.candidato.update({
        where: { id: candidato.id },
        data: {
          nomeCompleto: 'Candidato anonimizado',
          telefoneContato: null,
          telefoneRecado: null,
          celularWhatsapp: null,
          email: null,
          naturalidade: null,
          dataNascimento: null,
          nomeConjuge: null,
          logradouro: null,
          numero: null,
          complemento: null,
          bairro: null,
          cep: null,
          nomeMae: null,
          nomePai: null,
          cpf: null,
          cpfCifrado: null,
          pisNit: null,
          rgNumero: null,
          rgNumeroCifrado: null,
          rgOrgaoExpedidor: null,
          cnhNumero: null,
          cnhRegistro: null,
          ctpsNumero: null,
          ctpsSerie: null,
          tituloEleitorNumero: null,
          tituloEleitorZona: null,
          tituloEleitorSecao: null,
          reservistaNumero: null,
          tipoSanguineo: null,
          chavePix: null,
          sobreVoce: null,
          assinaturaBase64: null,
          consentimentoIp: null,
          consentimentoUserAgent: null,
          // cidade, uf e funcaoId permanecem para as estatísticas agregadas.
          anonimizadoEm: new Date(),
        },
      }),
    ]);
  }

  return candidatos.length;
}
