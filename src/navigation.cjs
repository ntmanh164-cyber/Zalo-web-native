// Commands are fixed by the bundled desktop UI; never accept a selector from a web page.
const selectors = Object.freeze({
  chat: '#main-tab [data-id="div_Main_TabMsg"]',
  contacts: '#main-tab .leftbar-tab[title="Danh bạ"]',
  saved: '#main-tab .leftbar-tab[title="My Documents"]',
  'zalo-settings': '#main-tab [data-id="div_Main_TabSetting"]',
  account: '#main-tab .nav__tabs__zalo .zavatar-container',
  cloud: '#main-tab [data-id="div_Main_Tab_zCloud"]',
  tools: '#main-tab [data-id="div_Main_TabTool"]'
});
function navigationScript(command) {
  if (!Object.hasOwn(selectors, command)) throw new Error('Điều hướng không hợp lệ');
  return `(() => { const element = document.querySelector(${JSON.stringify(selectors[command])}); if (!element) return false; element.click(); return true; })()`;
}
module.exports = {navigationScript};
