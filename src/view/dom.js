// Små hjälpare för att bygga DOM utan innerHTML.
const SVG_NS = 'http://www.w3.org/2000/svg';

function build(el, attrs, children) {
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else el.setAttribute(k, v === true ? '' : v);
  }
  el.append(...children.flat(Infinity).filter((c) => c != null && c !== false));
  return el;
}

/** HTML-element: h('p', { class: 'x' }, 'text', child) */
export const h = (tag, attrs, ...children) => build(document.createElement(tag), attrs, children);

/** SVG-element: s('rect', { x: 0, … }) */
export const s = (tag, attrs, ...children) => build(document.createElementNS(SVG_NS, tag), attrs, children);
