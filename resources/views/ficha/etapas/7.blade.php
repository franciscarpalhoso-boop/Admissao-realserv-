<form method="POST" action="{{ route('ficha.enviar', ['token' => $token]) }}" class="space-y-5" id="form-declaracao">
    @csrf
    <input type="hidden" name="assinatura_base64" id="assinatura_base64">

    <div>
        <p class="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Termo de veracidade</p>
        <div class="max-h-40 overflow-y-auto rounded-md border border-slate-200 bg-slate-50 p-3 text-xs leading-relaxed text-slate-700">
            {{ $termoVeracidade }}
        </div>
        <label class="mt-2 flex items-start gap-2 text-sm text-slate-700">
            <input type="checkbox" name="aceite_veracidade" value="1" id="aceite1" class="mt-0.5 h-4 w-4 accent-marca-600">
            Li e declaro que as informações prestadas são verdadeiras.
        </label>
    </div>

    <div>
        <p class="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Consentimento de dados (LGPD)</p>
        <div class="max-h-40 overflow-y-auto rounded-md border border-slate-200 bg-slate-50 p-3 text-xs leading-relaxed text-slate-700">
            {{ $termoLgpd }}
        </div>
        <label class="mt-2 flex items-start gap-2 text-sm text-slate-700">
            <input type="checkbox" name="aceite_lgpd" value="1" id="aceite2" class="mt-0.5 h-4 w-4 accent-marca-600">
            Autorizo o tratamento dos meus dados para fins de recrutamento e admissão.
        </label>
    </div>

    <div>
        <p class="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Assinatura</p>
        <canvas id="canvas-assinatura"
                class="h-40 w-full touch-none rounded-md border-2 border-dashed border-slate-300 bg-white"></canvas>
        <div class="mt-2 flex items-center justify-between">
            <p class="text-xs text-slate-500" id="estado-assinatura">Desenhe sua assinatura no quadro acima.</p>
            <button type="button" id="limpar-assinatura" class="text-xs font-medium text-slate-600 hover:underline">Limpar</button>
        </div>
        <p class="mt-2 text-xs text-slate-500">
            {{ $localAssinatura }}, {{ now()->format('d/m/Y') }} · {{ $candidato->nome_completo }}
        </p>
        <p class="mt-1 text-[11px] text-slate-400">
            Seu endereço de IP e o horário do aceite são registrados junto com a assinatura.
        </p>
    </div>

    <div class="sticky bottom-0 -mx-4 flex gap-2 border-t border-slate-100 bg-white px-4 py-3">
        <a href="{{ route('ficha.mostrar', ['token' => $token, 'etapa' => 6]) }}"
           class="inline-flex h-10 items-center rounded-md border border-slate-300 bg-white px-4 text-sm font-medium hover:bg-slate-50">Voltar</a>
        <button type="submit" id="botao-enviar" disabled
                class="h-10 flex-1 rounded-md bg-marca-600 text-sm font-medium text-white hover:bg-marca-700 disabled:pointer-events-none disabled:opacity-50">
            Enviar ficha
        </button>
    </div>
</form>

<script>
// Assinatura por desenho: Pointer Events cobre dedo, caneta e mouse.
(function () {
    const canvas = document.getElementById('canvas-assinatura');
    const estado = document.getElementById('estado-assinatura');
    const campo = document.getElementById('assinatura_base64');
    const botao = document.getElementById('botao-enviar');
    const aceite1 = document.getElementById('aceite1');
    const aceite2 = document.getElementById('aceite2');
    if (!canvas) return;

    const proporcao = window.devicePixelRatio || 1;
    canvas.width = canvas.clientWidth * proporcao;
    canvas.height = canvas.clientHeight * proporcao;
    const ctx = canvas.getContext('2d');
    ctx.scale(proporcao, proporcao);
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#0f172a';
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.clientWidth, canvas.clientHeight);

    let desenhando = false;
    let temTraco = false;

    const posicao = (evento) => {
        const r = canvas.getBoundingClientRect();
        return { x: evento.clientX - r.left, y: evento.clientY - r.top };
    };

    const atualizar = () => {
        if (temTraco) {
            campo.value = canvas.toDataURL('image/png');
            estado.textContent = 'Assinatura registrada.';
        }
        botao.disabled = !(temTraco && aceite1.checked && aceite2.checked);
    };

    canvas.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        canvas.setPointerCapture(e.pointerId);
        desenhando = true;
        const { x, y } = posicao(e);
        ctx.beginPath();
        ctx.moveTo(x, y);
    });
    canvas.addEventListener('pointermove', (e) => {
        if (!desenhando) return;
        e.preventDefault();
        const { x, y } = posicao(e);
        ctx.lineTo(x, y);
        ctx.stroke();
        temTraco = true;
    });
    const finalizar = () => { if (desenhando) { desenhando = false; atualizar(); } };
    canvas.addEventListener('pointerup', finalizar);
    canvas.addEventListener('pointerleave', finalizar);
    canvas.addEventListener('pointercancel', finalizar);

    document.getElementById('limpar-assinatura').addEventListener('click', () => {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.clientWidth, canvas.clientHeight);
        temTraco = false;
        campo.value = '';
        estado.textContent = 'Desenhe sua assinatura no quadro acima.';
        atualizar();
    });

    aceite1.addEventListener('change', atualizar);
    aceite2.addEventListener('change', atualizar);
})();
</script>
