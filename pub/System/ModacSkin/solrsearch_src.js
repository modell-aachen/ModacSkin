// this will deal with browsers that do not understand the hashtag in links
if(window.location.hash == '') {
    var ht=/\?htag=(.*)/.exec(window.location.href);
    if(ht && ht[1]) window.location.hash=ht[1];
}
jQuery(function($){
    // for displaying language flags on SolrSearch pages
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
