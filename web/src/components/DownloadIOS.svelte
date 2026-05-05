<script lang="ts">
  // Stub component for iOS app download
  // Will be connected to actual App Store link when available
</script>

<section class="download-ios">
  <h2>Download for iOS</h2>
  <p>The Ease app is coming soon to the App Store.</p>
  
  <div class="app-store-stub">
    <div class="apple-logo">
      <svg viewBox="0 0 24 24" width="32" height="32" fill="currentColor">
        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.22-.18.44-.18.77 0 .52-.07 1.01-.19 1.52-.25.98-.87 2.18-1.3 2.88-.22.38-.52.84-.9.84-.4 0-.4-.24-.85-.77-.24-.3-.48-.68-.83-.68s-.56.25-.83.51c-.31.29-.6.67-.82.67-.23 0-.34-.14-.62-.54-.31-.45-.55-.93-.97-1.01-.2-.04-.37-.06-.54-.06-.41 0-.78.28-1.22.8-.74.87-.92 2-.92 3.19 0 1.18.18 2.23.49 2.94.31.72.74 1.43.74 1.43s-.28.18-.81.18c-.53 0-.81-.18-1.27-.55-.45-.37-.85-.93-.85-.93s.18.14.45.35zm-8.98-6.29c.32-.38.85-.6 1.45-.6.44 0 .81.16 1.13.45.32.29.5.69.5 1.13 0 .45-.18.85-.5 1.13-.32.29-.69.45-1.13.45-.6 0-1.13-.22-1.45-.6-.32-.38-.5-.88-.5-1.33 0-.45.18-.85.5-1.13z"/>
      </svg>
    </div>
    <div class="store-content">
      <span class="label">Available on the</span>
      <span class="store-name">App Store</span>
    </div>
  </div>

  <p class="coming-soon">Coming Soon</p>
</section>

<style>
  .download-ios {
    background: rgba(0, 0, 0, 0.05);
    border-radius: 16px;
    padding: 2rem;
    text-align: center;
  }

  h2 {
    font-size: 1.75rem;
    margin: 0 0 0.5rem 0;
    color: #1f1f1f;
  }

  p {
    color: #666;
    margin: 0 0 1.5rem 0;
  }

  .app-store-stub {
    display: inline-flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem 1.5rem;
    background: #1f1f1f;
    color: white;
    border-radius: 12px;
  }

  .apple-logo {
    opacity: 0.9;
  }

  .store-content {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    text-align: left;
  }

  .label {
    font-size: 0.75rem;
    opacity: 0.8;
  }

  .store-name {
    font-size: 1.25rem;
    font-weight: 600;
  }

  .coming-soon {
    margin-top: 1rem;
    font-size: 0.875rem;
    color: #888;
  }
</style>
