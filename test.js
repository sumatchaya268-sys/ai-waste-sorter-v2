const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.type(), msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
  page.on('requestfailed', request => console.log('REQUEST FAILED:', request.url(), request.failure().errorText));

  // Also capture unhandled rejections inside the page context
  await page.evaluateOnNewDocument(() => {
    window.addEventListener('unhandledrejection', event => {
      console.error('Unhandled rejection:', event.reason);
    });
    window.addEventListener('error', event => {
      console.error('Window error:', event.message, event.filename, event.lineno, event.colno, event.error);
    });
  });

  try {
    await page.goto('https://ai-waste-sorter-v2.vercel.app', { waitUntil: 'networkidle0' });
    
    // Take a screenshot to see what it actually rendered
    await page.screenshot({ path: 'screenshot.png' });
    
    console.log('Main page loaded successfully');
  } catch (err) {
    console.error('Failed to load page:', err);
  }
  
  await browser.close();
})();
