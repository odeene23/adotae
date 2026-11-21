(() => {
 const root=document.documentElement;
 const get=(k,d)=>{try{return JSON.parse(localStorage.getItem(k))??d}catch{return d}};
 let font=get('adotae_a11y_font',1), contrast=get('adotae_a11y_contrast',false);
 function apply(){root.style.fontSize=(font*100)+'%';root.classList.toggle('a11y-high-contrast',contrast);}
 const tools=document.createElement('div');tools.className='a11y-page-tools';tools.setAttribute('role','group');tools.setAttribute('aria-label','Acessibilidade');
 tools.innerHTML='<button type="button" aria-label="Diminuir texto">A−</button><button type="button" aria-label="Texto padrão">A</button><button type="button" aria-label="Aumentar texto">A+</button><button type="button" aria-pressed="'+contrast+'" aria-label="Alternar alto contraste">Contraste</button>';
 const hdr=document.querySelector('.auth-header');if(hdr)hdr.append(tools);
 tools.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;const i=[...tools.querySelectorAll('button')].indexOf(b);if(i===0)font=Math.max(.85,font-.1);if(i===1)font=1;if(i===2)font=Math.min(1.5,font+.1);if(i===3)contrast=!contrast;localStorage.setItem('adotae_a11y_font',JSON.stringify(font));localStorage.setItem('adotae_a11y_contrast',JSON.stringify(contrast));b.setAttribute('aria-pressed',String(contrast));apply();});
 document.querySelectorAll('.nav-group').forEach(g=>{g.addEventListener('toggle',()=>{if(g.open)document.querySelectorAll('.nav-group').forEach(o=>{if(o!==g)o.open=false;});});});
 document.addEventListener('click',e=>{document.querySelectorAll('.nav-group[open]').forEach(g=>{if(!g.contains(e.target))g.open=false;});});
 document.addEventListener('keydown',e=>{if(e.key==='Escape')document.querySelectorAll('.nav-group[open]').forEach(g=>g.open=false);});
 apply();
})();