//= require_directory ./libraries/
//= require_directory ./plugins/
//= require_self

/* --- Main application logic -------------------------------- */

$(document).ready(function () {

  // --- Dark mode toggle ---

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
      if (!localStorage.getItem('simplecov-dark-mode')) {
        updateLabel();
      }
    });
  })();
  $('.file_list').dataTable({
    order: [],
    paging: false,
    columnDefs: [
      { orderSequence: ["asc", "desc"], targets: "_all" }
    ],
    info: false,
    searching: true
  });

  // Hide DataTables' built-in search (replaced by column filter)
  $('.dataTables_filter').hide();

  // --- Column filters ---

  var dataAttrMap = {
    line:   { covered: 'covered-lines',    total: 'relevant-lines' },
    branch: { covered: 'covered-branches', total: 'total-branches' },
    method: { covered: 'covered-methods',  total: 'total-methods' }
  };

  function compare(op, value, threshold) {
    if (op === 'gt')  return value > threshold;
    if (op === 'gte') return value >= threshold;
    if (op === 'eq')  return value === threshold;
    if (op === 'lte') return value <= threshold;
    if (op === 'lt')  return value < threshold;
    return true;
  }

  // Custom DataTables filter: check all column filters
  $.fn.dataTable.ext.search.push(function(settings, data, dataIndex) {
    var table = $(settings.nTable);
    var container = table.closest('.file_list_container');
    var row = $(table.DataTable().row(dataIndex).node());

    // File name search
    var nameQuery = container.find('.col-filter--name').val();
    if (nameQuery && data[0].toLowerCase().indexOf(nameQuery.toLowerCase()) === -1) return false;

    // Coverage threshold filters
    var pass = true;
    container.find('.col-filter__value').each(function() {
      var val = $(this).val();
      if (!val) return;
      var threshold = parseFloat(val);
      if (isNaN(threshold)) return;

      var type = $(this).data('type');
      var op = container.find('.col-filter__op[data-type="' + type + '"]').val();
      if (!op) return;

      var attrs = dataAttrMap[type];
      if (!attrs) return;
      var covered = parseInt(row.data(attrs.covered), 10) || 0;
      var total = parseInt(row.data(attrs.total), 10) || 0;
      var pct = total > 0 ? (covered * 100.0 / total) : 100;

      if (!compare(op, pct, threshold)) pass = false;
    });

    return pass;
  });

  // Disable nonsensical comparators based on value
  function updateFilterOptions(input) {
    var val = parseFloat($(input).val());
    var select = $(input).closest('.col-filter__coverage').find('.col-filter__op');
    select.find('option[value="gt"]').prop('disabled', val >= 100);
    select.find('option[value="lt"]').prop('disabled', val <= 0);
    // If the selected option is now disabled, switch to a valid one
    if (select.find('option:selected').prop('disabled')) {
      select.val(select.find('option:not(:disabled)').first().val());
    }
  }

  // Initialize on page load
  $('.col-filter__value').each(function() { updateFilterOptions(this); });

  // Focus search box on "/" key (standard shortcut)
  $(document).on('keydown', function(e) {
    if (e.key === '/' && !$(e.target).is('input, select, textarea')) {
      e.preventDefault();
      $('.file_list_container:visible .col-filter--name').first().focus();
    }
  });

  // Prevent filter clicks from triggering column sort
  $('.col-filter--name, .col-filter__op, .col-filter__value, .col-filter__coverage').on('click', function(e) {
    e.stopPropagation();
  });

  // Redraw on any filter change
  $(document).on('input change', '.col-filter--name, .col-filter__op, .col-filter__value', function() {
    if ($(this).hasClass('col-filter__value')) updateFilterOptions(this);
    $(this).closest('.file_list_container').find('table.file_list').DataTable().draw();
  });

  // Update totals row based on visible (filtered) rows
  function updateTotalsRow(container) {
    var dt = $(container).find('table.file_list').DataTable();
    var filteredNodes = dt.rows({search: 'applied'}).nodes();
    var rows = $(filteredNodes).filter('tr.t-file');

    function sumData(attr) {
      var total = 0;
      rows.each(function() { total += parseInt($(this).data(attr), 10) || 0; });
      return total;
    }

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

    var coveredLines = sumData('covered-lines'), relevantLines = sumData('relevant-lines');

    $(container).find('.t-file-count').text(rows.length + ' files');
    $(container).find('.t-totals__line-coverage').html(buildCoverageCell(coveredLines, relevantLines));
    $(container).find('.totals-row .cell--number').eq(0).text(relevantLines || '\u2013');

    if ($(container).find('.t-totals__branch-coverage').length) {
      var coveredBranches = sumData('covered-branches'), totalBranches = sumData('total-branches');
      $(container).find('.t-totals__branch-coverage').html(buildCoverageCell(coveredBranches, totalBranches));
      $(container).find('.totals-row .cell--number').eq(1).text(totalBranches || '\u2013');
    }

    if ($(container).find('.t-totals__method-coverage').length) {
      var coveredMethods = sumData('covered-methods'), totalMethods = sumData('total-methods');
      $(container).find('.t-totals__method-coverage').html(buildCoverageCell(coveredMethods, totalMethods));
      var methodIdx = $(container).find('.t-totals__branch-coverage').length ? 2 : 1;
      $(container).find('.totals-row .cell--number').eq(methodIdx).text(totalMethods || '\u2013');
    }
  }

  // Recalculate on every DataTables draw (sort, filter)
  $('table.file_list').on('draw.dt', function() {
    updateTotalsRow($(this).closest('.file_list_container'));
  });

  // --- Template materialization ---

  function materializeSourceFile(sourceFileId) {
    var existing = document.getElementById(sourceFileId);
    if (existing) return $(existing);

    var tmpl = document.getElementById('tmpl-' + sourceFileId);
    if (!tmpl) return null;

    var clone = document.importNode(tmpl.content, true);
    $('.source_files').append(clone);

    var el = $('#' + sourceFileId);
    el.find('pre code').each(function (i, e) { hljs.highlightBlock(e, '  ') });

    return el;
  }

  // --- Native dialog for source file viewing ---

  var dialog = document.getElementById('source-dialog');
  var dialogBody = document.getElementById('source-dialog-body');
  var dialogTitle = document.getElementById('source-dialog-title');
  var dialogClose = dialog.querySelector('.source-dialog__close');

  function openSourceFile(sourceFileId, linenumber) {
    var el = materializeSourceFile(sourceFileId);
    if (!el || !el.length) return;

    var sourceTable = el[0].cloneNode(true);
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
      if (targetLine) {
        dialogBody.scrollTop = targetLine.offsetTop;
      }
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
      var tab = $('.group_tabs a.' + tabId);
      if (tab.length) {
        $('.group_tabs a').parent().removeClass('active');
        tab.parent().addClass('active');
        $('.file_list_container').hide();
        $(".file_list_container#" + tabId).show();
      }
    }
  }

  // Navigate to the state described by the current hash
  function navigateToHash() {
    var hash = window.location.hash.substring(1);

    if (!hash) {
      showFileList($('.group_tabs a:first').attr('href').replace('#', ''));
      return;
    }

    if (hash.substring(0, 1) === '_') {
      showFileList(hash.substring(1));
    } else {
      var parts = hash.split('-L');
      // Ensure a tab is active for when we navigate back
      if (!$('.group_tabs li.active').length) {
        var firstTab = $('.group_tabs a:first');
        firstTab.parent().addClass('active');
      }
      openSourceFile(parts[0], parts[1]);
    }
  }

  function navigateToActiveTab() {
    var activeTab = $('.group_tabs li.active a').attr('href');
    if (activeTab) {
      window.location.hash = activeTab.replace('#', '#_');
    }
  }

  dialogClose.addEventListener('click', navigateToActiveTab);

  // Close dialog when clicking the backdrop
  dialog.addEventListener('click', function(e) {
    if (e.target === dialog) navigateToActiveTab();
  });

  // Toggle missed methods list
  $(document).on('click', '.t-missed-method-toggle', function (e) {
    e.preventDefault();
    $(this).closest('.header, .source-dialog__title, .source-dialog__header').find('.t-missed-method-list').toggle();
  });

  // Source link clicks — just set the hash, navigation handles the rest
  $(document).on('click', 'a.src_link', function (e) {
    e.preventDefault();
    window.location.hash = $(this).attr('href').substring(1);
  });

  $(document).on('click', 'table.file_list tbody tr', function (e) {
    if ($(e.target).closest('a').length) return;
    var link = $(this).find('a.src_link');
    if (link.length) {
      window.location.hash = link.attr('href').substring(1);
    }
  });

  // Line number clicks within dialog
  $(document).on('click', '.source-dialog .source_table li[data-linenumber]', function () {
    dialogBody.scrollTop = this.offsetTop;
    var linenumber = $(this).data('linenumber');
    var sourceFileId = window.location.hash.substring(1).replace(/-L.*/, '');
    window.location.replace(window.location.href.replace(/#.*/, '#' + sourceFileId + '-L' + linenumber));
    return false;
  });

  // All navigation goes through hashchange -> navigateToHash
  window.addEventListener('hashchange', navigateToHash);

  // --- Tab system ---

  $('.source_files').hide();
  $('.file_list_container').hide();

  $('.file_list_container').each(function () {
    var container_id = $(this).attr('id');
    var group_name = $(this).find('.group_name').first().html();
    var covered_percent = $(this).find('.covered_percent').first().html();

    $('.group_tabs').append('<li role="tab"><a href="#' + container_id + '">' + group_name + ' (' + covered_percent + ')</a></li>');
  });

  $('.group_tabs a').each(function () {
    $(this).addClass($(this).attr('href').replace('#', ''));
  });

  // Tab clicks just set the hash — navigation handles the rest
  $('.group_tabs').on('click', 'a', function () {
    window.location.hash = $(this).attr('href').replace('#', '#_');
    return false;
  });

  // --- Initial state from URL hash ---
  navigateToHash();

  // --- Finalize loading ---

  $("abbr.timeago").timeago();
  clearInterval(window._simplecovLoadingTimer);
  $('#loading').fadeOut();
  $('#wrapper').show();
});
