'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { QRCodeSVG } from 'qrcode.react'
import OrdersPage from './OrdersPage'

interface UserData {
  id: string
  cId: number
  userName: string
  CreatedAt: string
  UpdatedAt: string
  role?: {
    roleName: string
  }
  company?: {
    id: string
    C_Name?: string
    C_Logo_Image?: any
    C_QR_URL?: string
    pdfMenuUrl?: string
    menuType?: string

    Welcoming_Page?: any
    Main_Categories?: Array<{
      id: string
      name: string
      categoryNo: number
      subCategories: Array<{
        id: string
        name: string
        orderNo: number
      }>
    }>
    Themes?: Array<{
      style?: string
      backgroundColor?: string
      textColor?: string
      logoAreaColor?: string
      facebookUrl?: string
      instagramUrl?: string
      xUrl?: string
    }>
  }
}

interface Theme {
  backgroundColor?: string
  textColor?: string
  style?: string
}

export default function UserDashboard() {
  const router = useRouter()
  const [userData, setUserData] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'pdf' | 'manual' | 'theme' | 'preview' | 'profile'| 'contactUs' | 'orders' | ''>('')
  const [menuType, setMenuType] = useState<'pdf' | 'manual' | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [orderSystemSearch, setOrderSystemSearch] = useState('');
  const [theme, setTheme] = useState<Theme>({
    backgroundColor: '#ffffff',
    textColor: '#000000',
    style: 'modern'
  })

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    const userId = localStorage.getItem('userId')
    if (!userId) {
      router.push('/QR_Portal/user_login')
      return
    }

    try {
      const res = await fetch('/api/QR_Panel/user/profile', {
        credentials: 'include'
      })
      
      if (!res.ok) {
        throw new Error('Failed to fetch user data')
      }
      
      const data = await res.json()
      setUserData(data.user)
      
      // Determine menu type based on existing data
      // Prefer explicit menuType if available, otherwise infer from data
      if (data.user.company?.menuType === 'pdf') {
        setMenuType('pdf')
      } else if (data.user.company?.menuType === 'manual') {
        setMenuType('manual')
            } else if (data.user.company?.pdfMenuUrl) {
        setMenuType('pdf')
      } else if (data.user.company?.Main_Categories?.length > 0) {
        setMenuType('manual')
      }
      
    } catch (error) {
      console.error('Auth check failed:', error)
      router.push('/QR_Portal/user_login')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/QR_Panel/user/logout', { method: 'POST', credentials: 'include' })
      localStorage.removeItem('userId')
      localStorage.removeItem('userName')
      router.push('/QR_Portal/user_login')
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  const handleMenuTypeSelect = (type: 'pdf' | 'manual') => {
    setMenuType(type)
    setActiveTab(type)
  }

  const generateQRUrl = () => {
    if (!userData?.company?.id) return '';
    
    let baseUrl = userData.company.C_QR_URL || `${window.location.origin}/QR_Portal/menu/${userData.company.id}`;
    
    // Add the display mode parameter for PDF menus
    if (menuType === 'pdf') {
      try {
        const url = new URL(baseUrl);
        if (userData?.company?.menuType === 'pdf') {
          const displayMode = localStorage.getItem('pdfDisplayMode') || 'flipbook';
          url.searchParams.set('mode', displayMode);
        }
        return url.toString();
      } catch {
        // Fallback for invalid URL
        const separator = baseUrl.includes('?') ? '&' : '?';
        if (userData?.company?.menuType === 'pdf') {
          const displayMode = localStorage.getItem('pdfDisplayMode') || 'flipbook';
          return `${baseUrl}${separator}mode=${displayMode}`;
        }
        return baseUrl;
      }
    }
    
    return baseUrl;
  }

  const downloadQR = () => {
    try {
      // QR SVG elementini bul
      const qrContainer = document.getElementById('qr-container')
      const svgElement = qrContainer?.querySelector('svg')
      
      if (svgElement) {
        // SVG'yi canvas'a çevir
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        const svgData = new XMLSerializer().serializeToString(svgElement)
        const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
        const url = URL.createObjectURL(svgBlob)
        
        const img = new Image()
        img.onload = () => {
          canvas.width = 400
          canvas.height = 400
          
          // Beyaz arka plan ekle
          ctx!.fillStyle = 'white'
          ctx!.fillRect(0, 0, canvas.width, canvas.height)
          
          // QR kodu çiz
          ctx!.drawImage(img, 0, 0, 400, 400)
          
          // Download link oluştur
          const downloadUrl = canvas.toDataURL('image/png')
          const link = document.createElement('a')
          link.href = downloadUrl
          link.download = `${userData?.company?.C_Name || 'menu'}-qr-code.png`
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          
          URL.revokeObjectURL(url)
        }
        img.src = url
      } else {
        alert('QR code not found. Please try again.')
      }
    } catch (error) {
      console.error('QR download error:', error)
      alert('Failed to download QR code. Please try again.')
    }
  }

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery.trim() && userData?.company?.Main_Categories) {
      setActiveTab('manual');
      setMenuType('manual');
      setOrderSystemSearch(searchQuery.trim());
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Modern Header */}
     <header className="bg-gradient-to-r from-purple-500 to-purple-600 shadow-md py-3">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

      {/* Left: Logo & Company Name */}
      <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto">

        <div className="h-12 w-12 sm:h-16 sm:w-16 rounded bg-white p-1">
          <img
            src={
              userData?.company?.C_Logo_Image
                ? `/api/AdminPanel/company/image/${userData.company.id}/logo?${Date.now()}`
                : '/user-icon-on-transparent-background-free-png.webp'
            }
            alt="Company Logo"
            className="h-full w-full object-contain rounded"
          />
        </div>
        <div className="text-white font-bold text-xl sm:text-2xl whitespace-nowrap">
          {userData?.company?.C_Name || ''}
        </div>
      </div>

      {/* Center: Search Bar */}
      <div className="flex-1 min-w-[240px] max-w-xl w-full">
        <div className="relative">
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearch}
            className="w-full py-2 pl-10 pr-10 rounded-lg bg-white bg-opacity-90 text-gray-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-300 transition-all"
          />
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Right: Icons */}
      <div className="flex items-center space-x-4">
        {/* Contact Button */}
        <button
          onClick={() => setActiveTab('contactUs')}
          aria-label="Contact Us"
          className="p-2 bg-white bg-opacity-10 hover:bg-opacity-20 rounded-full transition"
        >
          <img
            src="/6ed29fc85c4dad83456b89637af7df.webp"
            alt="Contact"
            className="w-8 h-8 rounded-full object-cover ring-1 ring-white"
          />
        </button>

        {/* Profile Button */}
        <button
          onClick={() => setActiveTab('profile')}
          aria-label="Profile"
          className="bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full p-1.5 transition-all"
        >
          <img
            src={
              userData?.company?.C_Logo_Image
                ? `/api/AdminPanel/company/image/${userData.company.id}/logo?${Date.now()}`
                : '/user-icon-on-transparent-background-free-png.webp'
            }
            alt="Company Logo"
            className="w-8 h-8 object-cover rounded-full ring-1 ring-white hover:ring-2 transition duration-200"
            loading="lazy"
          />
        </button>

        {/* Logout */}
        <button
          onClick={handleLogout}
          aria-label="Logout"
          title="Logout"
          className="p-2 bg-red-500 hover:bg-red-600 rounded-full transition"
        >
          <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </button>
      </div>
    </div>
  </div>
