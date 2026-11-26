/* =====================================================
   CARRINHO
   - guarda tudo no localStorage (não some ao atualizar/fechar o site)
   - cria sozinho a gaveta lateral (não precisa de HTML na página)
   - usa os botões [data-abrir-carrinho] e [data-carrinho-qtd] do header

   Uso em qualquer página:
     Carrinho.adicionar({ id, tamanho, nome, foto, preco });
     Carrinho.abrir();
   ===================================================== */
const Carrinho = (() => {
  const CHAVE   = 'kafka:carrinho';
  const MAX_QTD = 99;

  let itens = carregar();
  let ultimoFoco = null;

  /* ---------- localStorage ---------- */
  function itemValido(i) {
    return i
      && typeof i.id === 'string'
      && typeof i.tamanho === 'string'
      && typeof i.nome === 'string'
      && typeof i.foto === 'string'
      && Number.isFinite(i.preco)
      && Number.isInteger(i.quantidade) && i.quantidade > 0;
  }

  function carregar() {
    try {
      const dados = JSON.parse(localStorage.getItem(CHAVE) || '[]');
      return Array.isArray(dados) ? dados.filter(itemValido) : [];
    } catch {
      return [];
    }
  }

  function salvar() {
    try { localStorage.setItem(CHAVE, JSON.stringify(itens)); } catch { /* storage cheio ou bloqueado */ }
  }

  /* ---------- cálculos ---------- */
  const quantidadeTotal = () => itens.reduce((soma, i) => soma + i.quantidade, 0);
  const valorTotal      = () => itens.reduce((soma, i) => soma + i.preco * i.quantidade, 0);
  const achar           = (id, tamanho) => itens.find((i) => i.id === id && i.tamanho === tamanho);

  /* ---------- ações ---------- */
  function adicionar({ id, tamanho, nome, foto, preco, qtd = 1 }) {
    const existente = achar(id, tamanho);
    if (existente) {
      existente.quantidade = Math.min(MAX_QTD, existente.quantidade + qtd);   // mesmo produto + tamanho: soma
    } else {
      itens.push({ id, tamanho, quantidade: qtd, nome, foto, preco });
    }
    atualizar();
  }

  function mudarQuantidade(id, tamanho, delta) {
    const item = achar(id, tamanho);
    if (!item) return;
    item.quantidade = Math.max(1, Math.min(MAX_QTD, item.quantidade + delta));
    atualizar();
  }

  function remover(id, tamanho) {
    itens = itens.filter((i) => !(i.id === id && i.tamanho === tamanho));
    atualizar();
  }

  function limpar() {
    itens = [];
    atualizar();
  }

  function atualizar() {
    salvar();
    render();
  }

  /* ---------- gaveta (HTML criado aqui) ---------- */
  document.body.insertAdjacentHTML('beforeend', `
    <div class="carrinho-overlay" data-fechar-carrinho hidden></div>
    <aside class="carrinho" id="carrinho" role="dialog" aria-modal="true" aria-labelledby="carrinho-titulo" aria-hidden="true">
      <header class="carrinho__topo">
        <h2 class="carrinho__titulo" id="carrinho-titulo">Carrinho (<span data-carrinho-qtd>0</span>)</h2>
        <button type="button" class="carrinho__fechar" data-fechar-carrinho>Fechar</button>
      </header>
      <div class="carrinho__corpo" id="carrinho-itens"></div>
      <footer class="carrinho__rodape">
        <div class="carrinho__total"><span>Total</span><span id="carrinho-total"></span></div>
        <button type="button" class="carrinho__finalizar" id="carrinho-finalizar">Finalizar compra</button>
      </footer>
    </aside>`);

  const painel    = document.getElementById('carrinho');
  const overlay   = document.querySelector('.carrinho-overlay');
  const corpo     = document.getElementById('carrinho-itens');
  const totalEl   = document.getElementById('carrinho-total');
  const finalizar = document.getElementById('carrinho-finalizar');

  /* ---------- desenha tudo a partir do array "itens" ---------- */
  function desenhar() {
    // contador (header + título da gaveta)
    document.querySelectorAll('[data-carrinho-qtd]').forEach((el) => { el.textContent = quantidadeTotal(); });

    totalEl.textContent = formatarPreco(valorTotal());
    finalizar.disabled  = itens.length === 0;

    if (!itens.length) {
      corpo.innerHTML = `
        <div class="carrinho__vazio">
          <span>Seu carrinho está vazio</span>
          <button type="button" data-fechar-carrinho>Continuar comprando</button>
        </div>`;
      return;
    }

    corpo.innerHTML = itens.map((i) => `
      <article class="carrinho__item" data-id="${escapar(i.id)}" data-tamanho="${escapar(i.tamanho)}">
        <div class="carrinho__foto" data-foto="${escapar(i.foto)}" role="img" aria-label="${escapar(i.nome)}"></div>
        <div class="carrinho__dados">
          <h3 class="carrinho__nome">${escapar(i.nome)}</h3>
          <p class="carrinho__tam">Tamanho: ${escapar(i.tamanho)}</p>
          <div class="carrinho__qtd">
            <button type="button" data-acao="menos" aria-label="Diminuir quantidade" ${i.quantidade <= 1 ? 'disabled' : ''}>−</button>
            <span aria-live="polite">${i.quantidade}</span>
            <button type="button" data-acao="mais" aria-label="Aumentar quantidade" ${i.quantidade >= MAX_QTD ? 'disabled' : ''}>+</button>
          </div>
        </div>
        <div class="carrinho__lado">
          <span class="carrinho__preco">${formatarPreco(i.preco * i.quantidade)}</span>
          <button type="button" class="carrinho__remover" data-acao="remover">Remover</button>
        </div>
      </article>`).join('');

    // a foto vem do localStorage: define pelo JS (e não dentro do HTML) para ser seguro
    corpo.querySelectorAll('[data-foto]').forEach((el) => {
      el.style.backgroundImage = `url(${JSON.stringify(el.dataset.foto)})`;
    });
  }

  // desenha e avisa as outras partes da página (ex.: o resumo do checkout)
  function render() {
    desenhar();
    document.dispatchEvent(new CustomEvent('carrinho:mudou'));
  }

  /* ---------- abrir / fechar ---------- */
  function abrir() {
    document.dispatchEvent(new CustomEvent('carrinho:abriu'));   // o menu/painel rápido se fecham sozinhos
    ultimoFoco = document.activeElement;
    overlay.hidden = false;
    painel.classList.add('is-aberto');
    painel.setAttribute('aria-hidden', 'false');
    document.body.classList.add('carrinho-aberto');
    document.querySelectorAll('[data-abrir-carrinho]').forEach((b) => b.setAttribute('aria-expanded', 'true'));
    painel.querySelector('.carrinho__fechar').focus();
  }

  function fechar() {
    painel.classList.remove('is-aberto');
    painel.setAttribute('aria-hidden', 'true');
    overlay.hidden = true;
    document.body.classList.remove('carrinho-aberto');
    document.querySelectorAll('[data-abrir-carrinho]').forEach((b) => b.setAttribute('aria-expanded', 'false'));
    if (ultimoFoco && ultimoFoco.focus) ultimoFoco.focus();
  }

  /* ---------- eventos ---------- */
  document.addEventListener('click', (e) => {
    if (e.target.closest('[data-abrir-carrinho]')) abrir();
    else if (e.target.closest('[data-fechar-carrinho]')) fechar();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && painel.classList.contains('is-aberto')) fechar();
  });

  // + / − / remover (delegação: funciona mesmo depois de redesenhar a lista)
  corpo.addEventListener('click', (e) => {
    const botao = e.target.closest('[data-acao]');
    if (!botao) return;

    const item    = botao.closest('.carrinho__item');
    const { id, tamanho } = item.dataset;
    const acao    = botao.dataset.acao;

    if (acao === 'remover') remover(id, tamanho);
    else mudarQuantidade(id, tamanho, acao === 'mais' ? 1 : -1);

    // devolve o foco ao mesmo botão (a lista foi redesenhada)
    if (acao !== 'remover') {
      const novo = [...corpo.querySelectorAll('.carrinho__item')]
        .find((el) => el.dataset.id === id && el.dataset.tamanho === tamanho);
      const alvo = novo && novo.querySelector(`[data-acao="${acao}"]:not(:disabled)`);
      if (alvo) alvo.focus();
    }
  });

  finalizar.addEventListener('click', () => {
    if (!itens.length) return;
    if (document.body.classList.contains('pagina-checkout')) fechar();   // já está no checkout
    else window.location.href = 'checkout.html';
  });

  // outra aba mudou o carrinho → atualiza esta também
  window.addEventListener('storage', (e) => {
    if (e.key === CHAVE) { itens = carregar(); render(); }
  });

  // voltar pelo histórico do navegador (página vinda do cache) → relê o localStorage
  window.addEventListener('pageshow', (e) => {
    if (e.persisted) { itens = carregar(); render(); }
  });

  // ao carregar a página: reconstrói o carrinho a partir do localStorage
  render();

  return {
    adicionar,
    abrir,
    fechar,
    limpar,
    itens: () => itens.map((i) => ({ ...i })),
    total: valorTotal,
    quantidade: quantidadeTotal
  };
})();