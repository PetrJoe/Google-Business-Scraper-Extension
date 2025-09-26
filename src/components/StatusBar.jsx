import React from 'react'

function StatusBar({ scrapeCount, businessCount, totalCount, loading }) {
  const getStatusClass = () => {
    if (loading) return 'loading'
    if (businessCount === 0) return 'default'
    return 'success'
  }

  const getStatusText = () => {
    if (loading) return 'Loading...'
    if (businessCount === 0) return 'No data'
    if (businessCount !== totalCount) return `${businessCount} of ${totalCount} shown`
    return `${totalCount} businesses`
  }

  return (
    <div className="status-bar">
      <div className="status-content">
        <div className="status-left">
          <div className={`status-item ${getStatusClass()}`}>
            {loading && (
              <div className="spinner" style={{ width: '12px', height: '12px' }}></div>
            )}
            <span>{getStatusText()}</span>
          </div>

          {scrapeCount > 0 && (
            <div className="status-item default">
              <span style={{ color: '#16a34a', fontWeight: '500' }}>{scrapeCount}</span>
              <span>scraped today</span>
            </div>
          )}
        </div>

        <div className="status-right">
          <svg fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
          <span>Business Scraper v1.0</span>
        </div>
      </div>
    </div>
  )
}

export default StatusBar