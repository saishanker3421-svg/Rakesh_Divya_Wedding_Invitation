(() => {
  const gallery = document.querySelector('.memories-grid');
  if (!gallery) return;

  const lightbox = document.createElement('div');
  lightbox.className = 'memory-lightbox';
  lightbox.setAttribute('role', 'dialog');
  lightbox.setAttribute('aria-modal', 'true');
  lightbox.setAttribute('aria-label', 'Expanded wedding photograph');

  const enlarged = document.createElement('img');
  const close = document.createElement('button');
  close.className = 'memory-lightbox-close';
  close.type = 'button';
  close.setAttribute('aria-label', 'Close photo');
  close.innerHTML = '&times;';
  lightbox.append(enlarged, close);
  document.body.appendChild(lightbox);

  let previousFocus = null;
  const open = (thumbnail) => {
    previousFocus = document.activeElement;
    enlarged.src = thumbnail.currentSrc || thumbnail.src;
    enlarged.alt = thumbnail.alt || 'Wedding memory';
    lightbox.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    close.focus();
  };
  const dismiss = () => {
    lightbox.classList.remove('is-open');
    document.body.style.overflow = '';
    enlarged.removeAttribute('src');
    if (previousFocus && typeof previousFocus.focus === 'function') previousFocus.focus();
  };

  gallery.querySelectorAll('figure').forEach((figure) => {
    const photo = figure.querySelector('img');
    if (!photo) return;
    figure.setAttribute('tabindex', '0');
    figure.setAttribute('role', 'button');
    figure.setAttribute('aria-label', `Enlarge ${photo.alt || 'wedding photo'}`);
    figure.addEventListener('click', () => open(photo));
    figure.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        open(photo);
      }
    });
  });

  close.addEventListener('click', dismiss);
  lightbox.addEventListener('click', (event) => {
    if (event.target === lightbox) dismiss();
  });
  document.addEventListener('keydown', (event) => {
    if (!lightbox.classList.contains('is-open')) return;
    if (event.key === 'Escape') dismiss();
  });
})();
