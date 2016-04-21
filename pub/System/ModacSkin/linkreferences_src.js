jQuery(function($){
    if(!(foswiki && foswiki.ModacContextMenuPlugin && foswiki.ModacContextMenuPlugin.addEntry)) return;

    var getFilename = function(opts) {
        var $trigger = opts.$trigger;
        if(!$trigger || !$trigger.attr) return;
        var href = $trigger.attr('href');
        var file = href.replace(/.*\//,'');
        if(!file) {
            if(console && console.log) console.log("Could not determine filename in '" + href+"'");
            return;
        }
        return file;
    }

    var showDialog = function(data, title) {
        var $data = $("<div></div>").append(data);
        $data.attr('class', "jqUIDialog {autoOpen: true, modal: true, closeOnEscape: true, width: '400px', title:'"+title+"'}");
        $data.hide();
        $('body').append($data);
    }

    var entry = {
        name: 'Search for references',
        icon: 'link',
        lockable: false,
        honorsKVP: false,
        disabled: false,
        callback: function(key, opts) {
            var filename = getFilename(opts);

            var url = foswiki.getPreference('SCRIPTURLPATH') + '/rest' + foswiki.getPreference('SCRIPTSUFFIX') + '/RenderPlugin/tag?name=SOLRSEARCH&render=1&param=' + 'type:topic+outgoingAttachment_lst:' + encodeURIComponent(foswiki.getPreference('WEB').replace('/', '.')) + '.' + encodeURIComponent(foswiki.getPreference('TOPIC')) + '/' + encodeURIComponent(filename) + '&format=' + encodeURI('[[$webtopic]]&separator=$n');

            $.blockUI && $.blockUI();

            $.ajax({
                url: url,
                success: function(data, textstatus, xhr){
                    data = data.replace(/^ +/, '').replace(/ +$/, '');
                    var list = data.split('\n');
                    var dialog;
                    if(data.length && list.length) {
                        dialog = '<p>Found references in these topics:</p><p>' + list.join('<br/>') + '</p>';
                    } else {
                        dialog = 'No references found';
                    }
                    $.unblockUI && $.unblockUI();
                    showDialog(dialog, 'References for ' + filename);
                }
            });
        }
    };
    foswiki.ModacContextMenuPlugin.addEntry(entry, entry);
});
