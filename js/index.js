(() => {
  const painel   = document.getElementById('rapida');
  const overlay  = document.querySelector('.rapida-overlay');
  const titulo   = painel.querySelector('.rapida__titulo');
  const preco    = painel.querySelector('.rapida__preco');
  const imagem   = painel.querySelector('.rapida__img');
  const acao     = painel.querySelector('.rapida__acao');
  const tamanhos = painel.querySelectorAll('.rapida__tamanho');

  let ultimoBotao = null;   // devolve o foco ao fechar

  
  /* ---------- abrir ---------- */
  function abrir(botao) {
    ultimoBotao = botao;
    if (botao) botao.focus();
    titulo.textContent = botao.dataset.nome;
    preco.textContent  = botao.dataset.preco;
    imagem.src         = botao.dataset.imagem;
    imagem.alt         = botao.dataset.nome;

    limparTamanho();

    overlay.hidden = false;
    painel.classList.add('is-aberta');
    painel.setAttribute('aria-hidden', 'false');
    painel.querySelector('.rapida__fechar').focus();
  }

  /* ---------- fechar ---------- */
  function fechar() {
    painel.classList.remove('is-aberta');
    painel.setAttribute('aria-hidden', 'true');
    overlay.hidden = true;
    if (ultimoBotao) ultimoBotao.focus();
  }

  /* ---------- tamanho ---------- */
  function limparTamanho() {
    tamanhos.forEach(t => {
      t.classList.remove('is-ativo');
      t.setAttribute('aria-pressed', 'false');
    });
    acao.disabled = true;
    acao.textContent = 'Selecionar o tamanho';
    delete acao.dataset.tamanho;
  }

  function escolherTamanho(botao) {
    tamanhos.forEach(t => {
      const ativo = t === botao;
      t.classList.toggle('is-ativo', ativo);
      t.setAttribute('aria-pressed', String(ativo));
    });
    acao.disabled = false;
    acao.textContent = 'Adicionar à sacola';
    acao.dataset.tamanho = botao.dataset.tamanho;
  }

  /* ---------- eventos ---------- */
  document.querySelectorAll('[data-abrir-rapida]').forEach(b =>
    b.addEventListener('click', () => abrir(b))
  );

  document.querySelectorAll('[data-fechar-rapida]').forEach(b =>
    b.addEventListener('click', fechar)
  );

  tamanhos.forEach(t => t.addEventListener('click', () => escolherTamanho(t)));

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && painel.classList.contains('is-aberta')) fechar();
  });

  acao.addEventListener('click', () => {
    if (acao.disabled) return;
    // Aqui entra a sua lógica de sacola:
    console.log('Adicionar à sacola:', {
      produto: titulo.textContent,
      tamanho: acao.dataset.tamanho,
    });
    fechar();
  });
})();