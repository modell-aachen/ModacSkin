# See bottom of file for license and copyright information

package ModacSkinSeleniumTestCase;

use FoswikiSeleniumWdTestCase();
our @ISA = qw( FoswikiSeleniumWdTestCase );

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
    $this->{selenium}->get(
        Foswiki::Func::getScriptUrl(
            $this->{test_web}, $this->{test_topic}, 'login'
        )
    );
    my $usernameInputFieldLocator = 'input[name="username"]';
    $this->{selenium}->find_element($usernameInputFieldLocator, 'css')->send_keys($Foswiki::cfg{UnitTestContrib}{SeleniumRc}{Username});
    my $passwordInputFieldLocator = 'input[name="password"]';
    $this->{selenium}->find_element($passwordInputFieldLocator, 'css')->send_keys($Foswiki::cfg{UnitTestContrib}{SeleniumRc}{Password});

    my $loginFormLocator = 'form[name="loginform"]';
    $this->{selenium}->find_element('//input[@type="submit"]')->click();

    my $postLoginLocation = $this->{selenium}->get_current_url();
    my $viewUrl =
      Foswiki::Func::getScriptUrl( $this->{test_web}, $this->{test_topic},
        'view' );

    # XXX change here, so short urls work
    my $viewUrlShort = $viewUrl;
    $viewUrlShort =~ s#/bin/view##;
    my $urlTest = qr/^(?:\Q$viewUrl\E|\Q$viewUrlShort\E)$/;
    unless($postLoginLocation=~m/$urlTest/) {
        sleep(5); # maybe the page didn't load yet
        $postLoginLocation = $this->{selenium}->get_current_url();
        my $attempt = shift || 0;
        if(not $postLoginLocation=~m/$urlTest/ && $attempt < 5) {
            return $this->login(++$attempt);
        }
    }
    $this->assert_matches( $urlTest, $postLoginLocation );
}

