import ShopNavbar from '@/components/shop/shop-navbar'

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-950">
      <ShopNavbar />
      <main>{children}</main>
    </div>
  )
}
