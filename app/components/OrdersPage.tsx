'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'

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

interface Company {
  id: string
  C_Name: string
  C_Logo_Image?: any
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

export default function OrdersPage() {
  const params = useParams()
  const companyId = params.companyId as string
  const [company, setCompany] = useState<Company | null>(null)
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
    if (companyId) {
      fetchCompanyData()
      // In real app, also fetch orders from API
      setOrders(mockOrders)
      setLoading(false)
    }
  }, [companyId])

  const fetchCompanyData = async () => {
    try {
      const res = await fetch(`/api/QR_Panel/menu/${companyId}`)
      
      if (!res.ok) {
        throw new Error('Company not found')
      }
      
      const data = await res.json()
      setCompany(data.company)
    } catch (err: any) {
      setError(err.message || 'Failed to load company data')
      console.error('Company fetch error:', err)
    }
  }

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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="text-4xl mb-4">😞</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Error Loading Orders</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    )
  }

  // Use same theme logic as MenuPage
  const userTheme = company?.Themes?.[0]
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

  const restaurantName = company?.C_Name || company?.user?.userName ? `${company?.user?.userName}'s Restaurant` : 'Restaurant Orders';

  return (
    <div 
      className="min-h-screen"
      style={{ 
        backgroundColor: theme.backgroundColor,
        color: theme.textColor 
      }}
    >
      {/* Header */}
      <header className="py-4 px-4 text-center bg-opacity-90 backdrop-blur-sm border-b">
        <div className="max-w-6xl mx-auto">
          {/* Company Logo */}
          {company?.C_Logo_Image && (
            <div className="mb-2">
              <img 
                src={`/api/AdminPanel/company/image/${company.id}/logo`}
                alt="Company Logo"
                className="max-w-16 max-h-16 mx-auto rounded-lg shadow-lg"
              />
            </div>
          )}
          
          <h1 className="text-3xl font-bold mb-2">
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
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6">
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
                <div key={order.id} className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
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

      {/* Footer */}
      <footer className="text-center py-4 px-4 border-t mt-8">
        {/* Social Media Links */}
        {(theme.facebookUrl || theme.instagramUrl || theme.xUrl) && (
          <div className="mb-2">
            <h3 className="text-xs font-medium mb-2 opacity-80">Follow Us</h3>
            <div className="flex justify-center space-x-2">
              {theme.facebookUrl && (
                <a
                  href={theme.facebookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center w-8 h-8 bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-all duration-300 hover:scale-110 shadow-sm"
                  title="Facebook"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </a>
              )}
              
              {theme.instagramUrl && (
                <a
                  href={theme.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-full transition-all duration-300 hover:scale-110 shadow-sm"
                  title="Instagram"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </a>
              )}
              
              {theme.xUrl && (
                <a
                  href={theme.xUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center w-8 h-8 bg-black hover:bg-gray-800 text-white rounded-full transition-all duration-300 hover:scale-110 shadow-sm"
                  title="X (Twitter)"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </a>
              )}
            </div>
          </div>
        )}
        
        <p className="text-xs opacity-60 leading-tight">
          Powered by QR Menu System - Restaurant Orders
        </p>
      </footer>
    </div>
  )
}