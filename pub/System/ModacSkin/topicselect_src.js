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
				url: foswiki.getScriptUrl('rest', 'ModacHelpersPlugin', 'topics'),
				data: function(params, page) {
					var offset = 0;
					if (params.page > 1) offset = (params.page - 1);
					return {
						no_discussions: 1,
						current_web: opts.web,
						term: (params.term||'').toLowerCase(),
						page: offset,
						limit: opts.pagesize,
						clearable: opts.clearable || 0,
						option_for_notopicparent: true,
					};
				},
				processResults: function(data, pageOpts) {
					var page = pageOpts.page || 1;
					if (!opts.include_web) $.each(data.results, function(_idx, val) {
						val.id = val.id.replace(new RegExp('^'+ foswiki.getPreference('WEB') +'\\.'), '');
						val.sublabel = val.id;
					        val.label = val.text;
					});
					return {
						results: data.results,
						pagination: {
							more: (data.count >= opts.pagesize * page)
						}
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

