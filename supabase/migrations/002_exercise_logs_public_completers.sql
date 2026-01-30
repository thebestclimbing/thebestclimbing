-- 완등자 메인 화면: 비로그인 사용자도 완등 기록 조회 가능
CREATE POLICY "완등 공개 조회" ON public.exercise_logs
  FOR SELECT USING (is_completed = true);

-- 출석체크: 로그인한 사용자(스태프)가 출석 등록 가능
CREATE POLICY "출석 등록 인증" ON public.attendances
  FOR INSERT TO authenticated WITH CHECK (true);

-- 통계: 관리자는 운동일지 전체 조회 가능
CREATE POLICY "관리자 운동일지 전체 조회" ON public.exercise_logs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );
