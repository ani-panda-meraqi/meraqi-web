// beta-form.js - the beta sign-up form, on every page that has one (form[data-beta]).
//   <script src="assets/beta-form.js" defer></script>
// data-beta names the page (home, pricing, comparison). It is sent to /api/waitlist as
// source, and the function stores it only if it is on its fixed list, so each row
// records which page the sign-up came from. The page confirms only when the function
// says the row was read back from the table (saved === true).

(function(){
  function wire(form){
    form.addEventListener('submit', async function(e){
      e.preventDefault();
      var input = form.querySelector('input[type=email]');
      var btn = form.querySelector('button');
      var email = (input.value || '').trim();
      if(!email) return;
      var label = btn.textContent;
      var next = form.nextElementSibling;
      var status = (next && next.classList.contains('capture-status')) ? next : null;
      var msg = 'Could not save right now. Please try again.';
      btn.disabled = true; input.disabled = true; btn.textContent = 'Adding you...';
      if(status){ status.textContent = ''; status.classList.remove('err'); }
      try{
        var res = await fetch('/api/waitlist', {
          method:'POST',
          headers:{'content-type':'application/json'},
          body: JSON.stringify({ email: email, hp: (form.hp ? form.hp.value : ''), source: form.getAttribute('data-beta') || '' })
        });
        var data = null;
        try{ data = await res.json(); }catch(_){}
        // Confirm only when the server says the row is in the table (it reads it back first).
        if(res.ok && data && data.saved === true){
          // Success stays on screen. Built with DOM calls so the typed address can never inject markup.
          if(status){
            var strong = document.createElement('strong');
            strong.textContent = email;
            status.append("You're on the list. We'll email you at ", strong, " when your slot opens.");
            form.hidden = true;
            status.focus();
          } else {
            btn.textContent = "You're on the list ✓";
          }
          return;
        }
        if(data && data.error) msg = data.error;
      }catch(err){
        msg = 'Could not reach the server. Check your connection and try again.';
      }
      btn.textContent = label; btn.disabled = false; input.disabled = false;
      if(status){ status.classList.add('err'); status.textContent = msg; }
      input.focus();
    });
  }
  document.querySelectorAll('form[data-beta]').forEach(wire);
})();
