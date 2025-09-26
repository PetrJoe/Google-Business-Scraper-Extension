import React, { useState } from 'react'

function ExportPanel({ businesses, onExport, onClearData }) {
  const [exportFormat, setExportFormat] = useState('csv')
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async () => {
    setIsExporting(true)
    try {
      await onExport(exportFormat)
    } finally {
      setIsExporting(false)
    }
  }

  const getBusinessStats = () => {
    const stats = {
      total: businesses.length,
      withPhone: businesses.filter(b => b.phone).length,
      withEmail: businesses.filter(b => b.email).length,
      withWebsite: businesses.filter(b => b.website).length,
      withRating: businesses.filter(b => b.rating).length,
      avgRating: 0
    }

    if (stats.withRating > 0) {
      stats.avgRating = businesses
        .filter(b => b.rating)
        .reduce((sum, b) => sum + b.rating, 0) / stats.withRating
    }

    return stats
  }

  const stats = getBusinessStats()

  return (
    <div className="export-panel space-y-6">
      {/* Statistics */}
      <div className="stats-card">
        <h3 className="stats-title">Data Overview</h3>

        <div className="stats-grid">
          <div className="stat-item blue">
            <div className="stat-number blue">{stats.total}</div>
            <div className="stat-label">Total Businesses</div>
          </div>
          <div className="stat-item green">
            <div className="stat-number green">{stats.withPhone}</div>
            <div className="stat-label">With Phone</div>
          </div>
          <div className="stat-item purple">
            <div className="stat-number purple">{stats.withEmail}</div>
            <div className="stat-label">With Email</div>
          </div>
          <div className="stat-item orange">
            <div className="stat-number orange">{stats.withWebsite}</div>
            <div className="stat-label">With Website</div>
          </div>
        </div>

        {stats.withRating > 0 && (
          <div className="avg-rating">
            <div className="avg-rating-number">
              {stats.avgRating.toFixed(1)} ★
            </div>
            <div className="avg-rating-label">
              Average Rating ({stats.withRating} businesses)
            </div>
          </div>
        )}
      </div>

      {/* Export Options */}
      <div className="export-card">
        <h3 className="export-title">Export Data</h3>

        <div className="space-y-4">
          <div>
            <label className="form-label">
              Export Format
            </label>
            <div className="radio-group">
              <div className="radio-item">
                <input
                  type="radio"
                  value="csv"
                  checked={exportFormat === 'csv'}
                  onChange={(e) => setExportFormat(e.target.value)}
                  id="csv"
                />
                <label htmlFor="csv">CSV (Comma Separated Values)</label>
              </div>
              <div className="radio-item">
                <input
                  type="radio"
                  value="xlsx"
                  checked={exportFormat === 'xlsx'}
                  onChange={(e) => setExportFormat(e.target.value)}
                  id="xlsx"
                />
                <label htmlFor="xlsx">XLSX (Excel Spreadsheet)</label>
              </div>
              <div className="radio-item">
                <input
                  type="radio"
                  value="json"
                  checked={exportFormat === 'json'}
                  onChange={(e) => setExportFormat(e.target.value)}
                  id="json"
                />
                <label htmlFor="json">JSON (JavaScript Object Notation)</label>
              </div>
            </div>
          </div>

          <button
            onClick={handleExport}
            disabled={businesses.length === 0 || isExporting}
            className="btn-export"
          >
            {isExporting ? (
              <>
                <div className="spinner"></div>
                <span>Exporting...</span>
              </>
            ) : (
              <>
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>Export {businesses.length} Businesses</span>
              </>
            )}
          </button>

          {businesses.length === 0 && (
            <p className="export-empty">
              No businesses available for export. Start scraping to collect data.
            </p>
          )}
        </div>
      </div>

      {/* Data Management */}
      <div className="management-card">
        <h3 className="export-title">Data Management</h3>

        <div className="space-y-3">
          <div className="storage-info">
            <div className="storage-details">
              <div className="font-medium">Storage Usage</div>
              <div className="text-sm">
                {businesses.length} businesses stored locally
              </div>
            </div>
          </div>

          <button
            onClick={onClearData}
            disabled={businesses.length === 0}
            className="btn-danger"
          >
            Clear All Data
          </button>

          <p className="warning-text">
            This action cannot be undone. Consider exporting your data first.
          </p>
        </div>
      </div>

      {/* Export Preview */}
      {businesses.length > 0 && (
        <div className="preview-card">
          <h3 className="preview-title">Data Preview</h3>

          <div className="preview-content">
            <p className="font-medium">Fields included in export:</p>
            <ul className="preview-list">
              <li>Business Name</li>
              <li>Category/Type</li>
              <li>Address</li>
              <li>Phone Number</li>
              <li>Email Address</li>
              <li>Website URL</li>
              <li>Rating & Review Count</li>
              <li>Business Hours</li>
              <li>Date Scraped</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}

export default ExportPanel