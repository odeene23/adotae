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
    // dentro do modal aberto usa o banner do dialog; fora dele usa o aviso global
    var alvo = auth.open ? $('#msgEvento') : $('#msgGlobal');
    if (!alvo) { return; }
    $('#msgEvento').hidden = true;
    $('#msgGlobal').hidden = true;
    alvo.textContent = texto;
    alvo.className = 'evento evento-' + tipo + (alvo.id === 'msgGlobal' ? ' evento-global' : '');
    alvo.hidden = false;
    clearTimeout(timerMsg);
    timerMsg = setTimeout(function () { alvo.hidden = true; }, 7000);
  }

  document.addEventListener('cadastro:sucesso', function () {
    mostrarMensagem('Cadastro realizado com sucesso!', 'ok');
  });
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
    $('#msgEvento').hidden = true;
  }

  $$('.tab', auth).forEach(function (t) {
    t.addEventListener('click', function () { mostrarPainel(t.getAttribute('data-tab')); });
  });
  $('#abrirRecuperar').addEventListener('click', function () { mostrarPainel('recuperar'); });
  $('#voltarLogin').addEventListener('click', function () { mostrarPainel('login'); });
  auth.addEventListener('close', function () {
    mostrarPainel('login');
    $('#recOk').hidden = true;
  });

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

    // alert pedido: usuário, nome e endereço
    if (!f.usuario.value.trim() || !f.nome.value.trim() || !f.endereco.value.trim()) {
      alert('Preencha usuário, nome e endereço.');
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
      formLogin.elements.senha.focus();
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
      if (auth.open) { auth.close(); }
      aplicarSessao();
      emitir('login:sucesso', { usuario: user.usuario, nome: user.nome });
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

  /* ---------- data de nascimento: não aceitar datas futuras ---------- */
  var hoje = new Date();
  var max = hoje.getFullYear() + '-' + ('0' + (hoje.getMonth() + 1)).slice(-2) + '-' + ('0' + hoje.getDate()).slice(-2);
  formCad.elements.nascimento.max = max;
  formRec.elements.nascimento.max = max;
})();
