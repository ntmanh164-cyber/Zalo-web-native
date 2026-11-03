const {trusted,external}=require('./policy.cjs');
// Zalo checks the WindowProxy returned by window.open(), then may assign its URL
// asynchronously. Keep a hidden, sandboxed placeholder until that assignment.
function installPopups(contents,{openExternal,navigateTrusted}) {
  contents.setWindowOpenHandler(({url})=>{
    if(url!=='about:blank' && !external(url) && !trusted(url))return {action:'deny'};
    return {action:'allow',overrideBrowserWindowOptions:{show:false,focusable:false,skipTaskbar:true,webPreferences:{nodeIntegration:false,contextIsolation:true,sandbox:true}}};
  });
  contents.on('did-create-window',(child,details)=>{
    const wc=child.webContents;let handled=false;
    const close=()=>{if(!child.isDestroyed())child.destroy();};
    const timer=setTimeout(close,60000);timer.unref();child.once('closed',()=>clearTimeout(timer));
    wc.setWindowOpenHandler(()=>({action:'deny'}));
    function route(url) {
      if(url==='about:blank')return;
      if(handled)return;handled=true;

      if(trusted(url))navigateTrusted(url);
      else if(external(url))openExternal(url);
      // Defer destruction so the caller receives a non-null WindowProxy.
      setImmediate(close);
    }
    wc.on('will-navigate',(event,url)=>{if(url!=='about:blank'){event.preventDefault();route(url);}});
    wc.on('will-redirect',(event,url)=>{event.preventDefault();route(url);});
    if(details.url!=='about:blank')setImmediate(()=>{if(!wc.isDestroyed()){wc.stop();route(details.url);}});
  });
}
module.exports={installPopups};