</header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Menu Section */}
        <div className="mb-8">
          <div className="flex justify-center">
            <button 
              onClick={() => setActiveTab('preview')}
              className="bg-gradient-to-r from-purple-400 to-purple-400 hover:from-purple-400 hover:to-purple-500 text-gray-800 font-semibold py-4 px-12 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 text-xl"
            >
              Menu
            </button>
          </div>
        </div>

       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8 justify-center max-w-4xl mx-auto">
  {/* PDF Upload Card */}
  <div
    onClick={() => {
      setMenuType('pdf');
      setActiveTab('pdf');
    }}
    className="bg-gradient-to-br from-pink-400 to-pink-300 hover:from-pink-300 hover:to-pink-400 rounded-xl p-8 cursor-pointer transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
  >
    <div className="text-center">
      <div className="text-3xl mb-4">📄</div>
      <h3 className="text-xl font-semibold text-gray-800">PDF Upload</h3>
    </div>
  </div>

  {/* Manual Upload Card (first one) */}
  <div
    onClick={() => {
      setMenuType('manual');
      setActiveTab('manual');
    }}
    className="bg-gradient-to-br from-pink-400 to-pink-300 hover:from-pink-300 hover:to-pink-400 rounded-xl p-8 cursor-pointer transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
  >
    <div className="text-center">
      <div className="text-3xl mb-4">📝</div>
      <h3 className="text-xl font-semibold text-gray-800">Manual Menu</h3>
    </div>
  </div>

  {/* Theme Settings Card */}
  <div
    onClick={() => setActiveTab('theme')}
    className="bg-gradient-to-br from-pink-400 to-pink-300 hover:from-pink-300 hover:to-pink-400 rounded-xl p-8 cursor-pointer transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
  >
    <div className="text-center">
      <div className="text-3xl mb-4">🎨</div>
      <h3 className="text-xl font-semibold text-gray-800">Theme Settings</h3>
    </div>
  </div>

  {/* Centered Second "Order System" Card - MODIFIED */}
  <div className="col-span-1 md:col-span-1 lg:col-start-2">
    <div
      onClick={() => {
        setActiveTab('orders');
      }}
      className="bg-gradient-to-br from-pink-400 to-pink-300 hover:from-pink-300 hover:to-pink-400 rounded-xl p-8 cursor-pointer transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
    >
      <div className="text-center">
        <div className="text-3xl mb-4">📝</div>
        <h3 className="text-xl font-semibold text-gray-800">Order System</h3>
        <p className="text-sm text-gray-600 mt-2">View and manage orders</p>
      </div>
    </div>
  </div>
