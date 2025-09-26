// Content script for Google Business Scraper Chrome Extension
// Runs on Google Search and Google Maps pages

console.log('Google Business Scraper content script loaded');

// Listen for messages from background script and popup
window.addEventListener('message', (event) => {
  if (event.data.type === 'START_SCRAPING') {
    startScrapingProcess(event.data.data);
  }
});

// Main scraping function
async function startScrapingProcess(config) {
  console.log('Starting scraping process with config:', config);

  try {
    let businesses = [];
    const currentUrl = window.location.href;

    if (currentUrl.includes('google.com/search')) {
      businesses = await scrapeGoogleSearch();
    } else if (currentUrl.includes('google.com/maps') || currentUrl.includes('maps.google.com')) {
      businesses = await scrapeGoogleMaps();
    }

    console.log(`Found ${businesses.length} businesses`);

    // Send scraped data to background script
    for (const business of businesses) {
      await sendToBackground('saveBusiness', business);
    }

    // Notify completion
    showNotification(`Successfully scraped ${businesses.length} businesses`);

  } catch (error) {
    console.error('Scraping error:', error);
    showNotification('Error during scraping: ' + error.message);
  }
}

// Scrape businesses from Google Search results
async function scrapeGoogleSearch() {
  const businesses = [];

  // Look for local business results
  const businessElements = document.querySelectorAll('[data-ved]');

  for (const element of businessElements) {
    try {
      const business = await extractBusinessFromSearchElement(element);
      if (business && business.name) {
        businesses.push(business);
      }
    } catch (error) {
      console.error('Error extracting business from search element:', error);
    }
  }

  // Also check for map pack results
  const mapPackElements = document.querySelectorAll('[role="article"]');
  for (const element of mapPackElements) {
    try {
      const business = await extractBusinessFromMapPack(element);
      if (business && business.name) {
        businesses.push(business);
      }
    } catch (error) {
      console.error('Error extracting business from map pack:', error);
    }
  }

  return businesses;
}

// Scrape businesses from Google Maps
async function scrapeGoogleMaps() {
  const businesses = [];

  // Wait for map to load
  await waitForElement('[role="main"]', 5000);

  // Look for business listings in the sidebar
  const listItems = document.querySelectorAll('[role="article"]');

  for (const item of listItems) {
    try {
      const business = await extractBusinessFromMapsListing(item);
      if (business && business.name) {
        businesses.push(business);
      }
    } catch (error) {
      console.error('Error extracting business from maps listing:', error);
    }
  }

  // If no sidebar listings, try to get the currently selected business
  if (businesses.length === 0) {
    const selectedBusiness = await extractSelectedBusiness();
    if (selectedBusiness) {
      businesses.push(selectedBusiness);
    }
  }

  return businesses;
}

// Extract business data from Google Search element
async function extractBusinessFromSearchElement(element) {
  const business = {};

  try {
    // Business name
    const nameElement = element.querySelector('h3, [role="heading"]');
    if (nameElement) {
      business.name = cleanText(nameElement.textContent);
    }

    // Address
    const addressElement = element.querySelector('[data-ved] span:contains("·")') ||
                          element.querySelector('span[style*="color"]');
    if (addressElement) {
      business.address = cleanText(addressElement.textContent);
    }

    // Phone number
    const phoneElement = element.querySelector('span[style*="color"]:contains("(")') ||
                        element.querySelector('a[href*="tel:"]');
    if (phoneElement) {
      business.phone = extractPhone(phoneElement.textContent || phoneElement.href);
    }

    // Website
    const websiteElement = element.querySelector('a[href*="http"]:not([href*="google"])');
    if (websiteElement) {
      business.website = websiteElement.href;
    }

    // Rating
    const ratingElement = element.querySelector('[role="img"][aria-label*="star"]') ||
                         element.querySelector('span:contains("★")');
    if (ratingElement) {
      business.rating = extractRating(ratingElement.ariaLabel || ratingElement.textContent);
    }

    // Category/Type
    const categoryElement = element.querySelector('span[style*="color"]:first-of-type');
    if (categoryElement && !categoryElement.textContent.includes('·')) {
      business.category = cleanText(categoryElement.textContent);
    }

  } catch (error) {
    console.error('Error extracting from search element:', error);
  }

  return business;
}

// Extract business data from Google Maps pack element
async function extractBusinessFromMapPack(element) {
  const business = {};

  try {
    // Business name
    const nameElement = element.querySelector('h3') || element.querySelector('[role="heading"]');
    if (nameElement) {
      business.name = cleanText(nameElement.textContent);
    }

    // Rating and reviews
    const ratingElement = element.querySelector('[role="img"][aria-label*="star"]');
    if (ratingElement) {
      const ariaLabel = ratingElement.ariaLabel;
      business.rating = extractRating(ariaLabel);
      business.reviewCount = extractReviewCount(ariaLabel);
    }

    // Category
    const categoryElement = element.querySelector('span[style*="color"]:first-of-type');
    if (categoryElement) {
      business.category = cleanText(categoryElement.textContent);
    }

    // Address
    const addressElements = element.querySelectorAll('span');
    for (const span of addressElements) {
      if (span.textContent.match(/\d+.*\w+.*\w+/)) {
        business.address = cleanText(span.textContent);
        break;
      }
    }

    // Phone
    const phoneElement = element.querySelector('span:contains("(")');
    if (phoneElement) {
      business.phone = extractPhone(phoneElement.textContent);
    }

  } catch (error) {
    console.error('Error extracting from map pack element:', error);
  }

  return business;
}

