jQuery(function($) {
    $('.modacNewTab').each(function() {
        var $this = $(this);
        var target = $this.attr('data-modac-target');
        if(!target) target = '_blank';
        $this.find('a,area').each(function() {
            var $this = $(this);
            if(!$this.attr('target')) $this.attr('target', target);
        });
    });
});
