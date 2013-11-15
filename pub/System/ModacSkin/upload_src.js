jQuery(function($) {
    $('.modacUpload').submit(function() {
        $.blockUI({ message: foswiki.getMetaTag('TEXT_UPLOADBLOCK') });
    });
});
