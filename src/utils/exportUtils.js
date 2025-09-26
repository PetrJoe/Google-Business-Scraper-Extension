import * as XLSX from 'xlsx'

// Convert businesses data to XLSX and trigger download
export function exportToXLSX(businesses, filename) {
  try {
    // Prepare data for Excel
    const worksheetData = businesses.map(business => ({
      'Business Name': business.name || '',
      'Category': business.category || '',
      'Address': business.address || '',
      'Phone': business.phone || '',
      'Email': business.email || '',
      'Website': business.website || '',
      'Rating': business.rating || '',
      'Review Count': business.reviewCount || '',
      'Hours': business.hours || '',
      'Latitude': business.lat || '',
      'Longitude': business.lon || '',
      'OSM ID': business.osmId || '',
      'Date Scraped': business.scrapedAt ? new Date(business.scrapedAt).toLocaleDateString() : ''
    }))

    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new()
    const worksheet = XLSX.utils.json_to_sheet(worksheetData)

    // Auto-size columns
    const maxWidth = 50
    const colWidths = {}

    // Calculate column widths based on content
    worksheetData.forEach(row => {
      Object.keys(row).forEach(key => {
        const value = String(row[key] || '')
        const width = Math.min(Math.max(value.length + 2, key.length + 2), maxWidth)
        colWidths[key] = Math.max(colWidths[key] || 0, width)
      })
    })

    // Apply column widths
    worksheet['!cols'] = Object.keys(colWidths).map(key => ({ wch: colWidths[key] }))

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Businesses')

    // Generate Excel file
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })

    // Create blob and download
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const url = URL.createObjectURL(blob)

    // Create download link and click it
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    // Clean up
    URL.revokeObjectURL(url)

    return { success: true, filename }
  } catch (error) {
    console.error('Error exporting to XLSX:', error)
    return { success: false, error: error.message }
  }
}

// Convert businesses data to CSV format
export function exportToCSV(businesses, filename) {
  try {
    const headers = [
      'Business Name',
      'Category',
      'Address',
      'Phone',
      'Email',
      'Website',
      'Rating',
      'Review Count',
      'Hours',
      'Latitude',
      'Longitude',
      'Date Scraped'
    ]

    const csvData = businesses.map(business => [
      business.name || '',
      business.category || '',
      business.address || '',
      business.phone || '',
      business.email || '',
      business.website || '',
      business.rating || '',
      business.reviewCount || '',
      business.hours || '',
      business.lat || '',
      business.lon || '',
      business.scrapedAt ? new Date(business.scrapedAt).toLocaleDateString() : ''
    ])

    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
      .join('\n')

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)

    // Create download link and click it
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    // Clean up
    URL.revokeObjectURL(url)

    return { success: true, filename }
  } catch (error) {
    console.error('Error exporting to CSV:', error)
    return { success: false, error: error.message }
  }
}

// Export businesses data to JSON format
export function exportToJSON(businesses, filename) {
  try {
    const jsonData = JSON.stringify(businesses, null, 2)

    // Create blob and download
    const blob = new Blob([jsonData], { type: 'application/json' })
    const url = URL.createObjectURL(blob)

    // Create download link and click it
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    // Clean up
    URL.revokeObjectURL(url)

    return { success: true, filename }
  } catch (error) {
    console.error('Error exporting to JSON:', error)
    return { success: false, error: error.message }
  }
}