// Extract business data from Google Maps listing
async function extractBusinessFromMapsListing(element) {
  const business = {};

  try {
    // Business name
    const nameElement = element.querySelector('[role="button"] div[aria-label]') ||
                       element.querySelector('h2') ||
                       element.querySelector('[data-value="name"]');

    if (nameElement) {
      business.name = cleanText(nameElement.textContent || nameElement.ariaLabel);
    }

    // Rating and reviews
    const ratingElement = element.querySelector('[role="img"][aria-label*="star"]');
    if (ratingElement) {
      business.rating = extractRating(ratingElement.ariaLabel);
      business.reviewCount = extractReviewCount(ratingElement.ariaLabel);
    }

    // Category
    const categoryElement = element.querySelector('[data-value="category"]') ||
                           element.querySelector('div:nth-child(2) span:first-child');
    if (categoryElement) {
      business.category = cleanText(categoryElement.textContent);
    }

    // Address
    const addressElement = element.querySelector('[data-value="address"]');
    if (addressElement) {
      business.address = cleanText(addressElement.textContent);
    }

    // Additional data by clicking on the business (if possible)
    const button = element.querySelector('[role="button"]');
    if (button) {
      // Store reference for potential detailed scraping
      business.detailsAvailable = true;
    }

  } catch (error) {
    console.error('Error extracting from maps listing:', error);
  }

  return business;
}

// Extract currently selected business from Google Maps
async function extractSelectedBusiness() {
  const business = {};

  try {
    // Wait for business info panel to load
    await waitForElement('[role="main"] h1', 3000);

    // Business name
    const nameElement = document.querySelector('[role="main"] h1');
    if (nameElement) {
      business.name = cleanText(nameElement.textContent);
    }

    // Rating and reviews
    const ratingElement = document.querySelector('[role="img"][aria-label*="star"]');
    if (ratingElement) {
      business.rating = extractRating(ratingElement.ariaLabel);
      business.reviewCount = extractReviewCount(ratingElement.ariaLabel);
    }

    // Category
    const categoryElement = document.querySelector('[data-value="category"]') ||
                           document.querySelector('button[data-value="category"]');
    if (categoryElement) {
      business.category = cleanText(categoryElement.textContent);
    }

    // Address
    const addressElement = document.querySelector('[data-item-id="address"]') ||
                          document.querySelector('button[data-item-id="address"]');
    if (addressElement) {
      business.address = cleanText(addressElement.textContent);
    }

    // Phone
    const phoneElement = document.querySelector('[data-item-id*="phone"]') ||
                        document.querySelector('button[data-item-id*="phone"]');
    if (phoneElement) {
      business.phone = extractPhone(phoneElement.textContent);
    }

    // Website
    const websiteElement = document.querySelector('[data-item-id="authority"]') ||
                          document.querySelector('a[data-item-id="authority"]');
    if (websiteElement) {
      business.website = websiteElement.href || websiteElement.textContent;
    }

    // Hours
    const hoursButton = document.querySelector('[data-item-id="oh"]');
    if (hoursButton) {
      business.hours = cleanText(hoursButton.textContent);
    }

  } catch (error) {
    console.error('Error extracting selected business:', error);
  }

  return business;
}

// Utility functions
function cleanText(text) {
  return text ? text.trim().replace(/\s+/g, ' ') : '';
}

function extractPhone(text) {
  if (!text) return null;
  const phoneMatch = text.match(/\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
  return phoneMatch ? phoneMatch[0] : null;
}

function extractRating(text) {
  if (!text) return null;
  const ratingMatch = text.match(/(\d+\.?\d*)\s*star/);
  return ratingMatch ? parseFloat(ratingMatch[1]) : null;
}

function extractReviewCount(text) {
  if (!text) return null;
  const reviewMatch = text.match(/(\d+(?:,\d+)*)\s*review/);
  return reviewMatch ? parseInt(reviewMatch[1].replace(',', '')) : null;
}

function waitForElement(selector, timeout = 5000) {
  return new Promise((resolve, reject) => {
    const element = document.querySelector(selector);
    if (element) {
      resolve(element);
      return;
    }

    const observer = new MutationObserver(() => {
      const element = document.querySelector(selector);
      if (element) {
        observer.disconnect();
        resolve(element);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    setTimeout(() => {
      observer.disconnect();
      reject(new Error(`Element ${selector} not found within ${timeout}ms`));
    }, timeout);
  });
}

async function sendToBackground(action, data) {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ action, data }, (response) => {
      resolve(response);
    });
  });
}

function showNotification(message) {
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #4CAF50;
    color: white;
    padding: 12px 20px;
    border-radius: 4px;
    z-index: 10000;
    font-family: Arial, sans-serif;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  `;
  notification.textContent = message;
  document.body.appendChild(notification);

  setTimeout(() => {
    if (notification.parentNode) {
      notification.parentNode.removeChild(notification);
    }
  }, 5000);
}

// Auto-detect and suggest scraping when business listings are found
let autoDetectTimer;
function autoDetectBusinessListings() {
  clearTimeout(autoDetectTimer);
  autoDetectTimer = setTimeout(() => {
    const businessElements = document.querySelectorAll('[role="article"], [data-ved]');
    if (businessElements.length >= 3) {
      console.log(`Detected ${businessElements.length} potential business listings`);
      // Could show a subtle notification or badge update here
    }
  }, 1000);
}

// Monitor page changes
const observer = new MutationObserver(autoDetectBusinessListings);
observer.observe(document.body, { childList: true, subtree: true });

// Initial detection
autoDetectBusinessListings();