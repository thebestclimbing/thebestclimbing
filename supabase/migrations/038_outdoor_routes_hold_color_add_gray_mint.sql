-- 외벽문제 홀드색상에 회색/민트 추가
ALTER TABLE outdoor_routes DROP CONSTRAINT outdoor_routes_hold_color_check;
ALTER TABLE outdoor_routes
  ADD CONSTRAINT outdoor_routes_hold_color_check
  CHECK (hold_color IN ('red', 'orange', 'yellow', 'green', 'blue', 'indigo', 'violet', 'white', 'black', 'pink', 'gray', 'mint'));
