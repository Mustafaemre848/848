'use client'

import { useRouter } from 'next/navigation'

interface DashboardCardProps {
  title: string
  icon: string
  gradientFrom: string
  gradientTo: string
  hoverFrom: string
  hoverTo: string
  onClick?: () => void
  navigateTo?: string
  companyId?: string
  description?: string
}

export default function DashboardCard({
  title,
  icon,
  gradientFrom,
  gradientTo,
  hoverFrom,
  hoverTo,
  onClick,
  navigateTo,
  companyId,
  description
}: DashboardCardProps) {
  const router = useRouter()

  const handleClick = () => {
    if (onClick) {
      onClick()
    } else if (navigateTo && companyId) {
      router.push(`/${navigateTo}/${companyId}`)
    }
  }

  return (
    <div className="col-span-1 md:col-span-1 lg:col-start-2">
      <div
        onClick={handleClick}
        className={`bg-gradient-to-br ${gradientFrom} ${gradientTo} hover:${hoverFrom} hover:${hoverTo} rounded-xl p-8 cursor-pointer transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1`}
      >
        <div className="text-center">
          <div className="text-3xl mb-4">{icon}</div>
          <h3 className="text-xl font-semibold text-gray-800">{title}</h3>
          {description && (
            <p className="text-sm text-gray-600 mt-2">{description}</p>
          )}
        </div>
      </div>
    </div>
  )
}