/** 웹의 헤더·탭바를 숨김 (앱에서 자체 네비게이션 제공) */
export const HIDE_WEB_CHROME_JS = `
  (function() {
    var style = document.createElement('style');
    style.textContent = '[data-web-header] { display: none !important; } [data-web-footer] { display: none !important; } * { -webkit-user-select: none; user-select: none; -webkit-touch-callout: none; } input, textarea, [contenteditable] { -webkit-user-select: text; user-select: text; }';
    document.head.appendChild(style);
    var meta = document.querySelector('meta[name=viewport]');
    if (meta) meta.setAttribute('content', meta.getAttribute('content') + ', maximum-scale=1.0, user-scalable=no');
  })();
`;
