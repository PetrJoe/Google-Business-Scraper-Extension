import React from 'react'

function StatusBar({ scrapeCount, businessCount, totalCount, loading }) {
  const getStatusColor = () => {
    if (loading) return 'text-blue-600'
    if (businessCount === 0) return 'text-gray-500'
    return 'text-green-600'
  }

  const getStatusText = () => {
    if (loading) return 'Loading...'
    if (businessCount === 0) return 'No data'
    if (businessCount !== totalCount) return `${businessCount} of ${totalCount} shown`
    return `${totalCount} businesses`
  }

  return (
    <div className="bg-white border-t border-gray-200 px-4 py-2">
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center space-x-4">
          <div className={`flex items-center space-x-1 ${getStatusColor()}`}>
            {loading && (
              <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full spinner"></div>
            )}
            <span>{getStatusText()}</span>
          </div>

          {scrapeCount > 0 && (
            <div className="text-gray-500">
              <span className="text-green-600 font-medium">{scrapeCount}</span> scraped today
            </div>
          )}
        </div>

        <div className="flex items-center space-x-1 text-gray-400">
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
          <span>Business Scraper v1.0</span>
        </div>
      </div>
    </div>
  )
}

export default StatusBar