<?php
/*
Template Name: Front
*/
get_header(); ?>


<header id="front-hero" role="banner">
	<section class="intro">
		<?php
		// If a feature image is set, get the id, so it can be injected as a css background property
		if ( has_post_thumbnail( $post->ID ) ) :
			$image = wp_get_attachment_image_src( get_post_thumbnail_id( $post->ID ), 'full' );
			$image = $image[0];
			?>

			<img id="featured-hero" src="<?php echo $image ?>">
		<?php endif;?>
		 <?php while ( have_posts() ) : the_post(); ?>
			<div class="content"><header>
					<h1 itemscope itemtype="http://schema.org/Person" class="name"><span itemprop="givenName" class="givenname">Casey</span> <span itemprop="familyName" class="familyname">Burton</span></h1>
				</header>
				<p class="title-loc"><strong>Graphic &amp; Web Designer</strong> Located in beautiful <strong>Bellingham, WA</strong>.</p>
				<p class="intro">Husband to a beautiful woman full of <a href="http://www.thedancestudio.net" title="Go check out The Dance Studio - teaching a love for dance since 1979" target="blank">dance</a> and joy, doting father of two, dedicated <a href="https://www.happychap.co" target="_blank" title="Agency partner @ HappyChap Creative Co. & The Happy Place">small business owner</a>,  building maint. / handyman / plumber extrordinaire &amp; son-of-a-fisherman. All-around inquisitive human being and hard-worker.</p>
				<?php the_content(); ?>
		 <?php endwhile;?>
		</section>

</header>

<?php get_footer();
