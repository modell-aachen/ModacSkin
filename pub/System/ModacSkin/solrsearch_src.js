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
    }
});
