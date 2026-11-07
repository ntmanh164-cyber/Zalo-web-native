let toastTimer;
window.desktop.invoke('init').then(data=>{if(data.platform!=='darwin')document.body.classList.add('windows');});
function showError(error){const status=document.querySelector('.status');if(!status)return;status.textContent=error.message||error;status.hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>status.hidden=true,4000);}
for(const button of document.querySelectorAll('[data-nav]'))button.onclick=async()=>{
 try {await window.desktop.invoke('navigation',button.dataset.nav);}catch(error){showError(error);}
};
window.desktop.onState(data=>{
 if(data.navigation)for(const button of document.querySelectorAll('[data-nav]'))button.setAttribute('aria-selected',button.dataset.nav===data.navigation);
 if('unread' in data)document.querySelector('[data-nav="chat"]')?.classList.toggle('has-unread',data.unread);
});

window.desktop.onState(data=>{if(data.navigation){const title=document.querySelector('.chrome-title');if(title)title.textContent=data.navigation==='contacts'?'Danh bạ':'Tin nhắn';}});
