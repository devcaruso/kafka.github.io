/* =====================================================
   CHECKOUT
   - entrar com e-mail ou telefone (sem senha, salvo neste aparelho)
   - validação do formulário
   - escolha da forma de pagamento (Pix, Cartão ou Dinheiro)
   - ao finalizar: monta o pedido, zera o carrinho e mostra a confirmação
   ===================================================== */
(() => {
  const $  = (seletor, raiz = document) => raiz.querySelector(seletor);
  const $$ = (seletor, raiz = document) => [...raiz.querySelectorAll(seletor)];

  const CHAVE_SESSAO = 'kafka:sessao';   // quem está "logado" neste aparelho
  const CHAVE_CONTAS = 'kafka:contas';   // dados de entrega salvos de cada pessoa
  const PAGAMENTOS   = { pix: 'Pix', cartao: 'Cartão', dinheiro: 'Dinheiro' };
  const CAMPOS       = ['nome', 'sobrenome', 'cep', 'endereco', 'complemento', 'cidade', 'estado', 'telefone'];

  const form = $('#form-checkout');
  let pedidoFeito = false;

  /* ---------- localStorage ---------- */
  function ler(chave, padrao) {
    try {
      const valor = JSON.parse(localStorage.getItem(chave));
      return valor === null || valor === undefined ? padrao : valor;
    } catch {
      return padrao;
    }
  }

  function gravar(chave, valor) {
    try { localStorage.setItem(chave, JSON.stringify(valor)); } catch { /* storage cheio ou bloqueado */ }
  }

  /* ---------- e-mail ou telefone ---------- */
  const soDigitos = (t) => String(t).replace(/\D/g, '');

  // devolve só os dígitos (DDD + número) ou null se não for um telefone brasileiro válido
  function normalizarTelefone(texto) {
    let d = soDigitos(texto);
    if ((d.length === 12 || d.length === 13) && d.startsWith('55')) d = d.slice(2);   // tira o +55
    if (d.length < 10 || d.length > 11) return null;
    if (Number(d.slice(0, 2)) < 11) return null;                                       // DDD inválido
    if (d.length === 11 && d[2] !== '9') return null;                                  // celular começa com 9
    return d;
  }

  const formatarTelefone = (d) => d.length === 11
    ? `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
    : `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;

  // aceita e-mail OU telefone; devolve { id, tipo, valor, exibicao } ou null
  function identificar(texto) {
    const t = String(texto).trim();
    if (!t) return null;

    if (t.includes('@')) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(t)) return null;
      const email = t.toLowerCase();
      return { id: 'email:' + email, tipo: 'email', valor: email, exibicao: email };
    }

    const tel = normalizarTelefone(t);
    return tel ? { id: 'tel:' + tel, tipo: 'telefone', valor: tel, exibicao: formatarTelefone(tel) } : null;
  }

  /* ---------- máscaras ---------- */
  function mascaraCep(e) {
    const d = soDigitos(e.target.value).slice(0, 8);
    e.target.value = d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
  }

  function mascaraTelefone(e) {
    const d = soDigitos(e.target.value).slice(0, 11);
    if (d.length > 10)     e.target.value = `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
    else if (d.length > 6) e.target.value = `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
    else if (d.length > 2) e.target.value = `(${d.slice(0, 2)}) ${d.slice(2)}`;
    else                   e.target.value = d;
  }

  $('#cep').addEventListener('input', mascaraCep);
  $('#telefone').addEventListener('input', mascaraTelefone);

  /* ---------- erros nos campos ---------- */
  function mostrarErro(nome, mensagem) {
    const pagamento = nome === 'pagamento';
    const caixa = pagamento ? $('[data-campo="pagamento"]') : $(`[data-campo="${nome}"]`);
    const texto = pagamento ? $('[data-erro-de="pagamento"]') : $('.campo__erro', caixa);
    if (!caixa || !texto) return;

    texto.textContent = mensagem || '';
    texto.hidden = !mensagem;
    caixa.classList.toggle('tem-erro', Boolean(mensagem));
  }

  function limparErros() {
    ['contato', ...CAMPOS, 'pagamento'].forEach((n) => mostrarErro(n, ''));
  }

  /* ---------- validação ---------- */
  const regras = {
    contato:   (v) => identificar(v) ? '' : 'Digite um e-mail ou telefone válido',
    nome:      (v) => v.trim().length >= 2 ? '' : 'Digite o nome',
    sobrenome: (v) => v.trim().length >= 2 ? '' : 'Digite o sobrenome',
    cep:       (v) => /^\d{5}-?\d{3}$/.test(v.trim()) ? '' : 'Digite um CEP válido',
    endereco:  (v) => v.trim().length >= 5 ? '' : 'Digite o endereço (rua e número)',
    cidade:    (v) => v.trim().length >= 2 ? '' : 'Digite a cidade',
    estado:    (v) => v ? '' : 'Selecione o estado',
    telefone:  (v) => normalizarTelefone(v) ? '' : 'Digite um telefone válido com DDD'
  };

  function valor(nome) {
    return form.elements[nome].value;
  }

  function validar() {
    const erros = {};
    Object.keys(regras).forEach((nome) => {
      const msg = regras[nome](valor(nome));
      if (msg) erros[nome] = msg;
    });
    if (!form.elements.pagamento.value) erros.pagamento = 'Selecione a forma de pagamento';
    return erros;
  }

  // valida cada campo ao sair dele e limpa o erro quando a pessoa volta a digitar
  Object.keys(regras).forEach((nome) => {
    const campo = form.elements[nome];
    campo.addEventListener('blur',   () => { if (campo.value || $(`[data-campo="${nome}"]`).classList.contains('tem-erro')) mostrarErro(nome, regras[nome](campo.value)); });
    campo.addEventListener('input',  () => mostrarErro(nome, ''));
    campo.addEventListener('change', () => mostrarErro(nome, ''));
  });
  $$('input[name="pagamento"]').forEach((r) => r.addEventListener('change', () => mostrarErro('pagamento', '')));

  /* ---------- sessão (entrar / sair) ---------- */
  function lerSessao() {
    const s = ler(CHAVE_SESSAO, null);
    return s && typeof s.id === 'string' && typeof s.tipo === 'string' && typeof s.valor === 'string' && typeof s.exibicao === 'string' ? s : null;
  }

  let sessao = lerSessao();

  function preencher(perfil) {
    CAMPOS.forEach((nome) => {
      if (perfil && typeof perfil[nome] === 'string') form.elements[nome].value = perfil[nome];
    });
  }

  function atualizarSessaoUI() {
    const contato = form.elements.contato;
    if (sessao) {
      contato.value    = sessao.exibicao;
      contato.readOnly = true;
      mostrarErro('contato', '');
    } else {
      contato.readOnly = false;
    }
    $('#btn-entrar').hidden = Boolean(sessao);
    $('#btn-sair').hidden   = !sessao;
    $('#salvar-wrap').hidden = !sessao;
  }

  function entrar(identidade) {
    sessao = identidade;
    gravar(CHAVE_SESSAO, identidade);

    preencher(ler(CHAVE_CONTAS, {})[identidade.id]);
    if (identidade.tipo === 'telefone' && !form.elements.telefone.value) {
      form.elements.telefone.value = identidade.exibicao;
    }
    atualizarSessaoUI();
  }

  function sair() {
    sessao = null;
    try { localStorage.removeItem(CHAVE_SESSAO); } catch { /* ignora */ }
    form.reset();          // limpa os dados da pessoa anterior (computador compartilhado)
    limparErros();
    atualizarSessaoUI();
  }

  function salvarPerfil() {
    if (!sessao || !$('#salvar').checked) return;
    const contas = ler(CHAVE_CONTAS, {});
    contas[sessao.id] = Object.fromEntries(CAMPOS.map((nome) => [nome, valor(nome).trim()]));
    gravar(CHAVE_CONTAS, contas);
  }

  /* ---------- janela "Entrar" ---------- */
  const janela     = $('#login');
  const formLogin  = $('#form-login');
  const campoLogin = $('#login-contato');
  const erroLogin  = $('#login-erro');

  function abrirLogin() {
    formLogin.reset();
    erroLogin.hidden = true;
    $('[data-campo="login-contato"]').classList.remove('tem-erro');
    janela.showModal();
    campoLogin.focus();
  }

  $('#btn-entrar').addEventListener('click', abrirLogin);
  $('#btn-sair').addEventListener('click', sair);
  $('#login-fechar').addEventListener('click', () => janela.close());
  janela.addEventListener('click', (e) => { if (e.target === janela) janela.close(); });   // clicou fora
  campoLogin.addEventListener('input', () => {
    erroLogin.hidden = true;
    $('[data-campo="login-contato"]').classList.remove('tem-erro');
  });

  formLogin.addEventListener('submit', (e) => {
    e.preventDefault();
    const identidade = identificar(campoLogin.value);

    if (!identidade) {
      erroLogin.textContent = 'Digite um e-mail ou telefone válido';
      erroLogin.hidden = false;
      $('[data-campo="login-contato"]').classList.add('tem-erro');
      return;
    }

    entrar(identidade);
    janela.close();
  });

  /* ---------- resumo do pedido ---------- */
  const textoItens = (n) => `${n} ${n === 1 ? 'item' : 'itens'}`;

  function htmlItens(itens) {
    return itens.map((i) => `
      <li class="resumo__item">
        <div class="resumo__foto" data-foto="${escapar(i.foto)}"><span class="resumo__qtd">${i.quantidade}</span></div>
        <div class="resumo__dados">
          <p class="resumo__nome">${escapar(i.nome)}</p>
          <p class="resumo__tam">${escapar(i.tamanho)}</p>
        </div>
        <span class="resumo__preco">${formatarPreco(i.preco * i.quantidade)}</span>
      </li>`).join('');
  }

  function aplicarFotos(lista) {
    $$('[data-foto]', lista).forEach((el) => {
      el.style.backgroundImage = el.dataset.foto ? `url(${JSON.stringify(el.dataset.foto)})` : 'none';
    });
  }

  function renderResumo() {
    const itens = Carrinho.itens();
    const lista = $('#resumo-itens');
    const total = formatarPreco(Carrinho.total());

    lista.innerHTML = htmlItens(itens);
    aplicarFotos(lista);

    $('#resumo-rotulo').textContent   = `Subtotal · ${textoItens(Carrinho.quantidade())}`;
    $('#resumo-subtotal').textContent = total;
    $('#resumo-total').textContent    = total;
    $('#resumo-total-topo').textContent = total;
  }

  function mostrarEstado() {
    const temItens = Carrinho.itens().length > 0;
    $('#checkout').hidden       = !temItens;
    $('#checkout-vazio').hidden = temItens;
    if (temItens) renderResumo();
  }

  // no celular o resumo começa fechado; no computador fica sempre aberto
  const telaGrande = window.matchMedia('(min-width: 901px)');
  const detalhes   = $('#resumo-detalhes');
  const ajustarResumo = () => { if (telaGrande.matches) detalhes.open = true; };
  detalhes.open = telaGrande.matches;
  telaGrande.addEventListener('change', ajustarResumo);

  $('#editar-carrinho').addEventListener('click', () => Carrinho.abrir());

  // o carrinho mudou (pela gaveta ou por outra aba) → atualiza o resumo
  document.addEventListener('carrinho:mudou', () => {
    if (!pedidoFeito) mostrarEstado();
  });

  /* ---------- finalizar pedido ---------- */
  function montarPedido() {
    const contato = sessao || identificar(valor('contato'));
    const itens   = Carrinho.itens();
    const subtotal = Carrinho.total();

    return {
      numero:    'KF-' + Date.now().toString(36).toUpperCase(),
      data:      new Date().toISOString(),
      cliente: {
        contato:   { tipo: contato.tipo, valor: contato.valor },
        nome:      valor('nome').trim(),
        sobrenome: valor('sobrenome').trim(),
        telefone:  normalizarTelefone(valor('telefone'))
      },
      entrega: {
        pais:        valor('pais'),
        cep:         soDigitos(valor('cep')),
        endereco:    valor('endereco').trim(),
        complemento: valor('complemento').trim(),
        cidade:      valor('cidade').trim(),
        estado:      valor('estado')
      },
      pagamento: form.elements.pagamento.value,      // 'pix' | 'cartao' | 'dinheiro'
      itens:     itens,                              // { id, tamanho, quantidade, nome, foto, preco }
      subtotal:  subtotal,
      frete:     null,                               // "a combinar"
      total:     subtotal
    };
  }

  function registrarPedido(pedido) {
    // AQUI entra a plataforma de pedidos (depois): enviar o "pedido" para o servidor.
    // Quando ela existir, é ela que deve conferir os preços (aqui eles vêm do navegador).
    console.log('Pedido finalizado:', pedido);
  }

  function mostrarConfirmacao(pedido) {
    $('#checkout').hidden       = true;
    $('#checkout-vazio').hidden = true;

    $('#conf-numero').textContent    = pedido.numero;
    $('#conf-pagamento').textContent = PAGAMENTOS[pedido.pagamento];
    $('#conf-total').textContent     = formatarPreco(pedido.total);

    const lista = $('#conf-itens');
    lista.innerHTML = htmlItens(pedido.itens);
    aplicarFotos(lista);

    const e = pedido.entrega;
    $('#conf-entrega').textContent =
      `${pedido.cliente.nome} ${pedido.cliente.sobrenome} — ${e.endereco}${e.complemento ? ', ' + e.complemento : ''}, ${e.cidade} - ${e.estado}, CEP ${e.cep.slice(0, 5)}-${e.cep.slice(5)}`;
    $('#conf-contato').textContent = (sessao || identificar(valor('contato'))).exibicao;

    $('#confirmacao').hidden = false;
    document.title = `Pedido ${pedido.numero} — KAFKA`;
    window.scrollTo(0, 0);
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (pedidoFeito || !Carrinho.quantidade()) return;

    const erros = validar();
    limparErros();
    Object.entries(erros).forEach(([nome, msg]) => mostrarErro(nome, msg));

    const primeiro = Object.keys(erros)[0];
    if (primeiro) {
      const alvo = primeiro === 'pagamento' ? $('input[name="pagamento"]') : form.elements[primeiro];
      alvo.focus();
      return;
    }

    const pedido = montarPedido();
    pedidoFeito = true;
    $('#btn-finalizar').disabled = true;

    registrarPedido(pedido);
    salvarPerfil();
    Carrinho.limpar();               // zera o carrinho da pessoa (e o localStorage)
    mostrarConfirmacao(pedido);
  });

  /* ---------- início ---------- */
  if (sessao) {
    preencher(ler(CHAVE_CONTAS, {})[sessao.id]);
    if (sessao.tipo === 'telefone' && !form.elements.telefone.value) form.elements.telefone.value = sessao.exibicao;
  }
  atualizarSessaoUI();
  mostrarEstado();
})();