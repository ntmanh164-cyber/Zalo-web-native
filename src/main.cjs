const { app, BrowserWindow, WebContentsView, ipcMain, Menu, shell, dialog, desktopCapturer, screen, systemPreferences, Notification } = require('electron');
const path = require('node:path');
const fs = require('node:fs');
const { trusted, external, cropRect, permissionAllowed, browserUserAgent } = require('./policy.cjs');
const { focusEditorScript } = require('./attachments.cjs');
const { writeClipboardImage } = require('./image-clipboard.cjs');
const { installPopups } = require('./popups.cjs');
const { navigationScript } = require('./navigation.cjs');
const { attachDiagnostics } = require('./diagnostics.cjs');
const { style, filterScript } = require('./zalo-style.cjs');
let win, zalo, footerView, headerView, cssKey, prefs, captureBusy = false, preview, capturedImage;
let chromeReady=false, settingsOpen=false, chromePoll, selectedNavigation='chat', lastUnread;
const overlays = new Map();
const appIcon = path.join(__dirname, 'assets', 'icon.png');
const local = name => path.join(__dirname, 'ui', name);
const secure = { preload: path.join(__dirname, 'preload.cjs'), contextIsolation: true, nodeIntegration: false, sandbox: true };
function state(data) { for (const contents of [win?.webContents, footerView?.webContents, headerView?.webContents]) if (contents && !contents.isDestroyed()) contents.send('state',data); }
function readPrefs() {
  try { const p = JSON.parse(fs.readFileSync(path.join(app.getPath('userData'), 'preferences.json'), 'utf8')); return {compact:p.compact !== false,hideBanners:p.hideBanners !== false}; }
  catch { return {compact:true,hideBanners:true}; }
}
async function applyStyle() {
  if (!zalo || !trusted(zalo.webContents.getURL())) return;
  if (cssKey) await zalo.webContents.removeInsertedCSS(cssKey).catch(() => {});
  cssKey = await zalo.webContents.insertCSS(style(prefs));
  await zalo.webContents.executeJavaScript(`document.documentElement.classList.toggle('zn-windows', ${process.platform !== 'darwin'})`);
  layout();
  await zalo.webContents.executeJavaScript(filterScript).catch(() => {});
}
function sidebarWidth(width) { return width < 1000 ? 292 : prefs.compact ? 316 : 356; }
function layout() {
  if (!win || !zalo) return;
  const [w,h] = win.getContentSize(), width=sidebarWidth(w);
  zalo.setBounds({x:0,y:0,width:w,height:h});
  headerView?.setBounds({x:0,y:0,width,height:44});
  footerView?.setBounds({x:0,y:Math.max(44,h-64),width,height:64});
  headerView?.setVisible(chromeReady && !settingsOpen);
  footerView?.setVisible(chromeReady && !settingsOpen);
}
function showSettings(open) {
  if(settingsOpen===open)return;
  settingsOpen=open; zalo.setVisible(!open); layout(); state({settingsOpen:open});
}
async function navigate(command) {
  if (command === 'settings') { showSettings(true); return; }
  if (command === 'capture') { await capture(); return; }
  // Validate the command before evaluating any script in the remote renderer.
  const script = navigationScript(command);
  if (!chromeReady) throw new Error('Hãy đăng nhập Zalo trước khi sử dụng menu.');
  showSettings(false);
  if (!await zalo.webContents.executeJavaScript(script, true)) throw new Error('Zalo đã thay đổi menu. Hãy tải lại ứng dụng.');
  if (['chat','contacts','saved'].includes(command)) { selectedNavigation=command; state({navigation:command}); }
  zalo.webContents.focus();
}
function closeCapture() {
  const windows = [...overlays.values()]; overlays.clear(); captureBusy = false;
  for (const {window} of windows) if (!window.isDestroyed()) window.close();
  if (win && !win.isDestroyed()) { win.show(); win.focus(); }
}
async function capture() {
  if (captureBusy) return;
  captureBusy = true;
  try {
    if (process.platform === 'darwin' && systemPreferences.getMediaAccessStatus('screen') === 'denied') {
      throw new Error('Hãy bật quyền Ghi màn hình cho Zalo Native trong Cài đặt hệ thống → Quyền riêng tư & Bảo mật, rồi mở lại ứng dụng.');
    }
    // Hide every Zalo window, including a previous screenshot preview. Wait for
    // the compositor to present the desktop before asking for its thumbnail.
    for(const window of BrowserWindow.getAllWindows())if(!window.isDestroyed() && window.isVisible())window.hide();
    await new Promise(resolve => setTimeout(resolve, 750));
    if(win.isVisible() || (preview && !preview.isDestroyed() && preview.isVisible()))throw new Error('Không thể ẩn cửa sổ Zalo trước khi chụp. Hãy thử lại.');
    const displays = screen.getAllDisplays();
    const sources = await desktopCapturer.getSources({types:['screen'],thumbnailSize:{
      width:Math.max(...displays.map(d => Math.ceil(d.size.width*d.scaleFactor))),
      height:Math.max(...displays.map(d => Math.ceil(d.size.height*d.scaleFactor)))
    }});
    for (const display of displays) {
      const source = sources.find(s => s.display_id === String(display.id)) || (displays.length === 1 ? sources[0] : null);
      if (!source || source.thumbnail.isEmpty()) continue;
      const overlay = new BrowserWindow({...display.bounds,show:false,frame:false,transparent:false,resizable:false,movable:false,alwaysOnTop:true,skipTaskbar:true,enableLargerThanScreen:true,webPreferences:secure});
      overlays.set(overlay.webContents.id,{window:overlay,image:source.thumbnail,bounds:display.bounds});
      const overlayId = overlay.webContents.id;
      overlay.on('closed', () => { if (overlays.has(overlayId)) closeCapture(); });
      overlay.setBounds(display.bounds); overlay.setAlwaysOnTop(true,'screen-saver');
      await overlay.loadFile(local('capture.html')); overlay.show(); overlay.focus();
    }
    if (!overlays.size) throw new Error('Không thể đọc màn hình. Hãy cấp quyền Ghi màn hình rồi thử lại.');
  } catch (error) { closeCapture(); dialog.showErrorBox('Chưa chụp được màn hình', error.message); }
}
async function showPreview(image) {
  capturedImage = image;
  if (preview && !preview.isDestroyed()) preview.close();
  preview = new BrowserWindow({width:760,height:590,minWidth:480,minHeight:400,title:'Ảnh chụp màn hình',icon:appIcon,parent:win,backgroundColor:'#f5f7fa',webPreferences:secure});
  await preview.loadFile(local('preview.html'));
}
function openExternal(url) { if (external(url)) shell.openExternal(url).catch(() => {}); }
function createWindow() {
  win = new BrowserWindow({width:1280,height:820,minWidth:860,minHeight:600,title:'Zalo Native',icon:appIcon,backgroundColor:'#edf3f9',
    titleBarStyle:process.platform === 'darwin' ? 'hiddenInset' : 'hidden',
    trafficLightPosition:{x:13,y:17}, ...(process.platform !== 'darwin' ? {titleBarOverlay:{color:'#f6f8fc',symbolColor:'#50627b',height:42}} : {}),
    webPreferences:secure});
  win.loadFile(local('index.html'));
  zalo = new WebContentsView({webPreferences:{partition:'persist:zalo',preload:path.join(__dirname,'remote-preload.cjs'),contextIsolation:true,nodeIntegration:false,sandbox:true,spellcheck:true}});
  win.contentView.addChildView(zalo);
  headerView=new WebContentsView({webPreferences:secure});
  footerView=new WebContentsView({webPreferences:secure});
  win.contentView.addChildView(headerView);win.contentView.addChildView(footerView);
  headerView.webContents.loadFile(local('header.html'));footerView.webContents.loadFile(local('footer.html'));
  layout();
  const wc = zalo.webContents;
  const diagnostic = attachDiagnostics(wc, app);
  wc.setUserAgent(browserUserAgent(process.versions.chrome, process.platform));
  installPopups(wc,{openExternal,navigateTrusted:url=>wc.loadURL(url).catch(()=>{})});
  wc.on('will-navigate',(event,url) => { if (!trusted(url)) { event.preventDefault(); openExternal(url); } });
  wc.on('will-redirect',(event,url) => { if (!trusted(url)) event.preventDefault(); });
  wc.session.setPermissionRequestHandler((contents, permission, callback, details) => {
    const allowed = permissionAllowed(permission, details.requestingUrl || contents.getURL(), contents.getURL());
    diagnostic.log('permission-request', {permission, allowed, ...diagnostic.route(details.requestingUrl || contents.getURL())});
    callback(allowed);
  });
  wc.session.setPermissionCheckHandler((contents, permission, origin, details) => {
    const allowed = permissionAllowed(permission, details.requestingUrl || origin, contents?.getURL(), details.embeddingOrigin);
    diagnostic.log('permission-check', {permission, allowed, ...diagnostic.route(details.requestingUrl || origin)});
    return allowed;
  });
  wc.on('did-start-navigation',(_event,_url,inPlace,main)=>{if(main&&!inPlace){chromeReady=false;layout();}});
  wc.on('did-start-loading',() => state({loading:true}));
  chromePoll=setInterval(async()=>{
    if(wc.isDestroyed() || !win || settingsOpen) return;
    try {
      if(new URL(wc.getURL()).hostname!=='chat.zalo.me')return;
      const status=await wc.executeJavaScript(`(() => {const nav=document.querySelector('#main-tab');return {ready:!!nav && !!document.querySelector('#sidebarNav'),contacts:!!nav?.querySelector('.leftbar-tab.selected[title="Danh bạ"]'),saved:!!document.querySelector('#header .threadChat__title')?.textContent.includes('My Documents'),unread:!!nav?.querySelector('.leftbar-unread-badge')};})()`);
      if(chromeReady!==status.ready){chromeReady=status.ready;layout();}
      const navigation=status.contacts?'contacts':status.saved?'saved':'chat';
      if(navigation!==selectedNavigation || lastUnread!==status.unread){selectedNavigation=navigation;lastUnread=status.unread;state({navigation,unread:status.unread});}
    } catch {}
  },900);
  wc.on('did-finish-load',async () => {
    if (process.argv.includes('--inspect-layout') && !wc.layoutInspector) {
      wc.layoutInspector = setInterval(async () => {
        if (wc.isDestroyed()) { clearInterval(wc.layoutInspector); return; }
        if (new URL(wc.getURL()).hostname !== 'chat.zalo.me') return;
        const geometry = await wc.executeJavaScript(`Array.from(document.querySelectorAll('body *')).map(e=>{const r=e.getBoundingClientRect();return {tag:e.tagName,id:e.id,classes:typeof e.className==='string'?e.className:'',nav:!!e.closest('#main-tab'),title:e.closest('#main-tab')?e.getAttribute('title'):null,dataId:e.getAttribute('data-id'),testId:e.getAttribute('data-testid'),role:e.getAttribute('role'),x:Math.round(r.x),y:Math.round(r.y),w:Math.round(r.width),h:Math.round(r.height)}}).filter(e=>e.nav || /input|compose|toolbar|editable/i.test(e.id+' '+e.classes) || (e.w>60 && e.h>30 && e.y+e.h>0 && e.y<innerHeight && (e.id || /message|bubble|chat|conv-item|search/i.test(e.classes)))).slice(0,220)`);
        await fs.promises.writeFile(path.join(app.getPath('userData'),'layout-geometry.json'),JSON.stringify(geometry,null,2));
      }, 5000);
    }
 await applyStyle().catch(() => {}); state({loading:false,connected:true}); });
  wc.on('did-fail-load',(_e,code,description,_url,isMainFrame) => { if (isMainFrame && code !== -3) state({loading:false,error:description}); });
  wc.on('render-process-gone',() => state({error:'Zalo đã dừng phản hồi. Bấm Tải lại để kết nối lại.'}));
  wc.loadURL(process.argv.includes('--resume-login')
    ? 'https://id.zalo.me/account/checksession?continue=https%3A%2F%2Fchat.zalo.me%2F'
    : 'https://chat.zalo.me/');
  win.on('resize',layout);
  win.on('closed',() => { clearInterval(chromePoll); clearInterval(wc.layoutInspector); for(const view of [headerView,footerView])if(view&&!view.webContents.isDestroyed())view.webContents.close();headerView=null;footerView=null;chromeReady=false;settingsOpen=false; for (const {window} of overlays.values()) window.destroy(); overlays.clear(); captureBusy=false; if (!wc.isDestroyed()) wc.close(); zalo=null; win=null; });
  const shortcut = process.platform === 'darwin' ? '⌘ ⇧ 5' : 'Ctrl Shift 5';
  const menu = [
    ...(process.platform === 'darwin' ? [{label:app.name,submenu:[{role:'about'},{type:'separator'},{role:'hide'},{role:'hideOthers'},{role:'unhide'},{type:'separator'},{role:'quit'}]}] : []),
    {label:'Chỉnh sửa',submenu:[{role:'undo'},{role:'redo'},{type:'separator'},{role:'cut'},{role:'copy'},{role:'paste'},{role:'selectAll'}]},
    {label:'Zalo',submenu:[{label:`Chụp màn hình (${shortcut})`,accelerator:'CommandOrControl+Shift+5',click:capture},{label:'Thử thông báo',click:()=>{if(Notification.isSupported()){const notification=new Notification({title:'Zalo Native',body:'Thông báo tin nhắn đã sẵn sàng.',icon:appIcon});notification.on('click',()=>{win.show();win.focus();});notification.show();}}},{label:'Tải lại',accelerator:'CommandOrControl+R',click:()=>wc.reload()},{role:'togglefullscreen'},{type:'separator'},{label:'Phóng to',accelerator:'CommandOrControl+Plus',click:()=>wc.setZoomLevel(Math.min(3,wc.getZoomLevel()+0.5))},{label:'Thu nhỏ',accelerator:'CommandOrControl+-',click:()=>wc.setZoomLevel(Math.max(-2,wc.getZoomLevel()-0.5))},{label:'Cỡ mặc định',accelerator:'CommandOrControl+0',click:()=>wc.setZoomLevel(0)}]},
    {label:'Cửa sổ',submenu:[{role:'minimize'},{role:'close'}]}
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(menu));
}
ipcMain.on('remote:open-link', (event, url) => {
  if (event.sender !== zalo?.webContents || event.senderFrame !== zalo.webContents.mainFrame || !trusted(event.sender.getURL()) || typeof url !== 'string' || url.length > 16384) return;
  openExternal(url);
});
ipcMain.handle('desktop',async (event,action,payload) => {
  // Only bundled UI may invoke native APIs; the Zalo view has no preload bridge.
  const overlay = overlays.get(event.sender.id);
  const fromShell = win && event.sender === win.webContents;
  const fromChrome = [headerView?.webContents,footerView?.webContents].includes(event.sender);
  const fromPreview = preview && !preview.isDestroyed() && event.sender === preview.webContents;
  if (overlay) {
    if (action === 'capture:source') return overlay.image.toDataURL();
    if (action === 'capture:cancel') { closeCapture(); return; }
    if (action === 'capture:crop') {
      const image = overlay.image.crop(cropRect(payload,overlay.bounds,overlay.image.getSize()));
      closeCapture(); await showPreview(image); return;
    }
    throw new Error('Unknown capture action');
  }
  if (fromPreview) {
    if (!capturedImage) return;
    if (action === 'preview:image') return capturedImage.toDataURL();
    if (action === 'preview:copy') { await writeClipboardImage(capturedImage); return true; }
    if (action === 'preview:save') {
      const result = await dialog.showSaveDialog(preview,{defaultPath:`Zalo-${Date.now()}.png`,filters:[{name:'PNG',extensions:['png']}]});
      if (!result.canceled && result.filePath) { await fs.promises.writeFile(result.filePath,capturedImage.toPNG()); return true; } return false;
    }
    if (action === 'preview:paste') {
      if(!zalo || !trusted(zalo.webContents.getURL()))throw new Error('Hãy mở cuộc trò chuyện trước khi đính kèm ảnh.');
      showSettings(false);win.show();win.focus();zalo.webContents.focus();
      const found=await zalo.webContents.executeJavaScript(focusEditorScript,true);
      if(!found){preview.show();preview.focus();throw new Error('Hãy mở một cuộc trò chuyện rồi thử đính kèm lại. Ảnh vẫn còn trong cửa sổ xem trước.');}
      await writeClipboardImage(capturedImage);
      zalo.webContents.focus();zalo.webContents.paste();
      preview.close();return true;
    }
    throw new Error('Unknown preview action');
  }
  if(fromChrome){
    if(action==='init')return {platform:process.platform,version:app.getVersion()};
    if(action==='navigation'){await navigate(payload);return;}
    throw new Error('Untrusted chrome action');
  }
  if (!fromShell) throw new Error('Untrusted sender');
  if (action === 'navigation') { await navigate(payload);return; }
  if (action === 'settings:open') { showSettings(true); return; }
  if (action === 'settings:close') { showSettings(false); return; }
  if (action === 'init') return {prefs,platform:process.platform,version:app.getVersion()};
  if (action === 'reload') { zalo.webContents.reload(); return; }
  if (action === 'capture') { await capture(); return; }
  if (action === 'settings') {
    if (!payload || typeof payload.compact !== 'boolean' || typeof payload.hideBanners !== 'boolean') throw new Error('Invalid settings');
    prefs={compact:payload.compact,hideBanners:payload.hideBanners};
    await fs.promises.writeFile(path.join(app.getPath('userData'),'preferences.json'),JSON.stringify(prefs)); await applyStyle(); return prefs;
  }
  throw new Error('Unknown action');
});
if (process.env.ZN_TEST_PROFILE) app.setPath('userData',process.env.ZN_TEST_PROFILE);
app.setName('Zalo Native');
if(process.platform === 'win32') app.setAppUserModelId('me.zalonative.desktop');
if (!app.requestSingleInstanceLock()) app.quit();
else {
  app.on('second-instance',() => { if (win) {win.show();win.focus();} });
  app.whenReady().then(() => { if(process.platform==='darwin')app.dock.setIcon(appIcon); prefs=readPrefs(); createWindow(); });
  app.on('activate',() => { if (!win) createWindow(); });
  app.on('window-all-closed',() => { if (process.platform !== 'darwin') app.quit(); });
}
