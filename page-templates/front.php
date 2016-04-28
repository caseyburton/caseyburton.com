<?php
/*
Template Name: Front
*/
get_header(); ?>

<header id="front-hero" role="banner">
	<div class="marketing">
		<div class="tagline">
			<p class="branding"><span class="happy">Happy</span><br> <span class="chap">Chap</span></p>
			<p class="brand-tag"><span class="creative">Creative</span> <span class="co">Co</span></p>
			<h1 class="subheader">A PNW design, build, create, make, help <span class="amp">&amp;</span> strategize agency. Digital <span class="amp">&amp;</span> <strike>dead tree</strike> print.</h1>
			<p class="location">Located in beautiful <strong>Bellingham, WA</strong>.</p>

			<ul class="accordion" data-accordion data-allow-all-closed="true">
			  <li class="accordion-item" data-accordion-item>
			    <a href="#" class="accordion-title button cta">Get at us</a>
			    <div class="accordion-content" data-tab-content>
					<?php echo do_shortcode('[contact-form-7 id="11" title="main-TEMP"]'); ?>
			    </div>
			  </li>
			  <!-- ... -->
			</ul>
		</div>
	</div>

</header>

<?php get_footer();
