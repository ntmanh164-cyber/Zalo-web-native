// Keep selectors explicit. Never hide generic dialogs or text inside messages.
function style(prefs) { return `
:root { --zn-font: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
body, input, textarea, button, select, [contenteditable] { font-family: var(--zn-font) !important; -webkit-font-smoothing: antialiased; }
::-webkit-scrollbar { width: 5px !important; height: 5px !important; }
::-webkit-scrollbar-track { background: transparent !important; }
::-webkit-scrollbar-thumb { background: transparent !important; border-radius: 9px !important; }
*:hover::-webkit-scrollbar-thumb, html.zn-scrolling ::-webkit-scrollbar-thumb { background: #8996a454 !important; }
/* Telegram layout. Keep Zalo's live controls in the DOM for native command routing. */
:root { --zn-surface: #f8fafc; --zn-panel: #ffffff; --zn-field: #edf1f6; --zn-line: #e6ecf2; --zn-chat: #eaf1f4; --zn-blue: #3194da; --zn-incoming: #ffffff; --zn-outgoing: #d9edff; --zn-ink: #25384c; }
#sidebarNav { box-sizing: border-box !important; position: relative !important; width: ${prefs.compact ? 316 : 356}px !important; min-width: ${prefs.compact ? 316 : 356}px !important; max-width: ${prefs.compact ? 316 : 356}px !important; flex: 0 0 ${prefs.compact ? 316 : 356}px !important; padding: 44px 0 64px !important; height: 100% !important; border-right: 1px solid var(--zn-line) !important; background: var(--zn-surface) !important; }
@media (max-width: 1000px) { #sidebarNav { width: 292px !important; min-width: 292px !important; max-width: 292px !important; flex-basis: 292px !important; } }
#sidebarNav > .flx-cell { min-width: 0 !important; min-height: 0 !important; width: 100% !important; background: var(--zn-surface) !important; }
#main-tab { position: absolute !important; top: 44px !important; bottom: 64px !important; left: 0 !important; width: 64px !important; height: auto !important; visibility: hidden !important; pointer-events: none !important; }
#contact-search { background: var(--zn-surface) !important; }
#contact-search .group-search, #contact-search-input { border-radius: 10px !important; background: var(--zn-field) !important; border: 0 !important; box-shadow: none !important; }
#contact-search-input { font-size: 13px !important; }
#conversationListId, #conversationList { background: var(--zn-surface) !important; }
#conversationList .conv-item { border-radius: 10px !important; box-shadow: none !important; }
#conversationList .conv-item.selected { background: #e5f1fc !important; }
#conversationList .conv-item:not(.selected):hover { background: #edf2f7 !important; }
#chatViewContainer > #header { background: var(--zn-panel) !important; border-bottom: 1px solid var(--zn-line) !important; box-shadow: none !important; }
html.zn-windows #chatViewContainer > #header { padding-right: 144px !important; }
#chatView, #messageView, .message-view__blur__overlay_noavatar { background: var(--zn-chat) !important; }
#messageViewContainer, #messageViewScroll { background-color: transparent !important; }
#chatView .message-frame.card { border-radius: 16px 16px 16px 5px !important; background: var(--zn-incoming) !important; border-color: transparent !important; box-shadow: 0 1px 2px #29476112 !important; }
#chatView .message-frame.card.me { border-radius: 16px 16px 5px 16px !important; background: var(--zn-outgoing) !important; }
#chatView .chatImageMessage--audit { border-radius: 14px !important; }
#chatInput, #chat-input { background: var(--zn-panel) !important; border-color: var(--zn-line) !important; }
#richInput { font-family: var(--zn-font) !important; -webkit-font-smoothing: antialiased; }
#chat-box-input-container-id.zn-composer { position: relative !important; padding: 12px 20px 16px !important; background: var(--zn-chat) !important; border: 0 !important; box-sizing: border-box !important; }
.zn-composer .zn-tools-host { display: contents !important; }
.zn-composer .chat-box-toolbar { display: flex !important; position: relative !important; inset: auto !important; flex-wrap: wrap !important; width: 100% !important; max-width: 100% !important; height: auto !important; min-height: 40px; padding: 4px 8px !important; margin: 0 0 6px !important; gap: 6px; border: 0 !important; border-bottom: 1px solid var(--zn-line) !important; border-radius: 10px !important; background: var(--zn-panel) !important; box-shadow: none; z-index: 5; box-sizing: border-box !important; }
.zn-composer .chat-box-toolbar-item { margin: 0 !important; }
.zn-composer #chatInput { position: relative !important; border: 1px solid var(--zn-line) !important; border-radius: 14px !important; box-shadow: 0 2px 10px #29476108; }
.zn-composer #chat-input-container-id { padding-left: 12px !important; }
.zn-list-top { position: absolute; right: 16px; bottom: 80px; z-index: 20; width: 40px; height: 40px; padding: 0; display: grid; place-items: center; border: 1px solid var(--zn-line); border-radius: 50%; color: var(--zn-ink); background: var(--zn-panel); box-shadow: 0 3px 16px #29476120; cursor: pointer; }
.zn-list-top[hidden] { display: none !important; }
.zn-list-top:hover { color: var(--zn-blue); background: var(--zn-field); }
.zn-list-top:focus-visible { outline: 2px solid var(--zn-blue); }
.zn-list-top svg { width: 21px; height: 21px; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
@media (prefers-color-scheme: dark) {
 :root { --zn-surface: #17212c; --zn-panel: #17212c; --zn-field: #243240; --zn-line: #273544; --zn-chat: #101c26; --zn-incoming: #223342; --zn-outgoing: #275272; --zn-ink: #e5edf6; }
 #conversationList .conv-item.selected { background: #263d52 !important; }
 #conversationList .conv-item:not(.selected):hover { background: #243240 !important; }
 #sidebarNav, #conversationList, #chatView .message-frame.card { color: var(--zn-ink) !important; }
}
${prefs.hideBanners ? `#chatOnboard { position: relative; display: flex !important; flex-direction: column; align-items: center; justify-content: center; gap: 14px; background: var(--zn-chat); }
#chatOnboard > .chat-onboard { display: none !important; }
#chatOnboard::before { content: 'Zalo Native'; color: #8196aa; font-family: var(--zn-font); font-size: 27px; font-weight: 600; letter-spacing: -1px; }
#chatOnboard::after { content: 'Chọn một cuộc trò chuyện để bắt đầu'; color: #a2b0bf; font-family: var(--zn-font); font-size: 13px; }
[data-zn-promo], #zalo-pc-banner, .zalo-pc-banner, .download-pc-banner, .download-app-banner, .zstyle-banner, .sticker-promotion-banner, [data-testid="download-pc-banner"], [data-testid="zstyle-banner"] { display: none !important; }` : ''}
`; }
function installFilter() {
  if (window.__znFilter) { window.__znFilter.scan(); return; }
  const selectors = '[class*="banner" i], [id*="banner" i], [class*="promotion" i], [data-testid*="upsell" i]';
  const promoText = /hãy tải ứng dụng zalo pc|tải zalo pc để|tải ứng dụng zalo pc để|nạp tiền zstyle|trải nghiệm tốt hơn.*zalo pc|zalo pc.*trải nghiệm tốt hơn/i;
  let timer, scrolling;
  function listScroller() {
    const sidebar=document.querySelector('#sidebarNav');
    const list=sidebar?.querySelector('#conversationList');
    if(!list || !list.getClientRects().length)return null;
    // Zalo may put the scroll owner on the virtual list or a wrapper above it.
    for(let el=list;el && el!==sidebar;el=el.parentElement) {
      if(el.scrollHeight>el.clientHeight+1 && /auto|scroll|overlay/.test(getComputedStyle(el).overflowY))return el;
    }
    return null;
  }
  function updateListTop() {
    const top=document.querySelector('#sidebarNav .zn-list-top');if(!top)return;
    const scroller=listScroller();top.hidden=!scroller || scroller.scrollTop<=80;
  }
  function scan() {
    // The control belongs to the chat list, never the message history.
    document.querySelectorAll('.zn-chat-top').forEach(el=>el.remove());
    const sidebar=document.querySelector('#sidebarNav');
    if(sidebar && !sidebar.querySelector('.zn-list-top')) {
      const top=document.createElement('button');top.type='button';top.className='zn-list-top';top.hidden=true;
      top.title='Về đầu danh sách chat';top.setAttribute('aria-label','Về đầu danh sách chat');
      top.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 15 7-7 7 7"/></svg>';
      top.addEventListener('click',()=>{const scroller=listScroller();if(scroller)scroller.scrollTo({top:0,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});});
      sidebar.append(top);
    }
    updateListTop();
    const container = document.getElementById('chat-box-input-container-id');
    const input = container?.querySelector('#chatInput');
    if(input && container.querySelector('.chat-box-toolbar')) {
      const toolbar=container.querySelector('.chat-box-toolbar');
      let toolsHost=toolbar;
      while(toolsHost.parentElement && toolsHost.parentElement!==container && !toolsHost.parentElement.contains(input))toolsHost=toolsHost.parentElement;
      if(toolsHost!==toolbar)toolsHost.classList.add('zn-tools-host');
      input.querySelector('.zn-attachments')?.remove();
      container.classList.add('zn-composer');
    }

    // Observed on the current Zalo login page: this promo has no class/id.
    document.querySelectorAll('.zcard-body a[href^="https://zalo.me/download/zalo-pc"]').forEach(link => {
      const block = link.parentElement?.parentElement;
      if (block && block.textContent.length < 1000 && /Nâng cao hiệu quả công việc với Zalo PC/i.test(block.textContent)) block.setAttribute('data-zn-promo', '');
    });
    document.querySelectorAll(selectors).forEach(el => {
      if (el.closest('[contenteditable], .message-content, .chat-message, .message-bubble, [data-message-id]')) return;
      if (el.childElementCount > 30 || el.textContent.length > 1600) return;
      const text = el.textContent.normalize('NFC');
      if (promoText.test(text) || /sticker|zstyle/i.test(el.className + ' ' + el.id)) el.setAttribute('data-zn-promo', '');
    });
  }
  const observer = new MutationObserver(() => { clearTimeout(timer); timer = setTimeout(scan, 120); });
  observer.observe(document.documentElement, {childList: true, subtree: true, characterData: true});
  window.addEventListener('resize',updateListTop);
  document.addEventListener('scroll', () => {
    updateListTop();
    document.documentElement.classList.add('zn-scrolling'); clearTimeout(scrolling);
    scrolling = setTimeout(() => document.documentElement.classList.remove('zn-scrolling'), 900);
  }, {capture:true, passive:true});
  window.__znFilter = {scan}; scan();
}
module.exports = { style, filterScript: `(${installFilter.toString()})()` };
