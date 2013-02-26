jQuery(function($) {
	$('.jqTopicSelect').each(function(i) {
		var opts = {
			pagesize: 20,
			include_web: true,
			except: false,
			web: foswiki.getPreference('WEB')
		};
		$.extend(opts, $(this).metadata());

		$(this).select2({
			ajax: {
				dataType: 'json',
				url: foswiki.getPreference('SCRIPTURLPATH') +'/view'+ foswiki.getPreference('SCRIPTSUFFIX') +'/System/ModacAjaxHelper',
				data: function(term, page) {
					var offset = 0;
					if (page > 1) offset = (page - 1);
					return {
						contenttype: 'text/plain',
						section: (opts.except ? 'topics_exceptwebs' : 'topicsinweb'),
						skin: 'text',
						web: opts.web,
						query: term.toLowerCase(),
						'offset': offset,
						count: opts.pagesize
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
			placeholder: foswiki.getMetaTag('l10n_modac_selecttopic_noparent'),
			formatResult: function(object, container, query) {
				return '<div class=\"topicselect_label\">'+object.label+'</div><div class=\"topicselect_sublabel\">'+object.sublabel+'</div>';
			},
			formatSelection: function(object, container) {
				return object.sublabel;
			},
			formatNoMatches: function() { return foswiki.getMetaTag('l10n_modac_selecttopic_nomatches'); },
			formatSearching: function() { return '<div class=\"jqAjaxLoader\" style=\"padding-left: 20px;\">'+ foswiki.getMetaTag('l10n_modac_selecttopic_searching') +'</div>'; },
			formatResultCssClass: function() { return 'topicselect_container'; },
			initSelection: function(element, callback) {
				var val = $(element).val();
				callback({id: val, label: val, sublabel: val});
			},
			allowClear: true,
			width: 'element'
		});
	});
});

