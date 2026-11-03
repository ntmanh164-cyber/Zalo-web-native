// Isolated world: expose no native API to the remote page.
const { ipcRenderer } = require('electron');
window.addEventListener('click', event => {
  if (!event.isTrusted || event.button !== 0 || location.hostname !== 'chat.zalo.me') return;
  const anchor = event.composedPath().find(node => node?.tagName === 'A' && node.href);
  if (!anchor || anchor.hasAttribute('download')) return;
  let url; try { url = new URL(anchor.href); } catch { return; }
  if (!['https:', 'http:', 'mailto:'].includes(url.protocol)) return;
  if (url.origin === location.origin && !anchor.closest('#messageView, .message-view, .message-frame')) return;
  event.preventDefault(); event.stopImmediatePropagation();
  ipcRenderer.send('remote:open-link', url.href);
}, true);
