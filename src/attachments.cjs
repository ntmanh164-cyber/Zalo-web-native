// Use an explicit PNG File so Zalo gets a name, MIME type and file bytes on
// both platforms rather than relying on macOS TIFF / native clipboard formats.
function pasteImageScript(base64,name) {
  return `(${pasteImage.toString()})(${JSON.stringify(base64)},${JSON.stringify(name)})`;
}
function pasteImage(base64,name) {
  const editor=[...document.querySelectorAll('#richInput, #chatInput [contenteditable="true"], #chat-input-content, [data-testid="chat-input"], [contenteditable="true"][role="textbox"]')].find(el=>el.isContentEditable && el.getClientRects().length && !el.closest('[role="dialog"]'));
  if(!editor)return {ok:false,reason:'editor'};
  const bytes=Uint8Array.from(atob(base64),char=>char.charCodeAt(0));
  const transfer=new DataTransfer();transfer.items.add(new File([bytes],name,{type:'image/png',lastModified:Date.now()}));
  editor.focus();
  const event=new ClipboardEvent('paste',{clipboardData:transfer,bubbles:true,cancelable:true,composed:true});
  editor.dispatchEvent(event);
  return {ok:event.defaultPrevented,reason:event.defaultPrevented?'accepted':'unhandled'};
}
module.exports={pasteImageScript};
