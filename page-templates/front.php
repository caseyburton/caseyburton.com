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

		</div>
	</div>
<div class="main-cta-contain">
	<div class="main-cta">
		<ul class="accordion" data-accordion data-allow-all-closed="true">
		  <li class="accordion-item" data-accordion-item>
		    <a href="#" class="accordion-title button cta">Get at us</a>
		    <div class="accordion-content" data-tab-content>
				<?php echo do_shortcode('[contact-form-7 id="11" title="main-TEMP"]'); ?>
		    </div>
		  </li>
		</ul>
	</div>
</div>

</header>


<?php do_action( 'foundationpress_before_content' ); ?>
 <?php while ( have_posts() ) : the_post(); ?>
   <article <?php post_class('main-content') ?> id="post-<?php the_ID(); ?>">
       <?php do_action( 'foundationpress_page_before_entry_content' ); ?>
       <div class="entry-content">
      		<h2>Things we'll do</h2>
      		<p class="subheader">for awesome clients who are keen to the value of thoughtful work.</p>
       		<ul class="services">
       			<li>Branding</li>
       			<li>Websites</li>
       			<li>Social Media</li>
       			<li>Strategy</li>
       			<li>Signs</li>
       			<li>PR</li>
       			<li>Apparel</li>
       			<li>Posters</li>
       			<li>Menus</li>
       			<li>Advertising</li>
       			<li>Consulting</li>
       			<li>Packaging</li>
       			<li>Propaganda</li>
       			<li>Flyers</li>
       			<li>Catalogs</li>
       			<li>Advice</li>
       			<li>&amp;</li>
       			<li>more</li>
       		</ul>
       		<h2>Things we've done</h2>
       		<p class="subheader">for all sorts of companies and causes &mdash; and some paradigmatic pictures, too.</p>
           <?php the_content(); ?>
           <p class="portfolio-cta">In short, we're a <strong>collective</strong> of co-conspirators who find smart, snappy &amp; effective <strong>solutions</strong> to your creative needs. How can we be of service<br>
			<span class="question">?</span></p>

			<div class="main-cta-contain">
			<div class="main-cta">
				<ul class="accordion" data-accordion data-allow-all-closed="true">
				  <li class="accordion-item" data-accordion-item>
				    <a href="#" class="accordion-title button cta">Email us here</a>
				    <div class="accordion-content" data-tab-content>
						<?php echo do_shortcode('[contact-form-7 id="11" title="main-TEMP"]'); ?>
				    </div>
				  </li>
				</ul>
			</div>
		</div> <!-- entry-content -->

           <p class="temp-footer">Happy<span class="chap">Chap</span></p>
           <p class="creative">Creative Co.</p>
       </div>
   </article>
 <?php endwhile;?>

<?php get_footer();