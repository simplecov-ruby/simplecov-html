jQuery.fn.dataTableExt.oSort['percent-asc']  = function(a,b) {
	var x = (a == "-") ? 0 : a.replace( /%/, "" );
	var y = (b == "-") ? 0 : b.replace( /%/, "" );
	x = parseFloat( x );
	y = parseFloat( y );
	return ((x < y) ? -1 : ((x > y) ?  1 : 0));
};

jQuery.fn.dataTableExt.oSort['percent-desc'] = function(a,b) {
	var x = (a == "-") ? 0 : a.replace( /%/, "" );
	var y = (b == "-") ? 0 : b.replace( /%/, "" );
	x = parseFloat( x );
	y = parseFloat( y );
	return ((x < y) ?  1 : ((x > y) ? -1 : 0));
};


$(document).ready(function() {
  $('.src_link').click(function(){
    $.scrollTo( $($(this).attr('href')), 800 );
    return false;
  });
  
  $('#overview').dataTable({
    "aaSorting": [[ 1, "asc" ]],
    "bPaginate": false,
    "aoColumns": [
			null,
		  { "sType": "percent" },
			null,
			null,
			null
		]
  });
});
