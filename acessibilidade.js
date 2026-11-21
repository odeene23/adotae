(() => {
 const root=document.documentElement;
 const get=(k,d)=>{try{return JSON.parse(localStorage.getItem(k))??d}catch{return d}};
 let font=get('adotae_a11y_font',1);
 let theme=get('adotae_tema',window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');
 function apply(){
   root.style.fontSize=(font*100)+'%';
   root.dataset.theme=theme;
   const btn=tools.querySelector('[data-theme-toggle]');
   if(btn){btn.textContent=theme==='dark'?'☀️ Modo claro':'🌙 Modo escuro';btn.setAttribute('aria-label',theme==='dark'?'Ativar modo claro':'Ativar modo escuro');btn.setAttribute('aria-pressed',String(theme==='dark'));}
 }
 const tools=document.createElement('div');tools.className='a11y-page-tools';tools.setAttribute('role','group');tools.setAttribute('aria-label','Acessibilidade');
 tools.innerHTML='<button type="button" aria-label="Diminuir texto">A−</button><button type="button" aria-label="Texto padrão">A</button><button type="button" aria-label="Aumentar texto">A+</button><button type="button" data-theme-toggle>🌙 Modo escuro</button>';
 const hdr=document.querySelector('.auth-header');if(hdr)hdr.append(tools);
 tools.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;const i=[...tools.querySelectorAll('button')].indexOf(b);if(i===0)font=Math.max(.85,font-.1);if(i===1)font=1;if(i===2)font=Math.min(1.5,font+.1);if(b.hasAttribute('data-theme-toggle'))theme=theme==='dark'?'light':'dark';localStorage.setItem('adotae_a11y_font',JSON.stringify(font));localStorage.setItem('adotae_tema',JSON.stringify(theme));apply();});
 document.querySelectorAll('.nav-group').forEach(g=>{g.addEventListener('toggle',()=>{if(g.open)document.querySelectorAll('.nav-group').forEach(o=>{if(o!==g)o.open=false;});});});
 const fecharMenus=(alvo)=>document.querySelectorAll('.nav-group[open]').forEach(g=>{if(!g.contains(alvo))g.open=false;});
 document.addEventListener('pointerdown',e=>fecharMenus(e.target));
 document.addEventListener('keydown',e=>{if(e.key==='Escape')document.querySelectorAll('.nav-group[open]').forEach(g=>g.open=false);});
 apply();
})();