
chrome.commands.onCommand.addListener((command) => {
  console.log("Handling: " + command)

  if (command === 'generate_reply') {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      chrome.scripting.executeScript({
        target: { tabId: tabs[0].id },
        files: ['src/content.js'],
      });
    });
  } else if (command === "move_to_next_button") {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      chrome.scripting.executeScript({
        target: { tabId: tabs[0].id },
        files: ['src/move-to-next-button.js']
      });
    });
  } else if (command === "move_to_previous_button") {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      chrome.scripting.executeScript({
        target: { tabId: tabs[0].id },
        files: ['src/move-to-previous-button.js']
      });
    });
  }
});


//chrome.scripting.registerContentScripts({
//  matches: ["https://twitter.com/*"],
//  files: ['src/single-reply-content.js'],
//});

chrome.runtime.onInstalled.addListener(async function (details) {
  console.log('Handling runtime install...', ...arguments)

  const self = await chrome.management.getSelf()

  if (details.reason === 'update' && self.installType !== 'development') {
    const changelogUrl = chrome.runtime.getURL('src/changelog.html')

    chrome.tabs.create({ url: changelogUrl })
  }
})

// Helper to extract URLs from post
function extractUrlsFromPost(postElement) {
  const links = postElement.querySelectorAll('a');
  return Array.from(links).map(a => a.href).filter(href => href.startsWith('http') && !href.includes('x.com'));
}

// Keyword fallback for news-related
function isNewsRelated(text) {
  const keywords = ['news', 'article', 'breaking', 'report', 'update', 'story'];
  return keywords.some(word => text.toLowerCase().includes(word));
}

// Image attachment function
async function attachImage(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch linked page.');
    const html = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const imageUrl = doc.querySelector('meta[property="og:image"]')?.content;
    if (!imageUrl) return;

    const imageResponse = await fetch(imageUrl, { mode: 'cors' });
    if (!imageResponse.ok) throw new Error('Image fetch failed (possibly CORS blocked).');

    const blob = await imageResponse.blob();
    const file = new File([blob], 'relevant_image.jpg', { type: blob.type });

    const fileInput = document.querySelector('input[type="file"][accept*="image/*"]');
    if (!fileInput) throw new Error('Upload input not found.');

    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);
    fileInput.files = dataTransfer.files;
    fileInput.dispatchEvent(new Event('change', { bubbles: true }));
  } catch (error) {
    console.error('Image attachment failed:', error);
    // Optional: alert('Couldn\'t attach image.');
  }
}