CREATE OR REPLACE FUNCTION auto_end_completed_events()
RETURNS TRIGGER AS $$
DECLARE
  ev RECORD;
  achieved INTEGER;
  target INTEGER;
BEGIN
  -- 루트 완등 이벤트 체크: is_completed=true인 새 로그가 들어올 때
  IF NEW.is_completed = true THEN
    FOR ev IN
      SELECT e.id, e.start_date, e.end_date
      FROM events e
      JOIN event_routes er ON er.event_id = e.id AND er.route_id = NEW.route_id
      WHERE e.status = 'active'
        AND e.mission_type = 'route_completion'
        AND NEW.logged_at::date >= e.start_date::date
        AND NEW.logged_at::date <= e.end_date::date
    LOOP
      SELECT
        COALESCE(SUM(sub.completers), 0),
        COALESCE(SUM(sub.target_count), 0)
      INTO achieved, target
      FROM (
        SELECT er2.target_count, COUNT(DISTINCT el.profile_id) AS completers
        FROM event_routes er2
        LEFT JOIN exercise_logs el ON el.route_id = er2.route_id
          AND el.is_completed = true
          AND el.logged_at::date >= ev.start_date::date
          AND el.logged_at::date <= ev.end_date::date
        WHERE er2.event_id = ev.id
        GROUP BY er2.route_id, er2.target_count
      ) sub;

      IF target > 0 AND achieved >= target THEN
        UPDATE events SET status = 'ended' WHERE id = ev.id;
      END IF;
    END LOOP;
  END IF;

  -- 홀드 수 이벤트 체크: 참여자의 누적 홀드 수가 목표에 달성하면 종료
  FOR ev IN
    SELECT e.id, e.required_count, e.start_date, e.end_date
    FROM events e
    JOIN event_participants ep ON ep.event_id = e.id
      AND ep.user_id = NEW.profile_id
      AND ep.route_id IS NULL
    WHERE e.status = 'active'
      AND e.mission_type = 'hold_count'
      AND NEW.logged_at::date >= e.start_date::date
      AND NEW.logged_at::date <= e.end_date::date
  LOOP
    SELECT COALESCE(SUM(progress_hold_count), 0)
    INTO achieved
    FROM exercise_logs
    WHERE profile_id = NEW.profile_id
      AND logged_at::date >= ev.start_date::date
      AND logged_at::date <= ev.end_date::date;

    IF achieved >= ev.required_count THEN
      UPDATE events SET status = 'ended' WHERE id = ev.id;
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER auto_end_completed_events_trigger
AFTER INSERT OR UPDATE ON exercise_logs
FOR EACH ROW
EXECUTE FUNCTION auto_end_completed_events();
