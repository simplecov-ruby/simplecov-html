//= require_directory ./libraries/
//= require_directory ./plugins/
//= require_self

$(document).ready(function () {
  $('.file_list').dataTable({
    order: [[1, "asc"]],
    paging: false
  });

  // Syntax highlight all files up front - deactivated
  // $('.source_table pre code').each(function(i, e) {hljs.highlightBlock(e, '  ')});

  // Syntax highlight source files on first toggle of the file view popup
  $("a.src_link").click(function () {
    // Get the source file element that corresponds to the clicked element
    var source_table = $($(this).attr('href'));

    // If not highlighted yet, do it!
    if (!source_table.hasClass('highlighted')) {
      source_table.find('pre code').each(function (i, e) { hljs.highlightBlock(e, '  ') });
      source_table.addClass('highlighted');
    };
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
    },
    onComplete: function (a, b, c) {
      var hash = a.el.hash
      var sourceCode = $(hash)
      var minDistance = 0
      var maxDistance = sourceCode.height();
      var distance = 100
      var onScroll = function(event) {
        distance = $(hash).position().top * -1
        console.log('set distance', distance, event.isDefaultPrevented())
      }
      var $parentDiv = $('#cboxLoadedContent')

      $parentDiv.on('scroll', onScroll)

      var scrollDown = function () {
        $parentDiv.off('scroll')
        if (distance >= maxDistance) {
          distance = maxDistance + 100
        }
        if (distance < 100) {
          distance = 100
        }
        console.log('down', distance, maxDistance)

        $parentDiv.animate({ scrollTop:  distance }, { duration: 0, complete: function () {
          console.log('down done', distance)
          distance += 100;
          setTimeout(function() {
            $parentDiv.on('scroll', onScroll)
          }, 1000)
        }});
      }

      var scrollUp = function () {
        $parentDiv.off('scroll')
        if (distance <= minDistance) {
          distance = 0
          return
        }

        $parentDiv.animate({ scrollTop:  distance }, { duration: 0, complete: function () {
          console.log('up done', distance)
          distance -= 100;
          setTimeout(function() {
            $parentDiv.on('scroll', onScroll)
          }, 1000)
        }});
      }

      $('#colorbox').on('keydown', function (evt) {
        if (evt.keyCode == 40) { // down arrow
          evt.preventDefault(); // prevents the usual scrolling behaviour
          scrollDown()
        } else if (evt.keyCode == 38) { // up arrow
          evt.preventDefault();
          scrollUp()
        }
      })
    },
    onClosed: function (a, b, c) {
      $('#colorbox').off('keydown')
      $('#cboxLoadedContent').off('scroll')
    }
  });

  window.onpopstate = function (event) {
    if (window.location.hash.substring(0, 2) == "#_") {
      $.colorbox.close();
      curr_anchor = window.location.hash.substring(1);
    } else {
      if ($('#colorbox').is(':hidden')) {
        $('a.src_link[href="' + window.location.hash + '"]').colorbox({ open: true });
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

  var favicon_path = $('link[rel="shortcut icon"]').attr('href');
  $('.group_tabs').on('click', 'a', function () {
    if (!$(this).parent().hasClass('active')) {
      $('.group_tabs a').parent().removeClass('active');
      $(this).parent().addClass('active');
      $('.file_list_container').hide();
      $(".file_list_container" + $(this).attr('href')).show();
      window.location.href = window.location.href.split('#')[0] + $(this).attr('href').replace('#', '#_');

      // Force favicon reload - otherwise the location change containing anchor would drop the favicon...
      // Works only on firefox, but still... - Anyone know a better solution to force favicon on local file?
      $('link[rel="shortcut icon"]').remove();
      $('head').append('<link rel="shortcut icon" type="image/png" href="' + favicon_path + '" />');
    };
    return false;
  });

  if (window.location.hash) {
    var anchor = window.location.hash.substring(1);
    if (anchor.length == 40) {
      $('a.src_link[href="#' + anchor + '"]').click();
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
