'use client';

import { useState } from 'react';
import { Botao, Campo, Card, CardCabecalho, CardCorpo, CardTitulo, Select } from '@/components/ui';

const MESES = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
];

export function Exportacao({ empresas }: { empresas: Array<{ id: string; nome: string }> }) {
  const agora = new Date();
  const [mes, setMes] = useState(String(agora.getMonth() + 1));
  const [ano, setAno] = useState(String(agora.getFullYear()));
  const [empresaId, setEmpresaId] = useState('');

  const anos = Array.from({ length: 6 }, (_, i) => agora.getFullYear() - i);

  const construirUrl = (formato: 'xlsx' | 'csv') => {
    const params = new URLSearchParams({ formato });
    if (mes) params.set('mes', mes);
    if (ano) params.set('ano', ano);
    if (empresaId) params.set('empresaId', empresaId);
    return `/api/exportacao?${params.toString()}`;
  };

  return (
    <Card>
      <CardCabecalho>
        <CardTitulo>Exportação para a contabilidade (eSocial)</CardTitulo>
      </CardCabecalho>
      <CardCorpo>
        <div className="flex flex-wrap items-end gap-3">
          <Campo rotulo="Mês" className="w-40">
            <Select value={mes} onChange={(e) => setMes(e.target.value)}>
              <option value="">Todos</option>
              {MESES.map((nome, i) => (
                <option key={nome} value={i + 1}>
                  {nome}
                </option>
              ))}
            </Select>
          </Campo>
          <Campo rotulo="Ano" className="w-28">
            <Select value={ano} onChange={(e) => setAno(e.target.value)}>
              <option value="">Todos</option>
              {anos.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </Select>
          </Campo>
          <Campo rotulo="Empresa" className="w-56">
            <Select value={empresaId} onChange={(e) => setEmpresaId(e.target.value)}>
              <option value="">Todas</option>
              {empresas.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.nome}
                </option>
              ))}
            </Select>
          </Campo>
          <a href={construirUrl('xlsx')}>
            <Botao>Baixar planilha (.xlsx)</Botao>
          </a>
          <a href={construirUrl('csv')}>
            <Botao variante="contorno">Baixar CSV</Botao>
          </a>
        </div>
        <p className="mt-2 text-xs text-slate-500">
          A planilha traz uma linha por admitido, com dados pessoais, documentos, endereço, cargo,
          salário, escala e empresa — mais uma aba de dependentes para o salário-família.
        </p>
      </CardCorpo>
    </Card>
  );
}
