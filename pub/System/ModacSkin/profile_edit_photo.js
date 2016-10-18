$(document).ready(function() {
    var dirty = 0;
    $('.foswikiInputField:not(#quickSearchBox), .foswikiSelect, .foswikiTextarea').change(function() {
        dirty = 1;
        console.log('changed');
    });
    $('#upload_foto_button').on('click', function() {
        var attachment_url = foswiki.preferences.SCRIPTURLPATH + "/attach/" + foswiki.preferences.WEB + "/" + foswiki.preferences.TOPIC;
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