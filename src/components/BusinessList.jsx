import React from 'react'
import BusinessCard from './BusinessCard'

function BusinessList({ businesses, loading, error, onRefresh }) {
  if (loading) {
    return (
      <div className="loading-state">
        <div className="state-content">
          <div className="state-icon loading">
            <div className="spinner"></div>
          </div>
          <p className="state-description">Loading businesses...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="error-state">
        <div className="state-content">
          <div className="state-icon error">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="state-title">Error Loading Data</h3>
          <p className="state-description">{error}</p>
          <button
            onClick={onRefresh}
            className="btn-retry"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  if (businesses.length === 0) {
    return (
      <div className="empty-state">
        <div className="state-content">
          <div className="state-icon empty">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h3 className="state-title">No Businesses Found</h3>
          <p className="state-description">
            Start by navigating to Google Search or Maps and running the scraper.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="business-list">
      <div className="business-list-content space-y-3">
        {businesses.map((business, index) => (
          <BusinessCard
            key={business.id || index}
            business={business}
          />
        ))}
      </div>
    </div>
  )
}

export default BusinessList