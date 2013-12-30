# See bottom of file for license and copyright information

package ModacSkinSeleniumTestCase;

use FoswikiSeleniumTestCase();
our @ISA = qw( FoswikiSeleniumTestCase );

use strict;
use warnings;

#use Unit::Request();
#use Unit::Response();
#use Foswiki::UI::Register();
use Foswiki();
use Error qw ( :try );
use ModacSkin::Helper qw ( setup :webs :topics );

our $users;
our @attachments;
our $webhome = $Foswiki::cfg{HomeTopicName};

sub new {
    my ($class, @args) = @_;
    my $this = $class->SUPER::new('ModacSkinSeleniumTests', @args);

    return $this;
}

# Specify which test to run by exporting DOTEST=TestName in your shell.
sub skip {
    my ( $this, $test ) = @_;

    if ( $test && $ENV{DOTEST} && $test !~ m#^ModacSkinSeleniumTestCase::\Q$ENV{DOTEST}\E_on# ) {
        return "test not selected";
    }
    return $this->SUPER::skip( $test );
}

sub loadExtraConfig {
    my $this = shift;
    $this->SUPER::loadExtraConfig();
}

sub set_up {
    my $this = shift;

    $this->SUPER::set_up();

    $this->{webs} = Helper::set_up_webs($this);

    our @attachments = Helper::set_up_attachments($this);
}

sub tear_down {
    my ( $this ) = @_;

    Helper::tear_down_attachments(\@attachments);

    unless ( $ENV{KEEPTESTWEBS} ) {
        Helper::tear_down_webs( $this, $this->{webs} );
    }

    $this->SUPER::tear_down();
}

# XXX Copy/Paste/Change from FoswikiSeleniumTestCase
sub login {
    my $this = shift;

    #SMELL: Assumes TemplateLogin
    $this->{selenium}->open_ok(
        Foswiki::Func::getScriptUrl(
            $this->{test_web}, $this->{test_topic}, 'login'
        )
    );
    my $usernameInputFieldLocator = 'css=input[name="username"]';
    $this->{selenium}->wait_for_element_present( $usernameInputFieldLocator,
        $this->{selenium_timeout} );
    $this->{selenium}->type_ok( $usernameInputFieldLocator,
        $Foswiki::cfg{UnitTestContrib}{SeleniumRc}{Username} );

    my $passwordInputFieldLocator = 'css=input[name="password"]';
    $this->assertElementIsPresent($passwordInputFieldLocator);
    $this->{selenium}->type_ok( $passwordInputFieldLocator,
        $Foswiki::cfg{UnitTestContrib}{SeleniumRc}{Password} );

    my $loginFormLocator = 'css=form[name="loginform"]';
    $this->assertElementIsPresent($loginFormLocator);
    $this->{selenium}->click_ok('css=input.foswikiSubmit[type="submit"]');
    $this->{selenium}->wait_for_page_to_load( $this->{selenium_timeout} );

    my $postLoginLocation = $this->{selenium}->get_location();
    my $viewUrl =
      Foswiki::Func::getScriptUrl( $this->{test_web}, $this->{test_topic},
        'view' );

    # XXX change here, so short urls work
    my $viewUrlShort = $viewUrl;
    $viewUrlShort =~ s#/bin/view##;
    $this->assert_matches( qr/\Q$viewUrl\E|\Q$viewUrlShort\E$/, $postLoginLocation );
}

sub verify_SeleniumRc_config {
    my $this = shift;
    $this->selenium->open_ok(
        Foswiki::Func::getScriptUrl(
            $this->{test_web}, $this->{test_topic}, 'view'
        )
    );
    $this->login();
}

# Make sure there is currently no popup visible.
# Only registers 'modacAjaxDialog' popups.
sub assertNoPopup {
    my ( $this ) = @_;

    if ( $this->{selenium}->is_element_present('css=div.modacAjaxDialog') ) {
        $this->assert((not $this->{selenium}->is_visible('css=div.modacAjaxDialog')), 'There already is a popup!');
    }
    if ( $this->{selenium}->is_element_present('css=div.modacLoadingDialog') ) {
        $this->assert((not $this->{selenium}->is_visible('css=div.modacLoadingDialog')), 'There already is a "Loading" popup!');
    }
    # the above do not work quite well, so I check with javascript as well
    my $n = $this->{selenium}->get_eval('selenium.browserbot.getUserWindow().jQuery("div.modacLoadingDialog:visible, div.modacAjaxDialog:visible").length');
    $this->assert_equals(0, $n, 'There are popups visible');
}

# Waits until a popup appears.
# Only registers 'modacAjaxDialog' popups.
sub waitForPopup {
    my ( $this ) = @_;

    # for some reason this does not work:
    #    $this->waitFor( sub { try { return shift->{selenium}->is_visible('css=div.modacAjaxDialog'); } otherwise {return 0; }; }, 'Popup did not appear', undef, 8000 );

    $this->{selenium}->wait_for_condition('selenium.browserbot.getCurrentWindow().jQuery("div.modacAjaxDialog:visible").length', $this->{selenium_timeout});
}

# Login and open the $web.$topic (defaults to TestWeb.WebHome)
sub loginto {
    my ( $this, $web, $topic ) = @_;

    $web ||= Helper::WEB;
    $topic ||= $webhome;

    $this->login();
    $this->selenium->open_ok(
        Foswiki::Func::getScriptUrl(
            $web, $topic, 'view'
        )
    );
}

# Fills out the login popup and presses the login button.
sub loginDialog {
    my ( $this ) = @_;

    # copy/paste login
    my $usernameInputFieldLocator = 'css=input[name="username"]';
    $this->{selenium}->wait_for_element_present( $usernameInputFieldLocator,
        $this->{selenium_timeout} );
    $this->{selenium}->type_ok( $usernameInputFieldLocator,
        $Foswiki::cfg{UnitTestContrib}{SeleniumRc}{Username} );

    my $passwordInputFieldLocator = 'css=input[name="password"]';
    $this->assertElementIsPresent($passwordInputFieldLocator);
    $this->{selenium}->type_ok( $passwordInputFieldLocator,
        $Foswiki::cfg{UnitTestContrib}{SeleniumRc}{Password} );
    # /copy/paste login
    $this->{selenium}->click_ok('css=span.ui-icon-circle-check');

    $this->waitForPopup();
}

# Logout in a background window and returns to the original window.
# As a result the user is no longer logged in, yet the old page with the former
# users permissions is still there.
sub backgroundLogout {
    my ( $this ) = @_;

    my $popup = 'logout';
    my $logoutURL = Foswiki::Func::getScriptUrl( Helper::WEB, $webhome, 'view' ).'?logout=1';
    $this->{selenium}->open_window($logoutURL, $popup);
    $this->{selenium}->wait_for_pop_up($popup, $this->{selenium_timeout});
    $this->{selenium}->select_pop_up($popup);
    $this->{selenium}->close();
    $this->{selenium}->select_window('null');
}

1;
__END__
Foswiki - The Free and Open Source Wiki, http://foswiki.org/

Author: %$AUTHOR%

Copyright (C) 2008-2011 Foswiki Contributors. Foswiki Contributors
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
