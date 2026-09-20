const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));

  try {
    await page.goto('https://ai-waste-sorter-v2.vercel.app', { waitUntil: 'networkidle0' });
    console.log('Main page loaded successfully');
  } catch (err) {
    console.error('Failed to load page:', err);
  }
  
  await browser.close();
})();
