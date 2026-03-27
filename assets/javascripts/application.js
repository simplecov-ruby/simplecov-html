//= require_directory ./libraries/
//= require_directory ./plugins/
//= require_self

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

$(document).ready(function () {
  $('.file_list').dataTable({
    order: [[1, "asc"]],
    paging: false
  });

  // Materialize a source file from its <template> tag into the .source_files container.
  // Returns the materialized element, or the existing one if already materialized.
  function materializeSourceFile(sourceFileId) {
    var existing = document.getElementById(sourceFileId);
    if (existing) return $(existing);

    var tmpl = document.getElementById('tmpl-' + sourceFileId);
    if (!tmpl) return null;

    var clone = document.importNode(tmpl.content, true);
    $('.source_files').append(clone);

    var el = $('#' + sourceFileId);

    // Apply syntax highlighting on first materialization
    el.find('pre code').each(function (i, e) { hljs.highlightBlock(e, '  ') });
    el.addClass('highlighted');

    return el;
  }

  // Syntax highlight source files on first toggle of the file view popup
  $("a.src_link").click(function () {
    var sourceFileId = $(this).attr('href').substring(1);
    materializeSourceFile(sourceFileId);
  });

  var prev_anchor;
  var curr_anchor;

  // Set-up of popup for source file views
  $("a.src_link").colorbox({
    transition: "none",
    inline: true,
    opacity: 1,
    width: "95%",
    height: "95%",
    onLoad: function () {
      prev_anchor = curr_anchor ? curr_anchor : window.location.hash.substring(1);
      curr_anchor = this.href.split('#')[1];

      // Ensure the source file is materialized before colorbox tries to inline it
      materializeSourceFile(curr_anchor.replace(/-L.*/, ''));

      window.location.hash = curr_anchor;

      $('.file_list_container').hide();
    },
    onCleanup: function () {
      if (prev_anchor && prev_anchor != curr_anchor) {
        $('a[href="#' + prev_anchor + '"]').click();
        curr_anchor = prev_anchor;
      } else {
        $('.group_tabs a:first').click();
        prev_anchor = curr_anchor;
        curr_anchor = "#_AllFiles";
      }
      window.location.hash = curr_anchor;

      var active_group = $('.group_tabs li.active a').attr('class');
      $("#" + active_group + ".file_list_container").show();
    }
  });

  // Event delegation for line number clicks (works with template-materialized elements)
  $(document).on('click', '.source_table li[data-linenumber]', function () {
    $('#cboxLoadedContent').scrollTop(this.offsetTop);
    var new_anchor = curr_anchor.replace(/-.*/, '') + '-L' + $(this).data('linenumber');
    window.location.replace(window.location.href.replace(/#.*/, '#' + new_anchor));
    curr_anchor = new_anchor;
    return false;
  });

  window.onpopstate = function (event) {
    if (window.location.hash.substring(0, 2) == "#_") {
      $.colorbox.close();
      curr_anchor = window.location.hash.substring(1);
    } else {
      if ($('#colorbox').is(':hidden')) {
        var anchor = window.location.hash.substring(1);
        var ary = anchor.split('-L');
        var source_file_id = ary[0];
        var linenumber = ary[1];

        // Materialize before opening colorbox
        materializeSourceFile(source_file_id);

        $('a.src_link[href="#' + source_file_id + '"]').colorbox({ open: true });
        if (linenumber !== undefined) {
          $('#cboxLoadedContent').scrollTop($('#cboxLoadedContent .source_table li[data-linenumber="' + linenumber + '"]')[0].offsetTop);
        }
      }
    }
  };

  // Hide src files and file list container after load
  $('.source_files').hide();
  $('.file_list_container').hide();

  // Add tabs based upon existing file_list_containers
  $('.file_list_container h2').each(function () {
    var container_id = $(this).parent().attr('id');
    var group_name = $(this).find('.group_name').first().html();
    var covered_percent = $(this).find('.covered_percent').first().html();

    $('.group_tabs').append('<li><a href="#' + container_id + '">' + group_name + ' (' + covered_percent + ')</a></li>');
  });

  $('.group_tabs a').each(function () {
    $(this).addClass($(this).attr('href').replace('#', ''));
  });

  // Make sure tabs don't get ugly focus borders when active
  $('.group_tabs').on('focus', 'a', function () { $(this).blur(); });

  var favicon_path = $('link[rel="icon"]').attr('href');
  $('.group_tabs').on('click', 'a', function () {
    if (!$(this).parent().hasClass('active')) {
      $('.group_tabs a').parent().removeClass('active');
      $(this).parent().addClass('active');
      $('.file_list_container').hide();
      $(".file_list_container" + $(this).attr('href')).show();
      window.location.href = window.location.href.split('#')[0] + $(this).attr('href').replace('#', '#_');

      // Force favicon reload - otherwise the location change containing anchor would drop the favicon...
      // Works only on firefox, but still... - Anyone know a better solution to force favicon on local file?
      $('link[rel="icon"]').remove();
      $('head').append('<link rel="icon" type="image/png" href="' + favicon_path + '" />');
    };
    return false;
  });

  if (window.location.hash) {
    var anchor = window.location.hash.substring(1);
    if (anchor.length === 40) {
      // Materialize before clicking
      materializeSourceFile(anchor);
      $('a.src_link[href="#' + anchor + '"]').click();
    } else if (anchor.length > 40) {
      var ary = anchor.split('-L');
      var source_file_id = ary[0];
      var linenumber = ary[1];

      // Materialize before opening colorbox
      materializeSourceFile(source_file_id);

      $('a.src_link[href="#' + source_file_id + '"]').colorbox({ open: true });
      // Scroll to anchor of linenumber
      $('#' + source_file_id + ' li[data-linenumber="' + linenumber + '"]').click();
    } else {
      $('.group_tabs a.' + anchor.replace('_', '')).click();
    }
  } else {
    $('.group_tabs a:first').click();
  };

  $("abbr.timeago").timeago();
  $('#loading').fadeOut();
  $('#wrapper').show();
  $('.dataTables_filter input').focus()
});
