// reviews 테이블 한 행에 대응하는 타입
export type Review = {
  id: string;
  user_id: string;
  nickname: string;
  title: string;
  content: string;
  rating: number; // 1~5
  created_at: string;
  updated_at: string;
};

// 목록 정렬 옵션
export type SortOption = "latest" | "rating";
export type OrderOption = "asc" | "desc";
