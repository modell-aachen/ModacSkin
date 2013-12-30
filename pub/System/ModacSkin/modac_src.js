jQuery(function($){
    if(typeof foswiki != 'object') {
        if(console && console.log) {
            console.log("foswiki object not found");
        }
        return;
    }

    var ModacSkin = foswiki.ModacSkin = {
        // Creates a string to use with jQuery's UI Dialog widget.
        // Just add this string to the dom and you'll get a dialog.
        //
        // Parameters:
        //    * options: overrides the default options used for ModacSkin
        makeDialogString : function(options) {
            if(options === undefined) {
                options = {};
            }
            return '<div class="jqUIDialog {width:' + ((options.width!==undefined)?options.width:'600') +
                ', modal:' + ((options.modal!==undefined)?options.modal:'true') +
                ',draggable:' + ((options.draggable!==undefined)?options.draggable:'true') +
                ',autoOpen:' + ((options.autoOpen!==undefined)?options.autoOpen:'true') +
                ',resizable:' + ((options.resizable!==undefined)?options.resizable:'true') +
                ',closeOnEscape:' + ((options.closeOnEscape!==undefined)?options.closeOnEscape:'true') +
                ((options.title!==undefined)?(',title:\''+options.title.replace("'","\\'")+'\''):'') +
                '} '+((options.dialogClass!==undefined)?options.dialogClass:'modacAjaxDialog')+'"></div>';
        },

        // Display data with forms as a dialog.
        // Creates dialog, takes care of the buttons and title, unblock screen.
        // If there is no .modacDialogContents the first h2 element will be used
        // as title.
        //
        // Parameters:
        //    * data: html of the contents to be displayed
        //    * beforeInit($contents, $dialog): callback function that will be
        //       executed before the dialog will be shown.
        //       callback parameters:
        //          * $contents: jQuery object of the contents of the dialog
        //          * $dialog: dialog object
        //    * $loadingDialog: this dialog will be closed when the new dialog
        //       is beeing shown. If the dialog has been closed in the mean time
        //       the new dialog will not be shown.
        //    * options: overwrite the default options for the dialog
        showDialog : function(data, beforeInit, $loadingDialog, options) {
            var $data = $('<div ></div>').append(data);

            var $contents = $data.find('.modacDialogContents');
            if($contents.length) {
                options.title = $data.find('.modacDialogTitle').remove().html();
            } else {
                options.title = $data.find('h2:first').remove().text();
                $contents = $('<div class="modacDialogContents"></div>').append($data);
            }

            // hide buttons
            $data.find('.patternTopicAction').hide();

            options.autoOpen = 'true';
            if($loadingDialog !== undefined) {
                try {
                    if($loadingDialog.dialog('isOpen')) {
                        $loadingDialog.dialog('close');
                    } else {
                        options.autoOpen = 'false';
                    }
                } catch(err) {
                    // dialog not yet initialized
                    $loadingDialog.on('dialogshow', function(){$loadingDialog.dialog('close');});
                }
                $loadingDialog.remove();
            }
            var $dialog = $(ModacSkin.makeDialogString(options)).hide();
            $dialog.append($contents);
            var inited = false;
            $dialog.on('dialogopen', function(){
                if(inited) return;
                inited = true;
                if(typeof beforeInit === 'function') beforeInit($contents, $dialog);
                ModacSkin.ajaxSubmitButtons($contents,$dialog);
            });
            $dialog.find('.modacHideDialog').hide();
            $('body').append($dialog);
            ModacSkin.unblockUI();
            return $dialog;
        },

        // Prepares data received from an ajax-call for display in a dialog:
        //    * creates buttons
        //    * submit form for corresponding buttons
        //
        // You usually want ModacSkin.showDialog instead of this method.
        //
        // This function should be called when the dialog is already in the dom
        // (on dialogopen).
        //
        // Parameters:
        //    * $data: data to be displayed in the dialog
        //    * $dialog: a dialog object already in the dom
        // All parameters must be jQuery-objects.
        ajaxSubmitButtons: function($data, $dialog) {
            // Prepare buttons:
            //    * pull jqUIDialogButtons from $data and put them to the button
            //      area of the $dialog, just like the jqDialog initializer does
            //    * pull <input type="submit"...> and turn them into buttons
            //      (using modacDialogDefaults)
            //    * add a 'cancel' button if there is no button with
            //      cancel/closing functionality (using modacDialogDefaults)
            //    * remaining topicactionbuttons will be hidden
            //
            // Submit form:
            //    * a jqUIDialogSubmit button will submit $form
            //    * if a input:submit has the name action_cancel or action_save
            //      the submitted form will receive a correspondig input.
            var buttons = $dialog.dialog('option', 'buttons');
            if(!buttons || !buttons.push) buttons = [];
            var closable = buttons.length; // is there a button with cancel/close function
                                           // XXX assuming if there are already buttons, they can close the dialog
            $data.find('.jqUIDialogButton, .modacDialogButton input:submit, .patternTopicAction input:submit, #foswikiLogin input:submit').each(function(){
                var $this = $(this);
                var button = {};
                $.extend(button, $this.metadata());
                button.text = $this.text();
                (function($formClosure){
                    // block on submit; it doesn't need unblocking, since a new page will be loaded
                    $formClosure.submit(function(){
                        if($formClosure.hasClass('noBlock')) return;
                        // if there is .modacSubmitMessage, another script will block
                        if($formClosure.find('.modacSubmitMessage').length == 0) ModacSkin.blockUI();
                        // close dialog, but don't let close-handler submit again
                        $dialog.addClass('submitting');
                        if($dialog.dialog('isOpen')) {
                            $dialog.dialog('close');
                        }
                    });

                    if($this.is('.jqUIDialogClose')) {
                        closable = true;
                        button.click = function() {
                            $dialog.dialog('close');
                        };
                    } else if($this.is('input:submit')) {
                        button.text = $this.val();
                        var type = 'dialogOK';

                        if($this.attr('name') === 'action_cancel') {
                            closable = true;
                            type = 'dialogClose';
                            $formClosure.submit(function(){
                                var $this = $(this);
                                if($this.find('input[name="action_save"]').length === 0) {
                                    $this.append('<input type="hidden" name="action_cancel" value="Cancel" />');
                                }
                            });
                            $dialog.on('dialogclose', function() {
                                // submit to clear the lease - unless we're already submitting
                                if(!$dialog.hasClass('submitting')) $formClosure.submit();
                                return true;
                            });
                            button.click = function(){
                                $formClosure.submit();
                            };
                        } else if($this.attr('name') === 'action_save') {
                            button.click = function(){
                                $formClosure.append('<input type="hidden" name="action_save" value="Save" />');
                                $formClosure.submit();
                            }
                        } else {
                            button.click = function(){
                                $formClosure.submit();
                            };
                        }
                        var $def = $data.find('.modacDialogDefaults .' + type);
                        if($def.length) {
                            if(!button.text) {
                                button.text = $def.html();
                            }
                            $.extend(button, $def.metadata());
                        }
                    } else if($this.is('.jqUIDialogSubmit')) {
                        button.click = function() {
                            $formClosure.submit();
                        }
                    } else {
                        var href = $this.attr('href');
                        if(typeof(href) !== 'undefined' && href !== '#') {
                            button.click = function() {
                                window.location.href = href;
                            };
                        }
                    }
                })($this.closest('form'));
                $this.remove();
                buttons.push(button);
            });
            // Make sure this dialog can be closed
            if(!closable) {
                var button = {text: 'close', click: function(){$dialog.dialog('close');}};
                var $def = $data.find('.modacDialogDefaults .dialogClose');
                if($def.length) {
                    button.text = $def.html();
                    $.extend(button, $def.metadata());
                }
                buttons.push(button);
            }
            // Add buttons
            if(buttons.length) {
                $dialog.dialog('option', 'buttons', buttons);
            }
        },

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

        // Use this as callback when fetching data for dialogs in order to deal
        // with logins.
        //
        // Parameters:
        //    * callback(data, textStatus, jqXHR, $data): function to be called
        //       upon successful ajax fetch
        //       callback parameters:
        //          * data: fetched data
        //          * textStatus: status message
        //          * jqXHR: jQuery XHR object
        //          * $data: jQuery object with parsed data
        //    * $loading: dialog to be closed when login-box appears
        handleLogin : function(callback, $loading) {
            return function(data, textStatus, jqXHR) {
                var $data = $(data);
                var $login = $data.find('#foswikiLogin');
                if(!$login.length) {
                    return callback(data, textStatus, jqXHR, $data);
                }
                var $form = $login.find('form:first');
                $login.append($data.find('.modacDialogDefaults')); // this will not be inside the form
                var $logindialog = ModacSkin.showDialog($login, function($data,$dialog){
                    $form.ajaxForm({
                        beforeSubmit: function(){
                            $dialog.dialog('close');
                            if($loading) {
                                $loading.dialog('open');
                            } else {
                                ModacSkin.blockUI();
                            }
                        },
                        success: ModacSkin.handleLogin(callback, $loading)
                    });
                    $dialog.on('dialogclose', function(){
                        $dialog.remove();
                        if($loading) $loading.remove();
                    });
                    if($loading) $loading.dialog('close');
                }, undefined, {});
            };
        },

        // WebCreateNewTopic-Links
        wcntHandler : function(ev) {
            // from http://stackoverflow.com/questions/901115/how-can-i-get-query-string-values
            function getParameterByName(href, name) {
                name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
                var regex = new RegExp("[\\?&;]" + name + "=([^&#;]*)"),
                    results = regex.exec(href);
                return results == null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
            }

            // prepare the input fields
            //    * hide non-used fields
            //    * set values
            //    * reload templates if needed
            //    * add InputsPreparedFlag when finished
            function prepareInputs() {
                var $dialog = jQuery('#modacWCNTDialog');
                var wcntInfo = $dialog.data('wcntInfo');
                if(wcntInfo === undefined) {
                    if(console && console.log) {
                        console.log("No wcntInfo!");
                    }
                    return;
                }
                var newtopictitle=wcntInfo.newtopictitle;
                var newtopic=wcntInfo.newtopic || '';
                var newweb=wcntInfo.newweb;

                var active,inactive;
                if(newtopic) {
                    active=jQuery('.topic_static');
                    inactive=jQuery('.topic_manual');
                    active.find('.inputName').val(newtopic);
                } else {
                    active=jQuery('.topic_manual');
                    inactive=jQuery('.topic_static');
                }
                active.find('.inputName').attr('name', 'topic').attr('id', 'topic_');
                inactive.find('.inputName').attr('name', 'topicname_disabled').attr('id', 'topic_disabled');
                active.find('.inputName').attr('id', 'topic');
                active.show();
                inactive.hide();
                // touch the input field so jqWikiWord does it's job
                jQuery('#topictitle').val(newtopictitle).change();

                // reload template selector if required
                var templatesWeb = $dialog.data('templatesWeb');
                if(newweb !== templatesWeb) {
                    var $tmpl = $dialog.find('.modacTopicTemplate');
                    if($tmpl.block) $tmpl.block(ModacSkin.blockDefaultOptions);
                    $tmpl.load(
                        $dialog.data('restUri') + '/RenderPlugin/template?name=WebCreateNewTopicDialog;render=on;expand=topictemplatestep;topic=' + (newtopic || newweb + '.WebHome') // the topic doesn't matter so just make it 'WebHome'
                    );
                    $dialog.data('templatesWeb', newweb);
                }
                $dialog.addClass('InputsPrepared');
            }
            // Reset dialog for preparation
            function unprepareInputs() {
                var $dialog = jQuery('#modacWCNTDialog');
                $dialog.removeClass('InputsPrepared');
            }

            var $target = $(ev.target);
            var $dialogID = $('#modacWCNTDialog');

            // Extract data from link
            var newtopic = getParameterByName($target.attr('href'), 'newtopic');
            var newweb = /^(.*)\.|\//.exec(newtopic);
            if(newweb) {
                newweb=newweb[1];
            } else {
                newweb = foswiki.getPreference('WEB');
            }
            var infodata = {
                newtopic: newtopic,
                newweb: newweb,
                newtopictitle: getParameterByName($target.attr('href'), 'newtopictitle'),
                topicparent: getParameterByName($target.attr('href'), 'topicparent')
            }

            if($dialogID.length == 0) {
                var baseWebTopic;
                if(infodata.newtopic) {
                    baseWebTopic = infodata.newtopic;
                    if(baseWebTopic.indexOf('.') < 0) baseWebTopic = encodeURIComponent(foswiki.getPreference('WEB'))+'.'+baseWebTopic; // Make sure there is a web or the rest call will fail
                } else {
                    baseWebTopic = encodeURIComponent(newweb + '.' + foswiki.getPreference('TOPIC'));
                }

                ModacSkin.blockUI();
                var restUri = foswiki.getPreference('SCRIPTURL') +'/rest'+ foswiki.getPreference('SCRIPTSUFFIX');
                $.ajax(restUri + '/RenderPlugin/template?name=WebCreateNewTopicDialog;render=on;expand=dialog;topic=' + baseWebTopic + ';topicparent='+baseWebTopic, {
                    success: function(data) {
                        ModacSkin.showDialog(data, function($data, $dialog) {
                                var $form = $dialog.find('form');
                                $form.submit(function() {
                                    if($dialog.block) $dialog.block(ModacSkin.blockDefaultOptions);
                                    jQuery('#inputtopic').change(); // make sure new topic name is beeing copied
                                });

                                $dialog.attr('id', 'modacWCNTDialog');

                                // store stuff
                                $dialog.data('templatesWeb', newweb);
                                $dialog.data('restUri', restUri);
                                $dialog.data('wcntInfo', infodata);

                                $dialog.on('dialogopen', prepareInputs);
                                $dialog.on('dialogclose', unprepareInputs);
                                prepareInputs(); // dialog is already open, so dialogopen won't fire
                            }, undefined, {});
                    }
                });
            } else {
                // Link was clicked before, copy new data and show it again
                $dialogID.data('wcntInfo', infodata);
                if($dialogID.dialog("isOpen")) {
                    // however this has happened
                    // close the dialog so it will readout new web.topic
                    $dialogID.dialog("close");
                }
                $dialogID.dialog("open");
            }

            // alrighty, inhibit the click
            return false;
        },

        // Cache for called TopicMenue dialogs
        menuDialogs: {},

        // Handles .morelink-* in topic menue.
        //    * creates dialogs for "More topic actions" items
        //    * caches the dialogs
        //    * prepends modacdialog skin
        //    * fetches correct sections
        //    * takes care of forms and links in dialogs
        //    * fetches contents for modacDialogAppendable
        //    * refetches contents when .modacDialogFire was clicked
        menuClickHandler: function(type) {
            if (ModacSkin.menuDialogs[type]) {
                ModacSkin.menuDialogs[type].dialog('open');
                return false;
            }
            var e = $(this);
            var restUri = foswiki.getPreference('SCRIPTURLPATH') +'/rest'+ foswiki.getPreference('SCRIPTSUFFIX');
            var baseWeb = foswiki.getPreference('WEB');
            var baseTopic = foswiki.getPreference('TOPIC');
            var jqplPubUri = foswiki.getPreference('PUBURLPATH') +'/'+ foswiki.getPreference('SYSTEMWEB') +'/JQueryPlugin';
            var skin = 'modacdialog,'+foswiki.getPreference('SKIN');
            var d;
            ModacSkin.blockUI();
            $.ajax(
                restUri +'/RenderPlugin/template?name=more;expand='+type+';render=1;topic='+baseWeb+'.'+encodeURIComponent(baseTopic) + ';skin=' + skin,
                {
                    success: ModacSkin.handleLogin(function(data, textStatus, jqXHR, $data) {
                        var d;
                        $data.find('a').click(function(ev){
                            var $target = $(ev.target);
                            var param = /[^?]*(\?.*name=more;expand=.*)/.exec($target.attr('href'));
                            if(!param || param.length != 2) return true;
                            if(d.block) {
                                d.block();
                                d.siblings('.ui-dialog-buttonpane').block({message: ''});
                            }
                            d.dialog('option', 'buttons', []);
                            d.load(restUri +'/RenderPlugin/template' + param[1], function(){
                                var $form = d.find('form:first');
                                ModacSkin.ajaxSubmitButtons(d, d, $form);
                                $form.submit(function(){
                                    // if !modacSubmitMessage blockUI
                                    // better do a handler for succesfull ajax
                                    if(d.block) {
                                        d.block();
                                        d.siblings('.ui-dialog-buttonpane').block(ModacSkin.blockDefaultOptions);
                                    }
                                });
                                if(d.dialog('isOpen')) {
                                    d.dialog('close');
                                    d.dialog('open');
                                }
                            });
                            return false;
                        });
                        var ajax = $data.find('.modacDialogAppendable');
                        if(ajax.length) {
                            var handleOops = function(jqXHR, status, errorThrown){
                                var response = $(jqXHR.responseText).find('.modacDialogContents');
                                if(response.length == 0) response = $(jqXHR.responseText).find('.foswikiTopic');
                                ModacSkin.menuDialogs[type] = $loadingDialog = ModacSkin.showDialog(response, function($data,$dialog){
                                    $data.find('form').ajaxForm({success: handleSuccess, error: handleOops});
                                }, undefined, {});
                            };
                            var handleSuccess = function(adata, status, jqXHR){
                                var $adata = $(adata);
                                var $contents = $adata.find(".modacDialogContents");
                                if($contents.length) {
                                    $contents.removeClass('modacDialogContents');
                                } else {
                                    $contents = $adata.find(".foswikiTopic");
                                    if(!$contents.length) {
                                        $contents = 'error...'; // XXX
                                    }
                                }
                                ajaxArea.replaceWith($contents);
                                ajaxArea = $contents;

                                // Copying select all/none from foswikiForm, because it only binds on document.ready
                                ajaxArea.find('.foswikiCheckAllOn').click(
                                    function(e) {
                                        var form = $(this).parents('form:first');
                                        $('.foswikiCheckBox', form).attr('checked', true);
                                    }
                                );
                                ajaxArea.find('.foswikiCheckAllOff').click(
                                    function(e) {
                                        var form = $(this).parents('form:first');
                                        $('.foswikiCheckBox', form).attr('checked', false);
                                    }
                                );

                                d = ModacSkin.menuDialogs[type] = ModacSkin.showDialog($data, undefined, ModacSkin.menuDialogs[type], {});
                            };
                            var ajaxArea = $('<div class="modacAjaxDialog"><div style="height: 150px; width: 200 px;"></div></div>');
                            ajax.before(ajaxArea);
                            ajax.append($('<input type="hidden" name="skin" value="' + skin + '" />'));
                            ajax.ajaxForm({
                                error: handleOops,
                                success: function(jqXHR, s, errorThrown) {(ModacSkin.handleLogin(handleSuccess, d))(jqXHR,s,errorThrown)}
                            });
                            ajax.submit(function(){
                                // Only block the dialog, not the whole page.
                                // It won't need unblocking, since a new dialog will be created.
                                if(d && d.block) {
                                    d.block(ModacSkin.blockDefaultOptions);
                                    d.siblings('.ui-dialog-buttonpane').block({message: ''});
                                }
                            });
                            ajax.submit();
                            $data.find('.modacDialogFire').change(function(){ajax.submit();});
                        } else {
                            d = ModacSkin.menuDialogs[type] = ModacSkin.showDialog($data, undefined, undefined, {});
                        }
                    })
                }
            );

            return false;
        },

        // Handles clicks on "More topic actions" items
        //    * inserts strikeone if needed
        //    * calls menuClickHandler if morelink-... was clicked
        //    * creates a dialog for other dialogable items
        //       * prepends modacdialog skin
        dialogCallback: function(){
            var $this = $(this);

            // make sure strikeone is present
            // I don't like this.
            if(typeof StrikeOne !== 'object') {
                $('head').append('<script type="text/javascript" src="' + foswiki.getPreference('PUBURLPATH') + '/' + foswiki.getPreference('SYSTEMWEB') + '/JavascriptFiles/strikeone.js"></script>');
            }

            var classes = $this.attr('class');
            var matches = /morelink-([a-z]+)/.exec(classes);
            if(matches) {
                return ModacSkin.menuClickHandler(matches[1]);
            }
            var $loading;
            ModacSkin.blockUI();
            var href = $this.find('a:first').attr('href');
            href += (href.indexOf('?') > 0?';':'?') + 'skin=modacdialog,'+foswiki.getPreference('SKIN');
            $.ajax({
                url: href,
                success: ModacSkin.handleLogin(function(data, st, jq, $data){
                    var title = $data.find('div.modacDialogTitle').remove().text();
                    var $form = $data.find('form:first');
                    ModacSkin.showDialog($data, undefined, $loading, {
                        width:$('#modacContents').width(),
                        title: title,
                        closeOnEscape: (href.match('^(?:'+foswiki.getPreference('SCRIPTURLPATH')+'|'+foswiki.getPreference('SCRIPTURL')+')'+foswiki.getPreference('SCRIPTSUFFIX')+'/edit/'))?false:true
                    });
                }, $loading),
                error: function(jqXHR, statusmsg) {
                    ModacSkin.showDialog('<span class="foswikiAlert">' + statusmsg + " fetching " + $this.attr('href') + '</span>', undefined, $loading, {});
                }
            });
            return false;
        }
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

    // attach WCNThandler
    $('.foswikiNewLink, .modacNewLink').livequery(function() {
        var $this = $(this);
        $this.click({link: $this}, ModacSkin.wcntHandler);
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

    // initialize superfish menue
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

    // Inhibit clicks on MoreMenue und submenues
    $('.modacMoreDynamicLink a').click(function() { return false; });

    // Handle Links opening dialogs
    $('.modacDialogable').click(ModacSkin.dialogCallback);

    // end TopicMenue
});

