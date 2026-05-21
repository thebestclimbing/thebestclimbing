CREATE OR REPLACE FUNCTION check_hold_achievement_on_join()
RETURNS TRIGGER AS $$
DECLARE
  ev RECORD;
  achieved INTEGER;
BEGIN
  -- 홀드 수 이벤트 참여 시 기존 운동 기록 소급 체크
  IF NEW.route_id IS NULL THEN
    FOR ev IN
      SELECT e.id, e.required_count, e.start_date, e.end_date
      FROM events e
      WHERE e.id = NEW.event_id
        AND e.status = 'active'
        AND e.mission_type = 'hold_count'
    LOOP
      SELECT COALESCE(SUM(progress_hold_count), 0)
      INTO achieved
      FROM exercise_logs
      WHERE profile_id = NEW.user_id
        AND logged_at::date >= ev.start_date::date
        AND logged_at::date <= ev.end_date::date;

      IF achieved >= ev.required_count THEN
        UPDATE events SET status = 'ended' WHERE id = ev.id;
      END IF;
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER check_hold_achievement_on_join_trigger
AFTER INSERT ON event_participants
FOR EACH ROW
EXECUTE FUNCTION check_hold_achievement_on_join();
