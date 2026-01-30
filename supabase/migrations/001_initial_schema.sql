-- 베스트클라이밍 초기 스키마
-- 기획안 docs/기획안.md 기준

-- Enum 타입
CREATE TYPE wall_type AS ENUM ('vertical', 'slight_overhang', 'overhang', 'extreme_overhang');
CREATE TYPE grade_value AS ENUM ('5.9', '10', '11', '12', '13');
CREATE TYPE grade_detail AS ENUM ('a', 'b', 'c', 'd');
CREATE TYPE user_role AS ENUM ('member', 'admin');
CREATE TYPE reservation_status AS ENUM ('pending', 'confirmed');

-- 프로필 (auth.users와 1:1, 트리거로 생성)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT NOT NULL,
  phone_tail4 TEXT NOT NULL CHECK (char_length(phone_tail4) = 4),
  membership_start DATE,
  membership_end DATE,
  role user_role NOT NULL DEFAULT 'member',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 암벽문제(루트)
CREATE TABLE public.routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wall_type wall_type NOT NULL,
  grade_value grade_value NOT NULL,
  grade_detail grade_detail NOT NULL,
  name TEXT NOT NULL,
  hold_count INTEGER NOT NULL CHECK (hold_count > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 운동일지
CREATE TABLE public.exercise_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  route_id UUID NOT NULL REFERENCES public.routes(id) ON DELETE CASCADE,
  progress_hold_count INTEGER NOT NULL DEFAULT 0,
  attempt_count INTEGER NOT NULL DEFAULT 1,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  is_round_trip BOOLEAN NOT NULL DEFAULT false,
  round_trip_count INTEGER NOT NULL DEFAULT 0,
  logged_at DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 출석
CREATE TABLE public.attendances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  attended_at DATE NOT NULL,
  checked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(profile_id, attended_at)
);

-- 일일체험 예약 (비회원)
CREATE TABLE public.daily_reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_name TEXT NOT NULL,
  depositor_name TEXT NOT NULL,
  reserved_at TIMESTAMPTZ NOT NULL,
  guest_count INTEGER NOT NULL CHECK (guest_count > 0),
  status reservation_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 자유게시판
CREATE TABLE public.free_board_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 공지사항
CREATE TABLE public.notices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 사진첩 (이미지는 Storage에 저장 후 URL 배열 저장)
CREATE TABLE public.photo_album_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL DEFAULT '',
  images TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 인덱스
CREATE INDEX idx_exercise_logs_profile_logged ON public.exercise_logs(profile_id, logged_at DESC);
CREATE INDEX idx_exercise_logs_route ON public.exercise_logs(route_id);
CREATE INDEX idx_exercise_logs_completed ON public.exercise_logs(is_completed, logged_at DESC);
CREATE INDEX idx_attendances_profile ON public.attendances(profile_id);
CREATE INDEX idx_attendances_date ON public.attendances(attended_at);
CREATE INDEX idx_daily_reservations_status ON public.daily_reservations(status);
CREATE INDEX idx_profiles_phone_tail4 ON public.profiles(phone_tail4);

-- updated_at 자동 갱신
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();
CREATE TRIGGER routes_updated_at BEFORE UPDATE ON public.routes
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();
CREATE TRIGGER exercise_logs_updated_at BEFORE UPDATE ON public.exercise_logs
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();
CREATE TRIGGER daily_reservations_updated_at BEFORE UPDATE ON public.daily_reservations
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();
CREATE TRIGGER free_board_posts_updated_at BEFORE UPDATE ON public.free_board_posts
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();
CREATE TRIGGER notices_updated_at BEFORE UPDATE ON public.notices
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();
CREATE TRIGGER photo_album_posts_updated_at BEFORE UPDATE ON public.photo_album_posts
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

-- RLS 활성화
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercise_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.free_board_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.photo_album_posts ENABLE ROW LEVEL SECURITY;

-- RLS 정책 (예시: 필요에 따라 조정)
-- 프로필: 본인 읽기/수정/생성, 관리자 전체
CREATE POLICY "본인 프로필 조회" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "본인 프로필 생성" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "본인 프로필 수정" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "관리자 프로필 전체" ON public.profiles FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- 루트: 모두 읽기, 관리자만 쓰기
CREATE POLICY "루트 읽기" ON public.routes FOR SELECT TO authenticated USING (true);
CREATE POLICY "루트 관리자 쓰기" ON public.routes FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- 운동일지: 본인만
CREATE POLICY "운동일지 본인" ON public.exercise_logs FOR ALL USING (auth.uid() = profile_id);

-- 출석: 본인 조회, 관리자 전체
CREATE POLICY "출석 본인 조회" ON public.attendances FOR SELECT USING (auth.uid() = profile_id);
CREATE POLICY "출석 관리자" ON public.attendances FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- 일일예약: 비회원 insert, 관리자 조회/수정
CREATE POLICY "일일예약 생성" ON public.daily_reservations FOR INSERT WITH CHECK (true);
CREATE POLICY "일일예약 관리자" ON public.daily_reservations FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- 자유게시판/공지/사진첩: 읽기 모두, 쓰기 인증된 사용자
CREATE POLICY "자유게시판 읽기" ON public.free_board_posts FOR SELECT USING (true);
CREATE POLICY "자유게시판 쓰기" ON public.free_board_posts FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "자유게시판 수정삭제" ON public.free_board_posts FOR ALL USING (auth.uid() = author_id);

CREATE POLICY "공지 읽기" ON public.notices FOR SELECT USING (true);
CREATE POLICY "공지 관리자" ON public.notices FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "사진첩 읽기" ON public.photo_album_posts FOR SELECT USING (true);
CREATE POLICY "사진첩 쓰기" ON public.photo_album_posts FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "사진첩 수정삭제" ON public.photo_album_posts FOR ALL USING (auth.uid() = author_id);

-- auth.users 생성 시 프로필 자동 생성 (선택: Supabase Dashboard에서 가입 시 추가 정보 수집 시 사용)
-- CREATE OR REPLACE FUNCTION public.handle_new_user()
-- RETURNS TRIGGER AS $$
-- BEGIN
--   INSERT INTO public.profiles (id, name, phone, phone_tail4)
--   VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', ''), COALESCE(NEW.raw_user_meta_data->>'phone', ''), COALESCE(NEW.raw_user_meta_data->>'phone_tail4', ''));
--   RETURN NEW;
-- END;
-- $$ LANGUAGE plpgsql SECURITY DEFINER;
-- CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
