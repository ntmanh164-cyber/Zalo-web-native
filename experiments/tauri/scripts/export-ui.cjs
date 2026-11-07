const fs=require('node:fs');const path=require('node:path');const root=path.resolve(__dirname,'../../..');const ui=path.resolve(__dirname,'../ui');
for(const name of ['header.html','footer.html','chrome.css','chrome.js','capture.html','capture.js','capture.css','preview.html','preview.js','preview.css']){
 let content=fs.readFileSync(path.join(root,'src/ui',name),'utf8');
 if(name.endsWith('.html'))content=content.replace("default-src 'self';","default-src 'self'; connect-src ipc: http://ipc.localhost;").replace('<script src=', '<script src="bridge.js"></script><script src=');
 if(name==='header.html')content=content.replace('<header class="chrome-header">','<header class="chrome-header" data-tauri-drag-region>');
 fs.writeFileSync(path.join(ui,name),content);
}
const {style,filterScript}=require(path.join(root,'src/zalo-style.cjs'));
const observer=fs.readFileSync(path.join(__dirname,'../remote-observer.js'),'utf8');
const themes={};for(const compact of [true,false])for(const hideBanners of [true,false])themes[`${compact}-${hideBanners}`]=style({compact,hideBanners});
fs.writeFileSync(path.join(ui,'zalo.js'),`(()=>{if(location.hostname!=='chat.zalo.me')return;const themes=${JSON.stringify(themes)};function mount(){const el=document.createElement('style');el.id='rust-telegram-style';document.documentElement.append(el);window.__rustApplyPrefs=p=>{el.textContent=themes[\`${"${p.compact}"}-${"${p.hide_banners}"}\`]||themes['true-true'];};window.__rustApplyPrefs({compact:true,hide_banners:true});${filterScript};${observer}}if(document.documentElement)mount();else document.addEventListener('DOMContentLoaded',mount,{once:true});})();`);
