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
                var escTitle = $data.find('.modacDialogTitle').remove().html();
                escTitle = escTitle.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&prime;').replace(/&/g, '&amp;');
                options.title = escTitle;
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
                if($('#topic').length) {
                    // there is already something wcnt-like present, so do not attempt to load the dialog
                    return true;
                }
                var baseWebTopic;
                if(infodata.newtopic) {
                    baseWebTopic = infodata.newtopic;
                    if(baseWebTopic.indexOf('.') < 0) baseWebTopic = encodeURIComponent(foswiki.getPreference('WEB'))+'.'+baseWebTopic; // Make sure there is a web or the rest call will fail
                } else {
                    baseWebTopic = encodeURIComponent(newweb + '.' + foswiki.getPreference('TOPIC'));
                }

                ModacSkin.blockUI();
                var restUri = foswiki.getPreference('SCRIPTURL') +'/rest'+ foswiki.getPreference('SCRIPTSUFFIX');
                $.ajax(restUri + '/RenderPlugin/template?name=WebCreateNewTopicDialog;render=on;expand=dialog;topic=' + baseWebTopic + ';topicparent='+infodata.topicparent+';newtopictitle='+infodata.newtopictitle, {
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
                        width:($data.find('.contentsWidth').length?$('#modacContents').width():undefined),
                        title: title,
                        closeOnEscape: (href.match('^(?:'+foswiki.getPreference('SCRIPTURLPATH')+'|'+foswiki.getPreference('SCRIPTURL')+')'+foswiki.getPreference('SCRIPTSUFFIX')+'/edit/'))?false:true
                    });
                }, $loading),
                error: function(jqXHR, statusmsg) {
                    ModacSkin.showDialog('<span class="foswikiAlert">' + statusmsg + " fetching " + $this.attr('href') + '</span>', undefined, $loading, {});
                }
            });
            return false;
        },

        // Hides WebLeftBar
        // Parameters:
        //     setcookie: when true, a cookie will be set so the bar remains
        //         hidden while navigating
        hideSidebar: function(setcookie) {
            ModacSkin.hideSideBarData = {};

            // store min-width
            var minPage = $('.foswikiPage').css('min-width');
            ModacSkin.hideSideBarData.foswikiPageMin = minPage;
            minPage = minPage.replace('px', '');

            // hide sidebar
            var $sidebar = $('#modacSidebar');
            var sideWidth = $sidebar.width();
            $sidebar.hide();

            // add expand-button
            var $placeholder = $('<div class="modacShowSidebar"></div>');
            $sidebar.after($placeholder);
            var pWidth = $placeholder.width();

            // expand modacWrapper
            ModacSkin.hideSideBarData.modacWrapperMargin = $('#modacWrapper').css('margin-left');
            $('#modacWrapper').css('margin-left', pWidth);
            $('.foswikiPage').css('min-width', (minPage-sideWidth+pWidth)+'px'); // add recovered space to min-width

            // set cookie
            if(setcookie && $.cookie) $.cookie('modacHideSidebar', true);
        },

        // Shows WebLeftBar again, removes any .modacShowSidebar buttons
        // Parameters:
        //     removecookie: when true, remove cookie, so the bar remains
        //         visible while navigating
        showSidebar: function(removecookie) {
            // restore sidebar, width and margins
                $('.modacShowSidebar').remove();
            $('#modacWrapper').css('margin-left', ModacSkin.hideSideBarData.modacWrapperMargin);
            $('.foswikiPage').css('min-width', ModacSkin.hideSideBarData.foswikiPageMin);
            $('#modacSidebar').show();

            if(removecookie && $.cookie) $.cookie('modacHideSidebar', null);
        },
        hideSidebarHandler: function() {
            ModacSkin.hideSidebar(true);
        }
    };

    // Hide WebLeftBar functionality
    $('.modacHideSidebar').livequery(function() {
        var $this = $(this);
        $this.css('left', $('#modacSidebar').width() + $('#modacSidebar').position().left - $this.width());
        $this.click(ModacSkin.hideSidebarHandler);
    });
    $('.modacShowSidebar').livequery(function() {
        $(this).click(function() {
            ModacSkin.showSidebar(true);
            return false;
        });
    });
    $('#modacSidebar').hover(function(){
        var icon = $('#modacSidebar div.modacHideSidebar');
        if(!icon[0]) return;
        var scroll;
        if(window.pageYOffset !== undefined) {
            scroll = window.pageYOffset;
        } else if (document.documentElement !== undefined && document.documentElement.scrollTop) {
            scroll = document.documentElement.scrollTop;
        } else if (document.body !== undefined) {
            scroll = document.body.scrollTop;
        } else {
            scroll = 0;
        }
        scroll += 100;
        icon.css('top', scroll);
        icon.show();
    }, function() {
        $('#modacSidebar div.modacHideSidebar').hide();
    });
    // react on cookie
    if($.cookie && $.cookie('modacHideSidebar')) ModacSkin.hideSidebar();

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

    // Add clear button to date fields
    $('.foswikiEditFormDateField').livequery(function() {
        var e = $(this);
        e.attr('readonly', 'readonly');
        var removeBtn = $('<img src="'+foswiki.getPreference('PUBURLPATH')+'/'+foswiki.getPreference('SYSTEMWEB')+'/DocumentGraphics/trash-small.png" alt="">');
                removeBtn.css('cursor', 'pointer').css('padding-left', '3px').click(function() { e.val(''); });
        e.next().after(removeBtn);
    });

    // Localized error messages from form validation (overwrites code from foswiki_edit.js)
    if (foswiki && foswiki.Edit) {
      foswiki.Edit.validateMandatoryFields = function() {
        if (foswiki.Edit.validateSuppressed) return true;
        var alerts = [];
        jQuery('select.foswikiMandatory, input.foswikiMandatory, textarea.foswikiMandatory').each(function(i,e) {
          if (jQuery(e).val()) return;
          alerts.push(jsi18n.get('edit', "You have not filled out the mandatory form field '[_1]'.", jQuery(e).attr('name')));
        });
        if (alerts.length) {
          alerts.push(jsi18n.get('edit', 'Please check your input.'));
          alert(alerts.join("\n"));
          return false;
        }
        return true;
      };
    }

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

    // Block UI when clicking blockOnClick links
    $('.blockOnClick a, a.blockOnClick').click(function() {
        ModacSkin.blockUI();
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
            $form.submit(function() {
                if($this.hasClass('modacjqWikiWordTouch')) $s.change();
                // Prepend web name if present in the form
                var web = $form.find(".modacjqWikiWordWeb").val();
                if(web) {
                    var oldval = $child.val();
                    if(!new RegExp('^'+web+'\\.').exec(oldval)) {
                        $child.val(web+'.'+$child.val());
                    }
                }
            });
            $child.addClass(JSON.stringify(options));
            $child.addClass('jqWikiWord');
        });
    });

    // TopicMenue

    // initialize superfish menue
    $('.jqmenu').supersubs({
        minWidth: 13, /* minimum width of sub-menus in em units */
        maxWidth: 13, /* maximum width of sub-menus in em units */
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

    // handle submit in quickSearchBox
    $('#modacSearchBox form').submit(function(){
        // If on a Solr page
        //    copy terms to solrSearchField and submit that instead
        // If on a normal wiki page
        //    Proper browser: rewrite query to link with solr4 style hashtag
        //    IE7,8: rewrite query to query to link with hashtag stored in 'htag' parameter - some script on solr page will decode it
        var $searchbox = $('#quickSearchBox');
        var $searchfield = $('.solrSearchField');
        var $forms = $('.solrSearchForm');
        if($searchbox.length == 0) return; // XXX

        if($searchfield.length == 0 || $forms == 0) {
            // not on a SolrSearch page, change query to solr4 style and do the search
            var $this = $(this),
                action = $this.attr("action"),
                search = $this.find("input[name='search']"),
                href = action,
                params = new Array();
            // rewrite facet parameters
            $this.closest('form').find('.fq').each(function(idx){ // XXX this works for web, anything else is untested
                var each = $(this);
                var name = encodeURIComponent(each.attr('name'));
                var val = encodeURIComponent(each.val());
                params.push('fq='+name+'%3A'+val);
            });
            // rewrite query
            if(search && search.val()) {
                params.push('q='+encodeURIComponent(search.val()));
            }
            // construct the hashtag (eventually deal with browsers feeling special)
            if(params.length) {
                var htag = params.join('&');
                if(navigator && navigator.appName === 'Microsoft Internet Explorer' && /MSIE [7,8]/.exec(navigator.userAgent)) {
                    href += '?htag='+htag;
                }
                href += '#'+htag;
            }
            // do the search
            window.location.href = href;
            return false;
        }

        // We are on a SolrSearch page
        // Copy
        var query = $searchbox.val();
        $searchfield.val(query);
        // Submit solrSearchForm and inhibit submit of quickSearchBox
        $searchfield.closest('form').first().submit(); // XXX could there be multiple?!?
        return false;
    });
});

