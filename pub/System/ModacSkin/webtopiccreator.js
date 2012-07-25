foswiki.webTopicCreator = {
    /**
     * Checks if the entered topic name is a valid WikiWord.
     * If so, enables the submit button, if not: enables the submit button if
     * the user allows non-WikiWords as topic name; otherwise disables the
     * submit button and returns 'false'.
     * Automatically removes spaces from entered name.
     * Automatically strips illegal characters.
     * If non-WikiWords are not allowed, capitalizes words (separated by space).
     * If non-WikiWords _are_ allowed, capitalizes sentence.
     * The generated topic name is written to a 'feedback' field.
     * @param inForm : pointer to the form
     * @param inShouldConvertInput : true: a new name is created from the
     * entered name
     * @return True: submit is enabled and topic creation is allowed; false:
     * submit is disabled and topic creation should be inhibited.
     */
		

	/*
	 * Ajax Request für TopicParent
	 */
	_ajaxRequest: function(web, topic, preset) {	
		$.ajax( 				
			{
				url: foswiki.getPreference("SCRIPTURL") + '/view/Sandbox/AjaxHelper?section=newtopic;contenttype=text/plain;limit=all;skin=text;input=' + topic + ';baseweb=' + web + ';format=$web.$topic,$topic;',
				async : false,
				success: function(datas) {         
					var data = datas.split("\n");
					var laenge = data.length || 2;

					var options = '';
				    	// into option value/labels...
					for (var i = 0; i < laenge; i++)
				    	{
						var line = data[i].split(",");
						options += "<option value=" +
	                       		line[0] + ">" +
	                       		line[1] +
	                       		"</option>";
				    	}
					$('#topicparent').html(options);
					
					// Modac : Nach der Ausführung change_done ausführen
					if(preset)
						$('#topicparent').trigger('change_done', web + '.' + preset);

			  	}
			});
	},

	/*
	 * AjaxRequest für Subwebs
	 */
	_renderSubweb: function(web, container, template, preset, currentcontainer) {	
		$.ajax( 				
			{
				url: foswiki.getPreference("SCRIPTURL") + '/rest/RenderPlugin/template?name=create;expand=' + template + ';webname=' + web,
			  	async: false,
				success: function(data) {
					if(data.length > 1){ 
						$('#' + container + 'step').removeClass('foswikiHidden');        
						$('#' + container).html(data);
					}
					else
					{
						$('#' + container + 'step').addClass('foswikiHidden');
					}
					
					// Modac : Nach der Ausführung change_done ausführen
					if(preset)
						$('select#' + currentcontainer).trigger('change_done', preset);
			  	}
			});
	},	
	
		
    _canSubmit: function(inForm, inShouldConvertInput, ajaxExec) {
		var parentweb, webname, template, parenttopic, topic;
        
        /* Bereich überprüfen */
        var inputForWebName = inForm.webname.value || '';
		if (inputForWebName.length == 0) {
			/* Disable Submit */
			$(inForm.submit).addClass("foswikiSubmitDisabled")
            .attr('disabled', true);
			/* Update feedback field */
			$("#webTopicCreatorFeedback").html("Bite geben Sie den Artikelbereich an");
			return false;
		}	
		else
		{
			/* Deprecated
			parentweb = foswiki.webTopicCreator._getParentWeb(inputForWebName);
			*/
			webname = inputForWebName;
			
		}
		/*--------------------------------------------------------------*/
        
        /* Checken ob Templates passen */
        var inputForTemplate = inForm.templatetopic.value;
        
        // Müssen hier die target_ var´s gescannt werden?
        var target_webname = inForm.target_webname.value;
        
        // Topic Name
    	var inputForTopicName = inForm.topic.value;
    	
    	/*
    	 * Hier muss eingestellt werden, welche Attribute in Frage kommen
    	 */
    	var inputForBereich = (inForm.webname2 == undefined || inForm.webname2.value == '') ? inForm.webname.value : inForm.webname2.value;
    	var inputForSubBereich = (inForm.webname3 == undefined) ? '' : inForm.webname3.value;
    	var webName = inputForWebName;

    	var inputName = inputForTopicName;        
    	var searchstring = "*";
    	var ergebnis = null;	
    	
		/* Topic names of zero length are not allowed */
        if (inputForTopicName.length == 0) {
            $(inForm.submit).addClass("foswikiSubmitDisabled")
            .attr('disabled', true);
            /* Update feedback field */
            $("#webTopicCreatorFeedback").html("");
        }
        
        /* Übergeordnetes Dokument überprüfen */
		var inputForParentTopic = inForm.topicparent.value || '';
		if (inputForParentTopic.length == 0) {
			/* Disable Submit */
			$(inForm.submit).addClass("foswikiSubmitDisabled")
            .attr('disabled', true);
			/* Update feedback field */
			$("#webTopicCreatorFeedback").html("Bite geben Sie zunächst einenen übergeordneten Artikel an");
			//return false;
		}	
		else
		{
			parenttopic = inputForParentTopic;
			//ergebnis = inputForTopicName.match(//g);
			//var regex = new RegExp(parenttopic, "g");
			//ergebnis = regex.exec(inputForTopicName);
			//alert(ergebnis);
			$("#webTopicCreatorFeedback").html("webTopicCreatorFeedback", "Achtung: Die Artikelnummer ist nicht korrekt." + parenttopic + " muss enthalten sein.");
		  	
		}
		/*---------------------------------------------------------------*/

		// Modac : TODO: inputForBereich könnte hier mit rein 

    	switch (inputForTemplate) {
    	  case "Main.UnternehmensstandardTemplate":
    		  // Modac : Hier könnte noch der Bereich zwingend mit rein
    		  ergebnis = inputForTopicName.match(/^((US-)([\D]{2,4})(-)(\d\d\d))$/g);
    		  $("#webTopicCreatorFeedback").html("Zwingendes Eingabeformat: US-" + inputForBereich + "-###. Beispiel: US-QM-001");
		  $("#topicName").html("<h3>Artikel Nummer</h3>");
		  $("#topicTitleStep").show();
    		  searchstring = "^WebHome$";
    		  break;
    	  case "Main.KernprozessTemplate":
    		  // Modac : Hier könnte noch der Bereich zwingend mit rein
    		  ergebnis = inputForTopicName.match(/^((KP-)([\D]{2,4})(-)(\d\d\d))$/g);
    		  $("#webTopicCreatorFeedback").html("Zwingendes Eingabeformat: KP-" + inputForBereich + "-###. Beispiel: KP-QM-001");
		  $("#topicName").html("<h3>Artikel Nummer</h3>");
		  $("#topicTitleStep").show();
    		  searchstring = "^WebHome$";
    		  break;       
    	  case "Main.VerfahrensanweisungTemplate":
    		  // Modac : Hier könnte noch der Bereich zwingend mit rein
    		  ergebnis = inputForTopicName.match(/^((VA-)(US|KP)(-)([\D]{2,4})(-)(\d\d\d)(-)(\d\d\d))$/g);
    		  $("#webTopicCreatorFeedback").html("Zwingendes Eingabeformat: VA-##-" + inputForBereich + "-###-###");
		  $("#topicName").html("<h3>Artikel Nummer</h3>");
		  $("#topicTitleStep").show();
    		  searchstring = "^(US|KP)(-)(" + inputForBereich + "-)(\\d\\d\\d)$";
    		  break;
    	  case "Main.ArbeitsanweisungTemplate":
    		  // Modac : Hier könnte noch der Bereich zwingend mit rein
    		  ergebnis = inputForTopicName.match(/^((AA-)([\D]{2,4})(-)(\d\d\d))$/g);
    		  $("#webTopicCreatorFeedback").html("Zwingendes Eingabeformat: AA-" + inputForBereich + "-###");
		  $("#topicName").html("<h3>Artikel Nummer</h3>");
		  $("#topicTitleStep").show();
    		  searchstring = "^(US|KP)(-)(" + inputForBereich + "-)(\\d\\d\\d)$";
    		  break;
    	  case "Main.InfoseiteTemplate":
    		  ergebnis = inputForTopicName;
    		  $("#webTopicCreatorFeedback").html("Bitte achten Sie auf die Ri.Wiki Namenskonventionen");
    		  $("#topicName").html("<h3>Artikel Name</h3>");
    		  $("#topicTitleStep").hide();
    		  searchstring = ".*";
    		  break;
    	  default:
    		  ergebnis = inputForTopicName;
    	  	  $("#webTopicCreatorFeedback").html("Bitte achten Sie auf die Ri.Wiki Namenskonventionen");
    	  	  $("#topicName").html("<h3>Artikel Nummer</h3>");
    	  	  $("#topicTitleStep").show();
    	  	  searchstring = ".*";
    	  	  break;
    	}    	
    	
    	if (ajaxExec){
    		// Modac : Parent Topics auslesen
    		foswiki.webTopicCreator._ajaxRequest(target_webname, searchstring);
    	}

    	if (ergebnis == null)
    	{
    		$(inForm.submit).addClass("foswikiSubmitDisabled")
            .attr('disabled', true);
    		return false;
    	}
    	/*-------------------------------------------------------*/
    	
    	
        // Replace illegal characters in the name with spaces. This is
        // always done, irrespective of whether we are non-wikiwording
        // or not.
        var nameFilterRegex = foswiki.getPreference('NAMEFILTER')
		var re = new RegExp(nameFilterRegex, "g");

        var userAllowsNonWikiWord = true;
        //$('#nonwikiword').each(
        //    function(index, el) {
        //        userAllowsNonWikiWord = el.checked;
        //   });

        var cleanName;
        if (userAllowsNonWikiWord) {
            // Take out all illegal chars
            cleanName = inputName.replace(re, "");
            // Capitalize just the first character
            finalName = cleanName.substr(0,1).toLocaleUpperCase()
                + cleanName.substr(1);
        } else {
            // Replace illegal chars with spaces
            cleanName = inputName.replace(re, " ");
            // Capitalize each word in the string
            finalName = foswiki.String.capitalize(cleanName);
            // And remove whitespace
            finalName = finalName.replace(/\s+/, '', 'g');
        }

        
        if (inShouldConvertInput) {
            inForm.topic.value = finalName;
        }
        
        /* Update feedback field */
        if (finalName != inputName) {
            feedbackHeader = "<strong>" + TEXT_FEEDBACK_HEADER + "</strong>";
            feedbackText = feedbackHeader + finalName;
            //$("#webTopicCreatorFeedback").html(feedbackText);
        } else {
            //$("#webTopicCreatorFeedback").html("");
        }
        
        if (foswiki.String.isWikiWord(finalName) || userAllowsNonWikiWord) {
            $(inForm.submit).removeClass("foswikiSubmitDisabled")
            .attr('disabled', false);
            return true;
        } else {
            $(inForm.submit).addClass("foswikiSubmitDisabled")
            .attr('disabled', true);
            return false;
        }
    },
    
    _removeSpacesAndPunctuation: function (inText) {
        return foswiki.String.removePunctuation(
            foswiki.String.removeSpaces(inText));
    },
    
    _filterSpacesAndPunctuation: function (inText) {
        return foswiki.String.removeSpaces(
            foswiki.String.filterPunctuation(inText));
    },
    
    _passFormValuesToNewLocation: function (inUrl) {
        var url = inUrl;
        // remove current parameters so we can override these with
        // newly entered values
        url = url.split("?")[0];
        // read values from form
        var params = "";
        var newtopic = document.forms.newtopicform.topic.value;
        params += ";newtopic=" + newtopic;
        var topicparent = document.forms.newtopicform.topicparent.value;
        params += ";topicparent=" + topicparent;
        var templatetopic = document.forms.newtopicform.templatetopic.value;
        params += ";templatetopic=" + templatetopic;
        var pickparent = URL_PICK_PARENT;
        params += ";pickparent=" + pickparent;
        params += ";template=" + URL_TEMPLATE;
        url += "?" + params;
        document.location.href = url;
        return false;
    }
};

