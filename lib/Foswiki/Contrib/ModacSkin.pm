# See bottom of file for license and copyright information
package Foswiki::Contrib::ModacSkin;
use strict;
use warnings;

our $VERSION = '1.4';
our $RELEASE = "1.4";
our $SHORTDESCRIPTION = 'Modell Aachen Skin (Mediawiki New Skin)';

# Preferences for SIMILAR-TOPICS-Table
our $SITEPREFS = {
  SIMILAR_TOPICS => "0",
  SIMILAR_TOPICS_FORM => "*DocumentForm",
  SIMILAR_TOPICS_LIKE => "title_search,text",
  SIMILAR_TOPICS_BOOST => "title_search^2,text",
  SIMILAR_TOPICS_FIELDS => "title,web,topic,field_Responsible_s,score,date,process_state_s",
  SIMILAR_TOPICS_FILTER => "-topic:*%WORKFLOWSUFFIX% -topic:*Template",
  SIMILAR_TOPICS_MIN_TERM_FREQUENCY => "2",
  SIMILAR_TOPICS_MIN_DOCUMENT_FREQUENCY => "5",
  SIMILAR_TOPICS_MARK_AS_DISCUSSION => "DISCUSSION|CONTENT_REVIEW|FORMAL_REVIEW",
  SIMILAR_TOPICS_ROWS => "5",
  SOLR_HIDE_DOCUMENTTYPE => "0",
  SHOW_EDIT_PROFILE => "0",
  MYPAGE_LAST_CHANGED_FAVORITES_MAX_ITEMS => "999",
  MODAC_HIDEWEBS => 'Custom|Main|Manuals|Sandbox|System|System.Manuals|System.Standards|TWiki|Tasks|TestCases|Trash%WORKFLOWAPPPREVIEWAPPS{default=""}%%MULTISITECONFIGWEBS{default=""}%',
};

sub solrWhitelist {
    my $plugin = shift;
    my $expr = shift;

    return $expr =~ m#^\{!join to=workflow_origin_s from=webtopic whitelisted=ModacSkin v='field_Responsible_s:[a-z0-9A-Z_-]+ host:\$host'\}$#;
}

