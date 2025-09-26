import React, { useState, useEffect } from 'react'
import Header from './Header'
import SearchForm from './SearchForm'
import BusinessList from './BusinessList'
import MapView from './MapView'
import ExportPanel from './ExportPanel'
import StatusBar from './StatusBar'
import { useBusinessData } from '../hooks/useBusinessData'
import { useNotification } from '../hooks/useNotification'

const VIEWS = {
  LIST: 'list',
  MAP: 'map',
  EXPORT: 'export'
}

function PopupApp() {
  const [currentView, setCurrentView] = useState(VIEWS.LIST)
  const [isScrapingActive, setIsScrapingActive] = useState(false)
  const [searchFilters, setSearchFilters] = useState({
    category: '',
    minRating: 0,
    hasPhone: false,
    hasEmail: false,
    hasWebsite: false
  })

  const {
    businesses,
    loading,
    error,
    scrapeCount,
    loadBusinessData,
    startScraping,
    clearAllData,
    exportData
  } = useBusinessData()

  const { notification, showNotification, clearNotification } = useNotification()

  // Load data on component mount
  useEffect(() => {
    loadBusinessData()
  }, [])

  // Handle scraping initiation
  const handleStartScraping = async (searchConfig) => {
    try {
      setIsScrapingActive(true)
      const result = await startScraping(searchConfig)

      if (result.success) {
        showNotification('Scraping started! Switch to Google Search/Maps to see progress.', 'success')
        setTimeout(() => {
          loadBusinessData() // Refresh data after scraping
        }, 2000)
      } else {
        showNotification(result.error || 'Failed to start scraping', 'error')
      }
    } catch (error) {
      showNotification('Error starting scraping: ' + error.message, 'error')
    } finally {
      setIsScrapingActive(false)
    }
  }

  // Handle data export
  const handleExport = async (format) => {
    try {
      const result = await exportData(format)
      if (result.success) {
        showNotification(`Data exported as ${result.filename}`, 'success')
      } else {
        showNotification(result.error || 'Export failed', 'error')
      }
    } catch (error) {
      showNotification('Export error: ' + error.message, 'error')
    }
  }

  // Handle clear all data
  const handleClearData = async () => {
    if (window.confirm('Are you sure you want to clear all scraped data?')) {
      try {
        await clearAllData()
        showNotification('All data cleared successfully', 'success')
      } catch (error) {
        showNotification('Error clearing data: ' + error.message, 'error')
      }
    }
  }

  // Filter businesses based on current filters
  const filteredBusinesses = businesses.filter(business => {
    if (searchFilters.category && !business.category?.toLowerCase().includes(searchFilters.category.toLowerCase())) {
      return false
    }
    if (searchFilters.minRating > 0 && (business.rating || 0) < searchFilters.minRating) {
      return false
    }
    if (searchFilters.hasPhone && !business.phone) {
      return false
    }
    if (searchFilters.hasEmail && !business.email) {
      return false
    }
    if (searchFilters.hasWebsite && !business.website) {
      return false
    }
    return true
  })

  return (
    <div className="app-container">
      <Header
        currentView={currentView}
        setCurrentView={setCurrentView}
        businessCount={filteredBusinesses.length}
        totalCount={businesses.length}
      />

      {notification && (
        <div className={`notification ${notification.type}`}>
          <span>{notification.message}</span>
          <button
            onClick={clearNotification}
            className="notification-close"
          >
            ×
          </button>
        </div>
      )}

      <div className="flex-1 overflow-hidden">
        {currentView === VIEWS.LIST && (
          <div className="flex flex-col" style={{ height: '100%' }}>
            <SearchForm
              onStartScraping={handleStartScraping}
              isScrapingActive={isScrapingActive}
              loading={loading}
              filters={searchFilters}
              setFilters={setSearchFilters}
            />
            <BusinessList
              businesses={filteredBusinesses}
              loading={loading}
              error={error}
              onRefresh={loadBusinessData}
            />
          </div>
        )}

        {currentView === VIEWS.MAP && (
          <MapView businesses={filteredBusinesses} />
        )}

        {currentView === VIEWS.EXPORT && (
          <ExportPanel
            businesses={filteredBusinesses}
            onExport={handleExport}
            onClearData={handleClearData}
          />
        )}
      </div>

      <StatusBar
        scrapeCount={scrapeCount}
        businessCount={filteredBusinesses.length}
        totalCount={businesses.length}
        loading={loading}
      />
    </div>
  )
}

export default PopupApp