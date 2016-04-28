<?php
/**
 * Custom functions
 *
 * @package FoundationPress
 * @since FoundationPress 1.0.0
 */



	define( 'GITHUB_UPDATER_EXTENDED_NAMING', true );

	add_filter('wpcf7_ajax_loader', 'change_wpcf7_ajax_loader');

	// Change the URL to the ajax-loader image
	function change_wpcf7_ajax_loader($url) {
	    return get_template_directory_uri()."/assets/images/ajax-loader.gif";
	}

?>