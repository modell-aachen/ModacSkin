#!/usr/bin/perl -w
BEGIN { 
	#Alex: Sonst klappt´s nicht
	$ENV{FOSWIKI_LIBS} = 'C:/EclipseWorkbench/super/foswiki1/trunk/core/lib';
	unshift @INC, split( /:/, $ENV{FOSWIKI_LIBS} ); }
use Foswiki::Contrib::Build;

# Create the build object
$build = new Foswiki::Contrib::Build('ModacSkin');

# (Optional) Set the details of the repository for uploads.
# This can be any web on any accessible Foswiki installation.
# These defaults will be used when expanding tokens in .txt
# files, but be warned, they can be overridden at upload time!

# name of web to upload to
$build->{UPLOADTARGETWEB} = 'Extensions';
# Full URL of pub directory
$build->{UPLOADTARGETPUB} = 'http://handbuch.open-quality.com/pub';
# Full URL of bin directory
$build->{UPLOADTARGETSCRIPT} = 'http://handbuch.open-quality.com/bin';
# Script extension
$build->{UPLOADTARGETSUFFIX} = '';

# Build the target on the command line, or the default target
$build->build($build->{target});

