const {clipboard,ClipboardItem}=require('electron');
async function writeClipboardImage(image) {
  await clipboard.write([new ClipboardItem({'image/png':new Blob([new Uint8Array(image.toPNG())],{type:'image/png'})})]);
}
module.exports={writeClipboardImage};
