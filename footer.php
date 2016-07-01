<?php
/**
 * The template for displaying the footer
 *
 * Contains the closing of the "off-canvas-wrap" div and all content after.
 *
 * @package FoundationPress
 * @since FoundationPress 1.0.0
 */

?>

		</section>

<div id="footer-container">
			<!-- <footer id="footer">
				<h2 class="tease-header">Soon&hellip;</h2>
				<p class="tease-body">Exciting things are happening with <strong>The Chaps</strong> &ndash; stay tuned folks!</p>
				Begin MailChimp Signup Form
				<link href="//cdn-images.mailchimp.com/embedcode/slim-10_7.css" rel="stylesheet" type="text/css">
				<div id="mc_embed_signup">
				<form action="//happychapmedia.us10.list-manage.com/subscribe/post?u=82b0af98035b46118794c1b6f&amp;id=eb75f38c63" method="post" id="mc-embedded-subscribe-form" name="mc-embedded-subscribe-form" class="validate" target="_blank" novalidate>
				    <div id="mc_embed_signup_scroll">
					<label for="mce-EMAIL">Put your email here:</label>
					<input type="email" value="" name="EMAIL" class="email" id="mce-EMAIL" placeholder="email address" required>
				    real people should not fill this in and expect good things - do not remove this or risk form bot signups
				    <div style="position: absolute; left: -5000px;" aria-hidden="true"><input type="text" name="b_82b0af98035b46118794c1b6f_eb75f38c63" tabindex="-1" value=""></div>
				    <div class="clear"><input type="submit" value="Stalk Us" name="subscribe" id="mc-embedded-subscribe" class="button"></div>
				    </div>
				</form>
				</div>
			
			</footer> -->
		</div>

		<?php do_action( 'foundationpress_layout_end' ); ?>

<?php if ( get_theme_mod( 'wpt_mobile_menu_layout' ) == 'offcanvas' ) : ?>
		</div><!-- Close off-canvas wrapper inner -->
	</div><!-- Close off-canvas wrapper -->
</div><!-- Close off-canvas content wrapper -->
<?php endif; ?>


<?php wp_footer(); ?>
<?php do_action( 'foundationpress_before_closing_body' ); ?>

<script>
  (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
  (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
  m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
  })(window,document,'script','https://www.google-analytics.com/analytics.js','ga');

  ga('create', 'UA-80201603-1', 'auto');
  ga('send', 'pageview');

</script>

</body>
</html>
