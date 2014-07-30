# See bottom of file for license and copyright information
use strict;
use warnings;
use Exporter 'import';

package Helper;

use Foswiki();
use Error qw ( :try );

use constant WEB => 'TemporaryModacSkinTestWeb';
use constant TRASH => 'TemporaryModacSkinTrashWeb';
use constant ATTACHMENTTEXT1 => 'This will be attached in a UnitTest run and can be safely removed.';
use constant ATTACHMENTTEXT2 => 'This is another file, that will be attached in a UnitTest run and can be safely removed.';
use constant NOFAV => 'FavouritesDisabled';
use constant NOFAVVIEW => 'FavouritesDisabledView';
use constant DEADLINKS => 'DeadLinks';
use constant MEASURE => 'TestMeasures';
use constant BLOGOUT => 'BackgroundLogout';
use constant TRANSLATIONS => 'MaketextTranslations';

our @EXPORT_OK = qw ( WEB );
our %EXPORT_TAGS = (
    webs => [ 'WEB', 'TRASH' ],
    setup => [ 'set_up_users', 'set_up_webs' ],
    topics => [ 'NOFAV', 'DEADLINKS', 'MEASURE', 'BLOGOUT', 'TRANSLATIONS' ]
);

# Creates files to attach
sub set_up_attachments {
    my $other = shift;

    my $attachment1 = {};
    my $stream = File::Temp->new( UNLINK => 0 );
    print $stream ATTACHMENTTEXT1;
    $other->assert( $stream->close() );
    $attachment1->{filename} = $stream->filename;
    $attachment1->{stream} = $stream;
    $attachment1->{text} = ATTACHMENTTEXT1;

    my $attachment2 = {};
    $stream = File::Temp->new( UNLINK => 0 );
    print $stream Helper::ATTACHMENTTEXT2;
    $other->assert( $stream->close() );
    $attachment2->{filename} = $stream->filename;
    $attachment2->{stream} = $stream;
    $attachment2->{text} = ATTACHMENTTEXT2;

    return ( $attachment1, $attachment2 );
}

sub tear_down_attachments {
    my $attachments = shift;

    foreach my $attachment ( @$attachments ) {
        $attachment->{stream}->unlink_on_destroy(1);
    }
}

sub set_up_webs {
    my $other = shift;

    use Foswiki::AccessControlException;

    my $webs = {};

    # Set up test-webs and workflows
    $Foswiki::cfg{TrashWebName} = TRASH;
    my $query = Unit::Request->new('');
    my $user = becomeAnAdmin( $other );
    try {
        # Create TestWebs
        my $ps = WEB;
        $webs->{$ps} = $other->populateNewWeb( $ps, "_default" );
        $webs->{$ps}->finish();
        # Change WebPreferences
        my ( $wmeta, $wtext ) = Foswiki::Func::readTopic( $ps, $Foswiki::cfg{WebPrefsTopicName} );
        # set skin
        unless ( $wtext =~ s#(\s{3,}\* Set SKIN\s*=\s*).*#$1modac#g ) {
            $wtext = "   * Set SKIN = modac\n$wtext";
        }
        # disable KVPPlugin for these tests
        unless ( $wtext =~ s#(\s{3,}\* Set WORKFLOW\s*=\s*).*#$1#g ) {
            $wtext = "   * Set WORKFLOW =\n$wtext";
        }
        # allow testuser to view/write
        unless ( $wtext =~ s#(\s{3,}\* Set ALLOWWEBCHANGE\s*=\s*).*#$1$Foswiki::cfg{UnitTestContrib}{SeleniumRc}{Username}#g ) {
            $wtext = "   * Set ALLOWWEBCHANGE =$Foswiki::cfg{UnitTestContrib}{SeleniumRc}{Username}\n$wtext";
        }
        unless ( $wtext =~ s#(\s{3,}\* Set ALLOWWEBVIEW\s*=\s*).*#$1$Foswiki::cfg{UnitTestContrib}{SeleniumRc}{Username}#g ) {
            $wtext = "   * Set ALLOWWEBVIEW =$Foswiki::cfg{UnitTestContrib}{SeleniumRc}{Username}\n$wtext";
        }
        unless ( $wtext =~ s#(\s{3,}\* Set ALLOWWEBRENAME\s*=\s*).*#$1$Foswiki::cfg{UnitTestContrib}{SeleniumRc}{Username}#g ) {
            $wtext = "   * Set ALLOWWEBRENAME =$Foswiki::cfg{UnitTestContrib}{SeleniumRc}{Username}\n$wtext";
        }
        Foswiki::Func::saveTopic( $ps, $Foswiki::cfg{WebPrefsTopicName}, $wmeta, $wtext );
        # Make a topic without favourites-star
        Foswiki::Func::saveTopic( $ps, NOFAVVIEW.'Template', undef, "%TMPL:INCLUDE{\"view\"}%\n%TMPL:DEF{\"modacFavTopic\"}%%TMPL:END%" );
        Foswiki::Func::saveTopic( $ps, NOFAV, undef, "   * Set VIEW_TEMPLATE = ".NOFAVVIEW );
        Foswiki::Func::saveTopic( $ps, DEADLINKS, undef, "   * [[DoesNotExist]]\n   * [[%WEB%.DoesNotExistAsWell][DoesNotExistAsWell]]" );
        Foswiki::Func::saveTopic( $ps, MEASURE, undef, "   * 11em: <div style=\"background-color:red; width: 11em; height: 1em;\" id=\"fixedWidthElevenem\"></div>\n   * 1em: <div style=\"background-color:red; width: 1em; height: 1em;\" id=\"fixedWidthOneem\"></div>\n   * 0.4em: <div style=\"background-color:red; width: 0.4em; height: 1em;\" id=\"fixedWidthOFourem\"></div>\n" );
        Foswiki::Func::saveTopic( $ps, BLOGOUT, undef, '<a href="%SCRIPTURL{view}%/%WEB%/%TOPIC%?logout=1" class="ajaxLink">Logout</a>' );
        Foswiki::Func::saveTopic( $ps, TRANSLATIONS, undef, '<span id="Attach">%TMPL:P{modacAttach}%</span><br/><span id="UploadFile">%MAKETEXT{"Upload file"}%</span><br/><span id="Cancel">%MAKETEXT{"Cancel"}%</span>' );

        $ps = TRASH;
        $webs->{$ps} = $other->populateNewWeb( $ps, "_default" );
        $webs->{$ps}->finish();
    }
    catch Foswiki::AccessControlException with {
        my $e = shift;
        die "???" unless $e;
        $other->assert( 0, ($e->can('stringify'))?$e->stringify():$e );
    }
    catch Error::Simple with {
        $other->assert( 0, shift->stringify() || '' );
    };

    return $webs;
}

sub tear_down_webs {
    my ( $other, $webs ) = @_;

    foreach my $web ( keys($webs) ) {
        $other->removeWebFixture( $other->{session}, $web );
    }
}

sub becomeAnAdmin {
    my ( $this ) = @_;

    $this->createNewFoswikiSession( $Foswiki::cfg{AdminUserLogin} || 'AdminUser' );
    my $user = Foswiki::Func::getWikiName();
    $this->assert( Foswiki::Func::isAnAdmin($user), "Could not become AdminUser, tried as $user." );
    return $user;
}

1;
