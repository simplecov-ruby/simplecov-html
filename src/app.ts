import hljs from 'highlight.js/lib/core';
import ruby from 'highlight.js/lib/languages/ruby';

hljs.registerLanguage('ruby', ruby);


// --- Utility helpers ------------------------------------------

function $(sel: string, ctx?: Element | Document): Element | null {
  return (ctx || document).querySelector(sel);
}

function $$(sel: string, ctx?: Element | Document): Element[] {
  return Array.from((ctx || document).querySelectorAll(sel));
}

function on(
  target: EventTarget,
  event: string,
  selectorOrFn: string | ((e: Event) => void),
  fn?: (this: Element, e: Event) => void
): void {
  if (typeof selectorOrFn === 'function') {
    target.addEventListener(event, selectorOrFn);
  } else {
    target.addEventListener(event, function (e: Event) {
      const el = (e.target as Element).closest(selectorOrFn);
      if (el && (target as Element).contains(el) && fn) {
        fn.call(el, e);
      }
    });
  }
}

// --- Timeago --------------------------------------------------

function timeago(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  const intervals: [number, string][] = [
    [31536000, 'year'], [2592000, 'month'], [86400, 'day'],
    [3600, 'hour'], [60, 'minute'], [1, 'second']
  ];
  for (const [secs, label] of intervals) {
    const count = Math.floor(seconds / secs);
    if (count >= 1) {
      return count === 1 ? `about 1 ${label} ago` : `${count} ${label}s ago`;
    }
  }
  return 'just now';
}

// --- Coverage helpers -----------------------------------------

function pctClass(pct: number): string {
  if (pct >= 90) return 'green';
  if (pct >= 75) return 'yellow';
  return 'red';
}

function fmtNum(n: number): string {
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function updateCoverageCells(
  container: Element,
  prefix: string,
  covered: number,
  total: number
): void {
  const barEl = $(prefix + '-bar', container);
  const pctEl = $(prefix + '-pct', container);
  const numEl = $(prefix + '-num', container);
  const denEl = $(prefix + '-den', container);
  if (total === 0) {
    if (barEl) barEl.innerHTML = '';
    if (pctEl) { pctEl.textContent = ''; pctEl.className = pctEl.className.replace(/green|yellow|red/g, '').trim(); }
    if (numEl) numEl.textContent = '';
    if (denEl) denEl.textContent = '';
    return;
  }
  const p = (covered * 100.0) / total;
  const cls = pctClass(p);
  if (barEl) barEl.innerHTML = '<div class="coverage-bar"><div class="coverage-bar__fill coverage-bar__fill--' + cls + '" style="width: ' + p.toFixed(1) + '%"></div></div>';
  if (pctEl) { pctEl.textContent = p.toFixed(2) + '%'; pctEl.className = pctEl.className.replace(/green|yellow|red/g, '').trim() + ' ' + cls; }
  if (numEl) numEl.textContent = fmtNum(covered) + '/';
  if (denEl) denEl.textContent = fmtNum(total);
}

// --- Sort state -----------------------------------------------

interface SortEntry {
  colIndex: number;
  direction: 'asc' | 'desc';
}

const sortState: Record<string, SortEntry> = {};

function getVisibleChild(row: Element, index: number): Element | null {
  let count = 0;
  for (let i = 0; i < row.children.length; i++) {
    if ((row.children[i] as HTMLElement).style.display === 'none') continue;
    if (count === index) return row.children[i];
    count++;
  }
  return null;
}

function getSortValue(td: Element | null): number | string {
  if (!td) return '';
  const order = td.getAttribute('data-order');
  if (order !== null) return parseFloat(order);
  const text = (td.textContent || '').trim();
  const num = parseFloat(text);
  return isNaN(num) ? text.toLowerCase() : num;
}

function sortTable(table: Element, colIndex: number): void {
  const tableId = table.id || table.getAttribute('data-sort-id') || 'default';
  const state = sortState[tableId] || {} as SortEntry;

  const dir: 'asc' | 'desc' =
    state.colIndex === colIndex && state.direction === 'asc' ? 'desc' : 'asc';
  sortState[tableId] = { colIndex, direction: dir };

  const tbody = table.querySelector('tbody')!;
  const rows = Array.from(tbody.querySelectorAll('tr.t-file'));

  rows.sort((a, b) => {
    const aVal = getSortValue(getVisibleChild(a, colIndex));
    const bVal = getSortValue(getVisibleChild(b, colIndex));
    let cmp: number;
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      cmp = aVal - bVal;
    } else {
      cmp = String(aVal).localeCompare(String(bVal));
    }
    return dir === 'asc' ? cmp : -cmp;
  });

  rows.forEach(row => tbody.appendChild(row));

  // Update sort indicators
  let tdPos = 0;
  $$('thead tr:first-child th', table).forEach((th) => {
    const span = parseInt(th.getAttribute('colspan') || '1', 10);
    th.classList.remove('sorting_asc', 'sorting_desc', 'sorting');
    // colIndex falls within this th if it's >= tdPos and < tdPos + span
    const isActive = colIndex >= tdPos && colIndex < tdPos + span;
    th.classList.add(isActive ? (dir === 'asc' ? 'sorting_asc' : 'sorting_desc') : 'sorting');
    tdPos += span;
  });
}

