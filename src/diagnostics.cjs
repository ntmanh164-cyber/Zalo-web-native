const fs = require('node:fs');
const path = require('node:path');
function attachDiagnostics(wc, app) {
  const file = path.join(app.getPath('userData'), 'login-diagnostics.jsonl');
  function route(raw) {
    try { const u = new URL(raw); return {origin:u.origin, route:u.pathname.replace(/[a-f0-9]{16,}|\d{6,}/gi, '[redacted]')}; }
    catch { return {origin:'invalid'}; }
  }
  function log(type, data={}) {
    try {
      if (fs.existsSync(file) && fs.statSync(file).size > 200000) fs.writeFileSync(file,'');
      fs.appendFileSync(file, JSON.stringify({at:new Date().toISOString(),type,...data})+'\n');
    } catch {}
  }
  log('launch',{version:app.getVersion(),chrome:process.versions.chrome});
  wc.on('did-navigate',(_event,url)=>log('navigate',route(url)));
  wc.on('did-frame-navigate',(_event,url,code,_status,main)=>log('frame',{...route(url),code,main}));
  wc.on('did-fail-load',(_event,code,_description,url,main)=>log('load-failed',{...route(url),code,main}));
  wc.on('will-navigate',(_event,url)=>log('navigation-attempt',route(url)));
  wc.on('will-redirect',(_event,url)=>log('redirect-attempt',route(url)));
  wc.on('render-process-gone',(_event,details)=>log('renderer-gone',{reason:details.reason}));
  // Never collect headers, cookie values, request bodies, response bodies or console text.
  wc.session.webRequest.onCompleted({urls:['https://*.zalo.me/*','https://*.zalo.vn/*']}, details=>{
    if (/\/account|\/auth|\/login|\/qr|trusted-device|session/i.test(new URL(details.url).pathname))
      log('request-completed',{...route(details.url),code:details.statusCode,kind:details.resourceType});
  });
  wc.session.webRequest.onErrorOccurred({urls:['https://*.zalo.me/*','https://*.zalo.vn/*','https://*.zdn.vn/*','https://*.zadn.vn/*']},details=>
    log('request-failed',{...route(details.url),error:details.error,kind:details.resourceType}));
  return {log,route,file};
}
module.exports={attachDiagnostics};
