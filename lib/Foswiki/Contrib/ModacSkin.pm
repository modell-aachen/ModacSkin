# See bottom of file for license and copyright information
package Foswiki::Contrib::ModacSkin;
use strict;
use warnings;

our $VERSION = '1.4';
our $RELEASE = "1.4";
our $SHORTDESCRIPTION = 'Modell Aachen Skin (Mediawiki New Skin)';

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
