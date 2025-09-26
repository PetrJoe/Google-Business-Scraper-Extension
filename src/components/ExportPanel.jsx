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
    <div className="flex-1 overflow-y-auto p-4 space-y-6">
      {/* Statistics */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Data Overview</h3>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-blue-50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
            <div className="text-sm text-blue-600">Total Businesses</div>
          </div>
          <div className="bg-green-50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-green-600">{stats.withPhone}</div>
            <div className="text-sm text-green-600">With Phone</div>
          </div>
          <div className="bg-purple-50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-purple-600">{stats.withEmail}</div>
            <div className="text-sm text-purple-600">With Email</div>
          </div>
          <div className="bg-orange-50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-orange-600">{stats.withWebsite}</div>
            <div className="text-sm text-orange-600">With Website</div>
          </div>
        </div>

        {stats.withRating > 0 && (
          <div className="bg-yellow-50 rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-yellow-600">
              {stats.avgRating.toFixed(1)} ★
            </div>
            <div className="text-sm text-yellow-600">
              Average Rating ({stats.withRating} businesses)
            </div>
          </div>
        )}
      </div>

      {/* Export Options */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Export Data</h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Export Format
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="csv"
                  checked={exportFormat === 'csv'}
                  onChange={(e) => setExportFormat(e.target.value)}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm">CSV (Comma Separated Values)</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="xlsx"
                  checked={exportFormat === 'xlsx'}
                  onChange={(e) => setExportFormat(e.target.value)}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm">XLSX (Excel Spreadsheet)</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="json"
                  checked={exportFormat === 'json'}
                  onChange={(e) => setExportFormat(e.target.value)}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm">JSON (JavaScript Object Notation)</span>
              </label>
            </div>
          </div>

          <button
            onClick={handleExport}
            disabled={businesses.length === 0 || isExporting}
            className="w-full export-btn bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
          >
            {isExporting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full spinner"></div>
                <span>Exporting...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>Export {businesses.length} Businesses</span>
              </>
            )}
          </button>

          {businesses.length === 0 && (
            <p className="text-sm text-gray-500 text-center">
              No businesses available for export. Start scraping to collect data.
            </p>
          )}
        </div>
      </div>

      {/* Data Management */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Data Management</h3>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
            <div>
              <div className="font-medium text-gray-900">Storage Usage</div>
              <div className="text-sm text-gray-600">
                {businesses.length} businesses stored locally
              </div>
            </div>
          </div>

          <button
            onClick={onClearData}
            disabled={businesses.length === 0}
            className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white px-4 py-2 rounded font-medium transition-colors"
          >
            Clear All Data
          </button>

          <p className="text-xs text-gray-500 text-center">
            This action cannot be undone. Consider exporting your data first.
          </p>
        </div>
      </div>

      {/* Export Preview */}
      {businesses.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Data Preview</h3>

          <div className="text-sm space-y-2">
            <p className="font-medium">Fields included in export:</p>
            <ul className="list-disc list-inside text-gray-600 space-y-1">
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