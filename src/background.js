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
      handleExportData(request.format, sendResponse);
      return true;

    case 'fetchOSMData':
      handleFetchOSMData(request.business, sendResponse);
      return true;

    default:
      sendResponse({ success: false, error: 'Unknown action' });
  }
});

// Handle scraping initiation
async function handleStartScraping(data, sendResponse) {
  try {
    // Get all Google search/maps tabs
    const tabs = await chrome.tabs.query({});
    const googleTabs = tabs.filter(tab =>
      tab.url && (
        tab.url.includes('google.com/search') ||
        tab.url.includes('google.com/maps') ||
        tab.url.includes('maps.google.com')
      )
    );

    if (googleTabs.length === 0) {
      sendResponse({ success: false, error: 'No Google Search or Maps tabs found. Please open Google Search or Maps in a tab first.' });
      return;
    }

    let totalScraped = 0;
    let errors = [];

    // Scrape from all Google tabs in background
    for (const tab of googleTabs) {
      try {
        // Inject content script to start scraping without switching focus
        const results = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: initiateScraping,
          args: [data]
        });

        if (results && results[0] && results[0].result) {
          totalScraped += results[0].result.count || 0;
        }
      } catch (error) {
        console.error(`Error scraping tab ${tab.id}:`, error);
        errors.push(`Tab ${tab.id}: ${error.message}`);
      }
    }

    if (totalScraped > 0) {
      sendResponse({
        success: true,
        message: `Background scraping completed! Found ${totalScraped} businesses from ${googleTabs.length} tab(s).`,
        scraped: totalScraped,
        tabsProcessed: googleTabs.length
      });
    } else {
      sendResponse({
        success: false,
        error: `No businesses found. ${errors.length > 0 ? 'Errors: ' + errors.join(', ') : 'Try refreshing the Google Search/Maps pages.'}`
      });
    }
  } catch (error) {
    console.error('Error starting scraping:', error);
    sendResponse({ success: false, error: error.message });
  }
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

    // Create download
    const blob = new Blob([exportData], { type: mimeType });
    const url = URL.createObjectURL(blob);

    await chrome.downloads.download({
      url: url,
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