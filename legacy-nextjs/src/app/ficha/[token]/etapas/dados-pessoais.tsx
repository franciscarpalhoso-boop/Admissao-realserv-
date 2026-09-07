'use client';

import { useState } from 'react';
import { Campo, Input, Select } from '@/components/ui';
import { UFS, rotuloEstadoCivil, rotuloEscolaridade, rotuloSexo } from '@/lib/labels';
import { mascararCep, mascararTelefone, somenteDigitos } from '@/lib/validacao';
import { paraInputDate } from '@/lib/formato';
import { FormularioEtapa, Grade, Secao } from './shell';
import type { PropsEtapa, FuncaoResumo } from '../tipos';

export function EtapaDadosPessoais({
  token,
  candidato,
  avancar,
  voltar,
  funcoes,
  funcaoId,
  onFuncaoChange,
}: PropsEtapa & {
  funcoes: FuncaoResumo[];
  funcaoId: string;
  onFuncaoChange: (id: string) => void;
}) {
  const [cep, setCep] = useState(candidato.cep ?? '');
  const [endereco, setEndereco] = useState({
    logradouro: candidato.logradouro ?? '',
    bairro: candidato.bairro ?? '',
    cidade: candidato.cidade ?? '',
    uf: candidato.uf ?? '',
  });
  const [buscandoCep, setBuscandoCep] = useState(false);
  const [estadoCivil, setEstadoCivil] = useState(candidato.estadoCivil ?? '');

  const buscarCep = async (valor: string) => {
    const digitos = somenteDigitos(valor);
    if (digitos.length !== 8) return;
    setBuscandoCep(true);
    try {
      const resposta = await fetch(`https://viacep.com.br/ws/${digitos}/json/`);
      const dados = await resposta.json();
      if (!dados.erro) {
        setEndereco({
          logradouro: dados.logradouro ?? '',
          bairro: dados.bairro ?? '',
          cidade: dados.localidade ?? '',
          uf: dados.uf ?? '',
        });
      }
    } catch {
      // Sem conexão com o ViaCEP: o candidato preenche manualmente.
    } finally {
      setBuscandoCep(false);
    }
  };

  return (
    <FormularioEtapa token={token} etapa={1} avancar={avancar} voltar={voltar}>
      <Secao titulo="Identificação">
        <Campo rotulo="Nome completo" obrigatorio>
          <Input name="nomeCompleto" defaultValue={candidato.nomeCompleto} required />
        </Campo>
        <Grade>
          <Campo rotulo="Telefone de contato">
            <Input
              name="telefoneContato"
              inputMode="tel"
              defaultValue={mascararTelefone(candidato.telefoneContato)}
              onChange={(e) => (e.target.value = mascararTelefone(e.target.value))}
            />
          </Campo>
          <Campo rotulo="Telefone para recado">
            <Input
              name="telefoneRecado"
              inputMode="tel"
              defaultValue={mascararTelefone(candidato.telefoneRecado)}
              onChange={(e) => (e.target.value = mascararTelefone(e.target.value))}
            />
          </Campo>
        </Grade>
        <Grade>
          <Campo rotulo="Celular (WhatsApp)" obrigatorio>
            <Input
              name="celularWhatsapp"
              inputMode="tel"
              required
              defaultValue={mascararTelefone(candidato.celularWhatsapp)}
              onChange={(e) => (e.target.value = mascararTelefone(e.target.value))}
            />
          </Campo>
          <Campo rotulo="E-mail">
            <Input name="email" type="email" defaultValue={candidato.email ?? ''} />
          </Campo>
        </Grade>
      </Secao>

      <Secao titulo="Vaga pretendida">
        <Grade>
          <Campo rotulo="Vaga pretendida" obrigatorio>
            <Select
              name="funcaoId"
              required
              value={funcaoId}
              onChange={(e) => onFuncaoChange(e.target.value)}
            >
              <option value="">Selecione...</option>
              {funcoes.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.nome}
                </option>
              ))}
            </Select>
          </Campo>
          <Campo rotulo="Tempo de experiência na vaga" ajuda="Ex.: 2 anos e 6 meses">
            <Input name="tempoExperiencia" defaultValue={candidato.tempoExperiencia ?? ''} />
          </Campo>
        </Grade>
      </Secao>

      <Secao titulo="Dados pessoais">
        <Grade>
          <Campo rotulo="Naturalidade (cidade)">
            <Input name="naturalidade" defaultValue={candidato.naturalidade ?? ''} />
          </Campo>
          <Campo rotulo="UF de nascimento">
            <Select name="ufNaturalidade" defaultValue={candidato.ufNaturalidade ?? ''}>
              <option value="">—</option>
              {UFS.map((uf) => (
                <option key={uf} value={uf}>
                  {uf}
                </option>
              ))}
            </Select>
          </Campo>
        </Grade>
        <Grade>
          <Campo rotulo="Data de nascimento" obrigatorio>
            <Input
              name="dataNascimento"
              type="date"
              required
              defaultValue={paraInputDate(candidato.dataNascimento)}
            />
          </Campo>
          <Campo rotulo="Sexo" ajuda="Usado para saber se o certificado de reservista é exigido.">
            <Select name="sexo" defaultValue={candidato.sexo ?? 'NAO_INFORMADO'}>
              {(['MASCULINO', 'FEMININO', 'NAO_INFORMADO'] as const).map((s) => (
                <option key={s} value={s}>
                  {rotuloSexo[s]}
                </option>
              ))}
            </Select>
          </Campo>
        </Grade>
        <Grade>
          <Campo rotulo="Estado civil">
            <Select
              name="estadoCivil"
              value={estadoCivil}
              onChange={(e) => setEstadoCivil(e.target.value as typeof estadoCivil)}
            >
              <option value="">—</option>
              {(Object.keys(rotuloEstadoCivil) as Array<keyof typeof rotuloEstadoCivil>).map((k) => (
                <option key={k} value={k}>
                  {rotuloEstadoCivil[k]}
                </option>
              ))}
            </Select>
          </Campo>
          {(estadoCivil === 'CASADO' || estadoCivil === 'UNIAO_ESTAVEL') && (
            <Campo rotulo="Nome do cônjuge">
              <Input name="nomeConjuge" defaultValue={candidato.nomeConjuge ?? ''} />
            </Campo>
          )}
        </Grade>
        <Campo rotulo="Escolaridade">
          <Select name="escolaridade" defaultValue={candidato.escolaridade ?? ''}>
            <option value="">—</option>
            {(Object.keys(rotuloEscolaridade) as Array<keyof typeof rotuloEscolaridade>).map((k) => (
              <option key={k} value={k}>
                {rotuloEscolaridade[k]}
              </option>
            ))}
          </Select>
        </Campo>
        <Grade>
          <Campo rotulo="Nome da mãe" obrigatorio>
            <Input name="nomeMae" required defaultValue={candidato.nomeMae ?? ''} />
          </Campo>
          <Campo rotulo="Nome do pai">
            <Input name="nomePai" defaultValue={candidato.nomePai ?? ''} />
          </Campo>
        </Grade>
      </Secao>

      <Secao titulo="Endereço">
        <Grade colunas={3}>
          <Campo rotulo="CEP" ajuda={buscandoCep ? 'Buscando endereço...' : 'Preenche sozinho'}>
            <Input
              name="cep"
              inputMode="numeric"
              value={cep}
              onChange={(e) => {
                const valor = mascararCep(e.target.value);
                setCep(valor);
                if (somenteDigitos(valor).length === 8) void buscarCep(valor);
              }}
              placeholder="00000-000"
            />
          </Campo>
          <Campo rotulo="Logradouro (rua)" className="sm:col-span-2">
            <Input
              name="logradouro"
              value={endereco.logradouro}
              onChange={(e) => setEndereco({ ...endereco, logradouro: e.target.value })}
            />
          </Campo>
        </Grade>
        <Grade colunas={3}>
          <Campo rotulo="Número">
            <Input name="numero" defaultValue={candidato.numero ?? ''} />
          </Campo>
          <Campo rotulo="Complemento">
            <Input name="complemento" defaultValue={candidato.complemento ?? ''} />
          </Campo>
          <Campo rotulo="Bairro">
            <Input
              name="bairro"
              value={endereco.bairro}
              onChange={(e) => setEndereco({ ...endereco, bairro: e.target.value })}
            />
          </Campo>
        </Grade>
        <Grade colunas={3}>
          <Campo rotulo="Cidade" className="sm:col-span-2">
            <Input
              name="cidade"
              value={endereco.cidade}
              onChange={(e) => setEndereco({ ...endereco, cidade: e.target.value })}
            />
          </Campo>
          <Campo rotulo="UF">
            <Select
              name="uf"
              value={endereco.uf}
              onChange={(e) => setEndereco({ ...endereco, uf: e.target.value })}
            >
              <option value="">—</option>
              {UFS.map((uf) => (
                <option key={uf} value={uf}>
                  {uf}
                </option>
              ))}
            </Select>
          </Campo>
        </Grade>
        <Campo rotulo="Tempo de residência no endereço" ajuda="Ex.: 3 anos">
          <Input name="tempoResidencia" defaultValue={candidato.tempoResidencia ?? ''} />
        </Campo>
      </Secao>
    </FormularioEtapa>
  );
}
