// Background script for Google Business Scraper Chrome Extension

// Install event - set up initial data
chrome.runtime.onInstalled.addListener(() => {
  console.log('Google Business Scraper Extension installed');

  // Initialize storage with empty data
  chrome.storage.local.set({
    scrapedBusinesses: [],
    settings: {
      autoScrape: false,
      maxResults: 50,
      includeEmails: true,
      includePhones: true,
      osmIntegration: true
    }
  });
});

// Handle messages from content scripts and popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Background received message:', request);

  switch (request.action) {
    case 'startScraping':
      handleStartScraping(request.data, sendResponse);
      return true; // Keep message channel open for async response

    case 'saveBusiness':
      handleSaveBusiness(request.data, sendResponse);
      return true;

    case 'getStoredData':
      handleGetStoredData(sendResponse);
      return true;

    case 'clearData':
      handleClearData(sendResponse);
      return true;

    case 'exportData':
      handleExportData(request.data.format, sendResponse);
      return true;

    case 'fetchOSMData':
      handleFetchOSMData(request.business, sendResponse);
      return true;

    default:
      sendResponse({ success: false, error: 'Unknown action' });
  }
});

// Handle automated searching and scraping
async function handleStartScraping(data, sendResponse) {
  try {
    const { keyword, location, platforms } = data;

    if (!keyword) {
      sendResponse({ success: false, error: 'Keyword is required' });
      return;
    }

    const searchUrls = generateSearchUrls(keyword, location, platforms);

    if (searchUrls.length === 0) {
      sendResponse({ success: false, error: 'Please select at least one search platform' });
      return;
    }

    let totalScraped = 0;
    let errors = [];
    const createdTabs = [];

    // Create tabs and perform searches
    for (const urlData of searchUrls) {
      try {
        console.log(`Creating background tab for ${urlData.platform}: ${urlData.url}`);

        // Create new tab (inactive so it doesn't interrupt user)
        const tab = await chrome.tabs.create({
          url: urlData.url,
          active: false // Don't switch focus to new tab
        });

        createdTabs.push({ ...tab, platform: urlData.platform });

        // Wait a bit for page to load before starting scraping
        setTimeout(async () => {
          try {
            const results = await chrome.scripting.executeScript({
              target: { tabId: tab.id },
              func: initiateScraping,
              args: [{ ...data, platform: urlData.platform }]
            });

            if (results && results[0] && results[0].result) {
              totalScraped += results[0].result.count || 0;
            }

            // Close the tab after scraping is complete
            setTimeout(async () => {
              try {
                await chrome.tabs.remove(tab.id);
                console.log(`Closed background tab for ${urlData.platform}`);
              } catch (closeError) {
                console.error(`Error closing tab for ${urlData.platform}:`, closeError);
              }
            }, 3000); // Wait 3 seconds after scraping to ensure completion
          } catch (error) {
            console.error(`Error scraping ${urlData.platform} tab:`, error);
            errors.push(`${urlData.platform}: ${error.message}`);

            // Close tab even if scraping failed
            try {
              await chrome.tabs.remove(tab.id);
              console.log(`Closed failed tab for ${urlData.platform}`);
            } catch (closeError) {
              console.error(`Error closing failed tab:`, closeError);
            }
          }
        }, urlData.delay || 2000);

      } catch (error) {
        console.error(`Error creating tab for ${urlData.platform}:`, error);
        errors.push(`${urlData.platform}: ${error.message}`);
      }
    }

    // Send immediate response about tab creation
    sendResponse({
      success: true,
      message: `Started automated search on ${searchUrls.length} platform(s). Background tabs will close automatically after scraping.`,
      tabsCreated: searchUrls.length,
      platforms: searchUrls.map(u => u.platform)
    });

    // Schedule final report after scraping completes
    setTimeout(async () => {
      console.log(`Automated background scraping completed: ${totalScraped} businesses found`);
    }, 30000); // Wait 30 seconds for all scraping to complete

  } catch (error) {
    console.error('Error in automated searching:', error);
    sendResponse({ success: false, error: error.message });
  }
}

// Generate search URLs for different platforms
function generateSearchUrls(keyword, location, platforms) {
  const urls = [];
  const encodedKeyword = encodeURIComponent(keyword);
  const searchQuery = location ? `${keyword} ${location}` : keyword;
  const encodedQuery = encodeURIComponent(searchQuery);

  if (platforms.google) {
    urls.push({
      platform: 'Google Search',
      url: `https://www.google.com/search?q=${encodedQuery}`,
      delay: 2000
    });
  }

  if (platforms.maps) {
    urls.push({
      platform: 'Google Maps',
      url: `https://www.google.com/maps/search/${encodedQuery}`,
      delay: 3000
    });
  }

  if (platforms.facebook) {
    urls.push({
      platform: 'Facebook',
      url: `https://www.facebook.com/search/pages/?q=${encodedKeyword}`,
      delay: 4000
    });
  }

  if (platforms.linkedin) {
    urls.push({
      platform: 'LinkedIn',
      url: `https://www.linkedin.com/search/results/companies/?keywords=${encodedKeyword}`,
      delay: 5000
    });
  }

  return urls;
}

