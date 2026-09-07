@php $whats = \App\Suporte\Documentos::normalizarWhatsapp($candidato->celular_whatsapp); @endphp

<div class="space-y-4">
    <h3 class="text-sm font-semibold">Entrevistas</h3>

    @forelse ($candidato->entrevistas as $entrevista)
        <div class="rounded-md border border-slate-200 p-3">
            <div class="flex flex-wrap items-start justify-between gap-2">
                <div>
                    <p class="text-sm font-medium">
                        {{ $entrevista->data_hora->format('d/m/Y H:i') }} ·
                        {{ $entrevista->modalidade === 'ONLINE' ? 'Online' : 'Presencial (sede)' }}
                    </p>
                    <p class="text-xs text-slate-500">
                        {{ $entrevista->local ?? $entrevista->link_online ?? '—' }}
                        @if ($entrevista->entrevistador) · {{ $entrevista->entrevistador->nome }} @endif
                    </p>
                </div>
                @if ($entrevista->realizada)
                    <span class="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-800">
                        Realizada @if ($entrevista->parecer) · {{ ['APROVADO' => 'Aprovado', 'REPROVADO' => 'Reprovado', 'BANCO_TALENTOS' => 'Banco de talentos'][$entrevista->parecer] }} @endif
                    </span>
                @else
                    <div class="flex flex-wrap items-center gap-2">
                        <span class="inline-flex items-center rounded-full border border-sky-200 bg-sky-50 px-2 py-0.5 text-[11px] font-medium text-sky-800">Agendada</span>
                        @if ($whats)
                            @php
                                $msg = "Olá {$candidato->nome_completo}! Confirmamos sua entrevista no Grupo Real Serv em "
                                    . $entrevista->data_hora->format('d/m/Y \à\s H:i') . '. Leve um documento com foto e o currículo. Até lá!';
                            @endphp
                            <a href="https://wa.me/{{ $whats }}?text={{ rawurlencode($msg) }}" target="_blank" rel="noopener"
                               class="text-xs font-medium text-emerald-700 hover:underline">Confirmar por WhatsApp</a>
                        @endif
                    </div>
                @endif
            </div>

            @if ($entrevista->realizada)
                <div class="mt-3 space-y-1 border-t border-slate-100 pt-2 text-xs text-slate-600">
                    <p>Notas — pontualidade {{ $entrevista->nota_pontualidade ?? '—' }},
                        apresentação {{ $entrevista->nota_apresentacao ?? '—' }},
                        comunicação {{ $entrevista->nota_comunicacao ?? '—' }},
                        experiência {{ $entrevista->nota_experiencia ?? '—' }},
                        disponibilidade {{ $entrevista->nota_disponibilidade ?? '—' }}</p>
                    @if ($entrevista->observacoes)
                        <p class="whitespace-pre-line text-slate-700">{{ $entrevista->observacoes }}</p>
                    @endif
                </div>
            @endif
        </div>
    @empty
        <p class="rounded-md border border-dashed border-slate-300 px-4 py-6 text-center text-sm text-slate-500">
            Nenhuma entrevista agendada para este candidato.
        </p>
    @endforelse

    <p class="text-xs text-slate-500">
        O agendamento e o roteiro completo da entrevista entram na etapa 4 do plano — o modelo de
        dados e as rotas já estão prontos.
    </p>
</div>
