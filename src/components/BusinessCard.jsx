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
    <div className="business-card">
      <div className="business-header">
        <div className="business-info">
          <h3 className="business-name">{name || 'Unknown Business'}</h3>
          {category && (
            <p className="business-category">{category}</p>
          )}
        </div>
        {rating && (
          <div className="business-rating">
            <div className="rating-stars">{formatRating(rating)}</div>
            <div className="rating-details">
              {rating.toFixed(1)}
              {reviewCount && ` (${reviewCount})`}
            </div>
          </div>
        )}
      </div>

      {address && (
        <div className="business-address">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <p className="address-text leading-relaxed">{address}</p>
        </div>
      )}

      <div className="business-contacts">
        {phone && (
          <button
            onClick={() => callPhone(phone)}
            className="contact-button contact-phone"
          >
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            <span>{phone}</span>
          </button>
        )}

        {email && (
          <button
            onClick={() => sendEmail(email)}
            className="contact-button contact-email"
          >
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <span>{email}</span>
          </button>
        )}

        {website && (
          <button
            onClick={() => openLink(website)}
            className="contact-button contact-website"
          >
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            <span>Website</span>
          </button>
        )}
      </div>

      <div className="business-meta">
        {hours && (
          <div className="business-hours">
            <span className="font-medium">Hours:</span> {hours}
          </div>
        )}

        {scrapedAt && (
          <div className="business-scraped">
            Scraped {formatDate(scrapedAt)}
          </div>
        )}
      </div>
    </div>
  )
}

export default BusinessCard