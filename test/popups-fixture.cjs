const {app,BrowserWindow}=require('electron');
const {installPopups}=require('../src/popups.cjs');
app.whenReady().then(async()=>{
 const win=new BrowserWindow({show:false,webPreferences:{nodeIntegration:false,contextIsolation:true,sandbox:true}});
 const routed=[];app.popupResults={routed};
 installPopups(win.webContents,{openExternal:url=>routed.push(url),navigateTrusted:url=>routed.push(url)});
 await win.loadURL('data:text/html,<h1>Popup fixture</h1>');
 app.popupResults.direct=await win.webContents.executeJavaScript("!!window.open('https://example.com/direct')",true);
 app.popupResults.delayed=await win.webContents.executeJavaScript("(() => {const popup=window.open('about:blank');if(!popup)return false;setTimeout(()=>{popup.location.href='https://example.com/delayed'},100);return true;})()",true);
 app.popupResults.unsafe=await win.webContents.executeJavaScript("window.open('file:///etc/passwd')===null",true);
 app.popupResults.trusted=await win.webContents.executeJavaScript("!!window.open('https://id.zalo.me/account')",true);
});