// Function to be injected into the page
function initiateScraping(data) {
  return new Promise((resolve) => {
    // This function runs in the context of the web page
    let scrapedCount = 0;

    // Listen for scraping results
    const handleMessage = (event) => {
      if (event.data.type === 'SCRAPING_COMPLETE') {
        scrapedCount = event.data.count || 0;
        window.removeEventListener('message', handleMessage);
        resolve({ count: scrapedCount });
      }
    };

    window.addEventListener('message', handleMessage);

    // Start scraping
    window.postMessage({
      type: 'START_SCRAPING',
      data: data
    }, '*');

    // Timeout after 30 seconds
    setTimeout(() => {
      window.removeEventListener('message', handleMessage);
      resolve({ count: scrapedCount });
    }, 30000);
  });
}

// Handle saving business data
async function handleSaveBusiness(businessData, sendResponse) {
  try {
    const result = await chrome.storage.local.get(['scrapedBusinesses']);
    const businesses = result.scrapedBusinesses || [];

    // Check for duplicates
    const exists = businesses.some(b =>
      b.name === businessData.name && b.address === businessData.address
    );

    if (!exists) {
      businesses.push({
        ...businessData,
        id: Date.now().toString(),
        scrapedAt: new Date().toISOString()
      });

      await chrome.storage.local.set({ scrapedBusinesses: businesses });
      sendResponse({ success: true, count: businesses.length });
    } else {
      sendResponse({ success: true, duplicate: true, count: businesses.length });
    }
  } catch (error) {
    console.error('Error saving business:', error);
    sendResponse({ success: false, error: error.message });
  }
}

// Handle getting stored data
async function handleGetStoredData(sendResponse) {
  try {
    const result = await chrome.storage.local.get(['scrapedBusinesses', 'settings']);
    sendResponse({
      success: true,
      data: {
        businesses: result.scrapedBusinesses || [],
        settings: result.settings || {}
      }
    });
  } catch (error) {
    console.error('Error getting stored data:', error);
    sendResponse({ success: false, error: error.message });
  }
}

// Handle clearing data
async function handleClearData(sendResponse) {
  try {
    await chrome.storage.local.set({ scrapedBusinesses: [] });
    sendResponse({ success: true });
  } catch (error) {
    console.error('Error clearing data:', error);
    sendResponse({ success: false, error: error.message });
  }
}

// Handle data export
async function handleExportData(format, sendResponse) {
  try {
    const result = await chrome.storage.local.get(['scrapedBusinesses']);
    const businesses = result.scrapedBusinesses || [];

    if (businesses.length === 0) {
      sendResponse({ success: false, error: 'No data to export' });
      return;
    }

    let exportData;
    let filename;
    let mimeType;

    switch (format) {
      case 'json':
        exportData = JSON.stringify(businesses, null, 2);
        filename = `google-business-data-${Date.now()}.json`;
        mimeType = 'application/json';
        break;

      case 'csv':
        exportData = convertToCSV(businesses);
        filename = `google-business-data-${Date.now()}.csv`;
        mimeType = 'text/csv';
        break;

      case 'xlsx':
        // For XLSX, we'll send the data back to the popup to handle with SheetJS
        sendResponse({
          success: true,
          requiresClientProcessing: true,
          data: businesses,
          filename: `google-business-data-${Date.now()}.xlsx`
        });
        return;

      default:
        sendResponse({ success: false, error: 'Unsupported format' });
        return;
    }

    // Create data URL for download (service worker compatible)
    const dataUrl = `data:${mimeType};charset=utf-8,${encodeURIComponent(exportData)}`;

    await chrome.downloads.download({
      url: dataUrl,
      filename: filename,
      saveAs: true
    });

    sendResponse({ success: true, filename: filename });
  } catch (error) {
    console.error('Error exporting data:', error);
    sendResponse({ success: false, error: error.message });
  }
}

// Handle OSM data fetching
async function handleFetchOSMData(business, sendResponse) {
  try {
    const query = encodeURIComponent(`${business.name} ${business.address}`);
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=1`;

    const response = await fetch(url);
    const data = await response.json();

    if (data && data.length > 0) {
      const osmData = {
        lat: parseFloat(data[0].lat),
        lon: parseFloat(data[0].lon),
        display_name: data[0].display_name,
        osm_id: data[0].osm_id,
        osm_type: data[0].osm_type
      };

      sendResponse({ success: true, osmData });
    } else {
      sendResponse({ success: true, osmData: null });
    }
  } catch (error) {
    console.error('Error fetching OSM data:', error);
    sendResponse({ success: false, error: error.message });
  }
}

// Utility function to convert to CSV
function convertToCSV(businesses) {
  const headers = ['Name', 'Category', 'Address', 'Phone', 'Email', 'Website', 'Rating', 'Reviews', 'Hours', 'Scraped At'];

  const csvData = businesses.map(business => [
    business.name || '',
    business.category || '',
    business.address || '',
    business.phone || '',
    business.email || '',
    business.website || '',
    business.rating || '',
    business.reviewCount || '',
    business.hours || '',
    business.scrapedAt || ''
  ]);

  const csvContent = [headers, ...csvData]
    .map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
    .join('\n');

  return csvContent;
}