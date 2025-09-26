import React, { useEffect, useRef } from 'react'

// Note: This component uses Leaflet.js which is loaded via CDN in popup.html
function MapView({ businesses }) {
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const markersRef = useRef([])

  useEffect(() => {
    // Initialize map when component mounts
    if (typeof L !== 'undefined' && mapRef.current && !mapInstanceRef.current) {
      initializeMap()
    }
  }, [])

  useEffect(() => {
    // Update markers when businesses change
    if (mapInstanceRef.current) {
      updateMarkers()
    }
  }, [businesses])

  const initializeMap = () => {
    // Create map centered on default location (can be improved with user location)
    const map = L.map(mapRef.current).setView([39.8283, -98.5795], 4) // Center of US

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map)

    mapInstanceRef.current = map
    updateMarkers()
  }

  const updateMarkers = () => {
    const map = mapInstanceRef.current
    if (!map) return

    // Clear existing markers
    markersRef.current.forEach(marker => {
      map.removeLayer(marker)
    })
    markersRef.current = []

    // Filter businesses that have coordinates
    const businessesWithCoords = businesses.filter(business =>
      business.lat && business.lon &&
      !isNaN(business.lat) && !isNaN(business.lon)
    )

    if (businessesWithCoords.length === 0) {
      // Show message when no businesses have coordinates
      return
    }

    // Add new markers
    const bounds = L.latLngBounds()

    businessesWithCoords.forEach(business => {
      const marker = L.marker([business.lat, business.lon])
        .addTo(map)
        .bindPopup(createPopupContent(business))

      markersRef.current.push(marker)
      bounds.extend([business.lat, business.lon])
    })

    // Fit map to show all markers
    if (businessesWithCoords.length > 0) {
      map.fitBounds(bounds, { padding: [10, 10] })
    }
  }

  const createPopupContent = (business) => {
    const {
      name,
      category,
      address,
      phone,
      email,
      website,
      rating,
      reviewCount
    } = business

    let popup = `<div class="p-2 min-w-48">
      <h3 class="font-medium text-gray-900 mb-1">${name || 'Unknown Business'}</h3>`

    if (category) {
      popup += `<p class="text-sm text-gray-600 mb-2">${category}</p>`
    }

    if (rating) {
      const stars = '★'.repeat(Math.floor(rating)) + (rating % 1 >= 0.5 ? '☆' : '')
      popup += `<div class="text-yellow-500 text-sm mb-2">${stars} ${rating.toFixed(1)}`
      if (reviewCount) {
        popup += ` (${reviewCount} reviews)`
      }
      popup += '</div>'
    }

    if (address) {
      popup += `<p class="text-sm text-gray-600 mb-2">${address}</p>`
    }

    popup += '<div class="space-y-1">'

    if (phone) {
      popup += `<div class="text-sm">
        <a href="tel:${phone}" class="text-green-600 hover:text-green-800">📞 ${phone}</a>
      </div>`
    }

    if (email) {
      popup += `<div class="text-sm">
        <a href="mailto:${email}" class="text-blue-600 hover:text-blue-800">✉️ ${email}</a>
      </div>`
    }

    if (website) {
      popup += `<div class="text-sm">
        <a href="${website}" target="_blank" class="text-purple-600 hover:text-purple-800">🔗 Website</a>
      </div>`
    }

    popup += '</div></div>'

    return popup
  }

  // Check if Leaflet is available
  if (typeof L === 'undefined') {
    return (
      <div className="loading-state">
        <div className="state-content">
          <div className="spinner"></div>
          <p className="state-description">Loading map...</p>
        </div>
      </div>
    )
  }

  const businessesWithCoords = businesses.filter(business =>
    business.lat && business.lon &&
    !isNaN(business.lat) && !isNaN(business.lon)
  )

  return (
    <div className="map-view">
      <div ref={mapRef} className="map-container" />

      {businesses.length > 0 && businessesWithCoords.length === 0 && (
        <div className="map-overlay">
          <div className="map-overlay-content">
            <div className="state-icon" style={{ backgroundColor: '#fffbeb' }}>
              <svg style={{ width: '24px', height: '24px', color: '#d97706' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h3 className="state-title">No Location Data</h3>
            <p className="state-description">
              Businesses need to be enriched with OpenStreetMap data to show on the map.
            </p>
          </div>
        </div>
      )}

      {businesses.length === 0 && (
        <div className="map-overlay" style={{ backgroundColor: 'white' }}>
          <div className="map-overlay-content">
            <div className="state-icon empty">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
            </div>
            <h3 className="state-title">No Businesses to Show</h3>
            <p className="state-description">
              Start scraping businesses to see them on the map.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export default MapView