sub maintenanceHandler {
    Foswiki::Plugins::MaintenancePlugin::registerCheck("ModacSkin:Compare:skinorder", {
        name => "ModacSkin: Skin order when comparing",
        description => "ModacSkin's modaccompare should appear before contextmenue.",
        check => sub {
            my $skin = $Foswiki::cfg{Extensions}{CompareRevisionsAddOn}{skin} || '';
            unless($skin =~ m#\bmodaccompare\b#) {
                return {
                    result => 1,
                    priority => $Foswiki::Plugins::MaintenancePlugin::ERROR,
                    solution => "Please put modaccompare in compare skin, eg: {Extensions}{CompareRevisionsAddOn}{skin} = custom,modaccompare,contextmenu,kvp,modac"
                };
            }
            if($skin =~ m#\bcontextmenu\b.*,\s*modaccompare\b#) {
                $skin =~ s#,\s*modaccompare\b##;
                $skin =~ s#,\s*contextmenu\b#,modaccompare,contextmenu#;
                return {
                    result => 1,
                    priority => $Foswiki::Plugins::MaintenancePlugin::ERROR,
                    solution => "Please put modaccompare before contextmenue, ie: {Extensions}{CompareRevisionsAddOn}{skin} = $skin"
                };
            } else {
                return { result => 0 };
            }
        }
    });
    Foswiki::Plugins::MaintenancePlugin::registerCheck("ModacSkin:Solr:Version", {
        name => "ModacSkin: Solr version",
        description => "Check if SolrPlugin needs to be updated.",
        check => sub {
            require Foswiki::Plugins::SolrPlugin;
            my $solrRelease = $Foswiki::Plugins::SolrPlugin::RELEASE;
            my @minRequired = (4, 0, 10);

            unless( $solrRelease =~ m#(\d+)\.(\d+)(?:\.(\d+))?$#) {
                return {
                    result => 1,
                    priority => $Foswiki::Plugins::MaintenancePlugin::ERROR,
                    solution => "Could not parse your SolrPlugin version. Probable cause: non-release branch. Please review version. Version: '$solrRelease'."
                };
            }
            my ($major, $minor, $build) = ($1, $2, $3);

            my $ok = { result => 0 };
            my $error = {
                result => 1,
                priority => $Foswiki::Plugins::MaintenancePlugin::ERROR,
                solution => "Your SolrPlugin version ($solrRelease) does not meet the minimum requirements (".join('.', @minRequired)."), please update SolrPlugin."
            };

            return $ok if( $major > $minRequired[0] );
            return $error if( $major < $minRequired[0] );
            return $ok if( $minor > $minRequired[1] );
            return $error if( $minor < $minRequired[1] );
            return $ok if ( not defined $build ) || $build >= $minRequired[2]; # $build not defined most likely means git repo.
            return $error;

        }
    });
    Foswiki::Plugins::MaintenancePlugin::registerCheck("ModacSkin:Solr:Autocomplete", {
        name => "ModacSkin: =MODAC_SOLR_AC_FILTER=",
        description => "Set ModacSkin's =MODAC_SOLR_AC_FILTER= for autocomplete.",
        check => sub {
            my ($web, $topic) = Foswiki::Func::normalizeWebTopicName(undef, $Foswiki::cfg{LocalSitePreferences});
            my ($meta, $text) = Foswiki::Func::readTopic($web, $topic);

            if($text =~ m#$Foswiki::regex{bulletRegex}\s+Set\s+MODAC_SOLR_AC_FILTER\s*=#m) {
                return { result => 0 };
            } else {
                return {
                    result => 1,
                    priority => $Foswiki::Plugins::MaintenancePlugin::WARN,
                    solution => "Please make sure =MODAC_SOLR_AC_FILTER= is set on [[$Foswiki::cfg{LocalSitePreferences}]], a reasonable value is <verbatim>   * Set MODAC_SOLR_AC_FILTER = -web:(System OR Main OR Custom OR Sandbox OR Manuals OR Tasks)</verbatim>" # XXX Duplicated in qdeploy
                };
            }
        }
    });
    Foswiki::Plugins::MaintenancePlugin::registerCheck("ModacSkin:HIDE_WEBS:default", {
        name => "Check for old settings",
        description => "Check SitePreferences for MODAC_HIDEWEBS default",
        check => sub {
            my ($web, $topic) = Foswiki::Func::normalizeWebTopicName(undef, $Foswiki::cfg{LocalSitePreferences});
            my $text = Foswiki::Func::readTopic($web, $topic);
            my $sitePrefs = $SITEPREFS->{MODAC_HIDEWEBS};
            $sitePrefs = quotemeta($sitePrefs);
            if($text =~ m#$Foswiki::regex{setRegex}MODAC_HIDEWEBS\s*=\s*$sitePrefs\s*$#m) {
                return {
                    result => 1,
                    priority => $Foswiki::Plugins::MaintenancePlugin::WARN,
                    solution => "Your MODAC_WEBMAPPINGS equal the DefaultPreference; you can remove it from your SitePreferences.",
                };
            } else {
                return { result => 0 };
            }
        }
    });

}

1;
__END__
Foswiki - The Free and Open Source Wiki, http://foswiki.org/

Copyright (C) 2008-2014 Foswiki Contributors. Foswiki Contributors
are listed in the AUTHORS file in the root of this distribution.
NOTE: Please extend that file, not this notice.

This program is free software; you can redistribute it and/or
modify it under the terms of the GNU General Public License
as published by the Free Software Foundation; either version 2
of the License, or (at your option) any later version. For
more details read LICENSE in the root of this distribution.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.

As per the GPL, removal of this notice is prohibited.
