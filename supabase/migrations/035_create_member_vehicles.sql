-- 회원 차량 정보 (1인당 1대)
CREATE TABLE public.member_vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  model TEXT NOT NULL,
  seat_count INT NOT NULL,
  memo TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER member_vehicles_updated_at BEFORE UPDATE ON public.member_vehicles
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

ALTER TABLE public.member_vehicles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "차량 정보 공개 조회" ON public.member_vehicles
  FOR SELECT USING (true);

CREATE POLICY "차량 정보 본인 관리" ON public.member_vehicles
  FOR ALL USING (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());
