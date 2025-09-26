# Google Business Scraper Chrome Extension

A powerful Chrome extension for scraping business listings from Google Search, Google Maps, Facebook, and LinkedIn. Extract comprehensive contact information including phone numbers, emails, websites, addresses, and business details with automated profile navigation.

## 🚀 Features

### **Multi-Platform Scraping**
- **Google Search** - Extract businesses from search results with Maps integration
- **Google Maps** - Navigate individual business profiles for detailed contact info
- **Facebook** - Scrape business pages and contact sections
- **LinkedIn** - Extract company profiles and professional details

### **Comprehensive Contact Extraction**
- 📞 **Phone Numbers** - Multiple format detection and validation
- 📧 **Email Addresses** - Business email prioritization over personal emails
- 🌐 **Websites** - Official business websites and social media links
- 📍 **Addresses** - Full location details with OpenStreetMap integration
- ⭐ **Ratings & Reviews** - Business ratings and review counts
- 🕒 **Business Hours** - Operating hours and schedule information

### **Advanced Features**
- **Profile Navigation** - Automatically clicks and visits individual business profiles
- **Background Operation** - Runs in hidden tabs without disrupting browsing
- **Smart Filtering** - Excludes duplicates and invalid entries
- **Rate Limiting** - Built-in delays to avoid detection
- **Export Options** - CSV, XLSX, JSON formats with timestamped files

## 📦 Installation

### **Prerequisites**
- Node.js 18+ and npm
- Chrome browser (Developer Mode enabled)

### **Setup Instructions**

1. **Clone the Repository**
   ```bash
   git clone <repository-url>
   cd gb
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Build the Extension**
   ```bash
   npm run build
   ```

4. **Load in Chrome**
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer Mode" (top right toggle)
   - Click "Load unpacked"
   - Select the `dist` folder from the project directory

5. **Pin the Extension** (Optional)
   - Click the Extensions icon in Chrome toolbar
   - Pin the Google Business Scraper for easy access

## 🎯 Usage

### **Basic Scraping**

1. **Open Extension Popup** - Click the extension icon in your toolbar

2. **Enter Search Terms**
   - **Keyword**: Enter business type (e.g., "pizza restaurant", "dentist")
   - **Location**: Add city/area (optional but recommended)
   - **Platforms**: Select Google Search, Maps, Facebook, LinkedIn

3. **Start Scraping** - Click "Start Scraping" button
   - Background tabs will open automatically
   - Tabs close after scraping completes
   - Progress shown in extension popup

4. **View Results** - Switch to "List" tab to see scraped businesses

### **Export Data**

1. **Navigate to Export Tab** - Click the download icon (third tab)

2. **Choose Format**:
   - **CSV** - For Excel/Google Sheets
   - **XLSX** - Native Excel format
   - **JSON** - For developers/APIs

3. **Export** - Click "Export X Businesses" to download

### **Effective Keywords**

See `keywords.md` for comprehensive list of high-performing search terms:

- **Professional Services**: `dentist office`, `law firm`, `accounting firm`
- **Local Services**: `plumber`, `electrician`, `auto repair shop`
- **Restaurants**: `pizza restaurant`, `italian restaurant`, `sushi bar`
- **Retail**: `furniture store`, `clothing boutique`, `pet store`

## 🛠 Development

### **Project Structure**

```
gb/
├── src/
│   ├── components/          # React UI components
│   │   ├── PopupApp.jsx    # Main application
│   │   ├── SearchForm.jsx  # Search input form
│   │   ├── BusinessList.jsx # Results display
│   │   └── ExportPanel.jsx # Export functionality
│   ├── hooks/              # Custom React hooks
│   ├── utils/              # Utility functions
│   ├── styles/             # CSS styling
│   ├── content.js          # Content script for scraping
│   └── background.js       # Service worker
├── public/
│   └── manifest.json       # Chrome extension manifest
├── dist/                   # Built extension files
└── keywords.md            # Search keyword guide
```

### **Build Commands**

```bash
# Development build with watching
npm run dev

# Production build
npm run build

# Preview built extension
npm run preview
```

### **Development Workflow**

1. Make changes to source files
2. Run `npm run build`
3. Reload extension in Chrome (Extensions page > Reload button)
4. Test changes in browser

## 🔧 Configuration

### **Manifest Permissions**

The extension requires these permissions:
- `activeTab` - Access current tab content
- `storage` - Store scraped data locally
- `scripting` - Inject content scripts
- `tabs` - Create and manage background tabs
- `downloads` - Export scraped data

### **Host Permissions**

Allowed to access:
- `google.com/*` - Google Search and Maps
- `maps.google.com/*` - Google Maps
- `facebook.com/*` - Facebook business pages
- `linkedin.com/*` - LinkedIn company profiles
- `nominatim.openstreetmap.org/*` - Address geocoding

## 📊 Data Schema

### **Business Object Structure**

```javascript
{
  "id": "1758918921309",
  "name": "Tony's Pizza Restaurant",
  "category": "Italian Restaurant",
  "address": "123 Main St, New York, NY 10001",
  "phone": "(555) 123-4567",
  "email": "info@tonyspizza.com",
  "website": "https://tonyspizza.com",
  "rating": 4.5,
  "reviewCount": 127,
  "hours": "Mon-Sun 11AM-11PM",
  "source": "Google Maps",
  "sourceUrl": "https://www.google.com/maps/search/pizza+restaurant",
  "scrapedAt": "2025-09-26T20:35:21.309Z",
  "additionalInfo": ["Delivery available", "Outdoor seating"]
}
```

## 🚫 Limitations & Best Practices

### **Rate Limiting**
- Built-in delays between requests (2-4 seconds)
- Maximum 10 businesses per search session
- Automatic tab closure to avoid resource usage

### **Data Accuracy**
- Results depend on business profile completeness
- Email detection prioritizes business domains
- Some businesses may have limited public contact info

### **Ethical Usage**
- Respect robots.txt and platform terms of service
- Use data responsibly for legitimate business purposes
- Don't overwhelm servers with excessive requests

## 🔍 Troubleshooting

### **Common Issues**

**Extension won't load:**
- Ensure Developer Mode is enabled
- Check console for build errors
- Reload extension after changes

**No businesses found:**
- Try more specific keywords
- Add location to search terms
- Check if target page loaded completely

**Export not working:**
- Ensure businesses are scraped first
- Check browser download settings
- Try different export format

**Background tabs not closing:**
- Extension will auto-close after 3-5 seconds
- Manually close if they remain open
- Check Chrome's tab management settings

### **Debug Mode**

Open browser console to see detailed logs:
- Content script activity
- Business extraction progress
- Error messages and warnings

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Make changes and test thoroughly
4. Build extension (`npm run build`)
5. Commit changes (`git commit -m 'Add amazing feature'`)
6. Push to branch (`git push origin feature/amazing-feature`)
7. Open Pull Request

## 📄 License

This project is for educational and legitimate business research purposes. Users are responsible for complying with platform terms of service and applicable data protection laws.

## 🆘 Support

For issues, feature requests, or questions:
- Check existing issues in the repository
- Review troubleshooting section above
- Create new issue with detailed description
- Include browser version and error messages

---

**Happy Scraping! 🎉**

*Remember to use this tool responsibly and respect the privacy and terms of service of the platforms you're scraping.*