// --- Column filter types --------------------------------------

interface DataAttrPair {
  covered: string;
  total: string;
}

interface ActiveFilter {
  attrs: DataAttrPair;
  op: string;
  threshold: number;
}

const dataAttrMap: Record<string, DataAttrPair> = {
  line:   { covered: 'coveredLines',   total: 'relevantLines' },
  branch: { covered: 'coveredBranches', total: 'totalBranches' },
  method: { covered: 'coveredMethods',  total: 'totalMethods' }
};

function compare(op: string, value: number, threshold: number): boolean {
  if (op === 'gt')  return value > threshold;
  if (op === 'gte') return value >= threshold;
  if (op === 'eq')  return value === threshold;
  if (op === 'lte') return value <= threshold;
  if (op === 'lt')  return value < threshold;
  return true;
}

// --- Filter & totals ------------------------------------------

function filterTable(container: Element): void {
  const table = $('table.file_list', container) as HTMLTableElement | null;
  if (!table) return;

  const nameInput = $('.col-filter--name', container) as HTMLInputElement | null;
  const nameQuery = nameInput ? nameInput.value : '';

  const filters: ActiveFilter[] = $$('.col-filter__value', container)
    .map((input: Element) => {
      const inp = input as HTMLInputElement;
      if (!inp.value) return null;
      const threshold = parseFloat(inp.value);
      if (isNaN(threshold)) return null;
      const type = inp.dataset.type || '';
      const opSelect = $(".col-filter__op[data-type=\"" + type + "\"]", container) as HTMLSelectElement | null;
      const op = opSelect ? opSelect.value : '';
      if (!op) return null;
      const attrs = dataAttrMap[type];
      if (!attrs) return null;
      return { attrs, op, threshold } as ActiveFilter;
    })
    .filter((f): f is ActiveFilter => f !== null);

  $$('tbody tr.t-file', table).forEach(row => {
    const htmlRow = row as HTMLElement;
    let visible = true;

    if (nameQuery) {
      const name = (row.children[0].textContent || '').toLowerCase();
      if (name.indexOf(nameQuery.toLowerCase()) === -1) visible = false;
    }

    if (visible) {
      for (const f of filters) {
        const covered = parseInt(htmlRow.dataset[f.attrs.covered] || '0', 10) || 0;
        const total = parseInt(htmlRow.dataset[f.attrs.total] || '0', 10) || 0;
        const pct = total > 0 ? (covered * 100.0) / total : 100;
        if (!compare(f.op, pct, f.threshold)) { visible = false; break; }
      }
    }

    htmlRow.style.display = visible ? '' : 'none';
  });

  updateTotalsRow(container);
  equalizeBarWidths();
}

function updateFilterOptions(input: HTMLInputElement): void {
  const val = parseFloat(input.value);
  const wrapper = input.closest('.col-filter__coverage');
  const select = wrapper ? wrapper.querySelector('.col-filter__op') as HTMLSelectElement | null : null;
  if (!select) return;
  const gtOpt = select.querySelector('option[value="gt"]') as HTMLOptionElement | null;
  const ltOpt = select.querySelector('option[value="lt"]') as HTMLOptionElement | null;
  if (gtOpt) gtOpt.disabled = val >= 100;
  if (ltOpt) ltOpt.disabled = val <= 0;
  if (select.selectedOptions[0] && select.selectedOptions[0].disabled) {
    const first = select.querySelector('option:not(:disabled)') as HTMLOptionElement | null;
    if (first) select.value = first.value;
  }
}

