/* =====================================================
   BANCO DE PRODUTOS
   Para cadastrar um produto novo, copie um bloco { ... }
   e troque os dados. O "id" precisa ser único e sem espaços:
   é ele que vai na URL  →  produto.html?id=ID_DO_PRODUTO
   ===================================================== */
const PRODUTOS = [
  {
    id: "camiseta-oversized-preta",
    nome: "Camiseta oversized preta",
    preco: 189.90,
    precoAntigo: null,                       // null = sem preço antigo
    descricao:
      "Confeccionada em 100% algodão e com modelagem oversized, nossa camiseta possui gola alta reforçada, ombros caídos e mangas largas.\n" +
      "O modelo veste tamanho M e tem 1,75 m de altura.\n" +
      "100% algodão\nFabricado no Brasil",
    tamanhos: ["XS", "S", "M", "L", "XL", "XXL"],
    cores: [{ nome: "Preto", hex: "#1c1b20" }],
    fotos: ["img/camiseta-frente.png", "img/camiseta-costas.png"]   // troque pelas suas fotos
  },
  {
    id: "camiseta-boxy-preta",
    nome: "Camiseta boxy preta",
    preco: 159.90,
    precoAntigo: 219.90,
    descricao:
      "Corte boxy, mais curto e quadrado, em malha pesada de 240 g/m².\n" +
      "O modelo veste tamanho M e tem 1,78 m de altura.\n" +
      "100% algodão\nFabricado no Brasil",
    tamanhos: ["S", "M", "L", "XL"],
    cores: [{ nome: "Preto", hex: "#1c1b20" }],
    fotos: ["img/camiseta-costas.png", "img/camiseta-frente.png"]
  },
  {
    id: "moletom-canguru-preto",
    nome: "Moletom canguru preto",
    preco: 399.90,
    precoAntigo: null,
    descricao:
      "Moletom canguru em felpa pesada, com capuz duplo, bolso frontal e punhos caneladados.\n" +
      "O modelo veste tamanho L e tem 1,80 m de altura.\n" +
      "80% algodão, 20% poliéster\nFabricado no Brasil",
    tamanhos: ["M", "L", "XL", "XXL"],
    cores: [{ nome: "Preto", hex: "#1c1b20" }, { nome: "Cinza", hex: "#8a8a8a" }],
    fotos: ["img/camisa-masculino-umbro-classic-azul.webp"]
  },
  {
    id: "jaqueta-puffer-marrom",
    nome: "Jaqueta puffer reversível marrom",
    preco: 1299.00,
    precoAntigo: 1599.00,
    descricao:
      "Confeccionada em 100% nylon e com modelagem regular, possui fechamento em zíper, barras caneladas e dois bolsos com zíper na parte frontal.\n" +
      "Reversível, para um visual liso.\n" +
      "100% nylon\nFabricado na China",
    tamanhos: ["XS", "S", "M", "L", "XL", "XXL"],
    cores: [{ nome: "Marrom", hex: "#5a3a2e" }],
    fotos: ["img/camiseta-costas.png", "img/camiseta-frente.png"]
  }
];

/* Textos das abas "Envio" e "Devoluções e trocas" (valem para todos os produtos) */
const INFO_LOJA = {
  envio:
    "Enviamos para todo o Brasil. O prazo de postagem é de até 3 dias úteis após a confirmação do pagamento.\n" +
    "Frete grátis em compras acima de R$ 500.",
  devolucoes:
    "Você tem até 7 dias após o recebimento para devolver ou trocar a peça, desde que ela esteja sem uso e com a etiqueta."
};

/* =====================================================
   FUNÇÕES AUXILIARES
   (usadas pela grade, pela página de produto e pelo carrinho)
   ===================================================== */

// procura um produto pelo id
const buscarProduto = (id) => PRODUTOS.find((p) => p.id === id);

// 1299 → "R$ 1.299,00 BRL"
const formatarPreco = (valor) =>
  'R$ ' + Number(valor).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' BRL';

// evita que um texto vire HTML quando é colocado dentro de um template
const escapar = (texto) =>
  String(texto).replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));