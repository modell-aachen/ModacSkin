jQuery(function($){
    // copy query to solrSearchForm and submit that
    $('#modacSearchBox form').submit(function(){
        var $searchbox = $('#quickSearchBox');
        var $searchfield = $('.solrSearchField');
        var $forms = $('.solrSearchForm');
        if($searchbox.length == 0 || $searchfield.length == 0 || $forms == 0) {
            // this script won't work, fallback to submit of modacSearchBox
            return;
        }
        // Copy
        var query = $searchbox.val();
        $searchfield.val(query);
        // Submit solrSearchForm and inhibit submit of quickSearchBox
        $forms[0].submit(); // XXX could there be multiple?!?
        return false;
    });
});
