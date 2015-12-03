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
            if($skin =~ m#\bcontextmenu\b.*,\s*modaccompare\b#) {
                $skin =~ s#,\s*modaccompare\b##;
                $skin =~ s#,\s*contextmenu\b#,modaccompare,contextmenu#;
                return {
                    result => 1,
                    priority => $Foswiki::Plugins::MaintenancePlugin::WARN,
                    solution => "Please put modaccompare before contextmenue, ie: {Extensions}{CompareRevisionsAddOn}{skin} = $skin"
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
