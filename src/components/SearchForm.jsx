import React, { useState } from 'react'

function SearchForm({ onStartScraping, isScrapingActive, loading, filters, setFilters }) {
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)

  const handleStartScraping = () => {
    onStartScraping({
      autoScrape: true,
      maxResults: 50,
      includeEmails: true,
      includePhones: true
    })
  }

  return (
    <div className="search-form space-y-4">
      <div className="search-controls">
        <button
          onClick={handleStartScraping}
          disabled={isScrapingActive || loading}
          className="btn-primary"
        >
          {isScrapingActive || loading ? (
            <>
              <div className="spinner"></div>
              <span>Scraping...</span>
            </>
          ) : (
            <>
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span>Start Scraping</span>
            </>
          )}
        </button>

        <button
          onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
          className="btn-secondary"
        >
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
        </button>
      </div>

      {showAdvancedFilters && (
        <div className="filters-section space-y-3">
          <h4 className="filters-title">Filter Results</h4>

          <div className="space-y-3">
            <div className="form-group">
              <label className="form-label">
                Category
              </label>
              <input
                type="text"
                value={filters.category}
                onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                placeholder="e.g. restaurant, hotel, store"
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                Minimum Rating
              </label>
              <select
                value={filters.minRating}
                onChange={(e) => setFilters({ ...filters, minRating: parseFloat(e.target.value) })}
                className="form-select"
              >
                <option value={0}>Any rating</option>
                <option value={1}>1+ stars</option>
                <option value={2}>2+ stars</option>
                <option value={3}>3+ stars</option>
                <option value={4}>4+ stars</option>
                <option value={4.5}>4.5+ stars</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">
                Required Contact Info
              </label>
              <div className="checkbox-group">
                <div className="checkbox-item">
                  <input
                    type="checkbox"
                    checked={filters.hasPhone}
                    onChange={(e) => setFilters({ ...filters, hasPhone: e.target.checked })}
                    id="hasPhone"
                  />
                  <label htmlFor="hasPhone">Has phone number</label>
                </div>
                <div className="checkbox-item">
                  <input
                    type="checkbox"
                    checked={filters.hasEmail}
                    onChange={(e) => setFilters({ ...filters, hasEmail: e.target.checked })}
                    id="hasEmail"
                  />
                  <label htmlFor="hasEmail">Has email</label>
                </div>
                <div className="checkbox-item">
                  <input
                    type="checkbox"
                    checked={filters.hasWebsite}
                    onChange={(e) => setFilters({ ...filters, hasWebsite: e.target.checked })}
                    id="hasWebsite"
                  />
                  <label htmlFor="hasWebsite">Has website</label>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="info-box">
        <svg fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
        <div className="info-box-content">
          <p className="font-medium">Instructions:</p>
          <p>Navigate to Google Search or Google Maps, search for businesses, then click "Start Scraping" to collect data from the current page.</p>
        </div>
      </div>
    </div>
  )
}

export default SearchForm