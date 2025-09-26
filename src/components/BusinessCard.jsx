import React from 'react'

function BusinessCard({ business }) {
  const {
    name,
    category,
    address,
    phone,
    email,
    website,
    rating,
    reviewCount,
    hours,
    scrapedAt
  } = business

  const formatRating = (rating) => {
    if (!rating) return null
    return '★'.repeat(Math.floor(rating)) + (rating % 1 >= 0.5 ? '☆' : '')
  }

  const formatDate = (dateString) => {
    if (!dateString) return null
    return new Date(dateString).toLocaleDateString()
  }

  const openLink = (url) => {
    if (url) {
      chrome.tabs.create({ url })
    }
  }

  const callPhone = (phoneNumber) => {
    if (phoneNumber) {
      chrome.tabs.create({ url: `tel:${phoneNumber}` })
    }
  }

  const sendEmail = (emailAddress) => {
    if (emailAddress) {
      chrome.tabs.create({ url: `mailto:${emailAddress}` })
    }
  }

  return (
    <div className="business-card bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-gray-900 truncate">{name || 'Unknown Business'}</h3>
          {category && (
            <p className="text-sm text-gray-600 mt-1">{category}</p>
          )}
        </div>
        {rating && (
          <div className="ml-3 text-right">
            <div className="text-yellow-400 text-sm">{formatRating(rating)}</div>
            <div className="text-xs text-gray-500">
              {rating.toFixed(1)}
              {reviewCount && ` (${reviewCount})`}
            </div>
          </div>
        )}
      </div>

      {address && (
        <div className="flex items-start space-x-2 mb-2">
          <svg className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <p className="text-sm text-gray-600 leading-relaxed">{address}</p>
        </div>
      )}

      <div className="flex flex-wrap gap-2 mt-3">
        {phone && (
          <button
            onClick={() => callPhone(phone)}
            className="flex items-center space-x-1 px-2 py-1 bg-green-50 text-green-700 text-xs rounded hover:bg-green-100 transition-colors"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            <span>{phone}</span>
          </button>
        )}

        {email && (
          <button
            onClick={() => sendEmail(email)}
            className="flex items-center space-x-1 px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded hover:bg-blue-100 transition-colors"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <span>{email}</span>
          </button>
        )}

        {website && (
          <button
            onClick={() => openLink(website)}
            className="flex items-center space-x-1 px-2 py-1 bg-purple-50 text-purple-700 text-xs rounded hover:bg-purple-100 transition-colors"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            <span>Website</span>
          </button>
        )}
      </div>

      {hours && (
        <div className="mt-2 text-xs text-gray-500">
          <span className="font-medium">Hours:</span> {hours}
        </div>
      )}

      {scrapedAt && (
        <div className="mt-2 text-xs text-gray-400">
          Scraped {formatDate(scrapedAt)}
        </div>
      )}
    </div>
  )
}

export default BusinessCard