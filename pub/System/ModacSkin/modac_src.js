jQuery(function($){
    // Auto-submit autocomplete fields depending on class
    (function($tosubmit) {
        $tosubmit.on('autocompleteselect', function(e, ui) { $(this).val(ui.item.value).closest('form').submit(); });
    })($('.solrSearchField, .modacAutoSubmit'));

    // Code below copied from pattern.js
    // (Search-specific stuff removed because we're using SolrSearch anyway)

    // Mark a form step with a hoopy styled character
    $("div.foswikiFormStep h3").each(
        function(index, el) {
            $(el).before(
                '<span class="foswikiActionFormStepSign">&#9658;</span>'
                );
        });

    // Create an attachment counter in the attachment table twisty.
    $('div.foswikiAttachments')
        .each(
            function(index, el) {
                // Fixed version of what's in pattern.js
                var count = $(el).find('table.foswikiTable tr').length - 1;
                var countStr = " <span class='foswikiSmall'>"
                    + count + "<\/span>";
                $(el).find('.patternAttachmentHeader').each(
                    function(index, el) {
                        $(el).append(countStr);
                    });
            }
        );

    $('input.foswikiFocus').each(
        function(index, el) {
            el.focus();
        });

    $('input.foswikiChangeFormButton').click(
        function(e) {
            if (foswiki.Edit)
                foswiki.Edit.validateSuppressed = true;
        });

    $('body.patternEditPage input').keydown(
        function(event) {
            if(event.keyCode == 13) {
              return false;
            }
        });

});

