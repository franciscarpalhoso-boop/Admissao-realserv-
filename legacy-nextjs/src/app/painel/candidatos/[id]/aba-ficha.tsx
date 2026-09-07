'use client';

import { Vazio } from '@/components/ui';
import { formatarData, formatarDataHora, formatarMoeda, sim } from '@/lib/formato';
import { mascararCep, mascararCpf, mascararPis, mascararTelefone } from '@/lib/validacao';
import { rotuloEscolaridade, rotuloEstadoCivil, rotuloSexo } from '@/lib/labels';
import type { CandidatoCompleto } from '@/server/candidatos';

function Item({ rotulo, valor }: { rotulo: string; valor: React.ReactNode }) {
  return (
    <div>
      <p className="text-[11px] font-medium text-slate-500">{rotulo}</p>
      <p className="text-sm text-slate-900">
        {valor === null || valor === undefined || valor === '' ? '—' : valor}
      </p>
    </div>
  );
}

function Secao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="mb-2 border-b border-slate-100 pb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
        {titulo}
      </h3>
      <div className="grid gap-x-4 gap-y-3 sm:grid-cols-3">{children}</div>
    </section>
  );
}

export function AbaFicha({ candidato }: { candidato: CandidatoCompleto }) {
  if (candidato.statusFicha === 'NAO_INICIADA') {
    return <Vazio>O candidato ainda não iniciou o preenchimento da ficha.</Vazio>;
  }

  return (
    <div className="space-y-6">
      <Secao titulo="1. Dados pessoais">
        <Item rotulo="Nome completo" valor={candidato.nomeCompleto} />
        <Item rotulo="Data de nascimento" valor={formatarData(candidato.dataNascimento)} />
        <Item rotulo="Sexo" valor={rotuloSexo[candidato.sexo]} />
        <Item rotulo="Telefone de contato" valor={mascararTelefone(candidato.telefoneContato)} />
        <Item rotulo="Telefone para recado" valor={mascararTelefone(candidato.telefoneRecado)} />
        <Item rotulo="Celular (WhatsApp)" valor={mascararTelefone(candidato.celularWhatsapp)} />
        <Item rotulo="E-mail" valor={candidato.email} />
        <Item rotulo="Vaga pretendida" valor={candidato.funcao?.nome} />
        <Item rotulo="Tempo de experiência" valor={candidato.tempoExperiencia} />
        <Item
          rotulo="Naturalidade"
          valor={[candidato.naturalidade, candidato.ufNaturalidade].filter(Boolean).join('/')}
        />
        <Item
          rotulo="Estado civil"
          valor={candidato.estadoCivil ? rotuloEstadoCivil[candidato.estadoCivil] : null}
        />
        <Item rotulo="Nome do cônjuge" valor={candidato.nomeConjuge} />
        <Item
          rotulo="Escolaridade"
          valor={candidato.escolaridade ? rotuloEscolaridade[candidato.escolaridade] : null}
        />
        <Item rotulo="Nome da mãe" valor={candidato.nomeMae} />
        <Item rotulo="Nome do pai" valor={candidato.nomePai} />
      </Secao>

      <Secao titulo="Endereço">
        <Item
          rotulo="Endereço"
          valor={[candidato.logradouro, candidato.numero, candidato.complemento]
            .filter(Boolean)
            .join(', ')}
        />
        <Item rotulo="Bairro" valor={candidato.bairro} />
        <Item rotulo="CEP" valor={mascararCep(candidato.cep)} />
        <Item rotulo="Cidade/UF" valor={[candidato.cidade, candidato.uf].filter(Boolean).join('/')} />
        <Item rotulo="Tempo de residência" valor={candidato.tempoResidencia} />
      </Secao>

      <Secao titulo="2. Documentação">
        <Item rotulo="CPF" valor={mascararCpf(candidato.cpf)} />
        <Item rotulo="PIS/NIT" valor={mascararPis(candidato.pisNit)} />
        <Item rotulo="Tipo sanguíneo" valor={candidato.tipoSanguineo} />
        <Item rotulo="RG" valor={candidato.rgNumero} />
        <Item rotulo="RG — emissão" valor={formatarData(candidato.rgDataEmissao)} />
        <Item
          rotulo="RG — órgão/UF"
          valor={[candidato.rgOrgaoExpedidor, candidato.rgUf].filter(Boolean).join('/')}
        />
        <Item rotulo="CNH" valor={candidato.cnhNumero} />
        <Item rotulo="CNH — categoria" valor={candidato.cnhCategoria} />
        <Item rotulo="CNH — validade" valor={formatarData(candidato.cnhValidade)} />
        <Item
          rotulo="CTPS"
          valor={
            candidato.ctpsDigital
              ? 'CTPS digital'
              : [candidato.ctpsNumero, candidato.ctpsSerie].filter(Boolean).join(' / ')
          }
        />
        <Item
          rotulo="Título de eleitor"
          valor={[candidato.tituloEleitorNumero, candidato.tituloEleitorZona, candidato.tituloEleitorSecao]
            .filter(Boolean)
            .join(' / ')}
        />
        <Item rotulo="Reservista" valor={candidato.reservistaNumero} />
      </Secao>

      {candidato.filhos.length > 0 && (
        <section>
          <h3 className="mb-2 border-b border-slate-100 pb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Filhos ({candidato.filhos.length})
          </h3>
          <ul className="space-y-1 text-sm text-slate-800">
            {candidato.filhos.map((filho) => (
              <li key={filho.id}>
                {filho.nome} · {formatarData(filho.dataNascimento) || 'sem data'}
                {filho.cpf && ` · ${mascararCpf(filho.cpf)}`}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h3 className="mb-2 border-b border-slate-100 pb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
          3. Cursos e referências
        </h3>
        {candidato.cursos.length === 0 && candidato.referencias.length === 0 ? (
          <p className="text-sm text-slate-500">Nada informado.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="mb-1 text-[11px] font-medium text-slate-500">Cursos</p>
              <ul className="space-y-1 text-sm text-slate-800">
                {candidato.cursos.map((curso) => (
                  <li key={curso.id}>
                    {curso.nome}
                    {curso.instituicao && ` · ${curso.instituicao}`}
                    {curso.ano && ` · ${curso.ano}`}
                  </li>
                ))}
                {candidato.cursos.length === 0 && <li className="text-slate-500">—</li>}
              </ul>
            </div>
            <div>
              <p className="mb-1 text-[11px] font-medium text-slate-500">Referências</p>
              <ul className="space-y-1 text-sm text-slate-800">
                {candidato.referencias.map((r) => (
                  <li key={r.id}>
                    {r.nome} · {mascararTelefone(r.telefone) || 'sem telefone'}
                    {r.relacao && ` · ${r.relacao}`}
                  </li>
                ))}
                {candidato.referencias.length === 0 && <li className="text-slate-500">—</li>}
              </ul>
            </div>
          </div>
        )}
      </section>

      <section>
        <h3 className="mb-2 border-b border-slate-100 pb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
          4. Empregos anteriores
        </h3>
        <div className="space-y-2">
          {[0, 1, 2].map((ordem) => {
            const emprego = candidato.empregosAnteriores.find((e) => e.ordem === ordem);
            const titulo = ['Último', 'Penúltimo', 'Antepenúltimo'][ordem];
            if (!emprego || emprego.naoPossui) {
              return (
                <p key={ordem} className="text-sm text-slate-500">
                  <span className="font-medium text-slate-700">{titulo}:</span> não possui
                </p>
              );
            }
            return (
              <div key={ordem} className="rounded-md border border-slate-200 p-2.5">
                <p className="text-sm font-medium text-slate-900">
                  {titulo}: {emprego.empresa}
                </p>
                <p className="text-xs text-slate-600">
                  {emprego.cargo} · {emprego.setor} · {formatarData(emprego.dataAdmissao)} a{' '}
                  {formatarData(emprego.dataSaida)} ·{' '}
                  {formatarMoeda(emprego.ultimoSalario?.toString()) || 'salário não informado'}
                </p>
                <p className="text-xs text-slate-600">
                  Contato: {emprego.contato ?? '—'} · {mascararTelefone(emprego.telefone) || '—'}
                </p>
                {emprego.motivoSaida && (
                  <p className="mt-1 text-xs text-slate-500">Saída: {emprego.motivoSaida}</p>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <Secao titulo="5. Uniforme">
        <Item rotulo="Nº do sapato" valor={candidato.numeroSapato} />
        <Item rotulo="Camisa/blusa" valor={candidato.tamanhoCamisa} />
        <Item rotulo="Nº da calça" valor={candidato.numeroCalca} />
      </Secao>

      <Secao titulo="6. Questionário">
        <Item rotulo="Aceita escala de revezamento" valor={sim(candidato.aceitaEscalaRevezamento)} />
        <Item rotulo="É fumante" valor={sim(candidato.fumante)} />
        <Item rotulo="Deseja vale-transporte" valor={sim(candidato.desejaValeTransporte)} />
        <Item
          rotulo="Parente na empresa"
          valor={
            candidato.possuiParenteEmpresa
              ? `${candidato.parenteNome ?? 'sim'}${candidato.parenteSetor ? ` (${candidato.parenteSetor})` : ''}`
              : sim(candidato.possuiParenteEmpresa)
          }
        />
        <Item
          rotulo="Já trabalhou na empresa"
          valor={
            candidato.jaTrabalhouEmpresa
              ? `Sim${candidato.jaTrabalhouAno ? ` (${candidato.jaTrabalhouAno})` : ''}`
              : sim(candidato.jaTrabalhouEmpresa)
          }
        />
        <Item rotulo="Linhas de ônibus" valor={candidato.linhasOnibus} />
        <Item
          rotulo="Valor da passagem"
          valor={formatarMoeda(candidato.valorPassagem?.toString())}
        />
        <Item rotulo="Chave PIX" valor={candidato.chavePix} />
      </Secao>

      {candidato.sobreVoce && (
        <section>
          <h3 className="mb-2 border-b border-slate-100 pb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Sobre o candidato
          </h3>
          <p className="whitespace-pre-line text-sm leading-relaxed text-slate-800">
            {candidato.sobreVoce}
          </p>
        </section>
      )}

      <Secao titulo="7. Declaração e assinatura">
        <Item rotulo="Termo de veracidade" valor={sim(candidato.aceiteVeracidade)} />
        <Item rotulo="Consentimento LGPD" valor={sim(candidato.aceiteLgpd)} />
        <Item rotulo="Data e hora do aceite" valor={formatarDataHora(candidato.assinaturaData)} />
        <Item rotulo="Local" valor={candidato.assinaturaLocal} />
        <Item rotulo="IP registrado" valor={candidato.consentimentoIp} />
      </Secao>

      {candidato.assinaturaBase64 && (
        <div>
          <p className="mb-1 text-[11px] font-medium text-slate-500">Assinatura do candidato</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={candidato.assinaturaBase64}
            alt="Assinatura do candidato"
            className="h-24 rounded-md border border-slate-200 bg-white"
          />
        </div>
      )}
    </div>
  );
}
