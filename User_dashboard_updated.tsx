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

// NEW: Order interface for the order management system
interface OrderItem {
  id: string
  foodName: string
  quantity: number
  price: number
  tableNumber: string
  orderTime: string
  status: 'pending' | 'preparing' | 'ready' | 'delivered'
  customerName?: string
  specialNotes?: string
}

export default function UserDashboard() {
  const router = useRouter()
  const [userData, setUserData] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)
  // UPDATED: Added 'orders' to the activeTab type
  const [activeTab, setActiveTab] = useState<'pdf' | 'manual' | 'theme' | 'preview' | 'profile'| 'contactUs' | 'orders' | ''>('')
  const [menuType, setMenuType] = useState<'pdf' | 'manual' | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [orderSystemSearch, setOrderSystemSearch] = useState('');
  // NEW: Order system state
  const [orders, setOrders] = useState<OrderItem[]>([])
  const [loadingOrders, setLoadingOrders] = useState(false)
  const [theme, setTheme] = useState<Theme>({
    backgroundColor: '#ffffff',
    textColor: '#000000',
    style: 'modern'
  })

  useEffect(() => {
    checkAuth()
  }, [])

  // NEW: Fetch orders when orders tab is active
  useEffect(() => {
    if (activeTab === 'orders') {
      fetchOrders()
    }
  }, [activeTab])

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

  // NEW: Function to fetch orders
  const fetchOrders = async () => {
    setLoadingOrders(true)
    try {
      const res = await fetch('/api/QR_Panel/user/orders', {
        credentials: 'include'
      })
      
      if (res.ok) {
        const data = await res.json()
        setOrders(data.orders || [])
      } else {
        console.error('Failed to fetch orders')
        // Mock data for demonstration
        setOrders([
          {
            id: '1',
            foodName: 'Grilled Chicken',
            quantity: 2,
            price: 25.99,
            tableNumber: 'Table 5',
            orderTime: '2024-01-15T14:30:00Z',
            status: 'preparing',
            customerName: 'John Doe',
            specialNotes: 'No onions please'
          },
          {
            id: '2',
            foodName: 'Caesar Salad',
            quantity: 1,
            price: 12.50,
            tableNumber: 'Table 3',
            orderTime: '2024-01-15T14:15:00Z',
            status: 'ready',
            customerName: 'Jane Smith'
          },
          {
            id: '3',
            foodName: 'Margherita Pizza',
            quantity: 1,
            price: 18.75,
            tableNumber: 'Table 7',
            orderTime: '2024-01-15T14:45:00Z',
            status: 'pending',
            customerName: 'Mike Johnson',
            specialNotes: 'Extra cheese'
          },
          {
            id: '4',
            foodName: 'Fish and Chips',
            quantity: 1,
            price: 22.00,
            tableNumber: 'Table 3',
            orderTime: '2024-01-15T14:20:00Z',
            status: 'delivered',
            customerName: 'Jane Smith'
          }
        ])
      }
    } catch (error) {
      console.error('Error fetching orders:', error)
    } finally {
      setLoadingOrders(false)
    }
  }

  // NEW: Function to update order status
  const updateOrderStatus = async (orderId: string, newStatus: OrderItem['status']) => {
    try {
      const res = await fetch('/api/QR_Panel/user/orders/update-status', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, status: newStatus }),
        credentials: 'include'
      })

      if (res.ok) {
        setOrders(orders.map(order => 
          order.id === orderId ? { ...order, status: newStatus } : order
        ))
      } else {
        alert('Failed to update order status')
      }
    } catch (error) {
      console.error('Error updating order status:', error)
      // For demo purposes, update locally
      setOrders(orders.map(order => 
        order.id === orderId ? { ...order, status: newStatus } : order
      ))
    }
  }