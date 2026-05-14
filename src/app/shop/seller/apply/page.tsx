import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

async function applyForSeller() {
  'use server'
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  await supabase
    .from('profiles')
    .update({ seller_status: 'pending' })
    .eq('id', user.id)

  redirect('/shop/seller/apply?status=applied')
}

export default async function SellerApplyPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const { status: queryStatus } = await searchParams
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('seller_status')
    .eq('id', user.id)
    .single()

  const sellerStatus = profile?.seller_status ?? 'none'
  const justApplied = queryStatus === 'applied'

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-white">판매자 신청</CardTitle>
        </CardHeader>
        <CardContent>
          {sellerStatus === 'approved' ? (
            <div className="text-center">
              <p className="mb-2 text-lg font-semibold text-emerald-400">
                ✓ 판매자로 승인됨
              </p>
              <p className="mb-4 text-sm text-slate-400">
                상품을 등록하고 판매를 시작할 수 있습니다.
              </p>
              <Link href="/shop/seller">
                <Button className="w-full">판매자 대시보드로 이동</Button>
              </Link>
            </div>
          ) : sellerStatus === 'pending' || justApplied ? (
            <div className="text-center">
              <p className="mb-2 text-lg font-semibold text-yellow-400">
                ⏳ 승인 대기 중
              </p>
              <p className="text-sm text-slate-400">
                관리자 승인 후 상품 등록이 가능합니다.
              </p>
            </div>
          ) : sellerStatus === 'rejected' ? (
            <div className="text-center">
              <p className="mb-2 font-semibold text-red-400">✕ 신청 거절됨</p>
              <p className="text-sm text-slate-400">관리자에게 문의해주세요.</p>
            </div>
          ) : (
            <div>
              <p className="mb-6 text-slate-300">
                판매자로 신청하면 관리자 승인 후 상품을 등록할 수 있습니다.
              </p>
              <form action={applyForSeller}>
                <Button type="submit" className="w-full">
                  판매자 신청하기
                </Button>
              </form>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
