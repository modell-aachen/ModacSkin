$(document).ready(function() {
    var dirty = 0;
    $('.foswikiInputField:not(#quickSearchBox), .foswikiSelect, .foswikiTextarea').change(function() {
        dirty = 1;
    });
    $('#upload_foto_button').on('click', function() {
        var attachment_url = foswiki.getScriptUrl('attach/') + foswiki.getPreference('WEB') + "/" + foswiki.getPreference('TOPIC');
        if(dirty) {
            var ok = confirm(jsi18n.get('edit', "You have unsaved changes which will be lost if you upload a foto now. Proceed?"));
            if(ok) {
                window.location = attachment_url;
            }
        } else {
            window.location = attachment_url;
        }
        return false;
    });
});