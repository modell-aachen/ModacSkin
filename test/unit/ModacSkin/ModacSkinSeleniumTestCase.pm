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

# Test if...
# ...the "More topic actions" menue and "Manage page" menue appear
sub verify_topmenueAppears {
    my ( $this ) = @_;

    my $web = Helper::WEB;

    $this->loginto();

    $this->openTopicSubMenue();
}

# Test if...
# ...the 'Copy topic' item appears and opens correctly
sub verify_CopyTopicItem {
    my ( $this ) = @_;

    $this->loginto();

    $this->assertNoPopup();

    $this->openTopicSubMenue();
    $this->{selenium}->click_ok('css=li.modacMoreDynamic ul li ul .morelink-copy:first a');
    $this->waitForPopup();
}

# Test if...
# ...the 'Attach' item appears and opens correctly
# ...all desired buttons are present (and no other)
sub verify_attachItem {
    my ( $this ) = @_;

    $this->loginto();

    $this->assertNoPopup();

    $this->openTopicMenue();
    $this->{selenium}->click_ok('link=Attach');
    $this->waitForPopup();

    # check if buttons were created correctly
#    $this->assert( $this->{selenium}->is_element_present('css=button.ui-button span.ui-icon-circle-check') );
    my $accept = $this->{selenium}->get_eval('selenium.browserbot.getCurrentWindow().jQuery("div.ui-dialog button.ui-button span.ui-icon-circle-check").parent().text()');
    $this->assert_equals('Upload file', $accept);
    my $cancel = $this->{selenium}->get_eval('selenium.browserbot.getCurrentWindow().jQuery("div.ui-dialog button.ui-button span.ui-icon-cancel").parent().text()');
    $this->assert_equals('Cancel', $cancel);
    my $submit= $this->{selenium}->get_eval('selenium.browserbot.getCurrentWindow().jQuery(".modacDialogContents input[type=\'submit\']").length');
    $this->assert_equals(0, $submit, "Additional submit buttons found!");
}

# Test if...
# ...canceling is possible
sub verify_attachItemCancelFunction {
    my ( $this ) = @_;

    $this->loginto();

    $this->assertNoPopup();

    # press 'Cancel' button
    $this->openTopicMenue();
    $this->{selenium}->click_ok('link=Attach');
    $this->waitForPopup();
    $this->{selenium}->click_ok('css=span.ui-icon-cancel');
    $this->assertNoPopup();

    # reopening it
    $this->openTopicMenue();
    $this->{selenium}->click_ok('link=Attach');
    $this->waitForPopup();
}

# Test if...
# ...pressing "Attach file" is possible
sub verify_attachItemAttachFunction {
    my ( $this ) = @_;

    $this->loginto();

    $this->assertNoPopup();

    # press 'Attach file' button
    # XXX unfortunately there is no way to upload a file since I can't know which file I could upload.
    $this->openTopicMenue();
    $this->{selenium}->click_ok('link=Attach');
    $this->waitForPopup();
    $this->{selenium}->click_ok('css=span.ui-icon-circle-check');
    $this->{selenium}->wait_for_page_to_load( $this->{selenium_timeout} );
    my $location = $this->{selenium}->get_location();
    my $uploadUrl = Foswiki::Func::getScriptUrl( Helper::WEB, $webhome, 'upload' );
    $this->assert_equals( $uploadUrl, $location ); # This should be an oops page saying the file has no content
}

# Test if...
# ...StrikeOne is beeing loaded when not present
sub verify_strikeOne {
    my ( $this ) = @_;

    $this->loginto( Helper::WEB, Helper::NOFAV );

    # check if there is no StrikeOne
    my $strikeone = $this->{selenium}->get_eval('typeof selenium.browserbot.getUserWindow().StrikeOne');
    $this->assert_equals( 'undefined', $strikeone, 'Test impossible, StrikeOne already loaded' );

    # now open any menue item and see if this enables StrikeOne
    $this->openTopicMenue();
    $this->{selenium}->click_ok('link=Attach');
    $this->waitForPopup();
    # check StrikeOne
    $strikeone = $this->{selenium}->get_eval('typeof selenium.browserbot.getUserWindow().StrikeOne');
    $this->assert_equals( 'object', $strikeone, 'StrikeOne did not load' );
}

# Test if...
# ...login box works with MoreTopicAction items (Rename / Move topic)
sub verify_loginBoxRenameMove {
    my ( $this ) = @_;

    # Login as user with change acls
    $this->loginto(undef);

    # Logout in background
    $this->backgroundLogout();

    # open rename / move item
    $this->openTopicSubMenue();
    $this->{selenium}->click_ok('css=li.modacMoreDynamic ul li ul .morelink-rename:first a');
    $this->waitForPopup();

    # check for login box and login
    $this->assert( $this->{selenium}->is_element_present('css=#foswikiLogin') );
    $this->loginDialog();

    # check UI is not blocked
    # XXX no published api
    $this->assert( $this->{selenium}->get_eval('selenium.browserbot.getUserWindow().jQuery("div.blockUI:visible").length') == 0 );
}

# Test if...
# ...login box works with non-MoreTopicAction items (attach)
sub verify_loginBoxAttachment {
    my ( $this ) = @_;

    # approach: Login to a page, logout in another window, press the attach-button, a login-box should appear

    # Login as user with change acls
    $this->loginto(undef);

    # Logout in background
    $this->backgroundLogout();

    # open attach item
    $this->openTopicMenue();
    $this->{selenium}->click_ok('link=Attach');
    $this->waitForPopup();

    # check for login box and login
    $this->assert( $this->{selenium}->is_element_present('css=#foswikiLogin') );
    $this->loginDialog();

    # check UI is not blocked
    # XXX no published api
    $this->assert( $this->{selenium}->get_eval('selenium.browserbot.getUserWindow().jQuery("div.blockUI:visible").length') == 0 );
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

# 'hovers' the mouse over 'More topic actions' and waits for the menue to appear.
sub openTopicMenue {
    my ( $this ) = @_;

    $this->{selenium}->mouse_over('css=li.modacMoreDynamic a:first');
    $this->waitFor( sub { shift->{selenium}->is_visible('css=li.modacMoreDynamic ul'); }, 'menue did not appear' );
}

# Opens the 'More topic actions' and then the submenue.
sub openTopicSubMenue {
    my ( $this ) = @_;

    $this->openTopicMenue();
    $this->{selenium}->mouse_over('css=li.modacMoreDynamic .moremenue-managepage:first');
    $this->waitFor( sub { shift->{selenium}->is_visible('css=li.modacMoreDynamic ul li ul li'); }, 'sub-menue did not appear' );
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
