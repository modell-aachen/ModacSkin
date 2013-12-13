jQuery(function($){
    if(typeof foswiki != 'object') {
        if(console && console.log) {
            console.log("foswiki object not found");
        }
        return;
    }

    var ModacSkin = foswiki.ModacSkin = {
        // Default 'Message' for blocking with jQuery block.
        // Usually just a spinner of some sorts.
        blockDefaultOptions: {
            message: '<div class="ajaxspinner"></div>',
            css: {width: 'auto', height: 'auto'}
        },

        // Use this function to signal a busy-state.
        // Usually simply blocks the screen.
        blockUI : function() {
            var left = ($(window).width() / 2) - 33;
            var options = $.extend(true, {css: {left: left}}, ModacSkin.blockDefaultOptions);
            if($.blockUI) $.blockUI(options);
        },

        // Use this function to signal that you are no longer busy.
        unblockUI: function() {
            if($.unblockUI) $.unblockUI();
        },

    };

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

    // end copied from pattern.js


    $('.modacPersPageDaysFinishedSelect').livequery(function() {
        $(this).change(function() {
            var days = $(this).val();
            var url = $(this).metadata().url || '';
            url += days + ';t=' + (new Date()).getTime();
            url = url.replace(/\d+DAYS/, days + 'DAYS');
            var div = $('.tab_tasks_recently .jqTabContents');
            div.html('<span class="jqAjaxLoader">&nbsp;</span>');
            div.load(url);
        });
    });

    // quickSearch magnifying glass
    $('.modacSearchIcon').click(function() {
        var $form = $(this).closest('form');
        $form.find('#quickSearchBox').focus(); // clear foswikiDefaultText
        $form.submit();
    });

    // block UI on submit when message is provided
    $('.modacSubmitMessage').livequery(function() {
        var $message = $(this);
        $message.closest('form').submit(function() {
            if($.blockUI) $.blockUI({message: $message.text()});
        });
    });

    // handle modacjqWikiWord and modacjqWikiWordController
    $('.modacjqWikiWordController').livequery(function() {
        // This function will
        //    * grab all modacjqWikiWord inside the controller
        //       * make each modacjqWikiWord's child and make it a proper jqWikiWord
        //          * replace modacjqWikiWord by it's child (in the dom)
        //          * select all 'source' selectors relative to the controller
        //          * make sure each source has a unique id
        //          * rewrite each selector to that id
        //          * write the jqWikiWord options to modacjqWikiWord's child and make it a jqWikiWord
        //       * When the enclosing form is being submittet touch each source (to make sure jqWikiWord did it's job at least once)
        var $controller = $(this);
        var $form;
        if($controller.is('form')) {
            $form = $controller;
        } else {
            $form = $controller.closest('form');
        }
        $controller.find('.modacjqWikiWord').each(function(){
            var $this = $(this);
            var $child = $this.children().first();
            $this.replaceWith($child);
            var options = $this.metadata();
            var s = options.source;
            if(!s) return;
            var $s = $(s);
            var id = $s.attr('id');
            if(!id) {
                id = foswiki.getUniqueID();
                $s.attr('id', id);
            }
            options.source = '#'+id;
            if($this.hasClass('modacjqWikiWordTouch')) $form.submit(function() {
                $s.change();
            });
            $child.addClass(JSON.stringify(options));
            $child.addClass('jqWikiWord');
        });
    });

    // TopicMenue

    $('.jqmenu').supersubs({
        minWidth: 12, /* minimum width of sub-menus in em units */
        maxWidth: 30, /* maximum width of sub-menus in em units */
        extraWidth: 1 /* extra width can ensure lines don't sometimes turn over
                         due to slight rounding differences and font-family */
    });
    $('.jqmenu').superfish({
        autoArrows: false, /* Default arrow color is bad anyway */
        dropShadows: false, /* Those muck up our borders */
        delay:  500,
        disableHI: true
    });
    $('.jqmenu').bgIframe({opacity:false});
    var menuDialogs = {};
    var menuClickHandler = function(type) {
        if (menuDialogs[type]) {
            menuDialogs[type].dialog('open');
            return false;
        }
        var e = $(this);
        var restUri = foswiki.getPreference('SCRIPTURLPATH') +'/rest'+ foswiki.getPreference('SCRIPTSUFFIX');
        var baseWeb = foswiki.getPreference('WEB');
        var baseTopic = foswiki.getPreference('TOPIC');
        var jqplPubUri = foswiki.getPreference('PUBURLPATH') +'/'+ foswiki.getPreference('SYSTEMWEB') +'/JQueryPlugin';
        var d = $('<div class="jqUIDialog {width:500, position:\'center\', modal:true}" title="'+e.text()+'"><img src="'+ jqplPubUri +'/images/spinner.gif" alt="Loading..."/></div>');
        menuDialogs[type] = d;
        d.dialog({ create: function() {
            d.load(restUri +'/RenderPlugin/template?name=more;expand='+type+';render=1;topic='+baseWeb+'.'+encodeURIComponent(baseTopic), function() {
                var h2 = d.find('h2');
                if (!h2.length) return;
                d.dialog('option', 'title', h2.html());
                h2.remove();
            });
        } });
        return false;
    };
    $('.modacMoreDynamicLink a').click(function() { return false; });
    $('.morelink-prefs').click(function(){ $('#more_editpref_form').submit();return false; });
    $('.morelink-copy').click(function(){ return menuClickHandler('copy'); });
    $('.morelink-delete').click(function(){ return menuClickHandler('delete'); });
    $('.morelink-rename').click(function(){ return menuClickHandler('rename'); });
    $('.morelink-setparent').click(function(){ return menuClickHandler('setparent'); });

    // end TopicMenue
});

