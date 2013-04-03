jQuery(function($) {
  var krzl = foswiki.getPreference('WIKINAME');

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
