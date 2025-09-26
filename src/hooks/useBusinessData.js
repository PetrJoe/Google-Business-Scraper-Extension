import { useState, useCallback } from 'react'
import { exportToXLSX, exportToCSV, exportToJSON } from '../utils/exportUtils'

export function useBusinessData() {
  const [businesses, setBusinesses] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [scrapeCount, setScrapeCount] = useState(0)

  // Send message to background script
  const sendMessage = useCallback((action, data = null) => {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({ action, data }, (response) => {
        if (chrome.runtime.lastError) {
          resolve({ success: false, error: chrome.runtime.lastError.message })
        } else {
          resolve(response || { success: false, error: 'No response' })
        }
      })
    })
  }, [])

  // Load business data from storage
  const loadBusinessData = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await sendMessage('getStoredData')

      if (response.success) {
        const { businesses = [], settings = {} } = response.data
        setBusinesses(businesses)
        setScrapeCount(businesses.length)
      } else {
        setError(response.error || 'Failed to load data')
        setBusinesses([])
      }
    } catch (err) {
      setError('Error loading data: ' + err.message)
      setBusinesses([])
    } finally {
      setLoading(false)
    }
  }, [sendMessage])

  // Start scraping process
  const startScraping = useCallback(async (config) => {
    try {
      const response = await sendMessage('startScraping', config)
      return response
    } catch (err) {
      return { success: false, error: err.message }
    }
  }, [sendMessage])

  // Clear all stored data
  const clearAllData = useCallback(async () => {
    try {
      const response = await sendMessage('clearData')
      if (response.success) {
        setBusinesses([])
        setScrapeCount(0)
      }
      return response
    } catch (err) {
      return { success: false, error: err.message }
    }
  }, [sendMessage])

  // Export data
  const exportData = useCallback(async (format) => {
    try {
      const response = await sendMessage('exportData', format)

      // Handle client-side XLSX processing
      if (response.requiresClientProcessing && format === 'xlsx') {
        return exportToXLSX(response.data, response.filename)
      }

      // Handle client-side CSV processing (fallback)
      if (response.requiresClientProcessing && format === 'csv') {
        return exportToCSV(response.data, response.filename)
      }

      // Handle client-side JSON processing (fallback)
      if (response.requiresClientProcessing && format === 'json') {
        return exportToJSON(response.data, response.filename)
      }

      return response
    } catch (err) {
      return { success: false, error: err.message }
    }
  }, [sendMessage])

  // Enrich business with OSM data
  const enrichWithOSMData = useCallback(async (business) => {
    try {
      const response = await sendMessage('fetchOSMData', business)
      if (response.success && response.osmData) {
        return {
          ...business,
          lat: response.osmData.lat,
          lon: response.osmData.lon,
          osmId: response.osmData.osm_id,
          osmType: response.osmData.osm_type
        }
      }
      return business
    } catch (err) {
      console.error('Error enriching business with OSM data:', err)
      return business
    }
  }, [sendMessage])

  // Bulk enrich businesses with OSM data
  const enrichAllWithOSMData = useCallback(async () => {
    setLoading(true)

    try {
      const enrichedBusinesses = await Promise.all(
        businesses.map(business => enrichWithOSMData(business))
      )

      // Update businesses with enriched data
      for (const business of enrichedBusinesses) {
        await sendMessage('saveBusiness', business)
      }

      // Reload data
      await loadBusinessData()
    } catch (err) {
      setError('Error enriching businesses: ' + err.message)
    } finally {
      setLoading(false)
    }
  }, [businesses, enrichWithOSMData, sendMessage, loadBusinessData])

  return {
    businesses,
    loading,
    error,
    scrapeCount,
    loadBusinessData,
    startScraping,
    clearAllData,
    exportData,
    enrichWithOSMData,
    enrichAllWithOSMData
  }
}