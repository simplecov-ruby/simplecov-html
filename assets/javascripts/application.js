//= require_directory ./libraries/
//= require_directory ./plugins/
//= require_self

/* --- Main application logic -------------------------------- */

$(document).ready(function () {

  // --- Dark mode toggle ---

  (function() {
    var toggle = document.getElementById('dark-mode-toggle');
    if (!toggle) return;

    function isDark() {
      return document.documentElement.classList.contains('dark-mode') ||
        (!document.documentElement.classList.contains('light-mode') &&
         window.matchMedia('(prefers-color-scheme: dark)').matches);
    }

    function updateLabel() {
      toggle.textContent = isDark() ? '\u2600\uFE0F Light' : '\uD83C\uDF19 Dark';
    }

    updateLabel();

    toggle.addEventListener('click', function() {
      if (isDark()) {
        document.documentElement.classList.remove('dark-mode');
        document.documentElement.classList.add('light-mode');
        localStorage.setItem('simplecov-dark-mode', 'light');
      } else {
        document.documentElement.classList.remove('light-mode');
        document.documentElement.classList.add('dark-mode');
        localStorage.setItem('simplecov-dark-mode', 'dark');
      }
      updateLabel();
    });

    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function() {
      if (!localStorage.getItem('simplecov-dark-mode')) {
        updateLabel();
      }
    });
  })();
  $('.file_list').dataTable({
    order: [[1, "asc"]],
    paging: false
  });

  // Move search box into the header row
  $('.file_list_container').each(function() {
    var filter = $(this).find('.dataTables_filter');
    var target = $(this).find('.file_list_search');
    if (filter.length && target.length) {
      filter.find('input').attr('placeholder', 'Search files\u2026');
      target.append(filter);
    }
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
  var prev_anchor;
  var curr_anchor;

  function openSourceFile(sourceFileId, linenumber) {
    var el = materializeSourceFile(sourceFileId);
    if (!el || !el.length) return;

    // Clone the source table into the dialog
    var sourceTable = el[0].cloneNode(true);

    // Move header content to dialog title area
    var header = sourceTable.querySelector('.header');
    if (header) {
      dialogTitle.innerHTML = header.innerHTML;
      header.remove();
    }

    dialogBody.innerHTML = '';
    dialogBody.appendChild(sourceTable);

    prev_anchor = curr_anchor ? curr_anchor : window.location.hash.substring(1);
    curr_anchor = sourceFileId + (linenumber ? '-L' + linenumber : '');
    window.location.hash = curr_anchor;

    dialog.showModal();
    dialogBody.focus();

    // Scroll to line number if specified
    if (linenumber) {
      var targetLine = dialogBody.querySelector('li[data-linenumber="' + linenumber + '"]');
      if (targetLine) {
        dialogBody.scrollTop = targetLine.offsetTop;
      }
    }
  }

  function closeDialog() {
    dialog.close();

    if (prev_anchor && prev_anchor.substring(0, 1) === '_') {
      window.location.hash = prev_anchor;
    } else {
      var activeTab = $('.group_tabs li.active a').attr('href');
      if (activeTab) {
        window.location.hash = activeTab.replace('#', '#_');
      }
    }

    curr_anchor = window.location.hash.substring(1);

    var active_group = $('.group_tabs li.active a').attr('class');
    if (active_group) {
      $("#" + active_group + ".file_list_container").show();
    }
  }

  dialogClose.addEventListener('click', closeDialog);

  dialog.addEventListener('close', function() {
    dialogBody.innerHTML = '';
    dialogTitle.innerHTML = '';
  });

  // Close on backdrop click
  dialog.addEventListener('click', function(e) {
    if (e.target === dialog) {
      closeDialog();
    }
  });

  // Source link clicks
  $(document).on('click', 'a.src_link', function (e) {
    e.preventDefault();
    var sourceFileId = $(this).attr('href').substring(1);
    openSourceFile(sourceFileId);
  });

  // Clicking anywhere in a file row opens the source view
  $(document).on('click', 'table.file_list tbody tr', function (e) {
    if ($(e.target).closest('a').length) return; // let link clicks handle themselves
    var link = $(this).find('a.src_link');
    if (link.length) {
      openSourceFile(link.attr('href').substring(1));
    }
  });

  // Line number clicks within dialog
  $(document).on('click', '.source-dialog .source_table li[data-linenumber]', function () {
    dialogBody.scrollTop = this.offsetTop;
    var linenumber = $(this).data('linenumber');
    var new_anchor = curr_anchor.replace(/-L.*/, '').replace(/-.*/, '') + '-L' + linenumber;
    window.location.replace(window.location.href.replace(/#.*/, '#' + new_anchor));
    curr_anchor = new_anchor;
    return false;
  });

  // --- Hash-based navigation ---

  window.onpopstate = function () {
    var hash = window.location.hash.substring(1);
    if (!hash) return;

    if (hash.substring(0, 1) === '_') {
      if (dialog.open) closeDialog();
      curr_anchor = hash;
    } else if (!dialog.open) {
      var parts = hash.split('-L');
      openSourceFile(parts[0], parts[1]);
    }
  };

  // --- Tab system ---

  $('.source_files').hide();
  $('.file_list_container').hide();

  $('.file_list_container h2').each(function () {
    var container_id = $(this).closest('.file_list_container').attr('id');
    var group_name = $(this).find('.group_name').first().html();
    var covered_percent = $(this).find('.covered_percent').first().html();

    $('.group_tabs').append('<li role="tab"><a href="#' + container_id + '">' + group_name + ' (' + covered_percent + ')</a></li>');
  });

  $('.group_tabs a').each(function () {
    $(this).addClass($(this).attr('href').replace('#', ''));
  });

  var favicon_path = $('link[rel="icon"]').attr('href');
  $('.group_tabs').on('click', 'a', function () {
    if (!$(this).parent().hasClass('active')) {
      $('.group_tabs a').parent().removeClass('active');
      $(this).parent().addClass('active');
      $('.file_list_container').hide();
      $(".file_list_container" + $(this).attr('href')).show();
      window.location.href = window.location.href.split('#')[0] + $(this).attr('href').replace('#', '#_');

      $('link[rel="icon"]').remove();
      $('head').append('<link rel="icon" type="image/png" href="' + favicon_path + '" />');
    }
    return false;
  });

  // --- Initial state from URL hash ---

  if (window.location.hash) {
    var anchor = window.location.hash.substring(1);
    if (anchor.length === 40) {
      openSourceFile(anchor);
    } else if (anchor.length > 40) {
      var ary = anchor.split('-L');
      openSourceFile(ary[0], ary[1]);
    } else {
      $('.group_tabs a.' + anchor.replace('_', '')).click();
    }
  } else {
    $('.group_tabs a:first').click();
  }

  // --- Finalize loading ---

  $("abbr.timeago").timeago();
  clearInterval(window._simplecovLoadingTimer);
  $('#loading').fadeOut();
  $('#wrapper').show();
  $('.dataTables_filter input').focus();
});