function updateTotalsRow(container: Element): void {
  const rows = $$('tbody tr.t-file', container)
    .filter(r => (r as HTMLElement).style.display !== 'none');

  function sumData(attr: string): number {
    let total = 0;
    rows.forEach(r => { total += parseInt((r as HTMLElement).dataset[attr] || '0', 10) || 0; });
    return total;
  }

  const fileCount = $('.t-file-count', container);
  const totalFiles = parseInt(container.getAttribute('data-total-files') || '0', 10);
  if (fileCount) {
    const label = rows.length === 1 ? ' file' : ' files';
    fileCount.textContent = rows.length === totalFiles
      ? fmtNum(totalFiles) + label
      : fmtNum(rows.length) + '/' + fmtNum(totalFiles) + label;
  }

  const coveredLines = sumData('coveredLines');
  const relevantLines = sumData('relevantLines');
  updateCoverageCells(container, '.t-totals__line', coveredLines, relevantLines);

  if ($('.t-totals__branch-pct', container)) {
    const coveredBranches = sumData('coveredBranches');
    const totalBranches = sumData('totalBranches');
    updateCoverageCells(container, '.t-totals__branch', coveredBranches, totalBranches);
  }

  if ($('.t-totals__method-pct', container)) {
    const coveredMethods = sumData('coveredMethods');
    const totalMethods = sumData('totalMethods');
    updateCoverageCells(container, '.t-totals__method', coveredMethods, totalMethods);
  }
}

// --- Template materialization ----------------------------------

function materializeSourceFile(sourceFileId: string): HTMLElement | null {
  const existing = document.getElementById(sourceFileId);
  if (existing) return existing;

  const tmpl = document.getElementById('tmpl-' + sourceFileId) as HTMLTemplateElement | null;
  if (!tmpl) return null;

  const clone = document.importNode(tmpl.content, true);
  document.querySelector('.source_files')!.appendChild(clone);

  const el = document.getElementById(sourceFileId);
  if (el) {
    $$('pre code', el).forEach(e => { hljs.highlightElement(e as HTMLElement); });
  }
  return el;
}

// --- Bar width equalization ------------------------------------

function setBarWidth(bars: Element[], table: Element, px: number): void {
  const w = px + 'px';
  $$('th.cell--coverage', table).forEach(h => h.setAttribute('colspan', '2'));
  bars.forEach(b => {
    const s = (b as HTMLElement).style;
    s.display = '';
    s.width = w; s.minWidth = w; s.maxWidth = w;
  });
}

function hideBars(bars: Element[], table: Element): void {
  $$('th.cell--coverage', table).forEach(h => h.setAttribute('colspan', '1'));
  bars.forEach(b => {
    const s = (b as HTMLElement).style;
    s.display = 'none'; s.width = ''; s.minWidth = ''; s.maxWidth = '';
  });
}

function equalizeBarWidths(): void {
  $$('.file_list_container').forEach(container => {
    if ((container as HTMLElement).style.display === 'none') return;
    if ((container as HTMLElement).offsetWidth === 0) return;

    const table = $('table.file_list', container) as HTMLTableElement | null;
    if (!table) return;
    const bars = $$('td.cell--bar', table);
    if (bars.length === 0) return;

    const wrapper = table.closest('.file_list--responsive') as HTMLElement | null;
    if (!wrapper) return;

    // Hide during measurement to prevent flicker
    wrapper.style.visibility = 'hidden';

    // Test whether bars at a given width fit without overflow
    const fitsAt = (px: number): boolean => {
      setBarWidth(bars, table, px);
      table.style.width = 'auto';
      void table.offsetWidth;
      const fits = table.scrollWidth <= wrapper.clientWidth;
      table.style.width = '';
      return fits;
    };

    let barWidth = 240;
    if (!fitsAt(240)) {
      if (!fitsAt(80)) {
        hideBars(bars, table);
        wrapper.style.visibility = '';
        return;
      }
      // Binary search for the widest bars that fit
      let lo = 80, hi = 239;
      while (lo < hi) {
        const mid = Math.ceil((lo + hi) / 2);
        if (fitsAt(mid)) lo = mid;
        else hi = mid - 1;
      }
      barWidth = lo;
    }

    setBarWidth(bars, table, barWidth);
    wrapper.style.visibility = '';
  });
}

// --- Source file dialog ----------------------------------------

let dialog: HTMLDialogElement;
let dialogBody: HTMLElement;
let dialogTitle: HTMLElement;

