/**
 * 베스트클라이밍 Supabase DB 타입 정의
 * 기획안 docs/기획안.md 기준
 */

export type WallType =
  | "vertical"           // 직벽
  | "slight_overhang"    // 약오버벽
  | "overhang"           // 오버벽
  | "extreme_overhang";  // 극오버

export type OutdoorWallType =
  | "vertical"          // 직벽
  | "left_overhang"     // 좌측오버행
  | "right_overhang"    // 우측오버행
  | "center_overhang";  // 중앙오버행

export type OutdoorLocation = "ilsan" | "munhak";

export type HoldColor =
  | "red" | "orange" | "yellow" | "green" | "blue"
  | "indigo" | "violet" | "white" | "black" | "pink";

export type GradeValue = "5.9" | "10" | "11" | "12" | "13";
export type GradeDetail = "a" | "b" | "c" | "d";

export type UserRole = "member" | "admin";

export type ReservationStatus = "pending" | "confirmed";

export interface Profile {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  phone_tail4: string; // 출석체크용 뒷 4자리
  membership_start: string | null; // ISO date
  membership_end: string | null;
  membership_paused?: boolean; // 회원권 정지 여부
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface OutdoorRoute {
  id: string;
  outdoor_location: OutdoorLocation;
  wall_type: OutdoorWallType;
  grade_value: GradeValue;
  grade_detail: GradeDetail;
  hold_color: HoldColor;
  rank_point: number;
  clip_count: number;
  created_at: string;
  updated_at: string;
}

export interface OutdoorExerciseLog {
  id: string;
  profile_id: string;
  outdoor_route_id: string;
  progress_clip_count: number;
  attempt_count: number;
  is_completed: boolean;
  completion_requested: boolean;
  is_round_trip: boolean;
  round_trip_count: number;
  logged_at: string;
  memo: string | null;
  created_at: string;
  updated_at: string;
}

export interface Route {
  id: string;
  wall_type: WallType;
  grade_value: GradeValue;
  grade_detail: GradeDetail;
  name: string;
  hold_count: number;
  rank_point: number | null;
  created_at: string;
  updated_at: string;
}

export interface ExerciseLog {
  id: string;
  profile_id: string;
  route_id: string;
  progress_hold_count: number;
  attempt_count: number;
  is_completed: boolean;
  is_round_trip: boolean;
  round_trip_count: number;
  logged_at: string;
  memo: string | null;
  created_at: string;
  updated_at: string;
}

export interface Attendance {
  id: string;
  profile_id: string;
  attended_at: string; // 출석일자
  checked_at: string;  // 체크한 시각
  created_at: string;
}

export interface DailyReservation {
  id: string;
  guest_name: string;
  depositor_name: string;
  reserved_at: string;
  guest_count: number;
  status: ReservationStatus;
  created_at: string;
  updated_at: string;
}

export interface FreeBoardPost {
  id: string;
  author_id: string;
  title: string;
  body: string;
  created_at: string;
  updated_at: string;
}

export interface Notice {
  id: string;
  author_id: string;
  title: string;
  body: string;
  popup_yn?: "Y" | "N";
  notice_type: "센터공지" | "등반공지";
  created_at: string;
  updated_at: string;
}

export interface NoticeComment {
  id: string;
  notice_id: string;
  author_id: string;
  body: string;
  created_at: string;
}

export interface MemberVehicle {
  id: string;
  profile_id: string;
  model: string;
  seat_count: number;
  memo: string | null;
  created_at: string;
  updated_at: string;
}

export interface NoticeDispatch {
  id: string;
  notice_id: string;
  vehicle_id: string;
  created_at: string;
}

export interface DispatchPassenger {
  id: string;
  dispatch_id: string;
  notice_id: string;
  profile_id: string;
  created_at: string;
}

export interface PhotoAlbumPost {
  id: string;
  author_id: string;
  title: string;
  body: string;
  images: string[]; // Supabase Storage URL 배열
  created_at: string;
  updated_at: string;
}

// Supabase 제네릭 타입 (테이블명 매핑)
export interface Database {
  public: {
    Tables: {
      profiles: { Row: Profile; Insert: Omit<Profile, "id" | "created_at" | "updated_at">; Update: Partial<Profile> };
      routes: { Row: Route; Insert: Omit<Route, "id" | "created_at" | "updated_at">; Update: Partial<Route> };
      outdoor_routes: { Row: OutdoorRoute; Insert: Omit<OutdoorRoute, "id" | "created_at" | "updated_at">; Update: Partial<OutdoorRoute> };
      exercise_logs: { Row: ExerciseLog; Insert: Omit<ExerciseLog, "id" | "created_at" | "updated_at">; Update: Partial<ExerciseLog> };
      outdoor_exercise_logs: { Row: OutdoorExerciseLog; Insert: Omit<OutdoorExerciseLog, "id" | "created_at" | "updated_at">; Update: Partial<OutdoorExerciseLog> };
      attendances: { Row: Attendance; Insert: Omit<Attendance, "id" | "created_at">; Update: Partial<Attendance> };
      daily_reservations: { Row: DailyReservation; Insert: Omit<DailyReservation, "id" | "created_at" | "updated_at">; Update: Partial<DailyReservation> };
      free_board_posts: { Row: FreeBoardPost; Insert: Omit<FreeBoardPost, "id" | "created_at" | "updated_at">; Update: Partial<FreeBoardPost> };
      notices: { Row: Notice; Insert: Omit<Notice, "id" | "created_at" | "updated_at">; Update: Partial<Notice> };
      notice_comments: { Row: NoticeComment; Insert: Omit<NoticeComment, "id" | "created_at">; Update: Partial<NoticeComment> };
      member_vehicles: { Row: MemberVehicle; Insert: Omit<MemberVehicle, "id" | "created_at" | "updated_at">; Update: Partial<MemberVehicle> };
      notice_dispatches: { Row: NoticeDispatch; Insert: Omit<NoticeDispatch, "id" | "created_at">; Update: Partial<NoticeDispatch> };
      dispatch_passengers: { Row: DispatchPassenger; Insert: Omit<DispatchPassenger, "id" | "created_at">; Update: Partial<DispatchPassenger> };
      photo_album_posts: { Row: PhotoAlbumPost; Insert: Omit<PhotoAlbumPost, "id" | "created_at" | "updated_at">; Update: Partial<PhotoAlbumPost> };
    };
  };
}

// 화면 표시용 라벨
export const OUTDOOR_LOCATION_LABELS: Record<OutdoorLocation, string> = {
  ilsan: "일산",
  munhak: "문학",
};

export const HOLD_COLOR_LABELS: Record<HoldColor, string> = {
  red: "빨강",
  orange: "주황",
  yellow: "노랑",
  green: "초록",
  blue: "파랑",
  indigo: "남색",
  violet: "보라",
  white: "흰색",
  black: "검정",
  pink: "분홍",
};

export const OUTDOOR_LOCATIONS: OutdoorLocation[] = ["ilsan", "munhak"];
export const HOLD_COLORS: HoldColor[] = ["red", "orange", "yellow", "green", "blue", "indigo", "violet", "white", "black", "pink"];

export const WALL_TYPE_LABELS: Record<WallType, string> = {
  vertical: "직벽",
  slight_overhang: "약오버벽",
  overhang: "오버벽",
  extreme_overhang: "극오버",
};

export const OUTDOOR_WALL_TYPE_LABELS: Record<OutdoorWallType, string> = {
  vertical: "직벽",
  left_overhang: "좌측오버행",
  right_overhang: "우측오버행",
  center_overhang: "중앙오버행",
};

export const OUTDOOR_WALL_TYPES: OutdoorWallType[] = ["vertical", "left_overhang", "right_overhang", "center_overhang"];

export const GRADE_VALUES: GradeValue[] = ["5.9", "10", "11", "12", "13"];
export const GRADE_DETAILS: GradeDetail[] = ["a", "b", "c", "d"];

export function formatGrade(gradeValue: GradeValue, gradeDetail: GradeDetail): string {
  return `${gradeValue}${gradeDetail}`;
}
