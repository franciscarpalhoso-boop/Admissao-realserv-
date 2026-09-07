'use client';

import { useState } from 'react';
import { Aviso, Botao, Campo, Input, Select } from '@/components/ui';
import { TIPOS_SANGUINEOS, UFS } from '@/lib/labels';
import { mascararCpf, mascararPis, somenteDigitos, validarCpf, validarPis } from '@/lib/validacao';
import { paraInputDate } from '@/lib/formato';
import { FormularioEtapa, Grade, Secao } from './shell';
import type { PropsEtapa } from '../tipos';

type FilhoForm = { nome: string; dataNascimento: string; cpf: string };

export function EtapaDocumentacao({
  token,
  candidato,
  avancar,
  voltar,
  exigeCnh,
}: PropsEtapa & { exigeCnh: boolean }) {
  const [cpf, setCpf] = useState(mascararCpf(candidato.cpf));
  const [pis, setPis] = useState(mascararPis(candidato.pisNit));
  const [ctpsDigital, setCtpsDigital] = useState(candidato.ctpsDigital);
  const [filhos, setFilhos] = useState<FilhoForm[]>(
    candidato.filhos.length > 0
      ? candidato.filhos.map((f) => ({
          nome: f.nome,
          dataNascimento: paraInputDate(f.dataNascimento),
          cpf: mascararCpf(f.cpf),
        }))
      : [],
  );

  const cpfInvalido = cpf.length > 0 && somenteDigitos(cpf).length === 11 && !validarCpf(cpf);
  const pisInvalido = pis.length > 0 && somenteDigitos(pis).length === 11 && !validarPis(pis);

  const atualizarFilho = (indice: number, campo: keyof FilhoForm, valor: string) => {
    setFilhos((atual) =>
      atual.map((f, i) => (i === indice ? { ...f, [campo]: valor } : f)),
    );
  };

  return (
    <FormularioEtapa token={token} etapa={2} avancar={avancar} voltar={voltar}>
      <Secao titulo="CPF e PIS">
        <Grade>
          <Campo
            rotulo="CPF"
            obrigatorio
            erro={cpfInvalido ? 'CPF inválido. Confira os números.' : undefined}
          >
            <Input
              name="cpf"
              inputMode="numeric"
              required
              value={cpf}
              onChange={(e) => setCpf(mascararCpf(e.target.value))}
              placeholder="000.000.000-00"
            />
          </Campo>
          <Campo
            rotulo="Nº PIS/NIT"
            erro={pisInvalido ? 'PIS/NIT inválido. Confira os números.' : undefined}
          >
            <Input
              name="pisNit"
              inputMode="numeric"
              value={pis}
              onChange={(e) => setPis(mascararPis(e.target.value))}
              placeholder="000.00000.00-0"
            />
          </Campo>
        </Grade>
      </Secao>

      <Secao titulo="RG">
        <Grade colunas={3}>
          <Campo rotulo="Número do RG">
            <Input name="rgNumero" defaultValue={candidato.rgNumero ?? ''} />
          </Campo>
          <Campo rotulo="Data de emissão">
            <Input name="rgDataEmissao" type="date" defaultValue={paraInputDate(candidato.rgDataEmissao)} />
          </Campo>
          <Campo rotulo="Órgão expedidor">
            <Input name="rgOrgaoExpedidor" placeholder="SSP" defaultValue={candidato.rgOrgaoExpedidor ?? ''} />
          </Campo>
        </Grade>
        <Campo rotulo="UF do RG" className="sm:max-w-[120px]">
          <Select name="rgUf" defaultValue={candidato.rgUf ?? ''}>
            <option value="">—</option>
            {UFS.map((uf) => (
              <option key={uf} value={uf}>
                {uf}
              </option>
            ))}
          </Select>
        </Campo>
      </Secao>

      <Secao titulo="CNH">
        {exigeCnh && (
          <Aviso tipo="alerta">
            A vaga escolhida exige CNH válida. Preencha os dados abaixo e anexe a CNH na etapa de
            documentos.
          </Aviso>
        )}
        <Grade colunas={3}>
          <Campo rotulo="Número da CNH">
            <Input name="cnhNumero" inputMode="numeric" defaultValue={candidato.cnhNumero ?? ''} />
          </Campo>
          <Campo rotulo="Nº de registro">
            <Input name="cnhRegistro" inputMode="numeric" defaultValue={candidato.cnhRegistro ?? ''} />
          </Campo>
          <Campo rotulo="Categoria">
            <Input name="cnhCategoria" placeholder="AB" defaultValue={candidato.cnhCategoria ?? ''} />
          </Campo>
        </Grade>
        <Grade colunas={3}>
          <Campo rotulo="Data de emissão">
            <Input name="cnhDataEmissao" type="date" defaultValue={paraInputDate(candidato.cnhDataEmissao)} />
          </Campo>
          <Campo rotulo="Validade">
            <Input name="cnhValidade" type="date" defaultValue={paraInputDate(candidato.cnhValidade)} />
          </Campo>
          <Campo rotulo="Data da 1ª habilitação">
            <Input
              name="cnhPrimeiraHabilitacao"
              type="date"
              defaultValue={paraInputDate(candidato.cnhPrimeiraHabilitacao)}
            />
          </Campo>
        </Grade>
        <Campo rotulo="UF da CNH" className="sm:max-w-[120px]">
          <Select name="cnhUf" defaultValue={candidato.cnhUf ?? ''}>
            <option value="">—</option>
            {UFS.map((uf) => (
              <option key={uf} value={uf}>
                {uf}
              </option>
            ))}
          </Select>
        </Campo>
      </Secao>

      <Secao titulo="CTPS">
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            name="ctpsDigital"
            checked={ctpsDigital}
            onChange={(e) => setCtpsDigital(e.target.checked)}
            className="h-4 w-4 accent-marca-600"
          />
          Tenho CTPS digital (aplicativo)
        </label>
        {!ctpsDigital && (
          <Grade colunas={3}>
            <Campo rotulo="Número da CTPS">
              <Input name="ctpsNumero" inputMode="numeric" defaultValue={candidato.ctpsNumero ?? ''} />
            </Campo>
            <Campo rotulo="Série">
              <Input name="ctpsSerie" inputMode="numeric" defaultValue={candidato.ctpsSerie ?? ''} />
            </Campo>
            <Campo rotulo="UF">
              <Select name="ctpsUf" defaultValue={candidato.ctpsUf ?? ''}>
                <option value="">—</option>
                {UFS.map((uf) => (
                  <option key={uf} value={uf}>
                    {uf}
                  </option>
                ))}
              </Select>
            </Campo>
          </Grade>
        )}
      </Secao>

      <Secao titulo="Título de eleitor e reservista">
        <Grade colunas={3}>
          <Campo rotulo="Inscrição">
            <Input name="tituloEleitorNumero" inputMode="numeric" defaultValue={candidato.tituloEleitorNumero ?? ''} />
          </Campo>
          <Campo rotulo="Zona">
            <Input name="tituloEleitorZona" inputMode="numeric" defaultValue={candidato.tituloEleitorZona ?? ''} />
          </Campo>
          <Campo rotulo="Seção">
            <Input name="tituloEleitorSecao" inputMode="numeric" defaultValue={candidato.tituloEleitorSecao ?? ''} />
          </Campo>
        </Grade>
        <Grade>
          <Campo rotulo="Certificado militar/reservista (nº)">
            <Input name="reservistaNumero" defaultValue={candidato.reservistaNumero ?? ''} />
          </Campo>
          <Campo rotulo="Tipo sanguíneo">
            <Select name="tipoSanguineo" defaultValue={candidato.tipoSanguineo ?? ''}>
              <option value="">—</option>
              {TIPOS_SANGUINEOS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>
          </Campo>
        </Grade>
      </Secao>

      <Secao titulo="Filhos">
        <p className="text-xs text-slate-500">
          Informe os filhos para salário-família e imposto de renda. Deixe em branco se não tiver.
        </p>
        {filhos.map((filho, indice) => (
          <div key={indice} className="rounded-md border border-slate-200 bg-slate-50 p-3">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-semibold text-slate-600">Filho {indice + 1}</p>
              <Botao
                type="button"
                variante="fantasma"
                tamanho="sm"
                onClick={() => setFilhos((atual) => atual.filter((_, i) => i !== indice))}
              >
                Remover
              </Botao>
            </div>
            <div className="space-y-2">
              <Campo rotulo="Nome completo">
                <Input
                  name="filhoNome"
                  value={filho.nome}
                  onChange={(e) => atualizarFilho(indice, 'nome', e.target.value)}
                />
              </Campo>
              <Grade>
                <Campo rotulo="Data de nascimento">
                  <Input
                    name="filhoNascimento"
                    type="date"
                    value={filho.dataNascimento}
                    onChange={(e) => atualizarFilho(indice, 'dataNascimento', e.target.value)}
                  />
                </Campo>
                <Campo rotulo="CPF">
                  <Input
                    name="filhoCpf"
                    inputMode="numeric"
                    value={filho.cpf}
                    onChange={(e) => atualizarFilho(indice, 'cpf', mascararCpf(e.target.value))}
                  />
                </Campo>
              </Grade>
            </div>
          </div>
        ))}
        <Botao
          type="button"
          variante="contorno"
          tamanho="sm"
          onClick={() => setFilhos((atual) => [...atual, { nome: '', dataNascimento: '', cpf: '' }])}
        >
          + Adicionar filho
        </Botao>
      </Secao>
    </FormularioEtapa>
  );
}