function openSourceFile(sourceFileId: string, linenumber?: string): void {
  const el = materializeSourceFile(sourceFileId);
  if (!el) return;

  const sourceTable = el.cloneNode(true) as HTMLElement;
  const header = sourceTable.querySelector('.header');
  if (header) {
    dialogTitle.innerHTML = header.innerHTML;
    header.remove();
  }

  dialogBody.innerHTML = '';
  dialogBody.appendChild(sourceTable);

  if (!dialog.open) dialog.showModal();
  document.documentElement.style.overflow = 'hidden';
  dialogBody.focus();

  if (linenumber) {
    const targetLine = dialogBody.querySelector('li[data-linenumber="' + linenumber + '"]') as HTMLElement | null;
    if (targetLine) dialogBody.scrollTop = targetLine.offsetTop;
  }
}

function showFileList(tabId: string): void {
  if (dialog.open) {
    dialog.close();
    dialogBody.innerHTML = '';
    dialogTitle.innerHTML = '';
    document.documentElement.style.overflow = '';
  }

  if (tabId) {
    const tab = document.querySelector('.group_tabs a.' + tabId);
    if (tab) {
      $$('.group_tabs li').forEach(li => li.classList.remove('active'));
      tab.parentElement!.classList.add('active');
      $$('.file_list_container').forEach(c => (c as HTMLElement).style.display = 'none');
      const target = document.getElementById(tabId);
      if (target) target.style.display = '';
    }
  }
  // Only equalize bars if the wrapper is actually visible
  const wrapper = document.getElementById('wrapper');
  if (wrapper && !wrapper.classList.contains('hide')) {
    equalizeBarWidths();
  }
}

function navigateToHash(): void {
  const hash = window.location.hash.substring(1);

  if (!hash) {
    const firstTab = document.querySelector('.group_tabs a');
    if (firstTab) showFileList(firstTab.getAttribute('href')!.replace('#', ''));
    return;
  }

  if (hash.charAt(0) === '_') {
    showFileList(hash.substring(1));
  } else {
    const parts = hash.split('-L');
    if (!document.querySelector('.group_tabs li.active')) {
      const first = document.querySelector('.group_tabs li');
      if (first) first.classList.add('active');
    }
    openSourceFile(parts[0], parts[1]);
  }
}

function navigateToActiveTab(): void {
  const activeLink = document.querySelector('.group_tabs li.active a');
  if (activeLink) {
    window.location.hash = activeLink.getAttribute('href')!.replace('#', '#_');
  }
}

// --- Initialization -------------------------------------------

