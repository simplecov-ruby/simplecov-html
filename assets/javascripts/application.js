//= require_directory ./plugins/
//= require_self

document.addEventListener('DOMContentLoaded', function () {
  'use strict';

  // --- Utility helpers ----------------------------------------

  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return Array.from((ctx || document).querySelectorAll(sel)); }

  function on(target, event, selectorOrFn, fn) {
    if (typeof selectorOrFn === 'function') {
      target.addEventListener(event, selectorOrFn);
    } else {
      // Event delegation
      target.addEventListener(event, function(e) {
        var el = e.target.closest(selectorOrFn);
        if (el && target.contains(el)) fn.call(el, e);
      });
    }
  }

  // --- Timeago ------------------------------------------------

  function timeago(date) {
    var seconds = Math.floor((new Date() - date) / 1000);
    var intervals = [
      [31536000, 'year'], [2592000, 'month'], [86400, 'day'],
      [3600, 'hour'], [60, 'minute'], [1, 'second']
    ];
    for (var i = 0; i < intervals.length; i++) {
      var count = Math.floor(seconds / intervals[i][0]);
      if (count >= 1) {
        return count === 1 ? 'about 1 ' + intervals[i][1] + ' ago'
                           : count + ' ' + intervals[i][1] + 's ago';
      }
    }
    return 'just now';
  }

  $$('abbr.timeago').forEach(function(el) {
    var date = new Date(el.getAttribute('title'));
    if (!isNaN(date)) el.textContent = timeago(date);
  });

  // --- Dark mode toggle ----------------------------------------

  (function() {
    var toggle = document.getElementById('dark-mode-toggle');
    if (!toggle) return;

    var root = document.documentElement;

    function isDark() {
      return root.classList.contains('dark-mode') ||
        (!root.classList.contains('light-mode') &&
         window.matchMedia('(prefers-color-scheme: dark)').matches);
    }

    function updateLabel() {
      toggle.textContent = isDark() ? '\u2600\uFE0F Light' : '\uD83C\uDF19 Dark';
    }

    updateLabel();

    toggle.addEventListener('click', function() {
      var switchToLight = isDark();
      root.classList.toggle('light-mode', switchToLight);
      root.classList.toggle('dark-mode', !switchToLight);
      localStorage.setItem('simplecov-dark-mode', switchToLight ? 'light' : 'dark');
      updateLabel();
    });

    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function() {
      if (!localStorage.getItem('simplecov-dark-mode')) updateLabel();
    });
  })();

  // --- Table sorting -------------------------------------------

  var sortState = {}; // per-table: { colIndex, direction }

  function getSortValue(td) {
    var order = td.getAttribute('data-order');
    if (order !== null) return parseFloat(order);
    var text = td.textContent.trim();
    var num = parseFloat(text);
    return isNaN(num) ? text.toLowerCase() : num;
  }

  function sortTable(table, colIndex) {
    var tableId = table.id || table.getAttribute('data-sort-id') || 'default';
    var state = sortState[tableId] || {};

    // Toggle direction: if same column, flip; otherwise start ascending
    var dir;
    if (state.colIndex === colIndex) {
      dir = state.direction === 'asc' ? 'desc' : 'asc';
    } else {
      dir = 'asc';
    }
    sortState[tableId] = { colIndex: colIndex, direction: dir };

    var tbody = table.querySelector('tbody');
    var rows = Array.from(tbody.querySelectorAll('tr.t-file'));

    rows.sort(function(a, b) {
      var aVal = getSortValue(a.children[colIndex]);
      var bVal = getSortValue(b.children[colIndex]);
      var cmp;
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        cmp = aVal - bVal;
      } else {
        cmp = String(aVal).localeCompare(String(bVal));
      }
      return dir === 'asc' ? cmp : -cmp;
    });

    rows.forEach(function(row) { tbody.appendChild(row); });

    // Update sort indicators
    $$('th', table).forEach(function(th, i) {
      th.classList.remove('sorting_asc', 'sorting_desc', 'sorting');
      if (i === colIndex) {
        th.classList.add(dir === 'asc' ? 'sorting_asc' : 'sorting_desc');
      } else {
        th.classList.add('sorting');
      }
    });
  }

  // Bind header clicks for sorting
  $$('table.file_list').forEach(function(table) {
    $$('thead tr:first-child th', table).forEach(function(th, colIndex) {
      th.classList.add('sorting');
      th.style.cursor = 'pointer';
      th.addEventListener('click', function() {
        sortTable(table, colIndex);
      });
    });
  });

  // --- Column filters ------------------------------------------

  var dataAttrMap = {
    line:   { covered: 'coveredLines',   total: 'relevantLines' },
    branch: { covered: 'coveredBranches', total: 'totalBranches' },
    method: { covered: 'coveredMethods',  total: 'totalMethods' }
  };

  function compare(op, value, threshold) {
    if (op === 'gt')  return value > threshold;
    if (op === 'gte') return value >= threshold;
    if (op === 'eq')  return value === threshold;
    if (op === 'lte') return value <= threshold;
    if (op === 'lt')  return value < threshold;
    return true;
  }

  function filterTable(container) {
    var table = $('table.file_list', container);
    if (!table) return;

    var nameQuery = ($('.col-filter--name', container) || {}).value || '';
    var filters = $$('.col-filter__value', container).map(function(input) {
      var val = input.value;
      if (!val) return null;
      var threshold = parseFloat(val);
      if (isNaN(threshold)) return null;
      var type = input.dataset.type;
      var opSelect = $('.col-filter__op[data-type="' + type + '"]', container);
      var op = opSelect ? opSelect.value : '';
      if (!op) return null;
      var attrs = dataAttrMap[type];
      if (!attrs) return null;
      return { attrs: attrs, op: op, threshold: threshold };
    }).filter(Boolean);

    var rows = $$('tbody tr.t-file', table);
    rows.forEach(function(row) {
      var visible = true;

      // File name filter
      if (nameQuery) {
        var name = row.children[0].textContent.toLowerCase();
        if (name.indexOf(nameQuery.toLowerCase()) === -1) visible = false;
      }

      // Coverage threshold filters
      if (visible) {
        for (var i = 0; i < filters.length; i++) {
          var f = filters[i];
          var covered = parseInt(row.dataset[f.attrs.covered], 10) || 0;
          var total = parseInt(row.dataset[f.attrs.total], 10) || 0;
          var pct = total > 0 ? (covered * 100.0 / total) : 100;
          if (!compare(f.op, pct, f.threshold)) { visible = false; break; }
        }
      }

      row.style.display = visible ? '' : 'none';
    });

    updateTotalsRow(container);
  }

  function updateFilterOptions(input) {
    var val = parseFloat(input.value);
    var wrapper = input.closest('.col-filter__coverage');
    var select = wrapper ? wrapper.querySelector('.col-filter__op') : null;
    if (!select) return;
    var gtOpt = select.querySelector('option[value="gt"]');
    var ltOpt = select.querySelector('option[value="lt"]');
    if (gtOpt) gtOpt.disabled = val >= 100;
    if (ltOpt) ltOpt.disabled = val <= 0;
    if (select.selectedOptions[0] && select.selectedOptions[0].disabled) {
      var first = select.querySelector('option:not(:disabled)');
      if (first) select.value = first.value;
    }
  }

  // Initialize filter options
  $$('.col-filter__value').forEach(function(input) { updateFilterOptions(input); });

  // Prevent filter clicks from triggering sort
  $$('.col-filter--name, .col-filter__op, .col-filter__value, .col-filter__coverage').forEach(function(el) {
    el.addEventListener('click', function(e) { e.stopPropagation(); });
  });

  // Redraw on filter change
  on(document, 'input', '.col-filter--name, .col-filter__op, .col-filter__value', function() {
    if (this.classList.contains('col-filter__value')) updateFilterOptions(this);
    filterTable(this.closest('.file_list_container'));
  });
  on(document, 'change', '.col-filter__op, .col-filter__value', function() {
    if (this.classList.contains('col-filter__value')) updateFilterOptions(this);
    filterTable(this.closest('.file_list_container'));
  });

  // "/" to focus search
  document.addEventListener('keydown', function(e) {
    if (e.key === '/' && !e.target.matches('input, select, textarea')) {
      e.preventDefault();
      var visible = $$('.file_list_container').filter(function(c) { return c.style.display !== 'none'; });
      var input = visible.length ? $('.col-filter--name', visible[0]) : null;
      if (input) input.focus();
    }
  });

  // --- Totals row ----------------------------------------------

  function pctClass(pct) {
    if (pct >= 90) return 'green';
    if (pct >= 75) return 'yellow';
    return 'red';
  }

  function buildCoverageCell(covered, total) {
    if (total === 0) return '<span class="coverage-cell__pct">\u2013</span>';
    var p = covered * 100.0 / total;
    return '<div class="coverage-cell">' +
      '<div class="coverage-bar"><div class="coverage-bar__fill coverage-bar__fill--' + pctClass(p) + '" style="width: ' + p.toFixed(1) + '%"></div></div>' +
      '<span class="coverage-cell__pct ' + pctClass(p) + '">' + p.toFixed(2) + '%</span>' +
      '<span class="coverage-cell__fraction">' + covered + '/' + total + '</span>' +
      '</div>';
  }

  function updateTotalsRow(container) {
    var rows = $$('tbody tr.t-file', container).filter(function(r) { return r.style.display !== 'none'; });

    function sumData(attr) {
      var total = 0;
      rows.forEach(function(r) { total += parseInt(r.dataset[attr], 10) || 0; });
      return total;
    }

    var fileCount = $('.t-file-count', container);
    if (fileCount) fileCount.textContent = rows.length + ' files';

    var coveredLines = sumData('coveredLines'), relevantLines = sumData('relevantLines');
    var lineCov = $('.t-totals__line-coverage', container);
    if (lineCov) lineCov.innerHTML = buildCoverageCell(coveredLines, relevantLines);

    var numberCells = $$('.totals-row .cell--number', container);
    if (numberCells[0]) numberCells[0].textContent = relevantLines || '\u2013';

    var branchCov = $('.t-totals__branch-coverage', container);
    if (branchCov) {
      var coveredBranches = sumData('coveredBranches'), totalBranches = sumData('totalBranches');
      branchCov.innerHTML = buildCoverageCell(coveredBranches, totalBranches);
      if (numberCells[1]) numberCells[1].textContent = totalBranches || '\u2013';
    }

    var methodCov = $('.t-totals__method-coverage', container);
    if (methodCov) {
      var coveredMethods = sumData('coveredMethods'), totalMethods = sumData('totalMethods');
      methodCov.innerHTML = buildCoverageCell(coveredMethods, totalMethods);
      var idx = branchCov ? 2 : 1;
      if (numberCells[idx]) numberCells[idx].textContent = totalMethods || '\u2013';
    }
  }

  // --- Template materialization --------------------------------

  function materializeSourceFile(sourceFileId) {
    var existing = document.getElementById(sourceFileId);
    if (existing) return existing;

    var tmpl = document.getElementById('tmpl-' + sourceFileId);
    if (!tmpl) return null;

    var clone = document.importNode(tmpl.content, true);
    document.querySelector('.source_files').appendChild(clone);

    var el = document.getElementById(sourceFileId);
    $$('pre code', el).forEach(function(e) { hljs.highlightBlock(e, '  '); });

    return el;
  }

  // --- Source file dialog --------------------------------------

  var dialog = document.getElementById('source-dialog');
  var dialogBody = document.getElementById('source-dialog-body');
  var dialogTitle = document.getElementById('source-dialog-title');
  var dialogClose = dialog.querySelector('.source-dialog__close');

  function openSourceFile(sourceFileId, linenumber) {
    var el = materializeSourceFile(sourceFileId);
    if (!el) return;

    var sourceTable = el.cloneNode(true);
    var header = sourceTable.querySelector('.header');
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
      var targetLine = dialogBody.querySelector('li[data-linenumber="' + linenumber + '"]');
      if (targetLine) dialogBody.scrollTop = targetLine.offsetTop;
    }
  }

  function showFileList(tabId) {
    if (dialog.open) {
      dialog.close();
      dialogBody.innerHTML = '';
      dialogTitle.innerHTML = '';
      document.documentElement.style.overflow = '';
    }

    if (tabId) {
      var tab = document.querySelector('.group_tabs a.' + tabId);
      if (tab) {
        $$('.group_tabs li').forEach(function(li) { li.classList.remove('active'); });
        tab.parentElement.classList.add('active');
        $$('.file_list_container').forEach(function(c) { c.style.display = 'none'; });
        var target = document.getElementById(tabId);
        if (target) target.style.display = '';
      }
    }
  }

  function navigateToHash() {
    var hash = window.location.hash.substring(1);

    if (!hash) {
      var firstTab = document.querySelector('.group_tabs a');
      if (firstTab) showFileList(firstTab.getAttribute('href').replace('#', ''));
      return;
    }

    if (hash.charAt(0) === '_') {
      showFileList(hash.substring(1));
    } else {
      var parts = hash.split('-L');
      if (!document.querySelector('.group_tabs li.active')) {
        var first = document.querySelector('.group_tabs li');
        if (first) first.classList.add('active');
      }
      openSourceFile(parts[0], parts[1]);
    }
  }

  function navigateToActiveTab() {
    var activeLink = document.querySelector('.group_tabs li.active a');
    if (activeLink) {
      window.location.hash = activeLink.getAttribute('href').replace('#', '#_');
    }
  }

  dialogClose.addEventListener('click', navigateToActiveTab);

  dialog.addEventListener('click', function(e) {
    if (e.target === dialog) navigateToActiveTab();
  });

  // --- Event delegation for dynamic content --------------------

  // Toggle missed methods list
  on(document, 'click', '.t-missed-method-toggle', function(e) {
    e.preventDefault();
    var parent = this.closest('.header') || this.closest('.source-dialog__title') || this.closest('.source-dialog__header');
    var list = parent ? parent.querySelector('.t-missed-method-list') : null;
    if (list) list.style.display = list.style.display === 'none' ? '' : 'none';
  });

  // Source link clicks
  on(document, 'click', 'a.src_link', function(e) {
    e.preventDefault();
    window.location.hash = this.getAttribute('href').substring(1);
  });

  // Row clicks open source view
  on(document, 'click', 'table.file_list tbody tr', function(e) {
    if (e.target.closest('a')) return;
    var link = this.querySelector('a.src_link');
    if (link) window.location.hash = link.getAttribute('href').substring(1);
  });

  // Line number clicks in dialog
  on(document, 'click', '.source-dialog .source_table li[data-linenumber]', function(e) {
    e.preventDefault();
    dialogBody.scrollTop = this.offsetTop;
    var linenumber = this.dataset.linenumber;
    var sourceFileId = window.location.hash.substring(1).replace(/-L.*/, '');
    window.location.replace(window.location.href.replace(/#.*/, '#' + sourceFileId + '-L' + linenumber));
  });

  window.addEventListener('hashchange', navigateToHash);

  // --- Tab system ----------------------------------------------

  document.querySelector('.source_files').style.display = 'none';
  $$('.file_list_container').forEach(function(c) { c.style.display = 'none'; });

  $$('.file_list_container').forEach(function(container) {
    var id = container.id;
    var groupName = container.querySelector('.group_name');
    var coveredPct = container.querySelector('.covered_percent');
    var name = groupName ? groupName.innerHTML : '';
    var pct = coveredPct ? coveredPct.innerHTML : '';

    var li = document.createElement('li');
    li.setAttribute('role', 'tab');
    var a = document.createElement('a');
    a.href = '#' + id;
    a.className = id;
    a.innerHTML = name + ' (' + pct + ')';
    li.appendChild(a);
    document.querySelector('.group_tabs').appendChild(li);
  });

  on(document.querySelector('.group_tabs'), 'click', 'a', function(e) {
    e.preventDefault();
    window.location.hash = this.getAttribute('href').replace('#', '#_');
  });

  // --- Initial state -------------------------------------------

  navigateToHash();

  // --- Finalize loading ----------------------------------------

  clearInterval(window._simplecovLoadingTimer);

  var loading = document.getElementById('loading');
  if (loading) {
    loading.style.transition = 'opacity 0.3s';
    loading.style.opacity = '0';
    setTimeout(function() { loading.style.display = 'none'; }, 300);
  }

  var wrapper = document.getElementById('wrapper');
  if (wrapper) wrapper.classList.remove('hide');
});