sub verify_SeleniumRc_config {
    my $this = shift;
    $this->selenium->get(
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
    #$this->{selenium}->click_ok('css=li.modacMoreDynamic ul li ul .morelink-copy:first a');
    $this->{selenium}->find_element('li.modacMoreDynamic ul li ul .morelink-copy a', 'css')->click();
    $this->waitForPopup();
}

# Test if...
# ...the 'Attach' item appears and opens correctly
# ...all desired buttons are present (and no other)
sub verify_attachItem {
    my ( $this ) = @_;

    my $translations = $this->getTranslations();

    $this->assertNoPopup();

    $this->openTopicMenue();
    $this->{selenium}->find_element($translations->{attachLink}, 'link')->click();
    $this->waitForPopup();

    # check if buttons were created correctly
#    $this->assert( $this->{selenium}->find_element('button.ui-button span.ui-icon-circle-check', 'css') );
    my $accept = $this->{selenium}->execute_script('return jQuery("div.ui-dialog button.ui-button span.ui-icon-circle-check").parent().text()');
    $this->assert_equals($translations->{uploadLink}, $accept);
    my $cancel = $this->{selenium}->execute_script('return jQuery("div.ui-dialog button.ui-button span.ui-icon-cancel").parent().text()');
    $this->assert_equals($translations->{cancelLink}, $cancel);
    my $submit= $this->{selenium}->execute_script('return jQuery(".modacDialogContents input[type=\'submit\']").length');
    $this->assert_equals(0, $submit, "Additional submit buttons found!");
}

# Test if...
# ...canceling is possible
sub verify_attachItemCancelFunction {
    my ( $this ) = @_;

    my $translations = $this->getTranslations();

    $this->assertNoPopup();

    # press 'Cancel' button
    $this->openTopicMenue();
    $this->{selenium}->find_element($translations->{attachLink}, 'link')->click();
    $this->waitForPopup();
    $this->{selenium}->find_element('span.ui-icon-cancel', 'css')->click();
    $this->assertNoPopup();

    # reopening it
    $this->openTopicMenue();
    $this->{selenium}->find_element($translations->{attachLink}, 'link')->click();
    $this->waitForPopup();
}

# Test if...
# ...pressing "Attach file" is possible
sub verify_attachItemAttachFunction {
    my ( $this ) = @_;

    my $translations = $this->getTranslations();

    $this->assertNoPopup();

    # press 'Attach file' button
    # XXX unfortunately there is no way to upload a file since I can't know which file I could upload.
    $this->openTopicMenue();
    $this->{selenium}->find_element($translations->{attachLink}, 'link')->click();
    $this->waitForPopup();
    $this->{selenium}->find_element('span.ui-icon-circle-check', 'css')->click();
    my $uploadUrl = Foswiki::Func::getScriptUrl( Helper::WEB, 'WebHome', 'upload' );
    $this->waitFor( sub { $this->{selenium}->get_current_url() eq $uploadUrl }, 'Failed upload did not lead to oops page' ); # This should be an oops page saying the file has no content XXX this is not a strong test
}

# Test if...
# ...StrikeOne is beeing loaded when not present
sub verify_strikeOne {
    my ( $this ) = @_;

    my $translations = $this->getTranslations( Helper::WEB, Helper::NOFAV );

    # check if there is no StrikeOne
    my $strikeone = $this->{selenium}->execute_script('return typeof StrikeOne');
    $this->assert_equals( 'undefined', $strikeone, 'Test impossible, StrikeOne already loaded' );

    # now open any menue item and see if this enables StrikeOne
    $this->openTopicMenue();
    $this->{selenium}->find_element($translations->{attachLink}, 'link')->click();
    $this->waitForPopup();
    # check StrikeOne
    $strikeone = $this->{selenium}->execute_script('return typeof StrikeOne');
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
    $this->{selenium}->find_element('li.modacMoreDynamic ul li ul .morelink-rename a', 'css')->click();
    $this->waitForPopup();

    # check for login box and login
    $this->assert( $this->{selenium}->find_element('foswikiLogin', 'id') );
    $this->loginDialog();

    # check UI is not blocked
    # XXX no published api
    # XXX Might take a while for scripts to finish
    $this->waitFor( sub { $this->{selenium}->execute_script('return jQuery("div.blockUI:visible").length') == 0 }, 'Screen is still blocked.' );
}

# Test if...
# ...login box works with non-MoreTopicAction items (attach)
sub verify_loginBoxAttachment {
    my ( $this ) = @_;

    # approach: Login to a page, logout in another window, press the attach-button, a login-box should appear

    # Login as user with change acls
    my $translations = $this->getTranslations();

    # Logout in background
    $this->backgroundLogout();

    # open attach item
    $this->openTopicMenue();
    $this->{selenium}->find_element($translations->{attachLink}, 'link')->click();
    $this->waitForPopup();

    # check for login box and login
    $this->{selenium}->find_element('foswikiLogin', 'id'); # check if element present
    $this->loginDialog();

    # check UI is not blocked
    # XXX no published api
    # XXX Might take a while for scripts to finish
    $this->waitFor( sub { $this->{selenium}->execute_script('return jQuery("div.blockUI:visible").length') == 0 }, 'Screen is still blocked.' );
}

# Test if...
# ...clicking on a dead link will bring up the WCNT dialog
# ...#topic and #topictitle will be set correctly, even if dialog was reopened
sub verify_deadlink {
    my ( $this ) = @_;

    $this->loginto(Helper::WEB, Helper::DEADLINKS);

    $this->assertNoPopup();
    $this->{selenium}->find_element('DoesNotExist', 'link')->click();
    $this->waitForPopup();
    $this->waitFor( sub { $this->{selenium}->execute_script('return jQuery(".InputsPrepared:visible").length') }, 'WCNT window did not initialize inputs' );
    $this->assert_equals('DoesNotExist', $this->{selenium}->find_element('topictitle', 'id')->get_value());
    $this->assert_equals(Helper::WEB.'.DoesNotExist', $this->{selenium}->find_element('topic', 'id')->get_value());
    $this->{selenium}->find_element('span.ui-icon-cancel', 'css')->click();

    # same link again
    $this->assertNoPopup();
    $this->{selenium}->find_element('DoesNotExist', 'link')->click();
    $this->waitForPopup();
    $this->waitFor( sub { $this->{selenium}->execute_script('return jQuery(".InputsPrepared:visible").length') }, 'WCNT window did not initialize inputs' );
    $this->assert_equals('DoesNotExist', $this->{selenium}->find_element('topictitle', 'id')->get_value());
    $this->assert_equals(Helper::WEB.'.DoesNotExist', $this->{selenium}->find_element('topic', 'id')->get_value());
    $this->{selenium}->find_element('span.ui-icon-cancel', 'css')->click();

    # different link, #topictitle and #topic have to change now
    $this->assertNoPopup();
    $this->{selenium}->find_element('DoesNotExistAsWell', 'link')->click();
    $this->waitForPopup();
    $this->waitFor( sub { $this->{selenium}->execute_script('return jQuery(".InputsPrepared:visible").length') }, 'WCNT window did not initialize inputs' );
    $this->assert_equals('DoesNotExistAsWell', $this->{selenium}->find_element('topictitle', 'id')->get_value());
    $this->assert_equals(Helper::WEB.'.DoesNotExistAsWell', $this->{selenium}->find_element('topic', 'id')->get_value());
    $this->{selenium}->find_element('span.ui-icon-cancel', 'css')->click();
}

# Test if...
# ...the submenue appears right of the normal menue
sub verify_menuePosition {
    my ( $this ) = @_;

    $this->loginto(Helper::WEB, Helper::MEASURE);

    my $width = $this->{selenium}->find_element('fixedWidthElevenem', 'id')->get_size()->{width};
    my $extrawidth = $this->{selenium}->find_element('fixedWidthOneem', 'id')->get_size()->{width};
    my $paddingrightwidth = $this->{selenium}->find_element('fixedWidthOFourem', 'id')->get_size()->{width};
#    my $width = $this->{selenium}->get_element_width('css=#fixedWidth11em');
#    my $extrawidth = $this->{selenium}->get_element_width('css=#fixedWidth1em');
#    my $paddingrightwidth = $this->{selenium}->get_element_width('css=#fixedWidth04em');
    my $paddingleftwidth = 25;
    my $roundingerr = 3;

    $this->openTopicSubMenue();
    my $leftMenue = $this->{selenium}->find_element('.modacMoreMenu li ul li', 'css')->get_element_location()->{x};
    my $leftSubMenue = $this->{selenium}->find_element('.modacMoreMenu li ul li ul li', 'css')->get_element_location()->{x};

    $this->assert($leftSubMenue - $leftMenue >= $width, "Submenu appears to be misplaced to the left (11em: $width menue: $leftMenue submenue: $leftSubMenue");
    $this->assert($leftSubMenue - $leftMenue <= $width + $extrawidth + $paddingrightwidth + $paddingleftwidth + $roundingerr, "Submenu appears to be misplaced to the right (11em: $width menue: $leftMenue submenue: $leftSubMenue");
}

# Make sure there is currently no popup visible.
# Only registers 'modacAjaxDialog' popups.
sub assertNoPopup {
    my ( $this ) = @_;

#    if ( $this->{selenium}->is_element_present('css=div.modacAjaxDialog') ) {
#        $this->assert((not $this->{selenium}->is_visible('css=div.modacAjaxDialog')), 'There already is a popup!');
#    }
#    if ( $this->{selenium}->is_element_present('css=div.modacLoadingDialog') ) {
#        $this->assert((not $this->{selenium}->is_visible('css=div.modacLoadingDialog')), 'There already is a "Loading" popup!');
#    }
    # the above do not work quite well, so I check with javascript as well
    my $n = $this->{selenium}->execute_script('return jQuery("div.modacLoadingDialog:visible, div.modacAjaxDialog:visible").length');
    $this->assert_equals(0, $n, 'There are popups visible');
}

# Waits until a popup appears.
# Only registers 'modacAjaxDialog' popups.
sub waitForPopup {
    my ( $this ) = @_;

    # for some reason this does not work:
    #    $this->waitFor( sub { try { return shift->{selenium}->is_visible('css=div.modacAjaxDialog'); } otherwise {return 0; }; }, 'Popup did not appear', undef, 8000 );

    my $n = $this->{selenium}->execute_script('return jQuery("div.modacLoadingDialog:visible, div.modacAjaxDialog:visible").length');
    $this->waitFor( sub { $this->{selenium}->execute_script('return jQuery("div.modacAjaxDialog:visible").length') }, 'Popup did not appear', undef, 5_000 );
}

# Login and open the $web.$topic (defaults to TestWeb.WebHome)
sub loginto {
    my ( $this, $web, $topic ) = @_;

    $web ||= Helper::WEB;
    $topic ||= $webhome;

    $this->login();
    $this->selenium->get(
        Foswiki::Func::getScriptUrl(
            $web, $topic, 'view'
        )
    );
}

# Fills out the login popup and presses the login button.
sub loginDialog {
    my ( $this ) = @_;

    # copy/paste login XXX na, it's not but should be
    my $usernameInputFieldLocator = 'input[name="username"]';
    $this->{selenium}->find_element( $usernameInputFieldLocator, 'css' )->send_keys(
        $Foswiki::cfg{UnitTestContrib}{SeleniumRc}{Username}
    );

    my $passwordInputFieldLocator = 'input[name="password"]';
    $this->{selenium}->find_element($passwordInputFieldLocator, 'css')->send_keys(
        $Foswiki::cfg{UnitTestContrib}{SeleniumRc}{Password} );
    # /copy/paste login
    $this->{selenium}->find_element('span.ui-icon-circle-check', 'css')->click();

    $this->waitForPopup();
}

# Logout in a background window and returns to the original window.
# As a result the user is no longer logged in, yet the old page with the former
# users permissions is still there.
# It will change to location BLOGOUT
sub backgroundLogout {
    my ( $this ) = @_; # One could pass a url to which to navigate after opening the popup - or return to current url

    $this->{selenium}->get(
        Foswiki::Func::getScriptUrl(
            Helper::WEB, Helper::BLOGOUT, 'view'
        )
    );

    $this->{selenium}->execute_script(<<'AJAX');
jQuery(function($) {
    $('.ajaxLink').click(function(){
        var $this = $(this);
        $.ajax({
            url: $this.attr('href'),
            context: $this
        }).done(function() {
            $(this).addClass('ajaxFinished');
        });
        return false;
    });
});
AJAX

    $this->{selenium}->find_element('Logout', 'link')->click();
    $this->waitFor( sub { $this->{selenium}->execute_script('return jQuery(".ajaxFinished").length') }, 'Ajax logout did not succeed', undef, 10_000 );
}

# 'hovers' the mouse over 'More topic actions' and waits for the menue to appear.
sub openTopicMenue {
    my ( $this ) = @_;

    my $element = $this->{selenium}->find_element('li.modacMoreDynamic a', 'css');
    $this->{selenium}->mouse_move_to_location(element => $element);
    my $menue = $this->{selenium}->find_element('li.modacMoreDynamic ul', 'css');
    $this->waitFor( sub { $menue->is_displayed() }, 'More-menue did not appear' );
}

# Opens the 'More topic actions' and then the submenue.
sub openTopicSubMenue {
    my ( $this ) = @_;

    $this->openTopicMenue();
    my $element = $this->{selenium}->find_element('li.modacMoreDynamic .moremenue-managepage', 'css');
    $this->{selenium}->mouse_move_to_location(element => $element);
    my $submenue = $this->{selenium}->find_element('li.modacMoreDynamic ul li ul li', 'css');
    $this->waitFor( sub { $submenue->is_displayed() }, 'sub-menue did not appear' );
}

# Will return a hash with common translataion and open the given topic.
# Parameters:
#    * goToWeb: Web to open after translations are fetched
#    * goToTopic : Topic to open after translations are fetched
# Returns:
#    * Hash with translations
sub getTranslations {
    my ( $this, $goToWeb, $goToTopic ) = @_;

    $goToWeb ||= Helper::WEB;
    $goToTopic ||= 'WebHome';

    my $translations = {};

    $this->loginto(Helper::WEB, Helper::TRANSLATIONS);

    $translations->{attachLink} = $this->{selenium}->find_element('Attach', 'id')->get_text();
    $translations->{uploadLink} = $this->{selenium}->find_element('UploadFile', 'id')->get_text();
    $translations->{cancelLink} = $this->{selenium}->find_element('Cancel', 'id')->get_text();

    $this->selenium->get(
        Foswiki::Func::getScriptUrl(
            $goToWeb, $goToTopic, 'view'
        )
    );

    return $translations;
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
