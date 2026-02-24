let deferredPrompt;
const installButton = document.getElementById('install-pwa-button'); // Your custom install button

window.addEventListener('beforeinstallprompt', (e) => {
  // Prevent the mini-infobar from appearing on mobile
  e.preventDefault();
  // Stash the event so it can be triggered later.
  deferredPrompt = e;
  // Update UI notify the user they can install the PWA
  if (installButton) {
    installButton.style.display = 'block';
  }
  console.log('beforeinstallprompt event fired.');
});

if (installButton) {
  installButton.addEventListener('click', async () => {
    if (deferredPrompt) {
      // Show the install prompt
      deferredPrompt.prompt();
      // Wait for the user to respond to the prompt
      const { outcome } = await deferredPrompt.userChoice;
      // Optionally, send analytics event with outcome of user choice
      console.log(`User response to the install prompt: ${outcome}`);
      // We've used the prompt, and can't use it again, clear it.
      deferredPrompt = null;
      // Hide the install button if it was shown
      installButton.style.display = 'none';
    }
  });
}

window.addEventListener('appinstalled', () => {
  // Log install to analytics
  console.log('PWA was installed!');
  // Hide the install button if it was shown
  if (installButton) {
    installButton.style.display = 'none';
  }
});