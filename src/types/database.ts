/**
 * 베스트클라이밍 Supabase DB 타입 정의
 * 기획안 docs/기획안.md 기준
 */

export type WallType =
  | "vertical"           // 직벽
  | "slight_overhang"    // 약오버벽
  | "overhang"           // 오버벽
  | "extreme_overhang";  // 극오버

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

export interface Route {
  id: string;
  wall_type: WallType;
  grade_value: GradeValue;
  grade_detail: GradeDetail;
  name: string;
  hold_count: number;
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
  created_at: string;
  updated_at: string;
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
      exercise_logs: { Row: ExerciseLog; Insert: Omit<ExerciseLog, "id" | "created_at" | "updated_at">; Update: Partial<ExerciseLog> };
      attendances: { Row: Attendance; Insert: Omit<Attendance, "id" | "created_at">; Update: Partial<Attendance> };
      daily_reservations: { Row: DailyReservation; Insert: Omit<DailyReservation, "id" | "created_at" | "updated_at">; Update: Partial<DailyReservation> };
      free_board_posts: { Row: FreeBoardPost; Insert: Omit<FreeBoardPost, "id" | "created_at" | "updated_at">; Update: Partial<FreeBoardPost> };
      notices: { Row: Notice; Insert: Omit<Notice, "id" | "created_at" | "updated_at">; Update: Partial<Notice> };
      photo_album_posts: { Row: PhotoAlbumPost; Insert: Omit<PhotoAlbumPost, "id" | "created_at" | "updated_at">; Update: Partial<PhotoAlbumPost> };
    };
  };
}

// 화면 표시용 라벨
export const WALL_TYPE_LABELS: Record<WallType, string> = {
  vertical: "직벽",
  slight_overhang: "약오버벽",
  overhang: "오버벽",
  extreme_overhang: "극오버",
};

export const GRADE_VALUES: GradeValue[] = ["5.9", "10", "11", "12", "13"];
export const GRADE_DETAILS: GradeDetail[] = ["a", "b", "c", "d"];

export function formatGrade(gradeValue: GradeValue, gradeDetail: GradeDetail): string {
  return `${gradeValue}${gradeDetail}`;
}
