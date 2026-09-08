import katex from 'katex';
import 'katex/dist/katex.min.css';

document.querySelectorAll('.formula').forEach(function (el) {
  var tex = el.getAttribute('data-tex') || el.textContent;
  try {
    katex.render(tex, el, {
      displayMode: el.classList.contains('display'),
      throwOnError: false,
    });
  } catch (e) {
    el.innerHTML =
      '<span style="color:#f78166;font-size:.85em" title="' +
      tex.replace(/"/g, '&quot;') +
      '">&#x26A0; 公式渲染失败</span>';
  }
});
