jQuery(function($) {
  // Split wikiname into words
  var tmp = foswiki.getPreference('WIKINAME');
  tmp = tmp.match(/[A-Z][a-z]*/g);
  krzl = tmp.join(' ');

  $('#action_kuerzel').val(krzl);
  $('#action_zeiterfassung').click(function() {
    if ($('#action_zeiterfassung').is(':checked'))
      $('#statusChange').show();
    else
      $('#statusChange').hide();
  });

  $('#action_due_calendar').click(function() {
    return showCalendar('action_due', '%d %b %Y');
  });
});
