import Link from "next/link";

export default function AdminPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">관리자</h1>
      <ul className="flex flex-col gap-2">
        <li>
          <Link href="/admin/members" className="text-blue-600 hover:underline">
            회원관리
          </Link>
        </li>
        <li>
          <Link href="/admin/routes" className="text-blue-600 hover:underline">
            암벽문제관리
          </Link>
        </li>
        <li>
          <Link href="/admin/attendance" className="text-blue-600 hover:underline">
            출석관리
          </Link>
        </li>
        <li>
          <Link href="/admin/reservations" className="text-blue-600 hover:underline">
            일일체험예약자관리
          </Link>
        </li>
      </ul>
    </div>
  );
}
