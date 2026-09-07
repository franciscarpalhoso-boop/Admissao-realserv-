<?php

return [
    /** Dias de validade do link público enviado ao candidato. */
    'dias_validade_link' => (int) env('DIAS_VALIDADE_LINK', 30),

    /** Meses até anonimizar reprovados e desistentes (LGPD). */
    'retencao_meses' => (int) env('RETENCAO_MESES', 6),

    /**
     * Maior dimensão (px) para onde as imagens são reduzidas ao entrar no
     * dossiê. A hospedagem compartilhada tem ~342 MB e 1 processo: embutir
     * fotos de 12 MP em tamanho original estoura a memória do php-fpm.
     */
    'dossie_max_px' => (int) env('DOSSIE_MAX_PX', 1600),
    'dossie_qualidade_jpeg' => (int) env('DOSSIE_QUALIDADE_JPEG', 78),
];
