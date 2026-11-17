'use strict';
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const output=path.join(root,'dist','v4-beta1');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const sw=fs.readFileSync(path.join(root,'sw.js'),'utf8');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'manifest.webmanifest'),'utf8'));
// Refuse to package anything that could silently load the current production vault.
assert(html.includes("const KEY='mbp-encrypted-v4-beta1'"),'V4 beta vault isolation missing');
assert(!html.includes("const KEY='mbp-encrypted-v1'"),'Production vault key found');
assert(sw.includes("const CACHE='mon-budget-shell-v4-beta1-offline-1'"),'Unexpected service worker cache');
assert(!sw.includes("keys.filter(k=>k.startsWith('mon-budget-shell-')"),'Unsafe cache cleanup');
fs.mkdirSync(output,{recursive:true});
const previewHtml=html
 .replace('<title>Mon Budget Privé</title>','<title>Mon Budget Privé — V4 Bêta 1</title>')
 .replace('<meta name="apple-mobile-web-app-title" content="Mon Budget">','<meta name="apple-mobile-web-app-title" content="Budget V4 Test">')
 .replace('<meta name="theme-color" content="#0b1220">','<meta name="robots" content="noindex,nofollow"><meta name="theme-color" content="#0b1220">');
assert(previewHtml.includes('Budget V4 Test'),'Preview app label absent');
assert(previewHtml.includes('mbpV4BetaNotice'),'Beta warning absent');
fs.writeFileSync(path.join(output,'index.html'),previewHtml);
const previewManifest={
 ...manifest,
 name:'Mon Budget Privé — V4 Bêta 1 (essai)',
 short_name:'Budget V4 Test',
 id:'./',
 start_url:'./',
 scope:'./'
};
fs.writeFileSync(path.join(output,'manifest.webmanifest'),JSON.stringify(previewManifest,null,2)+'\n');
const previewWorker=sw
 .replace("const CACHE='mon-budget-shell-v4-beta1-offline-1'",
          "const CACHE='mon-budget-shell-v4-preview-beta1-offline-1'")
 .replace("k.startsWith('mon-budget-shell-v4-')",
          "k.startsWith('mon-budget-shell-v4-preview-')");
// A preview must never clean a separate V4 cache or resolve missing assets from
// any other app's cache on the same origin.
assert(previewWorker.includes("k.startsWith('mon-budget-shell-v4-preview-')"),'Preview cache cleanup not scoped');
assert(!previewWorker.includes("keys.filter(k=>k.startsWith('mon-budget-shell-v4-')"),'Preview cleanup could delete another V4 cache');
fs.writeFileSync(path.join(output,'sw.js'),previewWorker);
for(const file of ['icon-192.png','icon-512.png']){
 fs.copyFileSync(path.join(root,file),path.join(output,file));
}
console.log('V4_PREVIEW_BUILD_PASS '+JSON.stringify({output:'dist/v4-beta1',separateManifest:true,serviceWorkerSubpathScope:true,productionUnmodified:true}));
