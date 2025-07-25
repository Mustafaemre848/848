'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { QRCodeSVG } from 'qrcode.react'

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

interface OrderItem {
  id: string
  name: string
  price: number
  quantity: number
  image?: string
}

interface Order {
  id: string
  tableNumber: string
  items: OrderItem[]
  totalPrice: number
  totalItems: number
  specialRequests?: string
  orderTime: string
  status: 'pending' | 'preparing' | 'ready' | 'served'
  customerName?: string
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
             <OrdersSection userData={userData} />
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

// Orders Section Component - Integrated OrdersPage functionality
function OrdersSection({ userData }: { userData: UserData | null }) {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')

  // Mock orders data - In real app, this would come from API
  const mockOrders: Order[] = [
    {
      id: '1',
      tableNumber: '5',
      items: [
        { id: '1', name: 'Margherita Pizza', price: 45.00, quantity: 2 },
        { id: '2', name: 'Caesar Salad', price: 25.00, quantity: 1 },
        { id: '3', name: 'Coca Cola', price: 8.00, quantity: 3 }
      ],
      totalPrice: 139.00,
      totalItems: 6,
      specialRequests: 'No onions on pizza please, extra parmesan on salad',
      orderTime: new Date(Date.now() - 5 * 60000).toISOString(), // 5 minutes ago
      status: 'pending',
      customerName: 'Table 5'
    },
    {
      id: '2',
      tableNumber: '12',
      items: [
        { id: '4', name: 'Grilled Chicken', price: 55.00, quantity: 1 },
        { id: '5', name: 'French Fries', price: 18.00, quantity: 2 }
      ],
      totalPrice: 91.00,
      totalItems: 3,
      specialRequests: 'Medium rare chicken, crispy fries',
      orderTime: new Date(Date.now() - 12 * 60000).toISOString(), // 12 minutes ago
      status: 'preparing'
    },
    {
      id: '3',
      tableNumber: '8',
      items: [
        { id: '6', name: 'Beef Burger', price: 42.00, quantity: 1 },
        { id: '7', name: 'Onion Rings', price: 15.00, quantity: 1 },
        { id: '8', name: 'Lemonade', price: 12.00, quantity: 2 }
      ],
      totalPrice: 81.00,
      totalItems: 4,
      orderTime: new Date(Date.now() - 20 * 60000).toISOString(), // 20 minutes ago
      status: 'ready'
    },
    {
      id: '4',
      tableNumber: '3',
      items: [
        { id: '9', name: 'Pasta Carbonara', price: 38.00, quantity: 1 },
        { id: '10', name: 'Garlic Bread', price: 12.00, quantity: 1 }
      ],
      totalPrice: 50.00,
      totalItems: 2,
      specialRequests: 'Allergic to mushrooms',
      orderTime: new Date(Date.now() - 35 * 60000).toISOString(), // 35 minutes ago
      status: 'served'
    }
  ]

  useEffect(() => {
    // Simulate API call
    const loadOrders = async () => {
      try {
        // In real app, fetch orders from API
        setOrders(mockOrders)
      } catch (err: any) {
        setError(err.message || 'Failed to load orders')
        console.error('Orders fetch error:', err)
      } finally {
        setLoading(false)
      }
    }
    
    loadOrders()
  }, [])

  const updateOrderStatus = (orderId: string, newStatus: Order['status']) => {
    setOrders(prevOrders =>
      prevOrders.map(order =>
        order.id === orderId ? { ...order, status: newStatus } : order
      )
    )
  }

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'preparing': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'ready': return 'bg-green-100 text-green-800 border-green-200'
      case 'served': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusIcon = (status: Order['status']) => {
    switch (status) {
      case 'pending': return '⏳'
      case 'preparing': return '👨‍🍳'
      case 'ready': return '✅'
      case 'served': return '🍽️'
      default: return '📋'
    }
  }

  const formatTime = (isoString: string) => {
    const date = new Date(isoString)
    const now = new Date()
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffMinutes < 1) return 'Just now'
    if (diffMinutes < 60) return `${diffMinutes}m ago`
    const diffHours = Math.floor(diffMinutes / 60)
    return `${diffHours}h ${diffMinutes % 60}m ago`
  }

  const filteredOrders = selectedStatus === 'all' 
    ? orders 
    : orders.filter(order => order.status === selectedStatus)

  // Use same theme logic as UserDashboard
  const userTheme = userData?.company?.Themes?.[0]
  const theme = userTheme ? {
    backgroundColor: userTheme.backgroundColor || '#ffffff',
    textColor: userTheme.textColor || '#000000',
    logoAreaColor: userTheme.logoAreaColor || '#f8f9fa',
    style: userTheme.style || 'modern',
    facebookUrl: userTheme.facebookUrl || '',
    instagramUrl: userTheme.instagramUrl || '',
    xUrl: userTheme.xUrl || ''
  } : {
    backgroundColor: '#ffffff',
    textColor: '#000000',
    logoAreaColor: '#f8f9fa',
    style: 'modern',
    facebookUrl: '',
    instagramUrl: '',
    xUrl: ''
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-4">😞</div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Error Loading Orders</h1>
        <p className="text-gray-600">{error}</p>
      </div>
    )
  }

  const restaurantName = userData?.company?.C_Name || userData?.userName ? `${userData?.userName}'s Restaurant` : 'Restaurant Orders';

  return (
    <div>
      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold mb-4 text-gray-800">
          {restaurantName} - Orders
        </h1>
        
        {/* Order Stats */}
        <div className="flex justify-center space-x-6 text-sm">
          <div className="text-center">
            <span className="font-bold text-yellow-600">{orders.filter(o => o.status === 'pending').length}</span>
            <p className="text-gray-600">Pending</p>
          </div>
          <div className="text-center">
            <span className="font-bold text-blue-600">{orders.filter(o => o.status === 'preparing').length}</span>
            <p className="text-gray-600">Preparing</p>
          </div>
          <div className="text-center">
            <span className="font-bold text-green-600">{orders.filter(o => o.status === 'ready').length}</span>
            <p className="text-gray-600">Ready</p>
          </div>
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div className="mb-6">
        <div className="flex justify-center">
          <div className="flex space-x-2 bg-gray-100 p-1 rounded-lg">
            {[
              { key: 'all', label: 'All Orders', count: orders.length },
              { key: 'pending', label: 'Pending', count: orders.filter(o => o.status === 'pending').length },
              { key: 'preparing', label: 'Preparing', count: orders.filter(o => o.status === 'preparing').length },
              { key: 'ready', label: 'Ready', count: orders.filter(o => o.status === 'ready').length },
              { key: 'served', label: 'Served', count: orders.filter(o => o.status === 'served').length }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setSelectedStatus(tab.key)}
                className={`px-4 py-2 rounded-md font-medium text-sm transition-all ${
                  selectedStatus === tab.key
                    ? 'bg-black text-white shadow-lg'
                    : 'text-gray-700 hover:bg-gray-200'
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Orders Grid */}
      {filteredOrders.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">📋</div>
          <h3 className="text-xl font-semibold text-gray-600 mb-2">No Orders Found</h3>
          <p className="text-gray-500">
            {selectedStatus === 'all' ? 'No orders yet.' : `No ${selectedStatus} orders.`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredOrders
            .sort((a, b) => new Date(b.orderTime).getTime() - new Date(a.orderTime).getTime())
            .map((order) => (
              <div key={order.id} className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-200">
                {/* Order Header */}
                <div className="p-4 border-b bg-gray-50">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-bold text-gray-800">Table {order.tableNumber}</h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(order.status)}`}>
                      {getStatusIcon(order.status)} {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{formatTime(order.orderTime)}</p>
                </div>

                {/* Order Items */}
                <div className="p-4">
                  <div className="space-y-2 mb-4">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex justify-between items-center text-sm">
                        <span className="flex-1">
                          <span className="font-medium">{item.quantity}x</span> {item.name}
                        </span>
                        <span className="font-bold text-green-600">₺{(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>

                  {/* Special Requests */}
                  {order.specialRequests && (
                    <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-xs font-medium text-yellow-800 mb-1">Special Requests:</p>
                      <p className="text-sm text-yellow-700">{order.specialRequests}</p>
                    </div>
                  )}

                  {/* Order Total */}
                  <div className="border-t pt-3 mb-4">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-lg">Total:</span>
                      <span className="font-bold text-lg text-green-600">₺{order.totalPrice.toFixed(2)}</span>
                    </div>
                    <p className="text-xs text-gray-500">{order.totalItems} items</p>
                  </div>

                  {/* Status Actions */}
                  {order.status !== 'served' && (
                    <div className="flex space-x-2">
                      {order.status === 'pending' && (
                        <button
                          onClick={() => updateOrderStatus(order.id, 'preparing')}
                          className="flex-1 bg-blue-500 text-white py-2 px-3 rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
                        >
                          Start Preparing
                        </button>
                      )}
                      {order.status === 'preparing' && (
                        <button
                          onClick={() => updateOrderStatus(order.id, 'ready')}
                          className="flex-1 bg-green-500 text-white py-2 px-3 rounded-lg hover:bg-green-600 transition-colors text-sm font-medium"
                        >
                          Mark Ready
                        </button>
                      )}
                      {order.status === 'ready' && (
                        <button
                          onClick={() => updateOrderStatus(order.id, 'served')}
                          className="flex-1 bg-gray-500 text-white py-2 px-3 rounded-lg hover:bg-gray-600 transition-colors text-sm font-medium"
                        >
                          Mark Served
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))
          }
        </div>
      )}
    </div>
  )
}