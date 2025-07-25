'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
import HTMLFlipBook from 'react-pageflip';

interface Company {
  id: string
  C_Name: string
  C_Logo_Image?: any
  Welcoming_Page?: any
  pdfMenuFile?: any
  menuType?: string

  Main_Categories?: Array<{
    id: string
    name: string
    categoryNo: number
    subCategories: Array<{
      id: string
      name: string
      orderNo: number
      menuImageUrl?: any
      price?: number
      stock: boolean
    }>
  }>
  Themes?: Array<{
    backgroundColor?: string
    textColor?: string
    logoAreaColor?: string
    style?: string
    facebookUrl?: string
    instagramUrl?: string
    xUrl?: string
  }>
  user?: {
    userName: string;
  };
}

interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
  image?: string
}

export default function MobileOptimizedMenuPage() {
  const params = useParams()
  const companyId = params.companyId as string
  const [company, setCompany] = useState<Company | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showWelcoming, setShowWelcoming] = useState(false)
  const [fadeOut, setFadeOut] = useState(false)
  const [pdfDisplayMode, setPdfDisplayMode] = useState('flipbook')
  
  // Mobile-specific states
  const [isMobile, setIsMobile] = useState(false)
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait')
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null)
  
  // Shopping cart state
  const [cart, setCart] = useState<CartItem[]>([])
  const [showCart, setShowCart] = useState(false)
  const [selectedItem, setSelectedItem] = useState<{id: string, quantity: number} | null>(null)
  const [tableNumber, setTableNumber] = useState('')
  const [orderRequest, setOrderRequest] = useState('')

  // Mobile detection and orientation handling
  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent.toLowerCase()
      const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent)
      const isSmallScreen = window.innerWidth <= 768
      setIsMobile(isMobileDevice || isSmallScreen)
    }

    const checkOrientation = () => {
      setOrientation(window.innerHeight > window.innerWidth ? 'portrait' : 'landscape')
    }

    checkMobile()
    checkOrientation()

    window.addEventListener('resize', checkMobile)
    window.addEventListener('resize', checkOrientation)
    window.addEventListener('orientationchange', checkOrientation)

    return () => {
      window.removeEventListener('resize', checkMobile)
      window.removeEventListener('resize', checkOrientation)
      window.removeEventListener('orientationchange', checkOrientation)
    }
  }, [])

  // Prevent zoom on double-tap (iOS Safari)
  useEffect(() => {
    const preventZoom = (e: TouchEvent) => {
      if (e.touches.length > 1) {
        e.preventDefault()
      }
    }

    const preventDoubleTapZoom = (e: TouchEvent) => {
      const t2 = e.timeStamp
      const t1 = e.currentTarget.dataset.lastTouch || t2
      const dt = t2 - parseInt(t1)
      const fingers = e.touches.length
      e.currentTarget.dataset.lastTouch = t2.toString()

      if (!dt || dt > 500 || fingers > 1) return // not double-tap

      e.preventDefault() // double tap - prevent zoom
      e.target.click()
    }

    document.addEventListener('touchstart', preventZoom, { passive: false })
    document.addEventListener('touchstart', preventDoubleTapZoom, { passive: false })

    return () => {
      document.removeEventListener('touchstart', preventZoom)
      document.removeEventListener('touchstart', preventDoubleTapZoom)
    }
  }, [])

  useEffect(() => {
    if (companyId) {
      fetchCompanyData()
    }
  }, [companyId])

  useEffect(() => {
    // Load PDF display mode from URL parameter (QR code) or localStorage (fallback)
    const urlParams = new URLSearchParams(window.location.search)
    const modeFromUrl = urlParams.get('mode')
    
    if (modeFromUrl && (modeFromUrl === 'scroll' || modeFromUrl === 'flipbook')) {
      setPdfDisplayMode(modeFromUrl)
    } else {
      // On mobile, prefer scroll mode for better UX
      if (isMobile) {
        setPdfDisplayMode('scroll')
      } else {
        const savedDisplayMode = localStorage.getItem('pdfDisplayMode')
        if (savedDisplayMode && (savedDisplayMode === 'scroll' || savedDisplayMode === 'flipbook')) {
          setPdfDisplayMode(savedDisplayMode)
        }
      }
    }
  }, [isMobile])

  // Remove dashboard-mode class from body to prevent background image
  useEffect(() => {
    document.body.classList.remove('dashboard-mode', 'bubble-bg')
    
    // Add mobile-specific classes
    if (isMobile) {
      document.body.classList.add('mobile-menu')
      // Prevent body scroll when cart is open
      if (showCart) {
        document.body.style.overflow = 'hidden'
      } else {
        document.body.style.overflow = 'auto'
      }
    }
    
    return () => {
      document.body.classList.add('dashboard-mode', 'bubble-bg')
      document.body.classList.remove('mobile-menu')
      document.body.style.overflow = 'auto'
    }
  }, [isMobile, showCart])

  useEffect(() => {
    if (company && company.Welcoming_Page && !loading) {
      setShowWelcoming(true)
      
      const fadeTimer = setTimeout(() => {
        setFadeOut(true)
      }, 2500)

      const hideTimer = setTimeout(() => {
        setShowWelcoming(false)
      }, 3000)

      return () => {
        clearTimeout(fadeTimer)
        clearTimeout(hideTimer)
      }
    }
  }, [company, loading])

  const fetchCompanyData = async () => {
    try {
      const res = await fetch(`/api/QR_Panel/menu/${companyId}`)
      
      if (!res.ok) {
        throw new Error('Menu not found')
      }
      
      const data = await res.json()
      setCompany(data.company)
    } catch (err: any) {
      setError(err.message || 'Failed to load menu')
      console.error('Menu fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  // Shopping cart functions
  const getTotalItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0)
  }

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0)
  }

  const addToCart = (item: { id: string, name: string, price: number, image?: string }, quantity: number) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(cartItem => cartItem.id === item.id)
      if (existingItem) {
        return prevCart.map(cartItem =>
          cartItem.id === item.id
            ? { ...cartItem, quantity: cartItem.quantity + quantity }
            : cartItem
        )
      } else {
        return [...prevCart, { ...item, quantity }]
      }
    })
    setSelectedItem(null)

    // Mobile haptic feedback
    if (navigator.vibrate && isMobile) {
      navigator.vibrate(50)
    }
  }

  const updateCartItemQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      setCart(prevCart => prevCart.filter(item => item.id !== id))
    } else {
      setCart(prevCart =>
        prevCart.map(item =>
          item.id === id ? { ...item, quantity } : item
        )
      )
    }

    // Mobile haptic feedback
    if (navigator.vibrate && isMobile) {
      navigator.vibrate(30)
    }
  }

  const clearCart = () => {
    setCart([])
    setShowCart(false)
    setTableNumber('')
    setOrderRequest('')
  }

  // Mobile touch handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0]
    setTouchStart({ x: touch.clientX, y: touch.clientY })
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart) return

    const touch = e.changedTouches[0]
    const deltaX = touchStart.x - touch.clientX
    const deltaY = touchStart.y - touch.clientY

    // Swipe detection (minimum 50px swipe)
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
      if (deltaX > 0) {
        // Swipe left - could be used for navigation
      } else {
        // Swipe right - could be used for navigation
      }
    }

    setTouchStart(null)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading menu...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 px-4">
        <div className="text-center max-w-sm">
          <div className="text-6xl mb-4">😞</div>
          <h1 className="text-xl font-bold text-gray-800 mb-2">Menu Not Found</h1>
          <p className="text-gray-600 text-sm">{error}</p>
        </div>
      </div>
    )
  }

  if (!company) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 px-4">
        <div className="text-center max-w-sm">
          <div className="text-6xl mb-4">❓</div>
          <h1 className="text-xl font-bold text-gray-800 mb-2">No Menu Available</h1>
          <p className="text-gray-600 text-sm">This restaurant hasn't set up their menu yet.</p>
        </div>
      </div>
    )
  }

  // Mobile-optimized theme selection
  const userTheme = company.Themes?.[0]
  
  const theme = userTheme ? {
    backgroundColor: userTheme.backgroundColor || '#ffffff',
    textColor: userTheme.textColor || '#000000',
    logoAreaColor: userTheme.logoAreaColor || '#f8f9fa',
    style: userTheme.style || 'modern',
    facebookUrl: userTheme.facebookUrl || '',
    instagramUrl: userTheme.instagramUrl || '',
    xUrl: userTheme.xUrl || ''
  } : {
    backgroundColor: isMobile ? '#f8fafc' : '#ffffff',
    textColor: '#1e293b',
    logoAreaColor: '#e2e8f0',
    style: 'minimal',
    facebookUrl: '',
    instagramUrl: '',
    xUrl: ''
  }

  const restaurantName = company.C_Name || company.user?.userName ? `${company.user?.userName}'s Restaurant` : 'Restaurant Menu';

  const getEffectiveMenuType = () => {
    const urlParams = new URLSearchParams(window.location.search)
    const typeFromUrl = urlParams.get('type')
    
    if (typeFromUrl && (typeFromUrl === 'pdf' || typeFromUrl === 'manual')) {
      return typeFromUrl
    }
    
    return company.menuType || 'none'
  }

  // Mobile-optimized welcoming screen
  if (company && showWelcoming) {
    return (
      <div
        className={`fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center transition-opacity duration-500 p-4 ${
          fadeOut ? 'opacity-0' : 'opacity-100'
        }`}
        onClick={() => {
          setFadeOut(true)
          setTimeout(() => setShowWelcoming(false), 300)
        }}
      >
        <div
          className={`relative bg-white rounded-2xl overflow-hidden shadow-2xl ${
            isMobile 
              ? 'w-full max-w-xs' 
              : 'max-w-sm w-[90%] sm:max-w-md'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => {
              setFadeOut(true)
              setTimeout(() => setShowWelcoming(false), 300)
            }}
            className="absolute top-3 right-3 text-gray-600 hover:text-black bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full w-10 h-10 flex items-center justify-center z-10 text-xl font-bold shadow-lg"
            aria-label="Close welcome screen"
          >
            ×
          </button>

          <img
            src={`/api/AdminPanel/company/image/${company.id}/welcoming?${Date.now()}`}
            alt="Welcoming"
            className="w-full h-auto object-cover"
          />
        </div>
      </div>
    )
  }

  return (
    <div 
      className={`min-h-screen transition-opacity duration-500 ${(showWelcoming || loading) ? 'opacity-0' : 'opacity-100'} ${isMobile ? 'mobile-layout' : ''}`}
      style={{ 
        backgroundColor: theme.backgroundColor,
        color: theme.textColor 
      }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Mobile-optimized Header */}
      <header className={`py-3 px-4 text-center bg-opacity-95 backdrop-blur-sm relative sticky top-0 z-40 border-b border-gray-200 ${isMobile ? 'shadow-sm' : ''}`}>
        <div className="max-w-4xl mx-auto">
          {/* Company Logo */}
          {company.C_Logo_Image && (
            <div className="mb-2">
              <img 
                src={`/api/AdminPanel/company/image/${company.id}/logo?${Date.now()}`}
                alt="Company Logo"
                className={`mx-auto rounded-lg shadow-lg ${
                  isMobile ? 'max-w-12 max-h-12' : 'max-w-16 max-h-16'
                }`}
              />
            </div>
          )}
          
          <h1 className={`font-bold ${isMobile ? 'text-lg' : 'text-2xl'}`}>
            {restaurantName}
          </h1>
        </div>

        {/* Mobile-optimized Shopping Cart Icon */}
        <button
          onClick={() => setShowCart(true)}
          className={`absolute top-3 right-4 bg-black text-white rounded-full shadow-lg hover:bg-gray-800 transition-all active:scale-95 ${
            isMobile ? 'p-2.5' : 'p-3'
          }`}
        >
          <div className="relative">
            <svg className={`${isMobile ? 'w-5 h-5' : 'w-6 h-6'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.1 5A1 1 0 006.9 19H19M9 19a2 2 0 100 4 2 2 0 000-4zm8 0a2 2 0 100 4 2 2 0 000-4z" />
            </svg>
            {getTotalItems() > 0 && (
              <span className={`absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold ${
                isMobile ? 'h-4 w-4 text-[10px]' : 'h-5 w-5'
              }`}>
                {getTotalItems() > 99 ? '99+' : getTotalItems()}
              </span>
            )}
          </div>
        </button>
      </header>

      <div className={`mx-auto ${getEffectiveMenuType() === 'pdf' ? 'max-w-none p-0 min-h-screen' : isMobile ? 'px-3' : 'max-w-4xl px-4'}`}>
        {getEffectiveMenuType() === 'pdf' && company.pdfMenuFile ? (
          <div 
            className={`w-full min-h-[85vh] flex items-center justify-center transition-all duration-500 ${
              pdfDisplayMode === 'scroll' 
                ? 'bg-slate-50 border-t border-slate-200' 
                : 'bg-orange-50 border-t border-orange-200'
            }`}
          >
            <MobilePDFViewer 
              pdfUrl={`/api/AdminPanel/company/pdf/${company.id}?t=${Date.now()}`}
              displayMode={isMobile ? 'scroll' : pdfDisplayMode}
              isMobile={isMobile}
            />
          </div>
        ) : getEffectiveMenuType() === 'manual' && company.Main_Categories ? (
          <MobileManualMenu 
            categories={company.Main_Categories} 
            theme={theme}
            selectedItem={selectedItem}
            setSelectedItem={setSelectedItem}
            addToCart={addToCart}
            isMobile={isMobile}
          />
        ) : (
          <div className={`text-center ${isMobile ? 'py-16 px-4' : 'py-8'}`}>
            <div className={`mb-4 ${isMobile ? 'text-4xl' : 'text-6xl'}`}>🍽️</div>
            <h2 className={`font-bold mb-4 ${isMobile ? 'text-xl' : 'text-2xl'}`}>Menu Coming Soon</h2>
            <p className={`opacity-80 ${isMobile ? 'text-base' : 'text-lg'}`}>
              This restaurant is still setting up their menu. Please check back later!
            </p>
          </div>
        )}
      </div>

      {/* Mobile-optimized Shopping Cart Modal */}
      {showCart && (
        <div
          className={`fixed inset-0 z-50 flex items-end sm:items-center justify-center backdrop-blur-sm ${
            isMobile ? 'p-0' : 'p-4'
          }`}
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
        >
          <div className={`bg-white overflow-hidden ${
            isMobile 
              ? 'w-full h-[90vh] rounded-t-3xl' 
              : 'rounded-lg max-w-md w-full max-h-[80vh]'
          }`}>
            <div className={`border-b flex items-center justify-between ${isMobile ? 'p-5' : 'p-4'}`}>
              <h2 className={`font-bold ${isMobile ? 'text-2xl' : 'text-xl'}`}>Shopping Cart</h2>
              <button
                onClick={() => setShowCart(false)}
                className={`text-gray-500 hover:text-gray-700 ${isMobile ? 'p-2' : ''}`}
              >
                <svg className={`${isMobile ? 'w-7 h-7' : 'w-6 h-6'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className={`overflow-y-auto ${isMobile ? 'p-5 max-h-[60vh]' : 'p-4 max-h-96'}`}>
              {/* Table Number Input */}
              <div className="mb-4">
                <label htmlFor="tableNumber" className={`block font-medium text-gray-700 mb-2 ${isMobile ? 'text-base' : 'text-sm'}`}>
                  Table Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="tableNumber"
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                  placeholder="Enter your table number"
                  className={`w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    isMobile ? 'px-4 py-3 text-base' : 'px-3 py-2'
                  }`}
                />
              </div>

              {/* Order Request/Notes Input */}
              <div className="mb-4">
                <label htmlFor="orderRequest" className={`block font-medium text-gray-700 mb-2 ${isMobile ? 'text-base' : 'text-sm'}`}>
                  Special Requests or Notes
                </label>
                <textarea
                  id="orderRequest"
                  value={orderRequest}
                  onChange={(e) => setOrderRequest(e.target.value)}
                  placeholder="Any special requests, allergies, or additional notes..."
                  rows={isMobile ? 4 : 3}
                  className={`w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${
                    isMobile ? 'px-4 py-3 text-base' : 'px-3 py-2'
                  }`}
                />
              </div>

              {cart.length === 0 ? (
                <div className={`text-center ${isMobile ? 'py-12' : 'py-8'}`}>
                  <div className={`mb-4 ${isMobile ? 'text-6xl' : 'text-4xl'}`}>🛒</div>
                  <p className="text-gray-500">Your cart is empty</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {cart.map((item) => (
                    <div key={item.id} className={`flex items-center space-x-3 bg-gray-50 rounded-lg ${isMobile ? 'p-4' : 'p-3'}`}>
                      <div className="flex-1">
                        <h3 className={`font-medium ${isMobile ? 'text-base' : 'text-sm'}`}>{item.name}</h3>
                        <p className={`text-gray-600 ${isMobile ? 'text-sm' : 'text-xs'}`}>₺{item.price.toFixed(2)} each</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => updateCartItemQuantity(item.id, item.quantity - 1)}
                          className={`bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300 active:scale-95 transition-all ${
                            isMobile ? 'w-10 h-10' : 'w-8 h-8'
                          }`}
                        >
                          <span className={`${isMobile ? 'text-lg' : 'text-sm'}`}>-</span>
                        </button>
                        <span className={`text-center font-bold ${isMobile ? 'w-10 text-lg' : 'w-8'}`}>{item.quantity}</span>
                        <button
                          onClick={() => updateCartItemQuantity(item.id, item.quantity + 1)}
                          className={`bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300 active:scale-95 transition-all ${
                            isMobile ? 'w-10 h-10' : 'w-8 h-8'
                          }`}
                        >
                          <span className={`${isMobile ? 'text-lg' : 'text-sm'}`}>+</span>
                        </button>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold ${isMobile ? 'text-base' : 'text-sm'}`}>₺{(item.price * item.quantity).toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {cart.length > 0 && (
              <div className={`border-t ${isMobile ? 'p-5' : 'p-4'}`}>
                <div className={`flex justify-between items-center mb-4 ${isMobile ? 'text-lg' : ''}`}>
                  <span className={`font-bold ${isMobile ? 'text-xl' : 'text-lg'}`}>Total: ₺{getTotalPrice().toFixed(2)}</span>
                  <span className={`text-gray-600 ${isMobile ? 'text-base' : 'text-sm'}`}>{getTotalItems()} items</span>
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={clearCart}
                    className={`flex-1 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors active:scale-95 font-medium ${
                      isMobile ? 'py-4 text-base' : 'py-2'
                    }`}
                  >
                    Clear Cart
                  </button>
                  <button
                    onClick={async () => {
                      if (!tableNumber.trim()) {
                        alert('Please enter your table number before confirming the order.');
                        return;
                      }

                      try {
                        const response = await fetch(`/api/QR_Panel/order/${companyId}`, {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                          },
                          body: JSON.stringify({
                            tableNumber: parseInt(tableNumber),
                            orderRequest: orderRequest.trim(),
                            cart: cart.map(item => ({
                              id: item.id,
                              quantity: item.quantity,
                              price: item.price,
                            })),
                            totalAmount: getTotalPrice(),
                          }),
                        });

                        if (response.ok) {
                          const data = await response.json();
                          alert(`✅ Order confirmed!\nOrder ID: ${data.orderId}`);
                          clearCart();
                          setShowCart(false);
                        } else {
                          const error = await response.json();
                          console.error('Order failed:', error);
                          alert('❌ Failed to place the order. Please try again.');
                        }
                      } catch (err) {
                        console.error('Error placing order:', err);
                        alert('❌ Something went wrong. Please try again later.');
                      }
                    }}
                    disabled={!tableNumber.trim()}
                    className={`flex-1 rounded-lg transition-all active:scale-95 font-medium ${
                      tableNumber.trim()
                        ? 'bg-green-500 text-white hover:bg-green-600'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    } ${isMobile ? 'py-4 text-base' : 'py-2'}`}
                  >
                    Confirm Order
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mobile-optimized Footer */}
      <footer className={`text-center border-t mt-4 ${isMobile ? 'py-6 px-4' : 'py-1 px-4'}`}>
        {/* Social Media Links */}
        {(theme.facebookUrl || theme.instagramUrl || theme.xUrl) && (
          <div className="mb-3">
            <h3 className={`font-medium mb-2 opacity-80 ${isMobile ? 'text-sm' : 'text-xs'}`}>Follow Us</h3>
            <div className="flex justify-center space-x-3">
              {theme.facebookUrl && (
                <a
                  href={theme.facebookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-all duration-300 hover:scale-110 active:scale-95 shadow-sm ${
                    isMobile ? 'w-10 h-10' : 'w-8 h-8'
                  }`}
                  title="Facebook"
                >
                  <svg className={`${isMobile ? 'w-6 h-6' : 'w-5 h-5'}`} fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </a>
              )}
              
              {theme.instagramUrl && (
                <a
                  href={theme.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-center justify-center bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-full transition-all duration-300 hover:scale-110 active:scale-95 shadow-sm ${
                    isMobile ? 'w-10 h-10' : 'w-8 h-8'
                  }`}
                  title="Instagram"
                >
                  <svg className={`${isMobile ? 'w-6 h-6' : 'w-5 h-5'}`} fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </a>
              )}
              
              {theme.xUrl && (
                <a
                  href={theme.xUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-center justify-center bg-black hover:bg-gray-800 text-white rounded-full transition-all duration-300 hover:scale-110 active:scale-95 shadow-sm ${
                    isMobile ? 'w-10 h-10' : 'w-8 h-8'
                  }`}
                  title="X (Twitter)"
                >
                  <svg className={`${isMobile ? 'w-6 h-6' : 'w-6 h-6'}`} fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </a>
              )}
            </div>
          </div>
        )}
        
        <p className={`opacity-60 leading-tight ${isMobile ? 'text-xs' : 'text-xs'}`}>
          Powered by QR Menu System
        </p>
      </footer>
    </div>
  )
}

// Mobile-optimized PDF Viewer Components
function MobilePDFFlipbook({ pdfUrl, isMobile }: { pdfUrl: string; isMobile: boolean }) {
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [dimensions, setDimensions] = useState({ width: 800, height: 1200 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateDimensions = () => {
      if (!containerRef.current) return;
      
      const container = containerRef.current;
      const screenWidth = window.innerWidth;
      const containerWidth = container.clientWidth;
      const containerHeight = window.innerHeight * 0.8;
      
      const aspectRatio = 1 / Math.sqrt(2);
      
      let targetWidth = containerWidth * (isMobile ? 0.95 : 0.8);
      let targetHeight = containerHeight * 0.9;
      
      let newWidth = Math.min(targetWidth, targetHeight * aspectRatio);
      let newHeight = Math.min(targetHeight, targetWidth / aspectRatio);
      
      newWidth = Math.max(newWidth, isMobile ? 280 : 320);
      newHeight = Math.max(newHeight, isMobile ? 350 : 400);
      
      setDimensions({
        width: Math.round(newWidth),
        height: Math.round(newHeight)
      });
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    window.addEventListener('orientationchange', updateDimensions);
    
    return () => {
      window.removeEventListener('resize', updateDimensions);
      window.removeEventListener('orientationchange', updateDimensions);
    }
  }, [isMobile]);

  useEffect(() => {
    let cancelled = false;
    const renderPDF = async () => {
      setLoading(true);
      try {
        const pdfjsLib = (window as any).pdfjsLib;
        if (!pdfjsLib) {
          console.error('pdfjsLib global not found');
          setLoading(false);
          return;
        }

        const loadingTask = pdfjsLib.getDocument(pdfUrl);
        const pdf = await loadingTask.promise;

        const imgs: string[] = [];
        const scale = isMobile ? 3 : 4; // Lower scale for mobile to improve performance
        
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale });
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          
          if (!context) {
            console.error('Canvas context creation failed');
            continue;
          }
          
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          
          try {
            await page.render({
              canvasContext: context,
              viewport: viewport,
              intent: 'print'
            }).promise;
            
            // Use lower quality for mobile to reduce memory usage
            imgs.push(canvas.toDataURL('image/jpeg', isMobile ? 0.7 : 0.85));
          } catch (err) {
            console.error(`Failed to render page ${i}:`, err);
          }
        }

        if (!cancelled) {
          setImages(imgs);
          setLoading(false);
        }
      } catch (err) {
        console.error('Mobile Flipbook render error:', err);
        if (!cancelled) setLoading(false);
      }
    };
    renderPDF();
    return () => { cancelled = true; };
  }, [pdfUrl, isMobile]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading menu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center w-full min-h-screen bg-gray-100 py-4">
      <div ref={containerRef} className="w-full max-w-6xl mx-auto px-2">
        <div className="relative bg-white rounded-lg shadow-xl">
          <HTMLFlipBook
            width={dimensions.width}
            height={dimensions.height}
            size="stretch"
            minWidth={isMobile ? 280 : 320}
            maxWidth={isMobile ? 600 : 1600}
            minHeight={isMobile ? 350 : 400}
            maxHeight={isMobile ? 800 : 2000}
            showCover={true}
            drawShadow={true}
            flippingTime={800}
            usePortrait={true}
            startPage={0}
            useMouseEvents={!isMobile}
            disableFlipByClick={false}
            mobileScrollSupport={true}
            clickEventForward={false}
            showPageCorners={!isMobile}
            swipeDistance={isMobile ? 20 : 30}
            maxShadowOpacity={0.3}
            startZIndex={20}
            autoSize={true}
            style={{ padding: isMobile ? '10px' : '20px' }}
            className="shadow-2xl mx-auto"
          >
            {images.map((src, idx) => (
              <div key={idx} className="bg-white flex items-center justify-center h-full overflow-hidden shadow-inner">
                <div className="relative w-full h-full">
                  <img 
                    src={src} 
                    alt={`Page ${idx + 1}`} 
                    className="absolute inset-0 w-full h-full object-contain select-none"
                    draggable="false"
                    loading={idx < 2 ? "eager" : "lazy"}
                  />
                </div>
              </div>
            ))}
          </HTMLFlipBook>
        </div>
      </div>
    </div>
  );
}

function MobileScrollPDFViewer({ pdfUrl, isMobile }: { pdfUrl: string; isMobile: boolean }) {
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const renderPDF = async () => {
      setLoading(true);
      try {
        const pdfjsLib: any = (window as any).pdfjsLib;
        if (!pdfjsLib) {
          console.error('pdfjsLib global not found');
          setLoading(false);
          return;
        }

        const loadingTask = pdfjsLib.getDocument(pdfUrl);
        const pdf = await loadingTask.promise;

        const imgs: string[] = [];
        const scale = isMobile ? 3 : 5; // Optimized scale for mobile
        
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale });
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          await page.render({ canvasContext: context!, viewport }).promise;
          imgs.push(canvas.toDataURL('image/jpeg', isMobile ? 0.8 : 0.9));
        }

        if (!cancelled) {
          setImages(imgs);
          setLoading(false);
        }
      } catch (err) {
        console.error('Mobile Scroll PDF render error:', err);
        if (!cancelled) setLoading(false);
      }
    };
    renderPDF();
    return () => { cancelled = true; };
  }, [pdfUrl, isMobile]);

  if (loading) {
    return (
      <div className={`text-center ${isMobile ? 'py-16' : 'py-12'}`}>
        <div className="inline-flex items-center space-x-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
          <span className={`font-medium text-gray-600 ${isMobile ? 'text-base' : 'text-lg'}`}>Loading menu...</span>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`w-full mx-auto space-y-2 overflow-auto ${
        isMobile ? 'max-w-full px-2 py-4' : 'max-w-4xl px-4 py-6 space-y-4'
      }`}
      style={{ 
        maxHeight: `${Math.max(window.innerHeight - (isMobile ? 100 : 120), 600)}px`
      }}
    >
      {images.map((src, idx) => (
        <div key={idx} className="w-full flex justify-center">
          <img 
            src={src} 
            alt={`Page ${idx + 1}`} 
            className={`max-w-full h-auto shadow-lg border border-gray-200 ${
              isMobile ? 'rounded-md' : 'rounded-lg'
            }`}
            style={{ 
              maxHeight: isMobile ? '85vh' : '95vh',
              width: isMobile ? '100%' : 'auto'
            }}
            loading={idx < 2 ? "eager" : "lazy"}
          />
        </div>
      ))}
    </div>
  );
}

function MobilePDFViewer({ pdfUrl, displayMode, isMobile }: { pdfUrl: string; displayMode: string; isMobile: boolean }) {
  if (displayMode === 'scroll' || isMobile) {
    return <MobileScrollPDFViewer pdfUrl={pdfUrl} isMobile={isMobile} />;
  }
  return <MobilePDFFlipbook pdfUrl={pdfUrl} isMobile={isMobile} />;
}

// Mobile-optimized Manual Menu Component
function MobileManualMenu({ 
  categories, 
  theme,
  selectedItem,
  setSelectedItem,
  addToCart,
  isMobile
}: { 
  categories: Company['Main_Categories']
  theme: { backgroundColor?: string; textColor?: string; logoAreaColor?: string; style?: string }
  selectedItem: {id: string, quantity: number} | null
  setSelectedItem: (item: {id: string, quantity: number} | null) => void
  addToCart: (item: { id: string, name: string, price: number, image?: string }, quantity: number) => void
  isMobile: boolean
}) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const sortedCategories = [...(categories || [])].sort((a, b) => a.categoryNo - b.categoryNo)

  useEffect(() => {
    if (sortedCategories.length > 0 && !selectedCategory) {
      setSelectedCategory(sortedCategories[0].id)
    }
  }, [sortedCategories, selectedCategory])

  const getCurrentCategory = () => {
    return sortedCategories.find(cat => cat.id === selectedCategory) || sortedCategories[0]
  }

  const currentCategory = getCurrentCategory()

  const handleQuantityChange = (itemId: string, change: number) => {
    const currentQuantity = selectedItem?.id === itemId ? selectedItem.quantity : 0
    const newQuantity = Math.max(0, currentQuantity + change)
    if (newQuantity === 0) {
      setSelectedItem(null)
    } else {
      setSelectedItem({ id: itemId, quantity: newQuantity })
    }

    // Mobile haptic feedback
    if (navigator.vibrate && isMobile) {
      navigator.vibrate(30)
    }
  }

  const handleAddToCart = (item: any) => {
    if (!selectedItem || selectedItem.id !== item.id) return
    
    addToCart({
      id: item.id,
      name: item.name,
      price: item.price || 0,
      image: item.menuImageUrl ? `/api/QR_Panel/user/manual-menu/image/${item.id}` : undefined
    }, selectedItem.quantity)
  }

  const handleCancelSelection = () => {
    setSelectedItem(null)
  }

  if (sortedCategories.length === 0) {
    return (
      <div className={`text-center ${isMobile ? 'py-16 px-4' : 'py-12'}`}>
        <div className={`mb-4 ${isMobile ? 'text-5xl' : 'text-4xl'}`}>📝</div>
        <h2 className={`font-bold mb-2 ${isMobile ? 'text-xl' : 'text-2xl'}`}>No Categories Yet</h2>
        <p className="opacity-70">The menu is being prepared.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* Mobile-optimized Category Selection */}
      <div className={`sticky top-0 z-10 bg-white bg-opacity-95 backdrop-blur-sm border-b border-gray-200 mb-4 ${
        isMobile ? 'py-3' : 'py-4 mb-6'
      }`}>
        <div className={`${isMobile ? 'px-3' : 'px-4'}`}>
          {isMobile ? (
            // Mobile: Horizontal scrollable tabs
            <div className="overflow-x-auto scrollbar-hide">
              <div className="flex space-x-2 min-w-max">
                {sortedCategories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`flex-shrink-0 px-4 py-2.5 rounded-full font-medium text-sm transition-all whitespace-nowrap ${
                      selectedCategory === category.id
                        ? 'bg-black text-white shadow-lg'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 active:scale-95'
                    }`}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            // Desktop: Centered flex wrap
            <div className="flex justify-center">
              <div className="flex flex-wrap space-x-2">
                {sortedCategories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`flex-shrink-0 px-6 py-3 rounded-full font-medium text-sm transition-all ${
                      selectedCategory === category.id
                        ? 'bg-black text-white shadow-lg'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Selected Category Content */}
      {currentCategory && (
        <div className={isMobile ? 'px-3 pb-8' : 'px-4 pb-8'}>
          {/* Category Header */}
          <div className={`text-center ${isMobile ? 'mb-6' : 'mb-8'}`}>
            <h1
              className={`font-bold mb-2 ${isMobile ? 'text-2xl' : 'text-3xl'}`}
              style={{ color: theme?.textColor || '#1f2937' }} 
            >
              {currentCategory.name}
            </h1>
            <div className={`bg-black mx-auto rounded ${isMobile ? 'w-16 h-0.5' : 'w-20 h-1'}`}></div>
          </div>

          {/* Mobile-optimized Items Grid */}
          {currentCategory.subCategories && currentCategory.subCategories.length > 0 ? (
            <div className={`grid gap-4 ${
              isMobile 
                ? 'grid-cols-1 sm:grid-cols-2' 
                : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
            }`}>
              {[...currentCategory.subCategories]
                .sort((a, b) => a.orderNo - b.orderNo)
                .map((item) => (
                  <div 
                    key={item.id}
                    className={`bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group relative ${
                      isMobile ? 'hover:scale-105 active:scale-95' : 'hover:-translate-y-1'
                    }`}
                  >
                    {/* Product Image */}
                    <div className={`w-full bg-gray-100 overflow-hidden ${isMobile ? 'aspect-[4/3]' : 'aspect-square'}`}>
                      {item.menuImageUrl ? (
                        <img 
                          src={`/api/QR_Panel/user/manual-menu/image/${item.id}`}
                          alt={item.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                          <div className="text-gray-400 text-center">
                            <div className={`mb-2 ${isMobile ? 'text-3xl' : 'text-4xl'}`}>🍽️</div>
                            <div className={`${isMobile ? 'text-xs' : 'text-sm'}`}>No Image</div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Product Info */}
                    <div className={isMobile ? 'p-3' : 'p-4'}>
                      <h3 className={`font-bold text-gray-800 mb-2 line-clamp-2 ${isMobile ? 'text-base' : 'text-lg'}`}>
                        {item.name}
                      </h3>
                      
                      {/* Price and availability */}
                      <div className="flex items-center justify-between mb-3">
                        {item.stock ? (
                          item.price ? (
                            <span className={`font-bold text-green-600 ${isMobile ? 'text-base' : 'text-lg'}`}>
                              ₺{item.price.toFixed(2)}
                            </span>
                          ) : (
                            <span className={`text-gray-500 ${isMobile ? 'text-xs' : 'text-sm'}`}>Price not set</span>
                          )
                        ) : (
                          <span className={`font-medium text-red-500 ${isMobile ? 'text-xs' : 'text-sm'}`}>Out of Stock</span>
                        )}
                       
                        <div
                          className={`rounded-full ${item.stock ? 'bg-green-500' : 'bg-red-500'} ${isMobile ? 'w-2.5 h-2.5' : 'w-3 h-3'}`}
                          title={item.stock ? 'Available' : 'Out of Stock'}
                        />
                      </div>

                      {/* Quantity Controls */}
                      {item.price && item.stock && (
                        <div className="flex items-center justify-center space-x-3 mb-3">
                          <button
                            onClick={() => handleQuantityChange(item.id, -1)}
                            className={`bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300 transition-colors active:scale-95 ${
                              isMobile ? 'w-9 h-9' : 'w-8 h-8'
                            }`}
                          >
                            <span className={isMobile ? 'text-lg' : 'text-base'}>-</span>
                          </button>
                          <span className={`text-center font-bold ${isMobile ? 'w-9 text-lg' : 'w-8'}`}>
                            {selectedItem?.id === item.id ? selectedItem.quantity : 0}
                          </span>
                          <button
                            onClick={() => handleQuantityChange(item.id, 1)}
                            className={`bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300 transition-colors active:scale-95 ${
                              isMobile ? 'w-9 h-9' : 'w-8 h-8'
                            }`}
                          >
                            <span className={isMobile ? 'text-lg' : 'text-base'}>+</span>
                          </button>
                        </div>
                      )}

                      {/* Action Buttons */}
                      {selectedItem?.id === item.id && selectedItem.quantity > 0 && item.price && (
                        <div className={`flex space-x-2 transition-all duration-300 ease-in-out opacity-100 ${isMobile ? 'mt-2' : 'mt-3'}`}>
                          <button
                            onClick={handleCancelSelection}
                            className={`flex-1 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium active:scale-95 ${
                              isMobile ? 'py-2.5 px-3 text-sm' : 'py-2 px-3 text-sm'
                            }`}
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleAddToCart(item)}
                            className={`flex-1 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium active:scale-95 ${
                              isMobile ? 'py-2.5 px-3 text-sm' : 'py-2 px-3 text-sm'
                            }`}
                          >
                            Add to Cart
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              }
            </div>
          ) : (
            <div className={`text-center ${isMobile ? 'py-12' : 'py-16'}`}>
              <div className={`mb-4 ${isMobile ? 'text-5xl' : 'text-6xl'}`}>🍽️</div>
              <h3 className={`font-semibold text-gray-600 mb-2 ${isMobile ? 'text-lg' : 'text-xl'}`}>No Items Yet</h3>
              <p className={`text-gray-500 ${isMobile ? 'text-sm px-4' : ''}`}>Items will appear here once they are added to this category.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// CSS for mobile optimizations (add to your global styles)
const mobileStyles = `
.mobile-layout {
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
}

.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.scrollbar-hide::-webkit-scrollbar {
  display: none;
}

@media (max-width: 768px) {
  .mobile-menu {
    font-size: 16px; /* Prevent zoom on iOS */
  }
  
  input, textarea, select {
    font-size: 16px; /* Prevent zoom on focus */
  }
}

/* Improve touch targets */
@media (pointer: coarse) {
  button, a, [role="button"] {
    min-height: 44px;
    min-width: 44px;
  }
}
`