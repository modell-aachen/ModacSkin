/*
 * jQuery ModacUsability plugin 
 *
 * Copyright (c) 2008-2011 Michael Daum http://michaeldaumconsulting.com
 * Copyright (c) 2011-	   Alexander Stoffers http://www.modell-aachen.de
 *
 * Dual licensed under the MIT and GPL licenses:
 *   http://www.opensource.org/licenses/mit-license.php
 *   http://www.gnu.org/licenses/gpl.html
 *
 * Revision: $Id$
 *
 */
(function($) {
	
	
/*****************************************************************************
 * class definition
 */
$.ModacUsability = function(menu, opts) {
  var self = this,
  	  $menu = $(menu),
      style;
  
  //build element specific options. 
  // note you may want to install the Metadata plugin
  self.opts = $.extend({}, opts);
  self.menu = menu;

  self.initGui();
};

/*************************************************************************
 * opens a modal dialog
 */
$.ModacUsability.prototype.openDialog = function(opts) {
  var self = this;
  if (opts.dialog && $(opts.dialog).length) {
    self._openDialog(opts);
  } else {
    if (opts.url) {
      $.get(opts.url, function(data) {
        opts.dialog = "#"+$(data).attr('id');
        $("body").append(data);
        self._openDialog(opts);
      });
    }
  }
};

$.ModacUsability.prototype._openDialog = function(opts) {
  var self = this, $dialog;

  $dialog = $(opts.dialog);

  $dialog.modal({
    minHeight: 'auto',
    minWidth: 'auto',
    persist: true,
    close:false,
    onShow: function(dialog) {
      $(window).trigger("resize.simplemodal");
      dialog.data.find("input:visible:first").focus();
      if (opts.onShow) {
        opts.onShow.call(this, self);
      }
    }
  });
  if (!opts._doneInit) {
    $dialog.find(".foswikiButtonSubmit").click(function() {
      $.modal.close();
      if ($.browser.msie) { // restore lost position
      }
      if (typeof(opts.onSubmit) != 'undefined') {
        opts.onSubmit.call(this, self);
      }
      return false;
    });
    $dialog.find(".foswikiButtonCancel").click(function() {
      $.modal.close();
      return false;
    });
    opts._doneInit = true;
  }
};

/*************************************************************************
 * init the gui
 */
$.ModacUsability.prototype.initGui = function() {
  var self = this, $standardTools, $toolbar;
  //$.log("called initGui this="+self);

  $menu = $(self.menu);
  self.container = $menu.wrap('<div class="pimmelPeter"></div>').parent();

  if (!self.opts.showToolbar) {
    //$.log("no toolbar");
    return;
  }

  $standardTools = $('<ul class="natEditButtonBox natEditButtonBoxObject"></ul>').
    append(
      $(self.opts.copyField).click(function() {
        self.openDialog(self.opts.copyDialog);
        return false;
      })).
    append(
      $(self.opts.renameField).click(function() {
        self.openDialog(self.opts.renameDialog);
        return false;
      }));
  
  $toolbar = $('<div class="natEditToolBar"></div>');
  
  $toolbar.append($standardTools);
    
  $toolbar.append('<span class="foswikiClear"></span>');

  self.container.prepend($toolbar);
};
//

/*
 * Modac: Hier wird der Namensraum und die default Werte initialisiert:
 * 
 */

/*****************************************************************************
 * plugin definition
 */
$.usability = {

  /***************************************************************************
   * widget constructor
   */
  build: function(opts) {
    //$.log("called natedit()");

    // build main options before element iteration
    var thisOpts = $.extend({}, $.usability.defaults, opts);

    return this.each(function() {
      new $.ModacUsability(this, thisOpts);
    });
  },

  /*************************************************************************
   * replace entities with real html
   */
  htmlEntities: function(text) { 
    var entities = {
      '&':'&amp;',
      '<':'&lt;',
      '>':'&gt;',
      '"':'&quot;',
      "\\n": "<br />"
    };
    for(var i in entities) {
      text = text.replace(new RegExp(i,'g'),entities[i]);
    }
    return text;
  },

  /***************************************************************************
   * plugin defaults
   */
  defaults: {
    copyField: '<li><a href="#" title="Copy Topic"><span>Seite kopieren</span></a></li>',
    renameField: '<li><a href="#" title="Seite verschieben"><span>Seite verschieben</span></a></li>',
    deleteField: '<li><a href="#" title="Seite löschen"><span>Seite löschen</span></a></li>',
    languageField: '<li><a href="#" title="Sprachen"><span>Sprachen</span></a></li>',
    printField: '<li><a href="#" title="Drucken"><span>Drucken</span></a></li>',
    accessField: '<li><a href="#" title="Rechte"><span>Rechte</span></a></li>',
    preferencesField: '<li><a href="#" title="Einstellungen"><span>Einstellungen</span></a></li>',


    autoHideToolbar: false,
    autoMaxExpand:false,
    autoExpand:false,
    minHeight:230,

    showToolbar: true,
    showHeadlineTools: true,
    showTextTools: true,
    showListTools: true,
    showParagraphTools: true,
    showObjectTools: true
  }
};

/*
 * Modac: Hier werden die einzelnen Dialoge initialisiert
 * 
 * 
 */

/* register to jquery */
$.fn.usability = $.usability.build;

/* initializer */
$(function() {
  // finish defaults at dom ready
  $.usability.defaults.copyDialog = {
    url: foswiki.getPreference("SCRIPTURLPATH")+'/rest/RenderPlugin/template?name=moredialog;expand=copytopic;topic='+foswiki.getPreference("WEB")+"."+foswiki.getPreference("TOPIC"),
    dialog: "#modacUsabilityCopyTopic"
  };
  $.usability.defaults.renameDialog =  {
    url: foswiki.getPreference("SCRIPTURLPATH")+'/rest/RenderPlugin/template?name=moredialog;expand=insertlink;topic='+foswiki.getPreference("WEB")+'.'+foswiki.getPreference("TOPIC"),
    dialog: '#modacUsabilityRenameTopic'
  };
  $.usability.defaults.deleteDialog =  {
    url: foswiki.getPreference("SCRIPTURLPATH")+'/rest/RenderPlugin/template?name=moredialog;expand=insertlink;topic='+foswiki.getPreference("WEB")+'.'+foswiki.getPreference("TOPIC"),
    dialog: '#modacUsabilityDeleteTopic'
  };
  
  $(".usablity").each(function() {
    $(this).usability({
      autoMaxExpand:false,
      signatureMarkup: ['-- ', foswiki.getPreference("WIKIUSERNAME"), ' - '+foswiki.getPreference("SERVERTIME")]
    });
  });
});

})(jQuery);
