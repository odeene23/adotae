'use strict';
(() => {
 const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
 const form=$('#anuncioForm'), toastEl=$('#toast'); let timer;
 const toast=m=>{toastEl.textContent=m;toastEl.classList.add('show');clearTimeout(timer);timer=setTimeout(()=>toastEl.classList.remove('show'),4000);};
 const read=(k,d)=>{try{return JSON.parse(localStorage.getItem('adotae_'+k))??d;}catch{return d;}};
 const save=(k,v)=>{try{localStorage.setItem('adotae_'+k,JSON.stringify(v));return true;}catch{toast('Não foi possível salvar. Tente uma foto menor.');return false;}};
 const user=read('usuario',null), session=localStorage.getItem('adotae_sessao');
 if(!user||!session){alert('Entre na sua conta para publicar um anúncio.');location.replace('acesso.html');return;}
 const digits=v=>String(v||'').replace(/\D/g,'');
 const letters=v=>String(v||'').replace(/[^A-Za-zÀ-ÖØ-öø-ÿ\s'-]/g,'');
 const tel=$('[name="telefone"]'); tel.value=user.telefone||user.celular||'';
 tel.addEventListener('input',()=>{let d=digits(tel.value).slice(0,11);if(d.length>6)d=d.replace(/^(\d{2})(\d{4,5})(\d{0,4}).*/,'($1) $2-$3');else if(d.length>2)d=d.replace(/^(\d{2})(\d{0,5})/,'($1) $2');else if(d.length)d='('+d;tel.value=d.replace(/-$/,'');});
 const email=$('[name="email"]');email.value=user.email||'';
 document.addEventListener('input',e=>{if(e.target.matches('[data-letters-only]'))e.target.value=letters(e.target.value);});
 function mode(m){$$('[data-doacao]',form).forEach(el=>el.textContent=el.dataset[m]);$('#anuncioDica').textContent=m==='doacao'?'Preencha os dados do animal que você quer doar. Todos os campos marcados são obrigatórios.':'Conte qual animal você procura para que os doadores encontrem você.';}
 $$('input[name="tipo"]').forEach(r=>r.addEventListener('change',()=>mode(r.value)));mode(form.tipo.value||'doacao');
 $('#defSelect').addEventListener('change',e=>{const on=e.target.value==='sim';$('#defDetalheBox').hidden=!on;$('#defDetalhe').required=on;});
 function photo(file){return new Promise((resolve,reject)=>{const img=new Image(),url=URL.createObjectURL(file);img.onload=()=>{const scale=Math.min(1,700/Math.max(img.width,img.height)),c=document.createElement('canvas');c.width=Math.round(img.width*scale);c.height=Math.round(img.height*scale);c.getContext('2d').drawImage(img,0,0,c.width,c.height);URL.revokeObjectURL(url);resolve(c.toDataURL('image/jpeg',.72));};img.onerror=reject;img.src=url;});}
 form.addEventListener('submit',async e=>{
  e.preventDefault();const d=Object.fromEntries(new FormData(form)),err=$('#anErro');err.hidden=true;const missing=[];
  if(!letters(d.nome).trim())missing.push('nome do animal/título');if(!d.especie)missing.push('espécie');if(!letters(d.raca).trim())missing.push('raça');if(!d.idadeNum||Number(d.idadeNum)<0)missing.push('idade');if(!d.sexo||!d.vacina||!d.deficiencia||!d.porte)missing.push('características do animal');if(d.deficiencia==='sim'&&!letters(d.deficienciaDetalhe).trim())missing.push('detalhe da deficiência');if(!d.uf||!letters(d.cidade).trim())missing.push('estado e cidade');if(!d.descricao.trim())missing.push('descrição');if(![10,11].includes(digits(d.telefone).length))missing.push('telefone com DDD');if(!/^\S+@\S+\\.\S+$/.test(d.email))missing.push('e-mail válido');
  if(missing.length){err.textContent='Confira os campos: '+missing.join(', ')+'.';err.hidden=false;return;}
  let foto='';if(d.foto&&d.foto.size){try{foto=await photo(d.foto);}catch{toast('Não foi possível carregar a foto.');}}
  const pet={id:'p'+Date.now(),donoId:user.id||user.usuario,tipo:d.tipo,nome:letters(d.nome).trim(),especie:d.especie,raca:letters(d.raca).trim(),idadeMeses:Number(d.idadeNum)*(d.idadeUn==='anos'?12:1),sexo:d.sexo,porte:d.porte,vacina:d.vacina,deficiencia:d.deficiencia,deficienciaDetalhe:d.deficiencia==='sim'?letters(d.deficienciaDetalhe).trim():'',descricao:d.descricao.trim(),uf:d.uf,cidade:letters(d.cidade).trim(),contato:{nome:user.nome,telefone:d.telefone,email:d.email.trim()},foto};
  const pets=read('pets',[]);pets.unshift(pet);if(!save('pets',pets))return;form.reset();$('#defDetalheBox').hidden=true;toast('Anúncio salvo no navegador!');setTimeout(()=>location.href='index.html#animais',1200);
 });
})();