jQuery(function($){
    var success = function(responseText, statusText, xhr, $form){
        $form.closest('.modac_comment').addClass('comment_ticked');
        if($form.unblock) $form.closest('.modac_comment_ctl').unblock(); // will be invisible, but let's remove stuff from the dom
        $form.hide();
    };
    var error = function(jqXHR, textStatus, error) {
        // XXX one might want to unblock here...
        if($.pnotify) $.pnotify({
            text: 'An error occured: ' + textStatus,
            type: 'error'
        });
    };
    var beforeSubmit = function(arr, $form, options) {
        if($form.block) $form.closest('.modac_comment_ctl').block({message: ''});
    };
    $('form.tick').ajaxForm({
        success: success,
        error: error,
        beforeSubmit: beforeSubmit
    });
});
