'use strict';
/* =====================================================
   ADOTAÊ — comportamento do site (somente front-end)
   Os dados ficam no localStorage do navegador.
   Seções: 1 utilitários · 2 dados de exemplo · 3 estados e cidades
           4 tema e fonte · 5 listagem · 6 detalhes · 7 conta · 8 anúncio · 9 contato
   ===================================================== */

/* ---------- 1. UTILITÁRIOS ---------- */
const $ = (sel, el = document) => el.querySelector(sel);
const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];

const store = {
  get(chave, padrao) {
    try { const v = localStorage.getItem('adotae_' + chave); return v ? JSON.parse(v) : padrao; }
    catch { return padrao; }
  },
  set(chave, valor) {
    try { localStorage.setItem('adotae_' + chave, JSON.stringify(valor)); return true; }
    catch { toast('Não foi possível salvar. Tente uma foto menor.'); return false; }
  }
};

function esc(texto) {
  return String(texto ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

let toastTimer;
function toast(msg) {
  const el = $('#toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 3500);
}

function soDigitos(t) { return String(t).replace(/\D/g, ''); }

function mascaraTelefone(input) {
  input.addEventListener('input', () => {
    let d = soDigitos(input.value).slice(0, 11);
    if (d.length > 6) d = d.replace(/^(\d{2})(\d{4,5})(\d{0,4}).*/, '($1) $2-$3');
    else if (d.length > 2) d = d.replace(/^(\d{2})(\d{0,5})/, '($1) $2');
    else if (d.length) d = '(' + d;
    input.value = d.replace(/-$/, '');
  });
}

function telefoneValido(t) { const n = soDigitos(t).length; return n === 10 || n === 11; }

async function hash(texto) {
  if (!window.crypto || !crypto.subtle) return texto;
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(texto));
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
}

/* ---------- 2. DADOS DE EXEMPLO ----------
   Para usar fotos reais, salve as imagens em img/pets/ com estes nomes
   (ou mude o caminho em "foto"). Sem a foto, aparece um emoji no lugar. */
const PETS_EXEMPLO = [
  { id: 'ex1', tipo: 'doacao', nome: 'Hulk', especie: 'cachorro', raca: 'SRD (vira-lata)', idadeMeses: 24, sexo: 'Macho', porte: 'Médio', vacina: 'sim', deficiencia: 'nao', deficienciaDetalhe: '', descricao: 'Brincalhão e muito carinhoso. Convive bem com crianças e outros cachorros. Já é castrado.', uf: 'RJ', cidade: 'Rio de Janeiro', contato: { nome: 'Ana Souza', telefone: '(21) 99999-0001', email: 'ana@exemplo.com' }, foto: 'img/pets/hulk.jpg' },
  { id: 'ex2', tipo: 'doacao', nome: 'Mia', especie: 'gato', raca: 'SRD', idadeMeses: 8, sexo: 'Fêmea', porte: 'Pequeno', vacina: 'parcial', deficiencia: 'nao', deficienciaDetalhe: '', descricao: 'Gatinha curiosa que adora brincar com bolinhas. Já come ração e usa caixa de areia.', uf: 'RJ', cidade: 'Niterói', contato: { nome: 'Carlos Lima', telefone: '(21) 99999-0002', email: 'carlos@exemplo.com' }, foto: 'img/pets/mia.jpg' },
  { id: 'ex3', tipo: 'doacao', nome: 'Bolt', especie: 'cachorro', raca: 'Labrador', idadeMeses: 48, sexo: 'Macho', porte: 'Grande', vacina: 'sim', deficiencia: 'sim', deficienciaDetalhe: 'Não enxerga do olho esquerdo', descricao: 'Tranquilo e obediente. Precisa de um quintal ou passeios diários. Ótimo companheiro.', uf: 'SP', cidade: 'Campinas', contato: { nome: 'Marina Alves', telefone: '(19) 99999-0003', email: 'marina@exemplo.com' }, foto: 'img/pets/bolt.jpg' },
  { id: 'ex4', tipo: 'doacao', nome: 'Manequinho', especie: 'gato', raca: 'Siamês', idadeMeses: 36, sexo: 'Fêmea', porte: 'Pequeno', vacina: 'sim', deficiencia: 'nao', deficienciaDetalhe: '', descricao: 'Calma e independente. Prefere casas sem outros gatos. Castrada e vermifugada.', uf: 'SP', cidade: 'São Paulo', contato: { nome: 'Paulo Ramos', telefone: '(11) 99999-0004', email: 'paulo@exemplo.com' }, foto: 'img/pets/manequinho.jpg' },
  { id: 'ex5', tipo: 'doacao', nome: 'Pipoca', especie: 'outro', raca: 'Coelho mini', idadeMeses: 12, sexo: 'Fêmea', porte: 'Pequeno', vacina: 'nao', deficiencia: 'nao', deficienciaDetalhe: '', descricao: 'Coelhinha dócil, acostumada com colo. Vai junto com a gaiola e o kit de cuidados.', uf: 'MG', cidade: 'Belo Horizonte', contato: { nome: 'Lúcia Ferraz', telefone: '(31) 99999-0005', email: 'lucia@exemplo.com' }, foto: 'img/pets/pipoca.jpg' },
  { id: 'ex6', tipo: 'doacao', nome: 'Fred', especie: 'cachorro', raca: 'Beagle', idadeMeses: 108, sexo: 'Macho', porte: 'Médio', vacina: 'sim', deficiencia: 'sim', deficienciaDetalhe: 'Surdez parcial', descricao: 'Idoso e cheio de amor. Quer um lar calmo para passar a melhor fase da vida.', uf: 'PR', cidade: 'Curitiba', contato: { nome: 'Rita Gomes', telefone: '(41) 99999-0006', email: 'rita@exemplo.com' }, foto: 'img/pets/fred.jpg' },
  { id: 'ex7', tipo: 'doacao', nome: 'Luna', especie: 'cachorro', raca: 'SRD', idadeMeses: 3, sexo: 'Fêmea', porte: 'Pequeno', vacina: 'nao', deficiencia: 'nao', deficienciaDetalhe: '', descricao: 'Filhotinha resgatada, saudável e muito esperta. Procura família que ajude com as vacinas.', uf: 'BA', cidade: 'Salvador', contato: { nome: 'Davi Costa', telefone: '(71) 99999-0007', email: 'davi@exemplo.com' }, foto: 'img/pets/luna.jpg' },
  { id: 'ex8', tipo: 'procura', nome: 'Procuro um cachorro de porte médio', especie: 'cachorro', raca: 'SRD', idadeMeses: 12, sexo: 'Tanto faz', porte: 'Médio', vacina: 'sim', deficiencia: 'sim', deficienciaDetalhe: 'Aceito animal com necessidades especiais', descricao: 'Moro em casa com quintal e trabalho meio período. Quero um companheiro para a família.', uf: 'PE', cidade: 'Recife', contato: { nome: 'Júlia Mendes', telefone: '(81) 99999-0008', email: 'julia@exemplo.com' }, foto: '' }
];

// Protege a listagem contra dados ausentes ou corrompidos no LocalStorage.
const getPets = () => {
  const salvos = store.get('pets', []);
  const personalizados = Array.isArray(salvos)
    ? salvos.filter(p => p && typeof p === 'object' && p.id && p.nome && p.especie)
    : [];
  const vistos = new Set();
  return [...personalizados, ...PETS_EXEMPLO].filter(p => {
    const id = String(p.id);
    if (vistos.has(id)) return false;
    vistos.add(id);
    return true;
  });
};
let favs = new Set(store.get('favs', []));

/* ---------- 3. ESTADOS E CIDADES ----------
   As cidades vêm da API pública do IBGE (todas as cidades do Brasil).
   Sem internet, o site mostra pelo menos a capital do estado. */
const ESTADOS = { AC: 'Acre', AL: 'Alagoas', AP: 'Amapá', AM: 'Amazonas', BA: 'Bahia', CE: 'Ceará', DF: 'Distrito Federal', ES: 'Espírito Santo', GO: 'Goiás', MA: 'Maranhão', MT: 'Mato Grosso', MS: 'Mato Grosso do Sul', MG: 'Minas Gerais', PA: 'Pará', PB: 'Paraíba', PR: 'Paraná', PE: 'Pernambuco', PI: 'Piauí', RJ: 'Rio de Janeiro', RN: 'Rio Grande do Norte', RS: 'Rio Grande do Sul', RO: 'Rondônia', RR: 'Roraima', SC: 'Santa Catarina', SP: 'São Paulo', SE: 'Sergipe', TO: 'Tocantins' };
const CAPITAIS = { AC: 'Rio Branco', AL: 'Maceió', AP: 'Macapá', AM: 'Manaus', BA: 'Salvador', CE: 'Fortaleza', DF: 'Brasília', ES: 'Vitória', GO: 'Goiânia', MA: 'São Luís', MT: 'Cuiabá', MS: 'Campo Grande', MG: 'Belo Horizonte', PA: 'Belém', PB: 'João Pessoa', PR: 'Curitiba', PE: 'Recife', PI: 'Teresina', RJ: 'Rio de Janeiro', RN: 'Natal', RS: 'Porto Alegre', RO: 'Porto Velho', RR: 'Boa Vista', SC: 'Florianópolis', SP: 'São Paulo', SE: 'Aracaju', TO: 'Palmas' };
const cacheCidades = {};

function preencherEstados(select, { todos = false, valor = '' } = {}) {
  select.innerHTML = '';
  select.append(new Option(todos ? 'Todos os estados' : 'Selecione', '', true, true));
  if (!todos) select.options[0].disabled = true;
  Object.entries(ESTADOS).forEach(([uf, nome]) => select.append(new Option(`${nome} (${uf})`, uf)));
  if (valor) select.value = valor;
}

async function preencherCidades(uf, select, { todas = false, valor = '' } = {}) {
  const pedido = String(Date.now() + Math.random());
  select.dataset.pedido = pedido;
  select.innerHTML = '';
  if (!uf) {
    select.append(new Option(todas ? 'Todas as cidades' : 'Escolha o estado primeiro', ''));
    select.disabled = true;
    return;
  }
  select.disabled = true;
  select.append(new Option('Carregando cidades…', ''));

  let lista = cacheCidades[uf];
  if (!lista) {
    try {
      const r = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios?orderBy=nome`);
      if (!r.ok) throw new Error('falha');
      lista = (await r.json()).map(c => c.nome);
      cacheCidades[uf] = lista;
    } catch {
      lista = [CAPITAIS[uf]];
      toast('Sem conexão com a lista do IBGE: mostrando só a capital.');
    }
  }
  if (select.dataset.pedido !== pedido) return; // o usuário já trocou de estado

  select.innerHTML = '';
  select.append(new Option(todas ? 'Todas as cidades' : 'Selecione a cidade', '', true, true));
  if (!todas) select.options[0].disabled = true;
  lista.forEach(nome => select.append(new Option(nome, nome)));
  select.disabled = false;
  if (valor) select.value = valor;
}

/* Liga um par estado/cidade */
function ligarEstadoCidade(selUf, selCidade, opcoes = {}) {
  preencherEstados(selUf, { todos: opcoes.todos });
  preencherCidades('', selCidade, { todas: opcoes.todos });
  selUf.addEventListener('change', () => preencherCidades(selUf.value, selCidade, { todas: opcoes.todos }));
}

/* ---------- 4. TEMA E TAMANHO DA FONTE ---------- */
const NIVEIS_FONTE = [0.875, 1, 1.125, 1.25, 1.5];
let nivelFonte = store.get('fonte', 1);

function aplicarFonte() {
  document.documentElement.style.setProperty('--fs', NIVEIS_FONTE[nivelFonte]);
  $('#fontMenos').disabled = nivelFonte === 0;
  $('#fontMais').disabled = nivelFonte === NIVEIS_FONTE.length - 1;
  store.set('fonte', nivelFonte);
}
$('#fontMenos').addEventListener('click', () => { nivelFonte = Math.max(0, nivelFonte - 1); aplicarFonte(); });
$('#fontMais').addEventListener('click', () => { nivelFonte = Math.min(NIVEIS_FONTE.length - 1, nivelFonte + 1); aplicarFonte(); });
$('#fontReset').addEventListener('click', () => { nivelFonte = 1; aplicarFonte(); });

function aplicarTema(tema) {
  document.documentElement.dataset.theme = tema;
  const btn = $('#temaBtn');
  const escuro = tema === 'dark';
  btn.querySelector('use').setAttribute('href', escuro ? '#i-sun' : '#i-moon');
  btn.setAttribute('aria-label', escuro ? 'Ativar modo claro' : 'Ativar modo escuro');
  btn.title = escuro ? 'Modo claro' : 'Modo escuro';
}
let tema = store.get('tema', window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
$('#temaBtn').addEventListener('click', () => {
  tema = tema === 'dark' ? 'light' : 'dark';
  store.set('tema', tema);
  aplicarTema(tema);
});

/* ---------- 5. LISTAGEM E FILTROS ---------- */
const filtros = { q: '', uf: '', cidade: '', especie: '', tipo: '', idade: '', vacinado: false, soFav: false };

function fmtIdade(m) {
  if (m < 12) return `${m} ${m === 1 ? 'mês' : 'meses'}`;
  const a = Math.floor(m / 12);
  return `${a} ${a === 1 ? 'ano' : 'anos'}`;
}
const EMOJI = { cachorro: '🐶', gato: '🐱', outro: '🐰' };
const ROTULO_ESPECIE = { cachorro: 'Cachorro', gato: 'Gato', outro: 'Outro' };

function fotoHTML(p) {
  return p.foto
    ? `<img src="${esc(p.foto)}" alt="Foto de ${esc(p.nome)}" loading="lazy" data-e="${p.especie}">`
    : `<div class="ph" aria-hidden="true">${EMOJI[p.especie] || '🐾'}</div>`;
}

function tagsHTML(p) {
  const t = [];
  const proc = p.tipo === 'procura';
  t.push(`<li>${ROTULO_ESPECIE[p.especie]}</li>`);
  t.push(`<li>${{ sim: proc ? 'Quer vacinado' : 'Vacinado', parcial: 'Vacina parcial', nao: proc ? 'Vacina indiferente' : 'Sem vacinas' }[p.vacina]}</li>`);
  if (p.deficiencia === 'sim') t.push(`<li class="warn">${proc ? 'Aceita deficiência' : 'Tem deficiência'}</li>`);
  return t.join('');
}

function cardHTML(p) {
  const fav = favs.has(p.id);
  return `<article class="card">
    <button class="fav ${fav ? 'on' : ''}" type="button" data-fav="${p.id}" aria-pressed="${fav}" aria-label="${fav ? 'Remover dos favoritos' : 'Favoritar'}: ${esc(p.nome)}"><svg class="ic"><use href="#i-heart"/></svg></button>
    <button class="card-open" type="button" data-abrir="${p.id}">
      <div class="thumb">${fotoHTML(p)}<span class="badge ${p.tipo}">${p.tipo === 'doacao' ? 'Para adoção' : 'Procurando'}</span></div>
      <div class="card-body">
        <h3>${esc(p.nome)}</h3>
        <p class="meta">${esc(p.raca)}, ${fmtIdade(p.idadeMeses)}</p>
        <p class="loc"><svg class="ic"><use href="#i-pin"/></svg>${esc(p.cidade)}, ${p.uf}</p>
        <ul class="tags">${tagsHTML(p)}</ul>
      </div>
    </button>
  </article>`;
}

function filtrar() {
  const q = filtros.q.trim().toLowerCase();
  return getPets().filter(p => {
    if (filtros.especie && p.especie !== filtros.especie) return false;
    if (filtros.tipo && p.tipo !== filtros.tipo) return false;
    if (filtros.uf && p.uf !== filtros.uf) return false;
    if (filtros.cidade && p.cidade !== filtros.cidade) return false;
    if (filtros.vacinado && p.vacina !== 'sim') return false;
    if (filtros.soFav && !favs.has(p.id)) return false;
    if (filtros.idade === 'filhote' && p.idadeMeses > 12) return false;
    if (filtros.idade === 'adulto' && (p.idadeMeses <= 12 || p.idadeMeses > 84)) return false;
    if (filtros.idade === 'idoso' && p.idadeMeses <= 84) return false;
    if (q && !`${p.nome} ${p.raca} ${p.descricao} ${p.cidade}`.toLowerCase().includes(q)) return false;
    return true;
  });
}

function renderizar() {
  const lista = filtrar();
  $('#grade').innerHTML = lista.map(cardHTML).join('');
  $('#vazio').hidden = lista.length > 0;
  $('#resultadoInfo').textContent = lista.length === 1 ? '1 anúncio encontrado' : `${lista.length} anúncios encontrados`;
  $('#favCount').textContent = favs.size;
}

/* Foto quebrada vira emoji (vale para cards e detalhes) */
document.addEventListener('error', e => {
  const img = e.target;
  if (!(img instanceof HTMLImageElement) || !img.dataset.e) return;
  img.outerHTML = `<div class="ph" aria-hidden="true">${EMOJI[img.dataset.e] || '🐾'}</div>`;
}, true);

$('#grade').addEventListener('click', e => {
  const fav = e.target.closest('[data-fav]');
  if (fav) return alternarFavorito(fav.dataset.fav);
  const abrir = e.target.closest('[data-abrir]');
  if (abrir) abrirDetalhe(abrir.dataset.abrir);
});

function alternarFavorito(id) {
  if (favs.has(id)) { favs.delete(id); toast('Removido dos favoritos'); }
  else { favs.add(id); toast('Adicionado aos favoritos'); }
  store.set('favs', [...favs]);
  renderizar();
  if ($('#detalhe').open) atualizarBotaoFavDetalhe(id);
}

/* filtros: eventos */
$('#chipsEspecie').addEventListener('click', e => {
  const chip = e.target.closest('.chip');
  if (!chip) return;
  $$('.chip', $('#chipsEspecie')).forEach(c => c.classList.toggle('on', c === chip));
  filtros.especie = chip.dataset.especie;
  renderizar();
});

// Mantém apenas um submenu de navegação aberto por vez.
$$('.nav-group').forEach(grupo => {
  grupo.addEventListener('toggle', () => {
    if (!grupo.open) return;
    $$('.nav-group').forEach(outro => {
      if (outro !== grupo) outro.open = false;
    });
  });
});

// Atalhos de espécie disponíveis no submenu "Adotar".
$$('[data-nav-especie]').forEach(link => link.addEventListener('click', () => {
  filtros.especie = link.dataset.navEspecie;
  $$('.chip', $('#chipsEspecie')).forEach(chip => chip.classList.toggle('on', chip.dataset.especie === filtros.especie));
  renderizar();
}));
$$('input[name="tipo"]', $('#filtros')).forEach(r => r.addEventListener('change', () => { filtros.tipo = r.value; renderizar(); }));
$('#filtroIdade').addEventListener('change', e => { filtros.idade = e.target.value; renderizar(); });
$('#filtroVacina').addEventListener('change', e => { filtros.vacinado = e.target.checked; renderizar(); });
$('#filtroFav').addEventListener('change', e => { filtros.soFav = e.target.checked; renderizar(); });

$('#limparFiltros').addEventListener('click', () => {
  Object.assign(filtros, { q: '', uf: '', cidade: '', especie: '', tipo: '', idade: '', vacinado: false, soFav: false });
  $('#buscaTexto').value = '';
  $('#buscaUf').value = '';
  preencherCidades('', $('#buscaCidade'), { todas: true });
  $('#filtroIdade').value = '';
  $('#filtroVacina').checked = false;
  $('#filtroFav').checked = false;
  $('input[name="tipo"][value=""]', $('#filtros')).checked = true;
  $('.chip', $('#chipsEspecie')).forEach((c, i) => c.classList.toggle('on', i === 0));
  renderizar();
});

/* busca do topo */
ligarEstadoCidade($('#buscaUf'), $('#buscaCidade'), { todos: true });
$('#buscaForm').addEventListener('submit', e => {
  e.preventDefault();
  filtros.q = $('#buscaTexto').value;
  filtros.uf = $('#buscaUf').value;
  filtros.cidade = $('#buscaCidade').value;
  renderizar();
  $('#animais').scrollIntoView();
});

/* favoritos no cabeçalho */
$('#favTop').addEventListener('click', () => {
  filtros.soFav = true;
  $('#filtroFav').checked = true;
  $('#filtros').open = true;
  renderizar();
  $('#animais').scrollIntoView();
  if (!favs.size) toast('Você ainda não favoritou nenhum animal.');
});

/* filtros recolhidos no celular */
if (window.matchMedia('(max-width: 960px)').matches) $('#filtros').open = false;

/* ---------- 6. DETALHES DO ANIMAL ---------- */
const dlgDetalhe = $('#detalhe');
let petAberto = null;

function abrirDetalhe(id) {
  const p = getPets().find(x => x.id === id);
  if (!p) return;
  petAberto = p;
  const proc = p.tipo === 'procura';
  const vacinaTxt = { sim: 'Vacinas em dia', parcial: 'Vacinação parcial', nao: 'Não vacinado' }[p.vacina];
  const defTxt = p.deficiencia === 'sim'
    ? (p.deficienciaDetalhe || (proc ? 'Aceita animal com deficiência' : 'Possui deficiência'))
    : (proc ? 'Prefere animal sem deficiência' : 'Não possui');
  const tel = soDigitos(p.contato.telefone);
  const msg = encodeURIComponent(proc
    ? `Olá, ${p.contato.nome}! Vi seu pedido "${p.nome}" no Adotaê e posso ajudar.`
    : `Olá, ${p.contato.nome}! Tenho interesse em adotar o(a) ${p.nome}, que vi no Adotaê.`);
  const dono = store.get('usuario', null);
  const meu = dono && p.donoId === dono.id;

  $('#detalheConteudo').innerHTML = `
    <div class="det">
      <div class="det-photo">${fotoHTML(p)}</div>
      <div>
        <h2 id="detNome">${esc(p.nome)}</h2>
        <p class="det-sub"><svg class="ic"><use href="#i-pin"/></svg>${esc(p.cidade)}, ${p.uf}</p>
        <dl class="facts">
          <div><dt>Espécie</dt><dd>${ROTULO_ESPECIE[p.especie]}</dd></div>
          <div><dt>${proc ? 'Raça desejada' : 'Raça'}</dt><dd>${esc(p.raca)}</dd></div>
          <div><dt>${proc ? 'Idade desejada' : 'Idade'}</dt><dd>${fmtIdade(p.idadeMeses)}</dd></div>
          <div><dt>Sexo</dt><dd>${esc(p.sexo)}</dd></div>
          <div><dt>Porte</dt><dd>${esc(p.porte)}</dd></div>
          <div><dt>Vacinas</dt><dd>${vacinaTxt}</dd></div>
          <div class="full"><dt>${proc ? 'Aceita deficiência?' : 'Deficiência'}</dt><dd>${esc(defTxt)}</dd></div>
        </dl>
        <p class="det-desc">${esc(p.descricao)}</p>
        ${!proc && !meu ? `<section class="adoption-action" aria-label="Demonstrar interesse na adoção"><button class="btn btn-primary btn-adopt" type="button" id="detQueroPet">💛 Eu quero esse pet</button><div class="adoption-celebration" id="detAdocaoSucesso" hidden role="status" aria-live="polite"><span class="celebration-paws" aria-hidden="true">🐾 ✨ 🐾</span><strong>Ótima escolha!</strong><span>Seu companheiro(a) está te esperando 💛</span></div></section>` : ''}
        <div class="det-actions">
          <button class="btn btn-ghost" type="button" id="detFav" data-fav-det="${p.id}"></button>
          <button class="btn btn-ghost" type="button" id="detShare"><svg class="ic"><use href="#i-share"/></svg>Compartilhar</button>
        </div>
        <div class="det-contact">
          <h3>Contato de ${esc(p.contato.nome)}</h3>
          <div class="det-actions">
            <a class="btn btn-primary" href="https://wa.me/55${tel}?text=${msg}" target="_blank" rel="noopener"><svg class="ic"><use href="#i-chat"/></svg>WhatsApp</a>
            <a class="btn btn-ghost" href="tel:+55${tel}"><svg class="ic"><use href="#i-phone"/></svg>${esc(p.contato.telefone)}</a>
            <a class="btn btn-ghost" href="mailto:${esc(p.contato.email)}?subject=${encodeURIComponent('Adotaê: ' + p.nome)}"><svg class="ic"><use href="#i-mail"/></svg>${esc(p.contato.email)}</a>
          </div>
        </div>
        ${meu ? `<button class="det-remove" type="button" id="detRemover">Remover meu anúncio</button>` : ''}
      </div>
    </div>`;
  atualizarBotaoFavDetalhe(p.id);
  if (!dlgDetalhe.open) dlgDetalhe.showModal();
  history.replaceState(null, '', '#pet-' + p.id);
}

function atualizarBotaoFavDetalhe(id) {
  const b = $('#detFav');
  if (!b) return;
  const on = favs.has(id);
  b.innerHTML = `<svg class="ic" style="${on ? 'fill:var(--heart);stroke:var(--heart)' : ''}"><use href="#i-heart"/></svg>${on ? 'Favoritado' : 'Favoritar'}`;
  b.setAttribute('aria-pressed', on);
}

dlgDetalhe.addEventListener('click', async e => {
  if (e.target.closest('#detQueroPet')) {
    const botao = $('#detQueroPet');
    const celebracao = $('#detAdocaoSucesso');
    if (botao && celebracao) {
      botao.hidden = true;
      celebracao.hidden = false;
      celebracao.classList.remove('celebrate');
      void celebracao.offsetWidth;
      celebracao.classList.add('celebrate');
    }
    return;
  }
  if (e.target.closest('#detFav')) return alternarFavorito(petAberto.id);
  if (e.target.closest('#detShare')) return compartilhar(petAberto);
  if (e.target.closest('#detRemover')) {
    if (!confirm('Remover este anúncio?')) return;
    store.set('pets', store.get('pets', []).filter(x => x.id !== petAberto.id));
    dlgDetalhe.close();
    renderizar();
    toast('Anúncio removido');
  }
});
dlgDetalhe.addEventListener('close', () => history.replaceState(null, '', location.pathname + location.search));

async function compartilhar(p) {
  const url = location.href.split('#')[0] + '#pet-' + p.id;
  const dados = { title: `Adotaê: ${p.nome}`, text: `Conheça ${p.nome} no Adotaê. Adote, não compre!`, url };
  try {
    if (navigator.share) { await navigator.share(dados); return; }
    await navigator.clipboard.writeText(url);
    toast('Link copiado! Cole onde quiser compartilhar.');
  } catch (err) {
    if (err && err.name === 'AbortError') return;
    window.prompt('Copie o link para compartilhar:', url);
  }
}

/* botão "fechar" de qualquer modal + clique fora */
$$('dialog').forEach(d => {
  d.addEventListener('click', e => {
    if (e.target.closest('[data-close]')) return d.close();
    if (e.target !== d) return;
    const r = d.getBoundingClientRect();
    const fora = e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom;
    if (fora) d.close();
  });
});

/* ---------- 7. CONTA (páginas independentes) ---------- */
let usuario = store.get('usuario', null);
let depoisDeEntrar = null;

function atualizarConta() {
  const botaoConta = $('#btnConta');
  if (botaoConta) botaoConta.textContent = usuario ? `Olá, ${usuario.nome.split(' ')[0]}` : 'Entrar';
  const botaoSair = $('#btnSair');
  if (botaoSair) botaoSair.hidden = !usuario;
}

if ($('#btnConta')) $('#btnConta').href = 'acesso.html';
function concluirSaida() {
  try {
    // Mantém anúncios e favoritos: são dados do site, não apenas da sessão.
    ['adotae_sessao', 'adotae_usuario', 'adotae_usuario_logado', 'adotae_lembrar', 'adotae_boas_vindas'].forEach(k => localStorage.removeItem(k));
    sessionStorage.clear();
  } catch (e) {}
  window.location.href = 'index.html';
}
function solicitarSaida() {
  let lembrar = false;
  try { lembrar = localStorage.getItem('adotae_lembrar') === 'true'; } catch (e) {}
  if (!lembrar) { concluirSaida(); return; }
  const dialogo = $('#logoutConfirm');
  if (dialogo && typeof dialogo.showModal === 'function') dialogo.showModal();
  else if (window.confirm('O site será encerrado e todos os dados salvos neste navegador serão apagados. Deseja continuar?')) concluirSaida();
}
const dialogoSaida = $('#logoutConfirm');
if (dialogoSaida) {
  $('[data-confirm-logout]', dialogoSaida)?.addEventListener('click', concluirSaida);
  $('[data-cancel-logout]', dialogoSaida)?.addEventListener('click', () => dialogoSaida.close());
  dialogoSaida.addEventListener('click', e => { if (e.target === dialogoSaida) dialogoSaida.close(); });
}
if ($('#btnSair')) $('#btnSair').addEventListener('click', solicitarSaida);

function entrar(u) {
  usuario = { id: u.id, nome: u.nome, email: u.email || '', telefone: u.telefone || u.celular || '', uf: u.uf || '', cidade: u.cidade || '' };
  store.set('usuario', usuario);
  atualizarConta();
}
/* ---------- 8. ANUNCIAR: página exclusiva ---------- */
const btnAnunciar = $('#btnAnunciar');
if (btnAnunciar) btnAnunciar.href = 'anunciar.html';

/* ---------- 9. CONTATO ---------- */
$('#contatoForm').addEventListener('submit', e => {
  e.preventDefault();
  e.target.reset();
  toast('Mensagem enviada! (simulação: nenhum e-mail real é enviado)');
});

/* ---------- INÍCIO ---------- */
aplicarTema(tema);
aplicarFonte();
atualizarConta();
renderizar();

// Exibe a saudação uma única vez após o redirecionamento do login.
try {
  const boasVindas = JSON.parse(localStorage.getItem('adotae_boas_vindas') || 'null');
  if (boasVindas && boasVindas.nome) {
    localStorage.removeItem('adotae_boas_vindas');
    const primeiroNome = boasVindas.nome.trim().split(/\s+/)[0];
    const saudacao = boasVindas.genero === 'Feminino' ? 'Seja bem-vinda' : boasVindas.genero === 'Masculino' ? 'Seja bem-vindo' : 'Que bom ter você';
    toast(`Olá, ${primeiroNome}! ${saudacao} ao Adotaê!`);
  }
} catch (e) { localStorage.removeItem('adotae_boas_vindas'); }

/* abre direto o animal se o link tiver #pet-... (compartilhamento) */
if (location.hash.startsWith('#pet-')) { try { abrirDetalhe(decodeURIComponent(location.hash.slice(5))); } catch (e) { abrirDetalhe(location.hash.slice(5)); } }
