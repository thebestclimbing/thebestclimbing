-- 공지에 배정된 차량
CREATE TABLE public.notice_dispatches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notice_id UUID NOT NULL REFERENCES public.notices(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES public.member_vehicles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (notice_id, vehicle_id)
);

-- 차량별 탑승자
CREATE TABLE public.dispatch_passengers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dispatch_id UUID NOT NULL REFERENCES public.notice_dispatches(id) ON DELETE CASCADE,
  notice_id UUID NOT NULL REFERENCES public.notices(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (notice_id, profile_id)
);

ALTER TABLE public.notice_dispatches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dispatch_passengers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "배차 공개 조회" ON public.notice_dispatches
  FOR SELECT USING (true);

CREATE POLICY "배차 관리자" ON public.notice_dispatches
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "탑승자 공개 조회" ON public.dispatch_passengers
  FOR SELECT USING (true);

CREATE POLICY "탑승자 관리자" ON public.dispatch_passengers
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );
