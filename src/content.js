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
  console.log('Starting background scraping process with config:', config);

  try {
    let businesses = [];
    const currentUrl = window.location.href;
    const platform = config.platform || detectPlatform(currentUrl);

    // Wait for page to load
    await new Promise(resolve => setTimeout(resolve, 2000));

    switch (platform) {
      case 'Google Search':
        if (currentUrl.includes('google.com/search')) {
          businesses = await scrapeGoogleSearchWithProfiles();
        }
        break;
      case 'Google Maps':
        if (currentUrl.includes('google.com/maps') || currentUrl.includes('maps.google.com')) {
          businesses = await scrapeGoogleMapsWithProfiles();
        }
        break;
      case 'Facebook':
        if (currentUrl.includes('facebook.com')) {
          businesses = await scrapeFacebookWithProfiles();
        }
        break;
      case 'LinkedIn':
        if (currentUrl.includes('linkedin.com')) {
          businesses = await scrapeLinkedInWithProfiles();
        }
        break;
      default:
        // Fallback detection
        if (currentUrl.includes('google.com/search')) {
          businesses = await scrapeGoogleSearchWithProfiles();
        } else if (currentUrl.includes('google.com/maps') || currentUrl.includes('maps.google.com')) {
          businesses = await scrapeGoogleMapsWithProfiles();
        } else if (currentUrl.includes('facebook.com')) {
          businesses = await scrapeFacebookWithProfiles();
        } else if (currentUrl.includes('linkedin.com')) {
          businesses = await scrapeLinkedInWithProfiles();
        }
    }

    console.log(`Found ${businesses.length} businesses from ${platform}`);

    // Send scraped data to background script
    let savedCount = 0;
    for (const business of businesses) {
      // Add platform info to business data
      business.source = platform;
      business.sourceUrl = currentUrl;

      const result = await sendToBackground('saveBusiness', business);
      if (result && result.success && !result.duplicate) {
        savedCount++;
      }
    }

    // Notify completion back to the injected script
    window.postMessage({
      type: 'SCRAPING_COMPLETE',
      count: savedCount,
      total: businesses.length,
      platform: platform
    }, '*');

    // Show subtle notification (don't focus the page)
    if (businesses.length > 0) {
      console.log(`Background scraping completed: ${savedCount} new businesses saved from ${platform}`);
    }

  } catch (error) {
    console.error('Background scraping error:', error);
    // Send completion even on error
    window.postMessage({
      type: 'SCRAPING_COMPLETE',
      count: 0,
      error: error.message,
      platform: config.platform || 'unknown'
    }, '*');
  }
}

// Detect platform from URL
function detectPlatform(url) {
  if (url.includes('google.com/search')) return 'Google Search';
  if (url.includes('google.com/maps') || url.includes('maps.google.com')) return 'Google Maps';
  if (url.includes('facebook.com')) return 'Facebook';
  if (url.includes('linkedin.com')) return 'LinkedIn';
  return 'Unknown';
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

// Scrape businesses from Facebook pages search
async function scrapeFacebook() {
  const businesses = [];

  try {
    // Wait for Facebook content to load
    await waitForElement('[role="feed"], [data-pagelet="Search"]', 5000);

    // Look for page results
    const pageElements = document.querySelectorAll('[data-pagelet*="SearchResult"], [role="article"]');

    for (const element of pageElements) {
      try {
        const business = await extractBusinessFromFacebook(element);
        if (business && business.name) {
          businesses.push(business);
        }
      } catch (error) {
        console.error('Error extracting Facebook business:', error);
      }
    }

    // Also try alternative selectors
    const linkElements = document.querySelectorAll('a[href*="/pages/"]');
    for (const link of linkElements) {
      try {
        const business = await extractFacebookPageFromLink(link);
        if (business && business.name) {
          businesses.push(business);
        }
      } catch (error) {
        console.error('Error extracting Facebook page from link:', error);
      }
    }

  } catch (error) {
    console.error('Error scraping Facebook:', error);
  }

  return businesses;
}

// Extract business data from Facebook element
async function extractBusinessFromFacebook(element) {
  const business = {};

  try {
    // Look for page name/title
    const nameElement = element.querySelector('h3, h4, strong, [role="heading"]') ||
                       element.querySelector('span[dir="auto"]');
    if (nameElement) {
      const nameText = cleanText(nameElement.textContent);
      if (nameText && nameText.length > 2 && nameText.length < 100) {
        business.name = nameText;
      }
    }

    // Look for links to pages
    const linkElement = element.querySelector('a[href*="/pages/"], a[href*="facebook.com/"]');
    if (linkElement) {
      business.website = linkElement.href;

      // Extract page name from URL if we don't have one
      if (!business.name) {
        const urlMatch = linkElement.href.match(/\/pages\/([^\/]+)/);
        if (urlMatch) {
          business.name = decodeURIComponent(urlMatch[1]).replace(/[-_]/g, ' ');
        }
      }
    }

    // Look for category/description
    const categoryElement = element.querySelector('[data-testid*="subtitle"], .x1i10hfl');
    if (categoryElement) {
      const categoryText = cleanText(categoryElement.textContent);
      if (categoryText && categoryText.length < 200) {
        business.category = categoryText;
      }
    }

    // Look for location info
    const locationElement = element.querySelector('[aria-label*="location"], [title*="location"]');
    if (locationElement) {
      business.address = cleanText(locationElement.textContent || locationElement.title);
    }

  } catch (error) {
    console.error('Error extracting from Facebook element:', error);
  }

  return business;
}

// Extract Facebook page info from link
async function extractFacebookPageFromLink(link) {
  const business = {};

  try {
    const href = link.href;
    if (!href.includes('facebook.com')) return null;

    // Extract business name from link text
    const linkText = cleanText(link.textContent);
    if (linkText && linkText.length > 2 && linkText.length < 100) {
      business.name = linkText;
    }

    business.website = href;

    // Try to get additional info from nearby elements
    const parent = link.closest('[role="article"], div[data-testid]');
    if (parent) {
      const descElement = parent.querySelector('[data-testid*="subtitle"]');
      if (descElement) {
        business.category = cleanText(descElement.textContent);
      }
    }

  } catch (error) {
    console.error('Error extracting Facebook page from link:', error);
  }

  return business;
}

// Scrape businesses from LinkedIn company search
async function scrapeLinkedIn() {
  const businesses = [];

  try {
    // Wait for LinkedIn search results to load
    await waitForElement('.search-results-container, .search-results__list', 5000);

    // Look for company results
    const companyElements = document.querySelectorAll('.search-result, .search-result__info, .entity-result');

    for (const element of companyElements) {
      try {
        const business = await extractBusinessFromLinkedIn(element);
        if (business && business.name) {
          businesses.push(business);
        }
      } catch (error) {
        console.error('Error extracting LinkedIn business:', error);
      }
    }

  } catch (error) {
    console.error('Error scraping LinkedIn:', error);
  }

  return businesses;
}

// Extract business data from LinkedIn element
async function extractBusinessFromLinkedIn(element) {
  const business = {};

  try {
    // Look for company name
    const nameElement = element.querySelector('.entity-result__title-text a, .search-result__title a, h3 a') ||
                       element.querySelector('.entity-result__title-text, .search-result__title, h3');
    if (nameElement) {
      business.name = cleanText(nameElement.textContent);
    }

    // Look for company URL
    const linkElement = element.querySelector('a[href*="/company/"]');
    if (linkElement) {
      business.website = linkElement.href;
    }

    // Look for company description/industry
    const descElement = element.querySelector('.entity-result__summary, .search-result__snippets') ||
                       element.querySelector('.entity-result__primary-subtitle, .subline-level-1');
    if (descElement) {
      const descText = cleanText(descElement.textContent);
      if (descText && descText.length < 500) {
        business.category = descText;
      }
    }

    // Look for location
    const locationElement = element.querySelector('[data-test-id="location"], .entity-result__secondary-subtitle');
    if (locationElement) {
      const locationText = cleanText(locationElement.textContent);
      if (locationText && !locationText.includes('followers')) {
        business.address = locationText;
      }
    }

    // Look for employee count (can indicate business size)
    const employeeElement = element.querySelector('.entity-result__employees, [data-test-id="employees"]');
    if (employeeElement) {
      const employeeText = cleanText(employeeElement.textContent);
      if (employeeText.includes('employee')) {
        business.notes = employeeText;
      }
    }

  } catch (error) {
    console.error('Error extracting from LinkedIn element:', error);
  }

  return business;
}

// Enhanced scraping functions with profile navigation

// Enhanced Google Search scraping with profile navigation
async function scrapeGoogleSearchWithProfiles() {
  const businesses = [];
  console.log('Starting enhanced Google Search scraping with profile navigation');

  // First, get basic business listings
  const basicBusinesses = await scrapeGoogleSearch();

  // Now navigate to each business profile for detailed information
  for (const business of basicBusinesses) {
    try {
      const enhancedBusiness = await navigateToGoogleBusinessProfile(business);
      businesses.push(enhancedBusiness);

      // Wait between navigation to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1500));
    } catch (error) {
      console.error('Error navigating to business profile:', error);
      // If profile navigation fails, keep basic business info
      businesses.push(business);
    }
  }

  return businesses;
}

// Enhanced Google Maps scraping with profile navigation
async function scrapeGoogleMapsWithProfiles() {
  const businesses = [];
  console.log('Starting enhanced Google Maps scraping with profile navigation');

  try {
    // Wait for Google Maps to load
    await waitForElement('[role="main"]', 5000);
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Try different selectors for business listings
    let businessElements = document.querySelectorAll('[role="article"] [data-value="name"]');

    if (businessElements.length === 0) {
      businessElements = document.querySelectorAll('div[data-result-index]');
    }

    if (businessElements.length === 0) {
      businessElements = document.querySelectorAll('a[data-cid]');
    }

    if (businessElements.length === 0) {
      businessElements = document.querySelectorAll('[jsaction*="click"] h3, [jsaction*="click"] div[aria-label]');
    }

    console.log(`Found ${businessElements.length} potential business elements`);

    // Process each business element
    for (let i = 0; i < Math.min(businessElements.length, 10); i++) {
      const element = businessElements[i];
      try {
        // Click on the business to load its details
        const clickTarget = element.closest('a') || element.closest('[role="button"]') || element;

        console.log(`Clicking on business element ${i + 1}`);
        clickTarget.click();

        // Wait for business details to load
        await new Promise(resolve => setTimeout(resolve, 4000));

        // Extract detailed business information
        const business = await extractDetailedMapsBusinessInfo();

        if (business && business.name && business.name !== 'Results' && business.name.length > 1) {
          console.log(`Extracted business: ${business.name}`);
          businesses.push(business);
        }

        // Wait between businesses to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000));

      } catch (error) {
        console.error(`Error processing business element ${i + 1}:`, error);
      }
    }

    console.log(`Successfully extracted ${businesses.length} businesses from Google Maps`);
    return businesses;

  } catch (error) {
    console.error('Error in enhanced Google Maps scraping:', error);
    return [];
  }
}

// Enhanced Facebook scraping with profile navigation
async function scrapeFacebookWithProfiles() {
  const businesses = [];
  console.log('Starting enhanced Facebook scraping with profile navigation');

  const basicBusinesses = await scrapeFacebook();

  for (const business of basicBusinesses) {
    try {
      const enhancedBusiness = await navigateToFacebookBusinessProfile(business);
      businesses.push(enhancedBusiness);
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      console.error('Error navigating to Facebook business profile:', error);
      businesses.push(business);
    }
  }

  return businesses;
}

// Enhanced LinkedIn scraping with profile navigation
async function scrapeLinkedInWithProfiles() {
  const businesses = [];
  console.log('Starting enhanced LinkedIn scraping with profile navigation');

  const basicBusinesses = await scrapeLinkedIn();

  for (const business of basicBusinesses) {
    try {
      const enhancedBusiness = await navigateToLinkedInBusinessProfile(business);
      businesses.push(enhancedBusiness);
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      console.error('Error navigating to LinkedIn business profile:', error);
      businesses.push(business);
    }
  }

  return businesses;
}

// Navigate to Google business profile and extract detailed info
async function navigateToGoogleBusinessProfile(basicBusiness) {
  try {
    // Look for the business link in search results
    const searchElements = document.querySelectorAll('[data-ved]');
    let businessLink = null;

    for (const element of searchElements) {
      const nameElement = element.querySelector('h3, [role="heading"]');
      if (nameElement && nameElement.textContent.includes(basicBusiness.name)) {
        businessLink = element.querySelector('a[href*="google.com/maps"]') ||
                      element.querySelector('a[href*="maps.google.com"]');
        break;
      }
    }

    if (businessLink) {
      // Open in new tab and extract details
      const newTab = window.open(businessLink.href, '_blank');
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Extract details from the maps page (this would need cross-origin handling)
      // For now, return enhanced basic info
      return {
        ...basicBusiness,
        profileVisited: true,
        mapsUrl: businessLink.href
      };
    }

    return basicBusiness;
  } catch (error) {
    console.error('Error navigating to Google business profile:', error);
    return basicBusiness;
  }
}

// Navigate to Maps business profile and extract detailed contact info
async function navigateToMapsBusinessProfile(element, basicBusiness) {
  try {
    // Click on the business listing to show details
    const clickableElement = element.querySelector('[role="button"]') || element;
    clickableElement.click();

    // Wait for details panel to load
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Extract detailed information from the expanded view
    const enhancedBusiness = { ...basicBusiness };

    // Phone number
    const phoneButton = document.querySelector('[data-item-id*="phone"] button, [aria-label*="phone" i]');
    if (phoneButton) {
      enhancedBusiness.phone = extractPhone(phoneButton.textContent || phoneButton.ariaLabel);
    }

    // Website
    const websiteButton = document.querySelector('[data-item-id="authority"] a, [aria-label*="website" i]');
    if (websiteButton) {
      enhancedBusiness.website = websiteButton.href || websiteButton.textContent;
    }

    // Address
    const addressButton = document.querySelector('[data-item-id="address"] button');
    if (addressButton) {
      enhancedBusiness.address = cleanText(addressButton.textContent);
    }

    // Hours
    const hoursButton = document.querySelector('[data-item-id="oh"] button');
    if (hoursButton) {
      enhancedBusiness.hours = cleanText(hoursButton.textContent);
    }

    // Email (look in about section if available)
    const aboutSection = document.querySelector('[data-section-id="ib"] div, [data-section-id="ad"] div');
    if (aboutSection) {
      const emailMatch = aboutSection.textContent.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
      if (emailMatch) {
        enhancedBusiness.email = emailMatch[0];
      }
    }

    // Additional services/amenities
    const amenitiesSection = document.querySelector('[data-section-id="amenities"]');
    if (amenitiesSection) {
      enhancedBusiness.amenities = cleanText(amenitiesSection.textContent);
    }

    return enhancedBusiness;
  } catch (error) {
    console.error('Error extracting detailed Maps business info:', error);
    return basicBusiness;
  }
}

// Navigate to Facebook business profile for detailed info
async function navigateToFacebookBusinessProfile(basicBusiness) {
  try {
    if (basicBusiness.website && basicBusiness.website.includes('facebook.com')) {
      // If we have a Facebook URL, we could extract page info
      // Look for contact information in about section
      const aboutButton = document.querySelector('a[href*="/about"]');
      if (aboutButton) {
        aboutButton.click();
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Extract contact info from about page
        const contactInfo = document.querySelector('[data-overviewsection="contact_info"], [data-overviewsection="contact"]');
        if (contactInfo) {
          const phoneMatch = contactInfo.textContent.match(/\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
          if (phoneMatch) basicBusiness.phone = phoneMatch[0];

          const emailMatch = contactInfo.textContent.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
          if (emailMatch) basicBusiness.email = emailMatch[0];

          const websiteMatch = contactInfo.textContent.match(/https?:\/\/[^\s]+/);
          if (websiteMatch) basicBusiness.website = websiteMatch[0];
        }
      }
    }

    return basicBusiness;
  } catch (error) {
    console.error('Error extracting Facebook business details:', error);
    return basicBusiness;
  }
}

// Navigate to LinkedIn business profile for detailed info
async function navigateToLinkedInBusinessProfile(basicBusiness) {
  try {
    if (basicBusiness.website && basicBusiness.website.includes('linkedin.com')) {
      // Click on the company link to view full profile
      const companyLink = document.querySelector(`a[href*="${basicBusiness.website}"]`);
      if (companyLink) {
        companyLink.click();
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Extract contact and company details
        const aboutSection = document.querySelector('.org-about-us__description, .company-about-us__description');
        if (aboutSection) {
          const emailMatch = aboutSection.textContent.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
          if (emailMatch) basicBusiness.email = emailMatch[0];
        }

        // Website
        const websiteSection = document.querySelector('.org-about-company-module__website a');
        if (websiteSection) {
          basicBusiness.website = websiteSection.href;
        }

        // Industry and size
        const industryElement = document.querySelector('.org-about-company-module__industry');
        if (industryElement) {
          basicBusiness.industry = cleanText(industryElement.textContent);
        }

        const sizeElement = document.querySelector('.org-about-company-module__company-size');
        if (sizeElement) {
          basicBusiness.companySize = cleanText(sizeElement.textContent);
        }
      }
    }

    return basicBusiness;
  } catch (error) {
    console.error('Error extracting LinkedIn business details:', error);
    return basicBusiness;
  }
}

// Extract detailed business information from Google Maps business profile
async function extractDetailedMapsBusinessInfo() {
  const business = {};

  try {
    // Wait for business details to load
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Business name - try multiple selectors
    const nameSelectors = [
      'h1[data-attrid="title"]',
      '[role="main"] h1',
      'h1.x3AX1-LfntMc-header-title-title',
      'div[data-attrid="title"] h1',
      '.x3AX1-LfntMc-header-title-title'
    ];

    for (const selector of nameSelectors) {
      const nameElement = document.querySelector(selector);
      if (nameElement && nameElement.textContent.trim()) {
        business.name = cleanText(nameElement.textContent);
        break;
      }
    }

    // If still no name, try aria-labels
    if (!business.name) {
      const ariaElement = document.querySelector('[aria-label*="Reviews for"], [aria-label*="stars"]');
      if (ariaElement && ariaElement.ariaLabel) {
        const match = ariaElement.ariaLabel.match(/Reviews for (.+?),|(.+?) \d+\.\d+ stars/);
        if (match) {
          business.name = match[1] || match[2];
        }
      }
    }

    // Rating and reviews
    const ratingSelectors = [
      '[role="img"][aria-label*="star"]',
      '.ceNzKf[aria-label*="stars"]',
      '[data-value="rating"]'
    ];

    for (const selector of ratingSelectors) {
      const ratingElement = document.querySelector(selector);
      if (ratingElement) {
        const ariaLabel = ratingElement.ariaLabel || ratingElement.textContent;
        business.rating = extractRating(ariaLabel);
        business.reviewCount = extractReviewCount(ariaLabel);
        break;
      }
    }

    // Category/Business type
    const categorySelectors = [
      'button[data-value="category"]',
      '[data-attrid="category"]',
      '.DkEaL'
    ];

    for (const selector of categorySelectors) {
      const categoryElement = document.querySelector(selector);
      if (categoryElement && categoryElement.textContent.trim()) {
        business.category = cleanText(categoryElement.textContent);
        break;
      }
    }

    // Address
    const addressSelectors = [
      'button[data-item-id="address"]',
      '[data-attrid="address"]',
      '.Io6YTe.fontBodyMedium',
      'div[data-attrid="address"] span'
    ];

    for (const selector of addressSelectors) {
      const addressElement = document.querySelector(selector);
      if (addressElement && addressElement.textContent.trim()) {
        business.address = cleanText(addressElement.textContent);
        break;
      }
    }

    // Phone number
    const phoneSelectors = [
      'button[data-item-id*="phone"]',
      '[data-attrid="phone"]',
      'a[href^="tel:"]',
      'button[aria-label*="phone" i]'
    ];

    for (const selector of phoneSelectors) {
      const phoneElement = document.querySelector(selector);
      if (phoneElement) {
        const phoneText = phoneElement.textContent || phoneElement.href || phoneElement.ariaLabel;
        const extractedPhone = extractPhone(phoneText);
        if (extractedPhone) {
          business.phone = extractedPhone;
          break;
        }
      }
    }

    // Website
    const websiteSelectors = [
      'a[data-item-id="authority"]',
      '[data-attrid="website"] a',
      'a[aria-label*="website" i]',
      '.CsEnBe a[href^="http"]'
    ];

    for (const selector of websiteSelectors) {
      const websiteElement = document.querySelector(selector);
      if (websiteElement && websiteElement.href && !websiteElement.href.includes('google.com')) {
        business.website = websiteElement.href;
        break;
      }
    }

    // Business hours
    const hoursSelectors = [
      'button[data-item-id="oh"]',
      '[data-attrid="hours"]',
      '.OqCZI'
    ];

    for (const selector of hoursSelectors) {
      const hoursElement = document.querySelector(selector);
      if (hoursElement && hoursElement.textContent.trim()) {
        business.hours = cleanText(hoursElement.textContent);
        break;
      }
    }

    // Email extraction - comprehensive search
    const emailSources = [
      // About section
      '[data-section-id="ib"] *',
      '[data-section-id="ad"] *',
      // Reviews and descriptions
      '.MyEned',
      '.wiI7pd',
      // Any visible text content
      '.fontBodyMedium'
    ];

    for (const source of emailSources) {
      const elements = document.querySelectorAll(source);
      for (const element of elements) {
        const text = element.textContent || '';
        const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
        if (emailMatch) {
          const email = emailMatch[0];
          // Prefer business emails over personal ones
          if (!email.includes('gmail.com') && !email.includes('yahoo.com') &&
              !email.includes('hotmail.com') && !email.includes('outlook.com')) {
            business.email = email;
            break;
          } else if (!business.email) {
            business.email = email; // Fallback to any email
          }
        }
      }
      if (business.email) break;
    }

    // Additional business information
    const additionalSelectors = [
      '[data-attrid="price_range"]',
      '[data-attrid="service_options"]',
      '.RcCsl'
    ];

    for (const selector of additionalSelectors) {
      const element = document.querySelector(selector);
      if (element && element.textContent.trim()) {
        if (!business.additionalInfo) business.additionalInfo = [];
        business.additionalInfo.push(cleanText(element.textContent));
      }
    }

    console.log('Extracted business data:', {
      name: business.name,
      phone: business.phone,
      email: business.email,
      website: business.website,
      address: business.address
    });

  } catch (error) {
    console.error('Error extracting detailed Maps business info:', error);
  }

  return business;
}

// Extract detailed info from currently selected Maps business (legacy function)
async function extractSelectedMapsBusinessDetails() {
  return await extractDetailedMapsBusinessInfo();
}