/* =====================================================
   Adotaê — cadastro, login e recuperação (front-end)
   Carregue ANTES do script.js:
     <script src="js/cadastro.js"></script>
     <script src="js/script.js"></script>
   Os dados ficam no localStorage (trabalho acadêmico, sem servidor).
   ===================================================== */
(function () {
  'use strict';

  var KEY_USUARIOS = 'adotae_usuarios';
  var KEY_SESSAO = 'adotae_sessao';

  var $ = function (sel, raiz) { return (raiz || document).querySelector(sel); };
  var $$ = function (sel, raiz) { return Array.prototype.slice.call((raiz || document).querySelectorAll(sel)); };

  var auth = $('#auth');
  var formLogin = $('#loginForm');
  var formCad = $('#cadastroForm');
  var formRec = $('#recuperarForm');
  if (!auth || !formLogin || !formCad || !formRec) { return; }

  /* ---------- utilitários ---------- */
  function norm(s) {
    return String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .trim().toLowerCase().replace(/\s+/g, ' ');
  }
  function digitos(s) { return String(s || '').replace(/\D/g, ''); }

  var ESTADOS_CAD = { AC:'Acre', AL:'Alagoas', AP:'Amapá', AM:'Amazonas', BA:'Bahia', CE:'Ceará', DF:'Distrito Federal', ES:'Espírito Santo', GO:'Goiás', MA:'Maranhão', MT:'Mato Grosso', MS:'Mato Grosso do Sul', MG:'Minas Gerais', PA:'Pará', PB:'Paraíba', PR:'Paraná', PE:'Pernambuco', PI:'Piauí', RJ:'Rio de Janeiro', RN:'Rio Grande do Norte', RS:'Rio Grande do Sul', RO:'Rondônia', RR:'Roraima', SC:'Santa Catarina', SP:'São Paulo', SE:'Sergipe', TO:'Tocantins' };
  var selCadUf = $('#cadUf'), selCadCidade = $('#cadCidade');
  if (selCadUf && selCadCidade) {
    selCadUf.innerHTML = '<option value="">Selecione o estado</option>';
    Object.keys(ESTADOS_CAD).forEach(function (uf) {
      selCadUf.appendChild(new Option(ESTADOS_CAD[uf] + ' (' + uf + ')', uf));
    });
    selCadCidade.innerHTML = '<option value="">Escolha o estado primeiro</option>';
    selCadCidade.disabled = true;
    selCadUf.addEventListener('change', function () {
      var uf = selCadUf.value;
      selCadCidade.disabled = true;
      selCadCidade.innerHTML = '<option value="">Carregando cidades...</option>';
      if (!uf) { selCadCidade.innerHTML = '<option value="">Escolha o estado primeiro</option>'; return; }
      fetch('https://servicodados.ibge.gov.br/api/v1/localidades/estados/' + uf + '/municipios?orderBy=nome')
        .then(function (r) { if (!r.ok) throw new Error('IBGE'); return r.json(); })
        .then(function (cidades) {
          selCadCidade.innerHTML = '<option value="">Selecione a cidade</option>';
          cidades.forEach(function (c) { selCadCidade.appendChild(new Option(c.nome, c.nome)); });
          selCadCidade.disabled = false;
        })
        .catch(function () {
          selCadCidade.innerHTML = '<option value="">Digite seu CEP para preencher a cidade</option>';
          selCadCidade.disabled = false;
        });
    });
  }


  function lerUsuarios() {
    try { return JSON.parse(localStorage.getItem(KEY_USUARIOS)) || []; } catch (e) { return []; }
  }
  function salvarUsuarios(lista) {
    try { localStorage.setItem(KEY_USUARIOS, JSON.stringify(lista)); return true; } catch (e) { return false; }
  }
  function achar(usuario) {
    var u = norm(usuario);
    return lerUsuarios().filter(function (x) { return x.usuario === u; })[0] || null;
  }

  // Guarda só o hash da senha (SHA-256). Se o navegador não tiver crypto.subtle, usa um fallback simples.
  function hash(texto) {
    if (window.crypto && window.crypto.subtle && window.TextEncoder) {
      return window.crypto.subtle.digest('SHA-256', new TextEncoder().encode(texto)).then(function (buf) {
        return Array.prototype.map.call(new Uint8Array(buf), function (b) {
          return ('0' + b.toString(16)).slice(-2);
        }).join('');
      });
    }
    return Promise.resolve('b64:' + btoa(unescape(encodeURIComponent(texto))));
  }
  function hashSenha(usuario, senha) { return hash('adotae:' + norm(usuario) + ':' + senha); }

  /* ---------- EVENTOS (mensagens) ----------
     Eventos disparados:  cadastro:sucesso | cep:sucesso | cep:erro | login:sucesso | login:erro | recuperar:sucesso
     Qualquer parte do site pode escutar:  document.addEventListener('cadastro:sucesso', fn)  */
  function emitir(nome, detalhe) {
    document.dispatchEvent(new CustomEvent(nome, { detail: detalhe || {} }));
  }

  var timerMsg;
  function mostrarMensagem(texto, tipo) {
    var alvo = $('#msgGlobal');
    if (!alvo) { return; }
    alvo.textContent = texto;
    alvo.className = 'evento evento-' + tipo + ' evento-global';
    alvo.hidden = false;
    clearTimeout(timerMsg);
    timerMsg = setTimeout(function () { alvo.hidden = true; }, 7000);
  }

  document.addEventListener('cadastro:sucesso', function () {
    mostrarMensagem('Cadastro realizado com sucesso', 'ok');
  });

  var toastTimer;
  function mostrarToast(texto) {
    var alvo = $('#toast');
    if (!alvo) return;
    alvo.textContent = texto;
    alvo.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { alvo.classList.remove('show'); }, 3500);
  }
  document.addEventListener('cep:erro', function () {
    mostrarMensagem('falha na consulta', 'erro');
    var msg = $('#cepMsg');
    msg.textContent = 'falha na consulta';
    msg.className = 'dica erro';
    msg.hidden = false;
    formCad.elements.cep.classList.add('invalido');
  });
  document.addEventListener('cep:sucesso', function () {
    var msg = $('#cepMsg');
    msg.textContent = 'Endereço encontrado. Confira os dados e informe o número.';
    msg.className = 'dica ok';
    msg.hidden = false;
    formCad.elements.cep.classList.remove('invalido');
  });
  document.addEventListener('login:sucesso', function (e) {
    mostrarMensagem('Bem-vindo(a), ' + (e.detail.nome || '').split(' ')[0] + '!', 'ok');
  });
  document.addEventListener('recuperar:sucesso', function () {
    mostrarMensagem('Dados confirmados com sucesso.', 'ok');
  });

  /* ---------- painéis (login / cadastro / recuperar) ---------- */
  function mostrarPainel(nome) {
    formLogin.hidden = nome !== 'login';
    formCad.hidden = nome !== 'cadastro';
    formRec.hidden = nome !== 'recuperar';
    $$('.tab', auth).forEach(function (t) {
      var ativo = t.getAttribute('data-tab') === (nome === 'recuperar' ? 'login' : nome);
      t.classList.toggle('on', ativo);
      t.setAttribute('aria-selected', ativo ? 'true' : 'false');
    });
  }

  mostrarPainel(document.body.getAttribute('data-auth-page') || 'login');

  $$('.tab', auth).forEach(function (t) {
    t.addEventListener('click', function () { mostrarPainel(t.getAttribute('data-tab')); });
  });
  $('#abrirRecuperar').addEventListener('click', function () { mostrarPainel('recuperar'); });
  $('#voltarLogin').addEventListener('click', function () { mostrarPainel('login'); });
  // Acesso é uma página independente; os painéis são alternados pelas abas.

  /* ---------- mostrar / ocultar senha ---------- */
  document.addEventListener('change', function (e) {
    if (!e.target.classList || !e.target.classList.contains('mostrar-senha')) { return; }
    var form = e.target.closest('form');
    $$('input[data-senha]', form).forEach(function (inp) {
      inp.type = e.target.checked ? 'text' : 'password';
    });
  });

  /* ---------- máscaras ---------- */
  function mascaraCep(v) {
    v = digitos(v).slice(0, 8);
    return v.length > 5 ? v.slice(0, 5) + '-' + v.slice(5) : v;
  }
  function mascaraCel(v) {
    v = digitos(v).slice(0, 11);
    if (v.length > 7) { return '(' + v.slice(0, 2) + ') ' + v.slice(2, 7) + '-' + v.slice(7); }
    if (v.length > 2) { return '(' + v.slice(0, 2) + ') ' + v.slice(2); }
    return v.length ? '(' + v : '';
  }
  formCad.elements.cep.addEventListener('input', function () {
    this.value = mascaraCep(this.value);
    this.classList.remove('invalido');
  });
  formCad.elements.celular.addEventListener('input', function () { this.value = mascaraCel(this.value); });
  formRec.elements.celular.addEventListener('input', function () { this.value = mascaraCel(this.value); });

  function configurarData(form) {
    if (!form) return;
    var texto=form.querySelector('[data-date-text]'), picker=form.querySelector('[data-date-picker]'), iso=form.elements.nascimento;
    if (!texto || !picker || !iso) return;
    function aplicarISO(valor) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(valor)) return false;
      var p=valor.split('-'), d=new Date(Number(p[0]),Number(p[1])-1,Number(p[2]));
      if(d.getFullYear()!==Number(p[0])||d.getMonth()!==Number(p[1])-1||d.getDate()!==Number(p[2])) return false;
      iso.value=valor; texto.value=p[2]+'/'+p[1]+'/'+p[0]; picker.value=valor; texto.setCustomValidity(''); return true;
    }
    texto.addEventListener('input',function(){
      var v=texto.value.replace(/[^0-9]/g,'').slice(0,8);
      texto.value=v.length>4?v.slice(0,2)+'/'+v.slice(2,4)+'/'+v.slice(4):v.length>2?v.slice(0,2)+'/'+v.slice(2):v;
      var m=texto.value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
      if(!m){iso.value='';picker.value='';return;}
      if(!aplicarISO(m[3]+'-'+m[2]+'-'+m[1])) { iso.value=''; picker.value=''; }
    });
    picker.addEventListener('change',function(){if(picker.value)aplicarISO(picker.value);});
    texto.addEventListener('blur',function(){if(texto.value&&!iso.value)texto.setCustomValidity('Digite uma data válida no formato DD/MM/AAAA.');});
    texto.addEventListener('input',function(){texto.setCustomValidity('');});
  }
  configurarData(formCad);
  configurarData(formRec);
  document.addEventListener('input',function(e){
    if(e.target.matches('[data-letters-only]')) e.target.value=e.target.value.replace(/[^A-Za-zÀ-ÖØ-öø-ÿ\s'-]/g,'');
  });


  /* ---------- ViaCEP ---------- */
  function selecionar(sel, valor, criar) {
    var alvo = norm(valor);
    var achou = false;
    $$('option', sel).forEach(function (o) {
      if (achou) { return; }
      var v = norm(o.value), t = norm(o.textContent);
      if (v === alvo || t === alvo || t.indexOf(alvo + ' ') === 0 || t.indexOf(alvo + '-') === 0) {
        sel.value = o.value;
        achou = true;
      }
    });
    if (!achou && criar && valor) {
      var op = document.createElement('option');
      op.value = valor;
      op.textContent = valor;
      sel.appendChild(op);
      sel.value = valor;
      achou = true;
    }
    return achou;
  }

  // O script.js pode carregar as cidades depois de mudar o estado, então esperamos a lista aparecer.
  function preencherUfCidade(uf, cidade) {
    var selUf = $('#cadUf'), selCid = $('#cadCidade');
    selecionar(selUf, uf, true);
    selUf.dispatchEvent(new Event('change', { bubbles: true }));
    var tentativas = 0;
    (function tentar() {
      if (selecionar(selCid, cidade, false)) {
        setTimeout(function () { selecionar(selCid, cidade, true); }, 500);
        return;
      }
      if (++tentativas < 15) { setTimeout(tentar, 200); } else { selecionar(selCid, cidade, true); }
    })();
  }

  function preencherEndereco(d) {
    var f = formCad.elements;
    f.endereco.value = d.logradouro || '';
    f.bairro.value = d.bairro || '';
    if (d.complemento && !f.complemento.value) { f.complemento.value = d.complemento; }
    preencherUfCidade(d.uf, d.localidade);
    (d.logradouro ? f.numero : f.endereco).focus();
  }

  var btnCep = $('#btnBuscarCep');
  function buscarCep() {
    var cep = digitos(formCad.elements.cep.value);
    if (cep.length !== 8) { emitir('cep:erro', { motivo: 'formato' }); return; }
    btnCep.disabled = true;
    btnCep.textContent = 'Buscando...';
    fetch('https://viacep.com.br/ws/' + cep + '/json/')
      .then(function (r) {
        if (!r.ok) { throw new Error('http'); }
        return r.json();
      })
      .then(function (d) {
        if (d.erro) { throw new Error('inexistente'); }
        preencherEndereco(d);
        emitir('cep:sucesso', d);
      })
      .catch(function () { emitir('cep:erro', { motivo: 'consulta' }); })
      .then(function () {
        btnCep.disabled = false;
        btnCep.textContent = 'Buscar CEP';
      });
  }
  btnCep.addEventListener('click', buscarCep);
  formCad.elements.cep.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') { e.preventDefault(); buscarCep(); }
  });

  /* ---------- força da senha e confirmação (ao digitar) ---------- */
  var cadSenha = $('#cadSenha'), cadConf = $('#cadConfirmar');
  var forca = $('#forca'), forcaTxt = $('#forcaTxt'), confMsg = $('#confirmaMsg');
  var DICA_FORTE = 'Crie uma senha forte: misture letras maiúsculas e minúsculas, números e símbolos.';

  function nivelSenha(s) {
    if (s.length < 6) { return 0; }
    var pontos = 0;
    if (/[a-z]/.test(s)) { pontos++; }
    if (/[A-Z]/.test(s)) { pontos++; }
    if (/\d/.test(s)) { pontos++; }
    if (/[^A-Za-z0-9]/.test(s)) { pontos++; }
    if (s.length >= 10) { pontos++; }
    return pontos <= 2 ? 1 : (pontos === 3 ? 2 : 3);
  }
  function atualizarForca() {
    var s = cadSenha.value;
    if (!s) {
      forca.setAttribute('data-nivel', '0');
      forcaTxt.textContent = DICA_FORTE;
    } else {
      var n = nivelSenha(s);
      forca.setAttribute('data-nivel', String(n));
      forcaTxt.textContent = [
        'Muito curta: use no mínimo 6 caracteres. ' + DICA_FORTE,
        'Senha fraca. ' + DICA_FORTE,
        'Senha média. Para ficar forte, use 10+ caracteres com maiúsculas, números e símbolos.',
        'Senha forte. Ótima escolha!'
      ][n];
    }
    atualizarConfirmacao();
  }
  function atualizarConfirmacao() {
    if (!cadConf.value) { confMsg.hidden = true; return; }
    var igual = cadConf.value === cadSenha.value;
    confMsg.hidden = false;
    confMsg.className = 'dica ' + (igual ? 'ok' : 'erro');
    confMsg.textContent = igual ? 'As senhas coincidem.' : 'As senhas não coincidem. Use uma senha forte e digite a mesma nos dois campos.';
  }
  cadSenha.addEventListener('input', atualizarForca);
  cadConf.addEventListener('input', atualizarConfirmacao);

  /* ---------- CADASTRO ---------- */
  function erroCad(texto) {
    var p = $('#cadErro');
    p.textContent = texto;
    p.hidden = !texto;
  }

  formCad.addEventListener('submit', function (e) {
    // assume o envio no lugar do script.js (este arquivo é carregado primeiro)
    e.stopImmediatePropagation();
    e.preventDefault();
    erroCad('');
    var f = formCad.elements;

    if (!f.usuario.value.trim() || !f.nome.value.trim() || !f.endereco.value.trim()) {
      erroCad('Preencha usuário, nome e endereço.');
      (!f.usuario.value.trim() ? f.usuario : (!f.nome.value.trim() ? f.nome : f.endereco)).focus();
      return;
    }
    if (!formCad.reportValidity()) { return; }

    var nomeCompleto = f.nome.value.trim();
    if (nomeCompleto.length < 15 || nomeCompleto.length > 60 || !/^[A-Za-zÀ-ÖØ-öø-ÿ ]+$/.test(nomeCompleto)) {
      erroCad('O nome completo deve ter de 15 a 60 caracteres e conter somente letras e espaços.');
      f.nome.focus(); return;
    }

    var nasc = new Date(f.nascimento.value + 'T00:00:00');
    if (isNaN(nasc.getTime()) || nasc > new Date() || nasc.getFullYear() < 1900) {
      erroCad('Informe uma data de nascimento válida.'); f.nascimento.focus(); return;
    }
    var cel = digitos(f.celular.value);
    if (cel.length !== 11 || cel.charAt(2) !== '9') {
      erroCad('Informe um celular válido com DDD, por exemplo (21) 99999-0000.'); f.celular.focus(); return;
    }
    if (digitos(f.cep.value).length !== 8) {
      erroCad('Informe um CEP válido (8 números).'); f.cep.focus(); return;
    }
    if (f.senha.value.length < 6) {
      erroCad('A senha precisa ter no mínimo 6 caracteres.'); f.senha.focus(); return;
    }
    if (f.senha.value !== f.confirmar.value) {
      erroCad('As senhas não coincidem.'); f.confirmar.focus(); return;
    }
    if (achar(f.usuario.value)) {
      erroCad('Esse usuário já existe. Escolha outro.'); f.usuario.focus(); return;
    }

    hashSenha(f.usuario.value, f.senha.value).then(function (h) {
      var usuario = norm(f.usuario.value);
      var lista = lerUsuarios();
      lista.push({
        usuario: usuario,
        nome: f.nome.value.trim(),
        materno: f.materno.value.trim(),
        nascimento: f.nascimento.value,
        genero: f.genero.value,
        celular: cel,
        endereco: {
          cep: digitos(f.cep.value),
          logradouro: f.endereco.value.trim(),
          numero: f.numero.value.trim(),
          complemento: f.complemento.value.trim(),
          bairro: f.bairro.value.trim(),
          cidade: f.cidade.value,
          uf: f.uf.value
        },
        senha: h,
        criadoEm: new Date().toISOString()
      });
      if (!salvarUsuarios(lista)) {
        erroCad('Não foi possível salvar o cadastro neste navegador.'); return;
      }
      var nome = f.nome.value.trim();
      formCad.reset();
      cadSenha.dispatchEvent(new Event('input'));
      $('#cepMsg').hidden = true;
      formLogin.elements.usuario.value = usuario;
      mostrarPainel('login');
      mostrarToast('Cadastro realizado com sucesso');
      emitir('cadastro:sucesso', { usuario: usuario, nome: nome });
    });
  });

  /* ---------- LOGIN ---------- */
  function erroLogin(texto) {
    var p = $('#loginErro');
    p.textContent = texto;
    p.hidden = !texto;
    if (texto) { emitir('login:erro', { motivo: texto }); }
  }

  var btnConta = $('#btnConta'), btnSair = $('#btnSair');
  function aplicarSessao() {
    var logado = !!localStorage.getItem(KEY_SESSAO);
    if (btnConta) { btnConta.hidden = logado; }
    if (btnSair) { btnSair.hidden = !logado; }
  }

  formLogin.addEventListener('submit', function (e) {
    e.stopImmediatePropagation();
    e.preventDefault();
    erroLogin('');
    var u = formLogin.elements.usuario.value.trim();
    var s = formLogin.elements.senha.value;
    if (!u || !s) { erroLogin('Informe usuário e senha.'); return; }
    var user = achar(u);
    if (!user) { erroLogin('Usuário ou senha incorretos.'); return; }
    hashSenha(u, s).then(function (h) {
      if (h !== user.senha) { erroLogin('Usuário ou senha incorretos.'); return; }
      try { localStorage.setItem(KEY_SESSAO, user.usuario); } catch (err) { /* ignora */ }
      formLogin.reset();
      aplicarSessao();
      try { localStorage.setItem('adotae_usuario', JSON.stringify({ id:user.usuario, nome:user.nome, usuario:user.usuario, telefone:user.celular||'', celular:user.celular||'', email:'', uf:user.endereco&&user.endereco.uf||'', cidade:user.endereco&&user.endereco.cidade||'', endereco:user.endereco||{} })); } catch (err) { /* ignora */ }
      emitir('login:sucesso', { usuario: user.usuario, nome: user.nome });
      window.location.href = 'index.html';
    });
  });

  if (btnSair) {
    btnSair.addEventListener('click', function () {
      try { localStorage.removeItem(KEY_SESSAO); } catch (err) { /* ignora */ }
      aplicarSessao();
    });
  }
  // depois que o script.js terminar de carregar
  window.addEventListener('load', aplicarSessao);

  /* ---------- RECUPERAR LOGIN / SENHA ---------- */
  formRec.addEventListener('submit', function (e) {
    e.stopImmediatePropagation();
    e.preventDefault();
    var erro = $('#recErro'), ok = $('#recOk');
    erro.hidden = true; ok.hidden = true;
    var f = formRec.elements;

    if (!formRec.reportValidity()) { return; }
    var cel = digitos(f.celular.value);
    var lista = lerUsuarios();
    var user = lista.filter(function (x) {
      return norm(x.materno) === norm(f.materno.value) && x.nascimento === f.nascimento.value && x.celular === cel;
    })[0];

    if (!user) {
      erro.textContent = 'Não encontramos um cadastro com esses dados.';
      erro.hidden = false;
      return;
    }

    var nova = f.novaSenha.value;
    if (nova && nova.length < 6) {
      erro.textContent = 'A nova senha precisa ter no mínimo 6 caracteres.';
      erro.hidden = false;
      return;
    }

    function concluir(msgExtra) {
      ok.textContent = 'Seu usuário é: ' + user.usuario + (msgExtra || '');
      ok.hidden = false;
      formLogin.elements.usuario.value = user.usuario;
      f.novaSenha.value = '';
      emitir('recuperar:sucesso', { usuario: user.usuario });
    }

    if (!nova) { concluir(''); return; }
    hashSenha(user.usuario, nova).then(function (h) {
      user.senha = h;
      salvarUsuarios(lista);
      concluir('. Sua senha foi redefinida, já pode entrar.');
    });
  });


  /* ---------- MINHA CONTA ---------- */
  function carregarMinhaConta() {
    var sessao = '';
    try { sessao = localStorage.getItem(KEY_SESSAO) || ''; } catch (e) {}
    if (!sessao) return;
    var usuarioAtual = lerUsuarios().filter(function (u) { return u.usuario === sessao; })[0];
    if (!usuarioAtual) return;

    var painelAuth = $('#auth');
    var painelConta = $('#minhaConta');
    if (!painelAuth || !painelConta) return;
    painelAuth.hidden = true;
    painelConta.hidden = false;

    var end = usuarioAtual.endereco || {};
    var dados = [
      ['Nome completo', usuarioAtual.nome],
      ['Usuário', usuarioAtual.usuario],
      ['Data de nascimento', usuarioAtual.nascimento ? usuarioAtual.nascimento.split('-').reverse().join('/') : 'Não informado'],
      ['Gênero', usuarioAtual.genero || 'Não informado'],
      ['Celular', usuarioAtual.celular || 'Não informado'],
      ['CEP', end.cep || 'Não informado'],
      ['Endereço', [end.logradouro, end.numero, end.complemento].filter(Boolean).join(', ') || 'Não informado'],
      ['Bairro', end.bairro || 'Não informado'],
      ['Cidade/Estado', [end.cidade, end.uf].filter(Boolean).join(' / ') || 'Não informado']
    ];
    $('#dadosConta').innerHTML = dados.map(function (item) {
      return '<div class="account-data-item"><span>' + item[0] + '</span><strong>' + String(item[1]).replace(/[&<>"']/g, function (c) { return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }) + '</strong></div>';
    }).join('');

    var favoritos = [];
    var pets = [];
    try { favoritos = JSON.parse(localStorage.getItem('adotae_favs') || '[]'); } catch (e) {}
    try { pets = JSON.parse(localStorage.getItem('adotae_pets') || '[]'); } catch (e) {}
    var exemplos = {
      ex1:'Hulk', ex2:'Mia', ex3:'Bolt', ex4:'Manequinho',
      ex5:'Pipoca', ex6:'Fred', ex7:'Luna',
      ex8:'Procuro um cachorro de porte médio'
    };
    var todos = pets.concat(Object.keys(exemplos).map(function (id) { return {id:id,nome:exemplos[id]}; }));
    var escolhidos = favoritos.map(function (id) {
      return todos.filter(function (pet) { return String(pet.id) === String(id); })[0] || {id:id,nome:'Animal favoritado'};
    });
    var areaFav = $('#favoritosConta');
    areaFav.innerHTML = escolhidos.length ? escolhidos.map(function (pet) {
      var nome = String(pet.nome || 'Animal').replace(/[&<>"']/g, function (c) { return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; });
      return '<article class="account-favorite"><span class="account-paw" aria-hidden="true">🐾</span><strong>' + nome + '</strong></article>';
    }).join('') : '<p class="hint">Você ainda não favoritou nenhum animal. Explore os animais na página inicial e toque no coração para salvá-los aqui.</p>';

    $('#sairConta').addEventListener('click', function () {
      try {
        localStorage.removeItem(KEY_SESSAO);
        localStorage.removeItem('adotae_usuario');
        localStorage.removeItem('adotae_usuario');
        localStorage.removeItem('adotae_usuario');
      } catch (e) {}
      window.location.href = 'index.html';
    });
  }
  carregarMinhaConta();

  /* ---------- data de nascimento: não aceitar datas futuras ---------- */
  var hoje = new Date();
  var max = hoje.getFullYear() + '-' + ('0' + (hoje.getMonth() + 1)).slice(-2) + '-' + ('0' + hoje.getDate()).slice(-2);
  formCad.elements.nascimento.max = max;
  formRec.elements.nascimento.max = max;
})();
