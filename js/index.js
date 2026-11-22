/* ================================================
   Menu lateral (vale para todas as páginas)
   ================================================ */
(() => {
  const menu       = document.getElementById('menu');
  const botaoAbrir = document.querySelector('[data-abrir-menu]');
  const overlay    = document.querySelector('.menu-overlay');
  if (!menu || !botaoAbrir) return;

  function abrir() {
    menu.classList.add('is-aberto');
    menu.setAttribute('aria-hidden', 'false');
    overlay.hidden = false;
    document.body.classList.add('menu-aberto');
    botaoAbrir.setAttribute('aria-expanded', 'true');
    menu.querySelector('.menu__fechar').focus();
  }

  function fechar(devolverFoco = true) {
    menu.classList.remove('is-aberto');
    menu.setAttribute('aria-hidden', 'true');
    overlay.hidden = true;
    document.body.classList.remove('menu-aberto');
    botaoAbrir.setAttribute('aria-expanded', 'false');
    if (devolverFoco) botaoAbrir.focus();
  }

  botaoAbrir.addEventListener('click', abrir);

  document.querySelectorAll('[data-fechar-menu]').forEach((el) =>
    el.addEventListener('click', () => fechar())
  );

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && menu.classList.contains('is-aberto')) fechar();
  });

  // o carrinho abriu → o menu se fecha
  document.addEventListener('carrinho:abriu', () => {
    if (menu.classList.contains('is-aberto')) fechar(false);
  });
})();

/* ================================================
   Grade de produtos gerada a partir do array PRODUTOS
   (só roda na página que tem <div id="grade-produtos">)
   ================================================ */
function cardHTML(p) {
  const link   = `produto.html?id=${encodeURIComponent(p.id)}`;
  const fotos  = p.fotos || [];
  const nCores = (p.cores || []).length;

  return `
    <li class="card">
      <div class="card__midia">
        <a href="${link}" class="card__img-link" aria-label="Ver ${escapar(p.nome)}">
          <div class="card__img card__img--principal" style="background-image: url('${escapar(fotos[0] || '')}')"></div>
          ${fotos[1] ? `<div class="card__img card__img--hover" style="background-image: url('${escapar(fotos[1])}')"></div>` : ''}
        </a>
        <button type="button" class="card__botao" data-abrir-rapida data-id="${escapar(p.id)}"
                aria-label="Adicionar ${escapar(p.nome)} ao carrinho">Adicionar ao carrinho</button>
      </div>
      <div class="card__info">
        <h3 class="card__nome"><a href="${link}">${escapar(p.nome)}</a></h3>
        <span class="card__preco">${formatarPreco(p.preco)}</span>
        ${nCores ? `<span class="card__cores">${nCores} ${nCores === 1 ? 'Cor' : 'Cores'}</span>` : ''}
      </div>
    </li>`;
}

function renderizarGrade() {
  const alvo = document.getElementById('grade-produtos');
  if (!alvo) return;

  alvo.innerHTML = PRODUTOS.length
    ? `<ul class="grade">${PRODUTOS.map(cardHTML).join('')}</ul>`
    : '<p class="grade-vazia">Nenhum produto cadastrado</p>';
}

renderizarGrade();

/* ================================================
   Painel "Adicionar ao carrinho" (escolher o tamanho)
   ================================================ */
(() => {
  const painel  = document.getElementById('rapida');
  const overlay = document.querySelector('.rapida-overlay');
  if (!painel) return;

  const titulo = painel.querySelector('.rapida__titulo');
  const preco  = painel.querySelector('.rapida__preco');
  const imagem = painel.querySelector('.rapida__img');
  const lista  = painel.querySelector('.rapida__lista');
  const aviso  = painel.querySelector('.rapida__aviso');
  const acao   = painel.querySelector('.rapida__acao');

  let produto     = null;   // produto aberto no painel
  let tamanho     = null;   // tamanho escolhido
  let ultimoBotao = null;   // devolve o foco ao fechar

  function montarTamanhos() {
    lista.innerHTML = '';
    produto.tamanhos.forEach((t) => {
      const li = document.createElement('li');
      const b  = document.createElement('button');
      b.type = 'button';
      b.className = 'rapida__tamanho';
      b.textContent = t;
      b.dataset.tamanho = t;
      b.setAttribute('aria-pressed', 'false');
      li.append(b);
      lista.append(li);
    });
  }

  function escolherTamanho(botao) {
    tamanho = botao.dataset.tamanho;
    lista.querySelectorAll('.rapida__tamanho').forEach((t) => {
      const ativo = t === botao;
      t.classList.toggle('is-ativo', ativo);
      t.setAttribute('aria-pressed', String(ativo));
    });
    aviso.hidden = true;
  }

  function abrir(botao) {
    produto = buscarProduto(botao.dataset.id);
    if (!produto) return;

    ultimoBotao = botao;
    tamanho = null;
    aviso.hidden = true;

    titulo.textContent = produto.nome;
    preco.textContent  = formatarPreco(produto.preco);
    imagem.style.backgroundImage = produto.fotos[0] ? `url(${JSON.stringify(produto.fotos[0])})` : 'none';
    imagem.setAttribute('aria-label', produto.nome);
    montarTamanhos();

    overlay.hidden = false;
    painel.classList.add('is-aberta');
    painel.setAttribute('aria-hidden', 'false');
    painel.querySelector('.rapida__fechar').focus();
  }

  function fechar(devolverFoco = true) {
    painel.classList.remove('is-aberta');
    painel.setAttribute('aria-hidden', 'true');
    overlay.hidden = true;
    if (devolverFoco && ultimoBotao) ultimoBotao.focus();
  }

  // delegação: funciona para os cards criados pelo JavaScript
  document.addEventListener('click', (e) => {
    const abrirBtn = e.target.closest('[data-abrir-rapida]');
    if (abrirBtn) abrir(abrirBtn);
  });

  document.querySelectorAll('[data-fechar-rapida]').forEach((b) =>
    b.addEventListener('click', () => fechar())
  );

  lista.addEventListener('click', (e) => {
    const botao = e.target.closest('.rapida__tamanho');
    if (botao) escolherTamanho(botao);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && painel.classList.contains('is-aberta')) fechar();
  });

  document.addEventListener('carrinho:abriu', () => {
    if (painel.classList.contains('is-aberta')) fechar(false);
  });

  acao.addEventListener('click', () => {
    if (!tamanho) {                       // sem tamanho: não adiciona
      aviso.hidden = false;
      return;
    }

    Carrinho.adicionar({
      id:      produto.id,
      tamanho: tamanho,
      nome:    produto.nome,
      foto:    produto.fotos[0] || '',
      preco:   produto.preco
    });

    fechar(false);
    Carrinho.abrir();                     // mostra o carrinho já com o item
  });
})();
