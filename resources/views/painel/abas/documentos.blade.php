@php $podeConferir = auth()->user()->podeOperarDp();
    $obrigatorios = $candidato->documentos->where('exigencia', 'OBRIGATORIO');
@endphp

<div class="space-y-3">
    <div class="flex flex-wrap items-center justify-between gap-2">
        <div>
            <p class="text-sm font-medium">
                {{ $obrigatorios->where('status', 'CONFERIDO')->count() }} de {{ $obrigatorios->count() }}
                documentos obrigatórios conferidos
            </p>
            <p class="text-xs text-slate-500">
                Itens condicionais (CNH, reservista, documentos dos filhos) só são exigidos conforme o perfil do candidato.
            </p>
        </div>
        @if ($podeConferir)
            <details class="relative">
                <summary class="inline-flex h-8 cursor-pointer list-none items-center rounded-md border border-slate-300 bg-white px-3 text-xs font-medium hover:bg-slate-50">
                    + Adicionar documento ao checklist
                </summary>
                <div class="absolute right-0 z-20 mt-2 w-72 rounded-lg border border-slate-200 bg-white p-3 shadow-xl">
                    <form method="POST" action="{{ route('candidatos.checklist', $candidato) }}" class="space-y-2">
                        @csrf
                        <x-campo rotulo="Nome do documento" nome="nome" obrigatorio placeholder="Ex.: Declaração de dependentes" />
                        <label class="flex items-center gap-2 text-sm text-slate-700">
                            <input type="checkbox" name="obrigatorio" value="1" checked class="h-4 w-4 accent-marca-600">
                            Obrigatório para admitir
                        </label>
                        <button class="h-8 w-full rounded-md bg-marca-600 text-xs font-medium text-white hover:bg-marca-700">Adicionar</button>
                    </form>
                </div>
            </details>
        @endif
    </div>

    <div class="space-y-2">
        @foreach ($candidato->documentos as $documento)
            <div class="rounded-md border border-slate-200 p-3">
                <div class="flex flex-wrap items-start justify-between gap-2">
                    <div class="min-w-0">
                        <p class="text-sm font-medium">
                            {{ $documento->nome }}
                            @if ($documento->extra)<span class="ml-1.5 text-[10px] font-normal text-slate-400">(item extra)</span>@endif
                        </p>
                        <p class="text-xs text-slate-500">
                            {{ ['OBRIGATORIO' => 'Obrigatório', 'OPCIONAL' => 'Opcional', 'CONDICIONAL' => 'Condicional'][$documento->exigencia] }}
                            @if ($documento->conferido_em)
                                · conferido por {{ $documento->conferido_por }} em {{ $documento->conferido_em->format('d/m/Y H:i') }}
                            @endif
                        </p>
                        @if ($documento->observacao_dp)
                            <p class="mt-1 text-xs font-medium text-red-600">{{ $documento->observacao_dp }}</p>
                        @endif
                    </div>
                    <span class="inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium {{ $documento->corStatus() }}">
                        {{ $documento->rotuloStatus() }}
                    </span>
                </div>

                @if ($documento->arquivos->isNotEmpty())
                    @php $foraDoDossie = $documento->arquivos->reject->entraNoDossie(); @endphp
                    @if ($foraDoDossie->isNotEmpty())
                        <div class="mt-2 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                            Há arquivo em formato que não entra no dossiê (HEIC, do iPhone). Peça ao
                            candidato para reenviar em JPG, PNG ou PDF.
                        </div>
                    @endif

                    <ul class="mt-2 space-y-1">
                        @foreach ($documento->arquivos as $arquivo)
                            <li class="flex flex-wrap items-center gap-2 text-xs">
                                <a href="{{ route('arquivos.baixar', $arquivo) }}" target="_blank" rel="noopener"
                                   class="truncate text-marca-700 hover:underline">📎 {{ $arquivo->nome_original }}</a>
                                <span class="shrink-0 text-slate-400">{{ number_format($arquivo->tamanho / 1024, 0, ',', '.') }} KB</span>
                            </li>
                        @endforeach
                    </ul>

                    <details class="mt-2">
                        <summary class="cursor-pointer text-xs font-medium text-marca-700">Visualizar aqui</summary>
                        <div class="mt-2 space-y-2">
                            @foreach ($documento->arquivos as $arquivo)
                                @if ($arquivo->mime_type === 'application/pdf')
                                    <iframe src="{{ route('arquivos.baixar', $arquivo) }}" title="{{ $arquivo->nome_original }}"
                                            class="h-96 w-full rounded-md border border-slate-200"></iframe>
                                @elseif ($arquivo->mime_type === 'image/heic')
                                    <p class="rounded-md border border-dashed border-slate-300 px-4 py-6 text-center text-xs text-slate-500">
                                        Formato HEIC não é exibido pelo navegador.
                                        <a href="{{ route('arquivos.baixar', $arquivo) }}" class="font-medium text-marca-700 hover:underline">Baixar arquivo</a>
                                    </p>
                                @else
                                    <img src="{{ route('arquivos.baixar', $arquivo) }}" alt="{{ $arquivo->nome_original }}"
                                         class="max-h-96 w-full rounded-md border border-slate-200 object-contain">
                                @endif
                            @endforeach
                        </div>
                    </details>

                    @if ($podeConferir)
                        <form method="POST" action="{{ route('documentos.conferir', $documento) }}"
                              class="mt-2 space-y-2 border-t border-slate-100 pt-2">
                            @csrf
                            <div class="flex flex-wrap items-end gap-2">
                                <div class="flex flex-wrap gap-1">
                                    @foreach (['ENVIADO', 'CONFERIDO', 'COM_PENDENCIA', 'PENDENTE'] as $status)
                                        <label class="cursor-pointer">
                                            <input type="radio" name="status" value="{{ $status }}"
                                                   @checked($documento->status === $status) class="peer sr-only">
                                            <span class="inline-block rounded-md border border-slate-300 px-2 py-1 text-xs text-slate-600 peer-checked:border-marca-500 peer-checked:bg-marca-50 peer-checked:font-medium peer-checked:text-marca-700">
                                                {{ \App\Models\DocumentoCandidato::STATUS[$status] }}
                                            </span>
                                        </label>
                                    @endforeach
                                </div>
                                <button class="h-8 rounded-md bg-marca-600 px-3 text-xs font-medium text-white hover:bg-marca-700">
                                    Registrar conferência
                                </button>
                            </div>
                            <x-campo rotulo="Observação (o candidato verá este texto)" nome="observacao_dp"
                                     :valor="$documento->observacao_dp"
                                     placeholder="Ex.: a foto do RG está cortada, reenvie o verso." />
                        </form>
                    @endif
                @endif
            </div>
        @endforeach
    </div>
</div>
