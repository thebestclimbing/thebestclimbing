-- 이벤트 테이블
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  prize_description TEXT NOT NULL,
  mission_type TEXT NOT NULL CHECK (mission_type IN ('route_completion', 'hold_count')),
  required_count INTEGER NOT NULL CHECK (required_count > 0),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'ended')),
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT events_end_after_start CHECK (end_date >= start_date)
);

-- 이벤트 루트 (route_completion 타입 전용)
CREATE TABLE public.event_routes (
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  route_id UUID NOT NULL REFERENCES public.routes(id) ON DELETE CASCADE,
  PRIMARY KEY (event_id, route_id)
);

-- 상품 지급 기록
CREATE TABLE public.event_reward_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rewarded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  note TEXT,
  UNIQUE (event_id, user_id)
);

-- RLS 활성화
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_reward_logs ENABLE ROW LEVEL SECURITY;

-- events: 인증 유저 읽기 / 관리자 전체 쓰기
CREATE POLICY "events_select" ON public.events
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "events_admin_write" ON public.events
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- event_routes: 인증 유저 읽기 / 관리자 전체 쓰기
CREATE POLICY "event_routes_select" ON public.event_routes
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "event_routes_admin_write" ON public.event_routes
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- event_reward_logs: 인증 유저 읽기 / 서비스롤(admin client)로만 쓰기
CREATE POLICY "event_reward_logs_select" ON public.event_reward_logs
  FOR SELECT TO authenticated USING (true);
