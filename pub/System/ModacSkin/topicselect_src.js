jQuery(function($) {
	var prevAllowInteraction = $.ui.dialog.prototype._allowInteraction;
	$.ui.dialog.prototype._allowInteraction = function(event) {
		if ($(event.target).closest('.select2-container--open').length) { return true; }
		return prevAllowInteraction.apply(this, arguments);
	};
	$('.jqTopicSelect:not(div):not(.jqTopicSelectInited)').livequery(function(i) {
		var opts = {
			pagesize: 20,
			include_web: true,
			except: false,
			web: foswiki.getPreference('WEB')
		};
		$.extend(opts, $(this).metadata());

		var formatEntry = function(d) {
			if (d instanceof jQuery) { return d; }
			if (d.loading) {
				return $('<div class="jqAjaxLoader" style="padding-left: 20px;">').text(foswiki.getMetaTag('l10n_modac_selecttopic_searching'));
			}
			var $e = $('<div class="topicselect_container"><div class="topicselect_label"></div><div class="topicselect_sublabel"></div></div>');
			$e.find('.topicselect_label').text(d.label || d.text);
			$e.find('.topicselect_sublabel').text(d.sublabel);
			return $e;
		};
		var formatEntryShort = function(d) {
			return $('<div class="topicselect_label"></div>').text(d.label || d.text);
		};
		var s2args = {
			ajax: {
				dataType: 'json',
				url: foswiki.getPreference('SCRIPTURLPATH') +'/view'+ foswiki.getPreference('SCRIPTSUFFIX') +'/System/ModacAjaxHelper',
				data: function(params) {
					var offset = 0;
					if (params.page > 1) offset = (params.page - 1);
					return {
						contenttype: 'text/plain',
						section: (opts.except ? 'topics_exceptwebs' : 'topicsinweb'),
						skin: 'text',
						web: opts.web,
						query: (params.term||'').toLowerCase(),
						'offset': offset,
						count: opts.pagesize,
						clearable: opts.clearable || 0
					};
				},
				results: function(data, page) {
					if (!opts.include_web) $.each(data, function(_idx, val) {
						val.id = val.id.replace(new RegExp('^'+ foswiki.getPreference('WEB') +'\\.'), '');
						val.sublabel = val.id;
					});
					return {
						results: data,
						more: (data.length >= opts.pagesize)
					};
				}
			},
			templateResult: formatEntry,
			templateSelection: formatEntryShort,
			minimumInputLength: 0,
			width: 'resolve'
		};
		$(this).select2(s2args);
		$(this).addClass('jqTopicSelectInited');
	});
});