(function($) {
    $(document).ready(
        function() {
            $('form#newtopicform').each(
                function(index, el) {
                    	//foswiki.webTopicCreator._canSubmit(el,false,true);
                });
            
			$('form#newtopicform').submit(function () {
				
				// Modac : Ziel Variablen implemetieren
				var target_web = "";
	                        
				// Modac : ???
				var test = foswiki.webTopicCreator._canSubmit(this,true);
				   
				// Modac : target_web setzen
				var target_web = document.newtopicform.webname.value;
				   
				// Modac : web2 anhängen, wenn vorhanden und nicht gleich web1
				if ( document.newtopicform.webname2.value != document.newtopicform.webname.value && document.newtopicform.webname2.value != '')
					target_web = target_web + "." + document.newtopicform.webname2.value;
				
				// Modac : web3 anhängen, wenn vorhanden
				if ( document.newtopicform.webname3.value != '' )
					target_web = target_web + "." + document.newtopicform.webname3.value;
	
				// Modac : Artikelname setzen ( Bereich + Topic + Sprache)
				
				var target_topic = target_web + "." + document.newtopicform.topic.value;
					
				if((document.newtopicform.topiclanguage.value == "Englisch") || (document.newtopicform.topiclanguage.value == "en")) {
						name = name + "-EN";
				   }
				
				document.newtopicform.topic.value = name;
	                        return test;
			});
			
			$('select#webname').livequery('change_new',
            		function(e, data) {
						$('select#webname3').empty();
						$('select#webname2').empty();
						$('select#webname').val(data);
						foswiki.webTopicCreator._renderSubweb(document.newtopicform.webname.value, "webname2", "webname2", data, "webname");
						foswiki.webTopicCreator._ajaxRequest(document.newtopicform.input_webname.value, ".*" , document.newtopicform.input_topicparent.value);
	                });
			
			$('select#webname').livequery('change_done',
            		function(e, data) {
						$('select#webname').val(data);
	                });
			
			$('select#webname2').livequery('change_new',
        			function(e, data) {
						$('select#webname3').empty();
						$('select#webname2').val(data);
						foswiki.webTopicCreator._renderSubweb(document.newtopicform.webname2.value, "webname3", "webname3", data, "webname2");
						//foswiki.webTopicCreator._ajaxRequest(document.newtopicform.input_webname.value, ".*" , document.newtopicform.input_topicparent.value);
                });
			
			$('select#webname2').livequery('change_done',
            		function(e, data) {
						$('select#webname2').val(data);
	                });
            
			$('select#webname3').livequery('change_new',
            		function(e, data) {
						$('select#webname3').val(data);
						foswiki.webTopicCreator._ajaxRequest(webname, searchstring, data);
                });
			
			$('select#webname3').livequery('change_done',
            		function(e, data) {
						$('select#webname3').val(data);
	                });
			
			$('select#topicparent').livequery('change_done',
            		function(e, data) {
						$('select#topicparent').val(data);
	                });
            
            $('select#templatetopic')
            .each(
                function(index, el) {
                    // focus input field
                    el.focus();
            })
            .keyup(
                function(e) {
                    //alert("onkeyup topic");
                    foswiki.webTopicCreator._canSubmit(this.form,false);
            })
            .change(
                function(e) {
                	//alert("template");
                    foswiki.webTopicCreator._canSubmit(this.form,false,true);
            })
            .blur(
                function(e) {
                    foswiki.webTopicCreator._canSubmit(this.form,true);
            });
            
            $('select#topicparent')
            .each(
                function(index, el) {
                    // focus input field
                    el.focus();
                })
            .keyup(
                function(e) {
                    //alert("onkeyup topic");
                    foswiki.webTopicCreator._canSubmit(this.form,false);
                })
            .change(
                function(e) {
                	//alert("parenttopic");
                    foswiki.webTopicCreator._canSubmit(this.form,false);
                })
            .blur(
                function(e) {
                    foswiki.webTopicCreator._canSubmit(this.form,true);
                });

            $('input#topic')
                .each(
                    function(index, el) {
                        // focus input field
                        el.focus();
                    })
                .keyup(
                    function(e) {
                        //alert("onkeyup topic");
                        foswiki.webTopicCreator._canSubmit(this.form,false);
                    })
                .change(
                    function(e) {
                    	//alert("Artikel");
                        foswiki.webTopicCreator._canSubmit(this.form,false);
                    })
                .blur(
                    function(e) {
                        foswiki.webTopicCreator._canSubmit(this.form,true);
                    });

            $('input#nonwikiword')
                .change(
                    function() {
                        foswiki.webTopicCreator._canSubmit(this.form,false);
                    })
                .mouseup(
                    function() {
                        foswiki.webTopicCreator._canSubmit(this.form,false);
                    });
            
            $('a#pickparent')
                .click(
                    function() {
                        return foswiki.webTopicCreator
                            ._passFormValuesToNewLocation(getQueryUrl());
                    });

            $('form#newtopicform').ready(
			function () {
				// Modac : Input Webname
				if (document.newtopicform.input_webname.value != '')
				{
					// Bereiche auseinander klamüsern
					var reg = new RegExp(/([^\/]+)[\/]?([^\/]+)?[\/]?([^\/]+)?/);
					reg.exec(document.newtopicform.input_webname.value);
				
					// Modac : Projekteinstellungen
					var web1 = RegExp.$1 || "";
					var web2 = RegExp.$2 || "";
					var web3 = RegExp.$3 || "";
					
					// Modac : Etwas tun
					if ( web1 )
					{
						$('select#webname').trigger('change_new', web1);
					}
					if ( web2 )
					{
						$('select#webname2').trigger('change_new', web2);
					}
					if ( web3 )
					{
						$('select#webname3').trigger('change_new', web3);
					}

				}


 				if (document.newtopicform.input_topicparent.value != '')
				{
					var input_topicparent = document.newtopicform.input_topicparent.value;
					
					/* Modac : Topic Parent setzen 
					$('select#topicparent').expire();
					$('#topicparentcontainer').empty();
					$('#topicparentcontainer').append("Seite: " + targetparent );
					$('#topicparentcontainer').append('<input id="topicparent" type="hidden" value="' + targetparent + '" />');
					*/
				}
 				
 					$('select#webname').livequery('each', 
 		                function(index, el) {
 		            		// focus input field
 		            		el.focus();
 		            		foswiki.webTopicCreator._renderSubweb(document.newtopicform.webname.value, "webname2", "webname2");
 		            });
 		            
 		            $('select#webname').livequery('keyup', 
 		        		function(e) {
 		                	//alert("onkeyup topic");
 		                	foswiki.webTopicCreator._canSubmit(this.form,false);
 		            });
 		            
 		            $('select#webname').livequery('change',
 		        		function(e) {
 		            		$('select#webname3').empty();
 		            		$('select#webname2').empty();
 		            		foswiki.webTopicCreator._renderSubweb(document.newtopicform.webname.value, "webname2", "webname2");
 		            		foswiki.webTopicCreator._canSubmit(this.form,false,true);
 		            		if (!($('#webname').val() == undefined || $('#webname').val() == ''))
 		            			$('#target_webname').val($('select#webname').val());
 		            		$('select#webname2').change();
 		            });
 		            
 		            $('select#webname').livequery('blur', 
 		                function(e) {
 		                    foswiki.webTopicCreator._canSubmit(this.form,true);
 		            });
 		            
 		            $('select#webname2').livequery('each',
 		                function(event) {
 		                    // focus input field
 		            		var webname = document.newtopicform.webname.value + "." + document.newtopicform.webname2.value;
 		            		foswiki.webTopicCreator._renderSubweb(webname, "webname3", "webname3");
 		                    this.focus();
 		            });
 		            
 		            $('select#webname2').livequery('keyup',
 		                function(event) {
 		                    //alert("onkeyup topic");
 		                    foswiki.webTopicCreator._canSubmit(this.form,false);
 		            });

 		            $('select#webname2').livequery('change',
 		                function(e) {
 		            		$('select#webname3').empty();
 		            		var webname = document.newtopicform.webname.value + "." + document.newtopicform.webname2.value;
 		                    foswiki.webTopicCreator._renderSubweb(webname, "webname3", "webname3");
 		                   if (!($('#webname2').val() == undefined || $('#webname2').val() == ''))
 		                    	$('#target_webname').val($('#target_webname').val() + "." + $('select#webname2').val());
 		                    foswiki.webTopicCreator._canSubmit(this.form,false,true);
 		                    
 		            });

 		            $('select#webname2').livequery('blur',
 		                function(e) {
 		                    foswiki.webTopicCreator._canSubmit(this.form,true);
 		            });

 		            $('select#webname3').livequery('each',
 		                function(event) {
 		                    // focus input field
 		                    this.focus();
 		            });

 		            $('select#webname3').livequery('keyup',
 		                function(event) {
 		                    // alert("onkeyup topic");
 		                    foswiki.webTopicCreator._canSubmit(this.form,false);
 		            });

 		            $('select#webname3').livequery('change',
 		                function(e) {
 		            	if (!($('#webname3').val() == undefined || $('#webname3').val() == ''))
 		            			$('#target_webname').val($('#target_webname').val() + "." + $('select#webname3').val());
 		                    foswiki.webTopicCreator._canSubmit(this.form,false,true);
 		            });

 		            $('select#webname3').livequery('blur',
 		                function(e) {
 		                    foswiki.webTopicCreator._canSubmit(this.form,true);
 		            });


		});
    });
})(jQuery);
