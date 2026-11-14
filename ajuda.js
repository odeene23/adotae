'use strict';
(() => {
 const $=s=>document.querySelector(s),KEY='adotae_localizacao_ajuda';
 const read=(k,d)=>{try{return JSON.parse(localStorage.getItem(k))??d;}catch{return d;}};
 const save=v=>{try{localStorage.setItem(KEY,JSON.stringify(v));return true;}catch{return false;}};
 let timer;function toast(msg){const el=$('#toast');el.textContent=msg;el.classList.add('show');clearTimeout(timer);timer=setTimeout(()=>el.classList.remove('show'),3500);}
 const user=read('adotae_usuario',null),saved=read(KEY,null),input=$('#locationInput');
 if(saved&&saved.texto)input.value=saved.texto;else if(user&&user.cidade)input.value=[user.cidade,user.uf].filter(Boolean).join(', ');
 function showResults(text){const location=text.trim();if(!location){toast('Informe uma localização para continuar.');input.focus();return;}save({texto:location,atualizadoEm:new Date().toISOString()});$('#searchedLocation').textContent='Localização pesquisada: '+location;
  const terms={castracao:'castração gratuita de cães e gatos',veterinarios:'veterinário clínica veterinária',emergencia:'hospital veterinário 24 horas emergência veterinária',ongs:'ONG proteção animal abrigo de animais'};
  Object.entries(terms).forEach(([key,term])=>{const link=document.querySelector('[data-map="'+key+'"]');link.href='https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(term+' perto de '+location);});
  $('#helpResults').hidden=false;$('#helpResults').scrollIntoView({behavior:'smooth',block:'start'});
 }
 $('#locationForm').addEventListener('submit',e=>{e.preventDefault();showResults(input.value);});
 $('#useLocation').addEventListener('click',()=>{if(!navigator.geolocation){toast('Seu navegador não oferece localização automática. Digite seu bairro ou cidade.');return;}$('#locationStatus').textContent='Obtendo sua localização…';
  navigator.geolocation.getCurrentPosition(pos=>{const coords=pos.coords.latitude.toFixed(5)+', '+pos.coords.longitude.toFixed(5);input.value=coords;$('#locationStatus').textContent='Localização obtida. Você pode pesquisar usando estas coordenadas.';showResults(coords);},()=>{$('#locationStatus').textContent='Não foi possível obter sua localização. Você pode digitá-la manualmente.';toast('Permita o acesso à localização ou digite seu bairro/cidade.');},{enableHighAccuracy:true,timeout:10000,maximumAge:300000});
 });
 if(input.value)showResults(input.value);
})();