</div>

        {/* Content Area */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          {activeTab === 'pdf' && (
            <div>
              {!menuType ? (
                <div className="text-center py-12">
                  <h2 className="text-2xl font-semibold text-gray-800 mb-6">PDF Menu Upload</h2>
                  <p className="text-gray-600 mb-8">Follow the steps below to upload your PDF menu</p>
                  <button
                    onClick={() => setMenuType('pdf')}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-lg font-medium text-lg transition-colors shadow-lg"
                  >
                    Start PDF Upload
                  </button>
                </div>
              ) : (
                <PDFUploadSection userData={userData} />
              )}
            </div>
          )}

          {activeTab === 'manual' && <ManualMenuSection searchQuery={orderSystemSearch} onSearchHandled={() => setOrderSystemSearch('')} />}
          {activeTab === 'theme' && <ThemeSettingsSection userData={userData} />}
          {activeTab === 'preview' && (
            <PreviewSection 
              userData={userData} 
              theme={theme}
              qrUrl={generateQRUrl()}
              onDownloadQR={downloadQR}
            />
          )}
          {activeTab === 'profile' && <ProfileSection userData={userData} />}
          {activeTab === 'contactUs' && <GetStartedPage userData={userData} />}
          
          {/* NEW: Orders Page Integration */}
          {activeTab === 'orders' && userData?.company?.id && (
            <OrdersPage />
          )}
          
          {/* Default Welcome Screen */}
          {!activeTab && (
            <div className="text-center py-12">
              <h2 className="text-2xl font-semibold text-gray-800 mb-6">Welcome!</h2>
              <p className="text-gray-600 mb-8">Select one of the cards above to get started</p>
              <div className="text-6xl mb-4">🍽️</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Note: You'll need to add the following component functions from your original file:
// - PDFUploadSection
// - ManualMenuSection  
// - ThemeSettingsSection
// - PreviewSection
// - ProfileSection
// - GetStartedPage

// For now, here are placeholder components:
function PDFUploadSection({ userData }: { userData: UserData | null }) {
  return (
    <div className="text-center py-12">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">PDF Upload Section</h2>
      <p className="text-gray-600">PDF upload functionality will be implemented here.</p>
    </div>
  )
}

function ManualMenuSection({ searchQuery, onSearchHandled }: { searchQuery?: string, onSearchHandled?: () => void }) {
  return (
    <div className="text-center py-12">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">Manual Menu Section</h2>
      <p className="text-gray-600">Manual menu functionality will be implemented here.</p>
    </div>
  )
}

function ThemeSettingsSection({ userData }: { userData: UserData | null }) {
  return (
    <div className="text-center py-12">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">Theme Settings</h2>
      <p className="text-gray-600">Theme settings functionality will be implemented here.</p>
    </div>
  )
}

function PreviewSection({ userData, theme, qrUrl, onDownloadQR }: { 
  userData: UserData | null
  theme: Theme
  qrUrl: string
  onDownloadQR: () => void
}) {
  return (
    <div className="text-center py-12">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">Preview Section</h2>
      <p className="text-gray-600">Preview functionality will be implemented here.</p>
    </div>
  )
}

function ProfileSection({ userData }: { userData: UserData | null }) {
  return (
    <div className="text-center py-12">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">Profile Section</h2>
      <p className="text-gray-600">Profile functionality will be implemented here.</p>
    </div>
  )
}

function GetStartedPage({ userData }: { userData: UserData | null }) {
  return (
    <div className="text-center py-12">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">Contact Us</h2>
      <p className="text-gray-600">Contact functionality will be implemented here.</p>
    </div>
  )
}