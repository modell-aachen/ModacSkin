jQuery(function($){
    if ($('.modacMoreDynamic').length == 0) return;
    $('.jqmenu').supersubs({
        minWidth: 12, /* minimum width of sub-menus in em units */
        maxWidth: 30, /* maximum width of sub-menus in em units */
        extraWidth: 1 /* extra width can ensure lines don't sometimes turn over
                         due to slight rounding differences and font-family */
    });
    $('.jqmenu').superfish({
        autoArrows: false, /* Default arrow color is bad anyway */
        dropShadows: false, /* Those muck up our borders */
        delay:  500
    });
    $('.jqmenu').bgIframe({opacity:false});
    var restUri = foswiki.getPreference('SCRIPTURLPATH') +'/rest'+ foswiki.getPreference('SCRIPTSUFFIX');
    var baseWeb = foswiki.getPreference('WEB');
    var baseTopic = foswiki.getPreference('TOPIC');
    var jqplPubUri = foswiki.getPreference('PUBURLPATH') +'/'+ foswiki.getPreference('SYSTEMWEB') +'/JQueryPlugin';
    var menuDialogs = {};
    var menuClickHandler = function(type) {
        var e = $(this);
        if (menuDialogs[type]) {
            menuDialogs[type].dialog('open');
            return false;
        }
        var d = $('<div class="jqUIDialog {width:500, position:\'center\', modal:true}" title="'+e.text()+'"><img src="'+ jqplPubUri +'/images/spinner.gif" alt="Loading..."/></div>');
        menuDialogs[type] = d;
        d.dialog({ create: function() {
            d.load(restUri +'/RenderPlugin/template?name=more;expand='+type+';render=1;topic='+baseWeb+'.'+baseTopic, function() {
                var h2 = d.find('h2');
                if (!h2.length) return;
                d.dialog('option', 'title', h2.html());
                h2.remove();
            });
        } });
        return false;
    };
    $('.modacMoreDynamic > a').click(function() { return false; });
    $('.morelink-prefs').click(function(){ $('#more_editpref_form').submit();return false; });
    $('.morelink-copy').click(function(){ return menuClickHandler('copy'); });
    $('.morelink-delete').click(function(){ return menuClickHandler('delete'); });
    $('.morelink-rename').click(function(){ return menuClickHandler('rename'); });
    $('.morelink-setparent').click(function(){ return menuClickHandler('setparent'); });
    $('#quickSearchBox, .solrSearchField').autocomplete({select: function(e, ui) { e.target.value = ui.item.value; e.target.form.submit(); }});
});