document.addEventListener('DOMContentLoaded', function () {
  // Timeago
  $$('abbr.timeago').forEach(el => {
    const date = new Date(el.getAttribute('title') || '');
    if (!isNaN(date.getTime())) el.textContent = timeago(date);
  });

  // Dark mode toggle
  (function () {
    const toggle = document.getElementById('dark-mode-toggle');
    if (!toggle) return;

    const root = document.documentElement;

    function isDark(): boolean {
      return root.classList.contains('dark-mode') ||
        (!root.classList.contains('light-mode') &&
          window.matchMedia('(prefers-color-scheme: dark)').matches);
    }

    function updateLabel(): void {
      toggle!.textContent = isDark() ? '\u2600\uFE0F Light' : '\uD83C\uDF19 Dark';
    }

    updateLabel();

    toggle.addEventListener('click', () => {
      const switchToLight = isDark();
      root.classList.toggle('light-mode', switchToLight);
      root.classList.toggle('dark-mode', !switchToLight);
      localStorage.setItem('simplecov-dark-mode', switchToLight ? 'light' : 'dark');
      updateLabel();
    });

    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      if (!localStorage.getItem('simplecov-dark-mode')) updateLabel();
    });
  })();

  // Table sorting — compute td index dynamically at click time
  function thToTdIndex(table: Element, clickedTh: Element): number {
    let idx = 0;
    for (const th of $$('thead tr:first-child th', table)) {
      const span = parseInt(th.getAttribute('colspan') || '1', 10);
      if (th === clickedTh) return idx + span - 1;
      idx += span;
    }
    return idx;
  }

  $$('table.file_list').forEach(table => {
    $$('thead tr:first-child th', table).forEach((th) => {
      th.classList.add('sorting');
      (th as HTMLElement).style.cursor = 'pointer';
      th.addEventListener('click', () => sortTable(table, thToTdIndex(table, th)));
    });
  });

  // Filter options init
  $$('.col-filter__value').forEach(el => updateFilterOptions(el as HTMLInputElement));

  // Prevent filter clicks from triggering sort
  $$('.col-filter--name, .col-filter__op, .col-filter__value, .col-filter__coverage').forEach(el => {
    el.addEventListener('click', e => e.stopPropagation());
  });

  // Filter change handlers
  on(document, 'input', '.col-filter--name, .col-filter__op, .col-filter__value', function () {
    if (this.classList.contains('col-filter__value')) updateFilterOptions(this as HTMLInputElement);
    filterTable(this.closest('.file_list_container')!);
  });
  on(document, 'change', '.col-filter__op, .col-filter__value', function () {
    if (this.classList.contains('col-filter__value')) updateFilterOptions(this as HTMLInputElement);
    filterTable(this.closest('.file_list_container')!);
  });

  // "/" to focus search
  document.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key === '/' && !(e.target as Element).matches('input, select, textarea')) {
      e.preventDefault();
      const visible = $$('.file_list_container').filter(c => (c as HTMLElement).style.display !== 'none');
      const input = visible.length ? $('.col-filter--name', visible[0]) as HTMLElement | null : null;
      if (input) input.focus();
    }
  });

  // Dialog setup
  dialog = document.getElementById('source-dialog') as HTMLDialogElement;
  dialogBody = document.getElementById('source-dialog-body')!;
  dialogTitle = document.getElementById('source-dialog-title')!;

  dialog.querySelector('.source-dialog__close')!.addEventListener('click', navigateToActiveTab);
  dialog.addEventListener('click', e => { if (e.target === dialog) navigateToActiveTab(); });

  // Event delegation for dynamic content
  on(document, 'click', '.t-missed-method-toggle', function (e: Event) {
    e.preventDefault();
    const parent = this.closest('.header') || this.closest('.source-dialog__title') || this.closest('.source-dialog__header');
    const list = parent ? parent.querySelector('.t-missed-method-list') as HTMLElement | null : null;
    if (list) list.style.display = list.style.display === 'none' ? '' : 'none';
  });

  on(document, 'click', 'a.src_link', function (e: Event) {
    e.preventDefault();
    window.location.hash = this.getAttribute('href')!.substring(1);
  });

  on(document, 'click', 'table.file_list tbody tr', function (e: Event) {
    if ((e.target as Element).closest('a')) return;
    const link = this.querySelector('a.src_link');
    if (link) window.location.hash = link.getAttribute('href')!.substring(1);
  });

  on(document, 'click', '.source-dialog .source_table li[data-linenumber]', function (e: Event) {
    e.preventDefault();
    dialogBody.scrollTop = (this as HTMLElement).offsetTop;
    const linenumber = (this as HTMLElement).dataset.linenumber;
    const sourceFileId = window.location.hash.substring(1).replace(/-L.*/, '');
    window.location.replace(window.location.href.replace(/#.*/, '#' + sourceFileId + '-L' + linenumber));
  });

  window.addEventListener('hashchange', navigateToHash);

  // Tab system
  document.querySelector('.source_files')!.setAttribute('style', 'display:none');
  $$('.file_list_container').forEach(c => (c as HTMLElement).style.display = 'none');

  $$('.file_list_container').forEach(container => {
    const id = container.id;
    const groupName = container.querySelector('.group_name');
    const coveredPct = container.querySelector('.covered_percent');

    const li = document.createElement('li');
    li.setAttribute('role', 'tab');
    const a = document.createElement('a');
    a.href = '#' + id;
    a.className = id;
    a.innerHTML = (groupName ? groupName.innerHTML : '') + ' (' + (coveredPct ? coveredPct.innerHTML : '') + ')';
    li.appendChild(a);
    document.querySelector('.group_tabs')!.appendChild(li);
  });

  on(document.querySelector('.group_tabs')!, 'click', 'a', function (e: Event) {
    e.preventDefault();
    window.location.hash = this.getAttribute('href')!.replace('#', '#_');
  });

  // Equalize bar column widths within each table
  // Defer until after wrapper is visible
  window.addEventListener('resize', equalizeBarWidths);

  // Initial state
  navigateToHash();

  // Finalize loading
  clearInterval((window as any)._simplecovLoadingTimer);
  clearTimeout((window as any)._simplecovShowTimeout);

  const loadingEl = document.getElementById('loading');
  if (loadingEl) {
    loadingEl.style.transition = 'opacity 0.3s';
    loadingEl.style.opacity = '0';
    setTimeout(() => { loadingEl.style.display = 'none'; }, 300);
  }

  const wrapperEl = document.getElementById('wrapper');
  if (wrapperEl) wrapperEl.classList.remove('hide');

  // Equalize bar widths now that wrapper is visible
  equalizeBarWidths();

});
