// Manipulating the hashtag for solr filters.
// Execute this before solr's js does it's thing -> do not use jQuery.
// This will deal with browsers that do not understand the hashtag in links.
if(window.location.hash == '') {
    var ht=/\?htag=(.*)/.exec(window.location.href);
    if(ht && ht[1]) window.location.hash=ht[1];
}

// Helper functions on search page:
jQuery(function($){
    // For displaying language flags on SolrSearch pages.
    modacSolr = {
        lang: function(language){
            if(typeof(language)==='undefined') return '';
            var flag, name;
            if(language === 'de') { flag='de'; name='German'; }
            else if(language === 'en') { flag='gb'; name='English'; }
            else if(language === 'fr') { flag='fr'; name='French'; }
            if(!flag) return '';
            return "<img class='modacFlag' src='"+foswiki.getPreference('PUBURLPATH')+"/"+foswiki.getPreference('SYSTEMWEB')+"/FamFamFamFlagIcons/"+flag+".png' title='"+jsi18n.get('solr', name)+"' />";
        }
    };

    // To allow pseudo facets with checkboxes/radios
    // Will append the selected options to the url and reload the page.
    // The template will have to react to the options.
    $('input.modacPseudoFacet:radio, input.modacPseudoFacet:checkbox').change(function(){
        var $this = $(this);
        var params; // the "parameter part" of the uri (anything between ? and #)
        var separator; // the character that separates the parameters (, or &)

        // rewrites params to include/remove the input
        var parameterize = function(){
            var $input = $(this);
            var name = $input.attr('name');
            var string = name + '=' + encodeURIComponent($input.val());
            params = params.replace(string, '');
            if($input.attr('checked')) {
                if(params) params += separator;
                params += string;
            }
        };

        params = new String(window.location);
        params = params.replace(/#.*/, '').replace(/^[^?]*\??/, '');
        separator = (/;/.exec(params))?';':'&';

        $('input.modacPseudoFacet:radio,input.modacPseudoFacet:checkbox').each(parameterize);
        params = params.replace(new RegExp('^'+separator+'+|'+separator+'{2,}', 'g'), '');
        if(params.length) params = '?' + params;
        var loc = foswiki.getPreference('SCRIPTURL') + '/view' + foswiki.getPreference('SCRIPTSUFFIX') + '/' + foswiki.getPreference('WEB') + '/' + foswiki.getPreference('TOPIC') + params + window.location.hash;
        window.location = loc;
        return true;
    });
});
