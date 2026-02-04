-- 관리자가 완등요청된 기록을 완등완료 처리할 수 있도록 UPDATE 정책 추가
CREATE POLICY "관리자 운동일지 완등처리" ON public.exercise_logs
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );
