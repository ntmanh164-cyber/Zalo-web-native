const trustedHosts = new Set(['chat.zalo.me', 'id.zalo.me', 'id.zalo.vn']);
function trusted(url) { try { const u = new URL(url); return u.protocol === 'https:' && (trustedHosts.has(u.hostname) || (u.hostname === 'jr.zaloapp.com' && u.pathname === '/jr/syncsession') || (u.hostname === 'jr.chat.zalo.me' && u.pathname === '/jr/pushsession')); } catch { return false; } }
function external(url) { try { return ['https:', 'http:', 'mailto:'].includes(new URL(url).protocol); } catch { return false; } }
function cropRect(rect, bounds, imageSize) {
  if (!rect || !['x','y','width','height'].every(k => Number.isFinite(rect[k]))) throw new Error('Vùng chụp không hợp lệ');
  const sx = imageSize.width / bounds.width, sy = imageSize.height / bounds.height;
  const x = Math.max(0, Math.min(imageSize.width - 1, Math.round(rect.x * sx)));
  const y = Math.max(0, Math.min(imageSize.height - 1, Math.round(rect.y * sy)));
  const width = Math.min(imageSize.width - x, Math.round(rect.width * sx));
  const height = Math.min(imageSize.height - y, Math.round(rect.height * sy));
  if (width < 2 || height < 2) throw new Error('Vùng chụp quá nhỏ');
  return { x, y, width, height };
}
module.exports = { trusted, external, cropRect };

function permissionAllowed(permission, requestingUrl, topUrl, embeddingOrigin) {
  if (!trusted(requestingUrl)) return false;
  if (['storage-access', 'top-level-storage-access'].includes(permission)) {
    return trusted(topUrl) && (!embeddingOrigin || trusted(embeddingOrigin));
  }
  return ['notifications', 'media', 'fullscreen', 'persistent-storage'].includes(permission);
}
function browserUserAgent(chromeVersion, platform) {
  const os = platform === 'win32' ? 'Windows NT 10.0; Win64; x64' : platform === 'darwin' ? 'Macintosh; Intel Mac OS X 10_15_7' : 'X11; Linux x86_64';
  return `Mozilla/5.0 (${os}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${chromeVersion} Safari/537.36`;
}
module.exports.permissionAllowed = permissionAllowed;
module.exports.browserUserAgent = browserUserAgent;
