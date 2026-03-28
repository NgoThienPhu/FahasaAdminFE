export interface UserAddress {
  id: string
  recipientName?: string
  phoneNumber?: string
  detailAddress?: string
  wardName?: string
  districtName?: string
  provinceName?: string
  fullAddress?: string
  isDefault?: boolean
}

export function formatUserAddressLine(addr: UserAddress): string {
  if (addr.fullAddress?.trim()) return addr.fullAddress.trim()
  const parts = [
    addr.detailAddress,
    addr.wardName,
    addr.districtName,
    addr.provinceName,
  ]
    .map((p) => (typeof p === 'string' ? p.trim() : ''))
    .filter(Boolean)
  return parts.join(', ')
}
