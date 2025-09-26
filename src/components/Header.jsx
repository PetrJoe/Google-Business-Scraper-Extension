import React from 'react'

const VIEWS = {
  LIST: 'list',
  MAP: 'map',
  EXPORT: 'export'
}

function Header({ currentView, setCurrentView, businessCount, totalCount }) {
  const getViewIcon = (view) => {
    switch (view) {
      case VIEWS.LIST:
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
          </svg>
        )
      case VIEWS.MAP:
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        )
      case VIEWS.EXPORT:
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
          </svg>
        )
      default:
        return null
    }
  }

  return (
    <div className="header">
      <div className="header-top">
        <div className="header-brand">
          <div className="header-icon">
            <svg fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </div>
          <h1 className="header-title">Business Scraper</h1>
        </div>
        <div className="header-count">
          {businessCount !== totalCount ? (
            <span>{businessCount} of {totalCount} shown</span>
          ) : (
            <span>{totalCount} businesses</span>
          )}
        </div>
      </div>

      <div className="tab-container">
        {Object.values(VIEWS).map((view) => (
          <button
            key={view}
            onClick={() => setCurrentView(view)}
            className={`tab-button ${currentView === view ? 'active' : ''}`}
          >
            {getViewIcon(view)}
            <span style={{ textTransform: 'capitalize' }}>{view}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

export default Header