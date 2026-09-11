// site.js - shared front-end behaviour loaded on every page via
//   <script src="assets/site.js" defer></script>
// Currently: top-nav (burger toggle, aria-expanded, close-on-link, scroll 'stuck').
// Self-guards with if(!n)return, so it is inert on any page without the nav.
// See /ARCHITECTURE.md.

(function(){var n=document.getElementById('mnav');if(!n)return;var b=document.getElementById('mnav-burger');if(b){b.addEventListener('click',function(){var o=n.classList.toggle('open');b.setAttribute('aria-expanded',o?'true':'false');});}n.querySelectorAll('.mnav-drawer a').forEach(function(a){a.addEventListener('click',function(){n.classList.remove('open');});});window.addEventListener('scroll',function(){n.classList.toggle('stuck',window.scrollY>12);},{passive:true});})();
