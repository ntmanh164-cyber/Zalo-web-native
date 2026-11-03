const $ = id => document.getElementById(id);
let prefs;
function report(error) { $('loading').hidden=false; $('loading').textContent=error.message || error; }
async function invoke(action,payload) { try { return await window.desktop.invoke(action,payload); } catch(error) { report(error); } }
window.desktop.onState(data => {
  if ('settingsOpen' in data) { $('settings-panel').hidden=!data.settingsOpen; document.body.classList.toggle('settings-open',data.settingsOpen); }
  if ('loading' in data) $('loading').hidden=!data.loading;
  if (data.connected) { $('connection').classList.add('online'); $('connection').title='Đã kết nối Zalo'; $('status').textContent='Không gian trò chuyện của bạn'; }
  if (data.error) { $('connection').classList.remove('online'); $('status').textContent='Kết nối bị gián đoạn'; report(data.error); }
});
function closeSettings() { $('settings-panel').hidden=true; invoke('settings:close'); }
$('capture').onclick=()=>invoke('capture');
$('reload').onclick=()=>invoke('reload');
$('chats').onclick=closeSettings;
$('close-settings').onclick=closeSettings;
$('settings').onclick=async()=>{ $('settings-panel').hidden=false; await invoke('settings:open'); };
for (const key of ['compact','hideBanners']) $(key).onchange=async()=>{ prefs[key]=$(key).checked; await invoke('settings',prefs); };
document.addEventListener('keydown',event=>{if(event.key==='Escape')closeSettings();});
invoke('init').then(data=>{ if(!data)return; prefs=data.prefs; for(const key in prefs)$(key).checked=prefs[key]; if(data.platform!=='darwin'){document.body.classList.add('windows');$('shortcut').textContent='Ctrl Shift 5';}$('version').textContent=`Zalo Native ${data.version}`; });

for(const button of document.querySelectorAll('[data-zalo-nav]'))button.onclick=()=>invoke('navigation',button.dataset.zaloNav);
