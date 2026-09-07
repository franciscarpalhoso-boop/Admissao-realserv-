{{-- Modal de cadastro em <details>: funciona sem JavaScript de build. --}}
<details class="relative">
    <summary class="inline-flex h-10 cursor-pointer list-none items-center rounded-md bg-marca-600 px-4 text-sm font-medium text-white hover:bg-marca-700">
        Novo candidato
    </summary>
    <div class="absolute right-0 z-30 mt-2 w-[22rem] rounded-lg border border-slate-200 bg-white p-4 shadow-xl">
        <h2 class="mb-3 text-sm font-semibold">Novo candidato</h2>
        <form method="POST" action="{{ route('candidatos.criar') }}" class="space-y-3">
            @csrf
            <div>
                <label class="mb-1 block text-xs font-medium text-slate-600">Nome completo <span class="text-red-500">*</span></label>
                <input name="nome_completo" required value="{{ old('nome_completo') }}"
                       class="h-10 w-full rounded-md border border-slate-300 px-3 text-sm focus:border-marca-500 focus:outline-none focus:ring-1 focus:ring-marca-500">
            </div>
            <div>
                <label class="mb-1 block text-xs font-medium text-slate-600">Celular (WhatsApp)</label>
                <input name="celular_whatsapp" inputmode="tel" placeholder="(13) 99999-0000" value="{{ old('celular_whatsapp') }}"
                       class="h-10 w-full rounded-md border border-slate-300 px-3 text-sm focus:border-marca-500 focus:outline-none focus:ring-1 focus:ring-marca-500">
                <p class="mt-1 text-[11px] text-slate-500">Usado para enviar o link da ficha.</p>
            </div>
            <div>
                <label class="mb-1 block text-xs font-medium text-slate-600">E-mail</label>
                <input name="email" type="email" value="{{ old('email') }}"
                       class="h-10 w-full rounded-md border border-slate-300 px-3 text-sm focus:border-marca-500 focus:outline-none focus:ring-1 focus:ring-marca-500">
            </div>
            <div>
                <label class="mb-1 block text-xs font-medium text-slate-600">Vaga pretendida</label>
                <select name="funcao_id" class="h-10 w-full rounded-md border border-slate-300 px-2 text-sm focus:border-marca-500 focus:outline-none focus:ring-1 focus:ring-marca-500">
                    <option value="">Selecione...</option>
                    @foreach ($funcoes as $funcao)
                        <option value="{{ $funcao->id }}">{{ $funcao->nome }}</option>
                    @endforeach
                </select>
            </div>
            <div>
                <label class="mb-1 block text-xs font-medium text-slate-600">Observações da triagem</label>
                <textarea name="observacoes_triagem" rows="2"
                          class="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-marca-500 focus:outline-none focus:ring-1 focus:ring-marca-500"></textarea>
            </div>
            <button class="h-10 w-full rounded-md bg-marca-600 text-sm font-medium text-white hover:bg-marca-700">
                Cadastrar e gerar link
            </button>
        </form>
    </div>
</details>
