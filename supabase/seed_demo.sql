-- ============================================================
-- 데모용 후기 시드 (강원도 소상공인 후기 13건)
-- Supabase 대시보드 → SQL Editor 에 붙여넣고 Run.
--
-- · 기존 후기(test2 등)를 모두 지우고 실감나는 후기 13건을 넣습니다.
-- · 가입된 사용자가 최소 1명 있어야 합니다(작성자 user_id 로 사용).
--   → 닉네임은 행마다 저장되므로 한 계정이어도 다양한 닉네임으로 보입니다.
-- · updated_at = created_at 으로 넣어 "(수정됨)" 표시가 안 뜨게 합니다.
-- ============================================================

do $$
declare
  uid uuid;
begin
  select id into uid from auth.users order by created_at asc limit 1;
  if uid is null then
    raise exception '시드할 사용자가 없습니다. 사이트에서 회원가입을 1회 진행한 뒤 다시 실행하세요.';
  end if;

  -- 기존 데이터(테스트 후기) 전체 삭제
  delete from public.reviews;

  insert into public.reviews (user_id, nickname, title, content, rating, created_at, updated_at) values
    (uid, '강릉토박이', '안목해변 앞 카페, 뷰가 미쳤어요', '바다 바로 앞이라 통창으로 파도 보면서 커피 마셨는데 분위기 최고였어요. 라떼도 진하고 직원분들도 친절하셨습니다. 주말엔 사람 많으니 조금 일찍 가세요.', 5, now() - interval '14 hours', now() - interval '14 hours'),
    (uid, '속초러버', '속초 중앙시장 닭강정 줄 설 만해요', '겉바속촉에 양념도 너무 달지 않고 딱이에요. 포장해서 숙소에서 맥주랑 먹었는데 후회 없습니다. 양도 많아서 둘이 먹기 충분했어요.', 5, now() - interval '1 day 6 hours', now() - interval '1 day 6 hours'),
    (uid, '춘천직장인', '춘천 명동 닭갈비 인생집 찾았다', '철판에 막 볶아주시는데 불향이 살아있어요. 막국수랑 같이 먹으니 환상이었습니다. 마지막 볶음밥은 필수예요. 가족 모임으로 또 갈 듯.', 5, now() - interval '2 days 3 hours', now() - interval '2 days 3 hours'),
    (uid, '양양서퍼', '서피비치 근처 브런치 식당', '서핑 끝나고 허기져서 갔는데 양도 많고 맛도 좋았어요. 다만 웨이팅이 좀 길어서 별 하나 뺐습니다. 그래도 재방문 의사 있어요.', 4, now() - interval '3 days 8 hours', now() - interval '3 days 8 hours'),
    (uid, '바다보러간다', '강릉 초당 순두부 아침으로 딱', '고소하고 부드러운 순두부에 양념장 올려 먹으니 속이 풀려요. 짬뽕순두부도 인기라던데 다음엔 그걸로. 주차는 조금 불편했어요.', 4, now() - interval '4 days 5 hours', now() - interval '4 days 5 hours'),
    (uid, '평창감자', '평창 메밀막국수 시원하고 깔끔', '면이 쫄깃하고 육수가 슴슴하니 자꾸 생각나는 맛이에요. 수육이랑 같이 먹으면 더 좋습니다. 시골 분위기라 마음도 편했어요.', 5, now() - interval '6 days 2 hours', now() - interval '6 days 2 hours'),
    (uid, '동해바다맘', '묵호항 회센터 신선해요', '수족관에서 바로 골라 떠주시는데 회가 탱글탱글합니다. 매운탕까지 알차게 먹고 왔어요. 가격도 생각보다 합리적이었습니다.', 5, now() - interval '8 days', now() - interval '8 days'),
    (uid, '주말여행러', '속초 대포항 새우튀김 강추', '갓 튀겨낸 새우튀김 바삭함이 다르네요. 바다 보면서 먹는 맛이 일품입니다. 사람이 많아 조금 기다렸지만 기다린 보람 있었어요.', 4, now() - interval '10 days 4 hours', now() - interval '10 days 4 hours'),
    (uid, '커피한잔의여유', '강릉 빵지순례 성공', '소금빵이랑 휘낭시에 사왔는데 둘 다 훌륭했어요. 매장이 작아 자리는 없지만 포장 추천합니다. 오전에 가야 종류가 많아요.', 4, now() - interval '12 days', now() - interval '12 days'),
    (uid, '강원도민', '춘천 닭갈비 골목 무난한 선택', '관광지라 가격은 살짝 있지만 맛은 평타 이상이에요. 친절하시고 반찬도 깔끔했습니다. 평일 낮엔 한가해서 좋았어요.', 3, now() - interval '14 days 6 hours', now() - interval '14 days 6 hours'),
    (uid, '주말산책러', '양양 죽도해변 근처 카페 한적해요', '사람 북적이는 곳을 싫어하는데 여기 딱이었어요. 통유리로 보는 바다 뷰가 힐링이었습니다. 디저트는 평범했지만 분위기로 만족.', 4, now() - interval '16 days', now() - interval '16 days'),
    (uid, '맛집헌터', '강릉 짬뽕순두부 웨이팅 각오하세요', '유명한 만큼 줄이 깁니다. 그래도 한 입 먹으면 이해돼요. 얼큰하면서 부드러운 순두부 조합이 최고입니다. 다음엔 오픈런 할게요.', 5, now() - interval '19 days', now() - interval '19 days'),
    (uid, '여행기록중', '속초 아바이마을 오징어순대 별미', '오징어순대 처음 먹어봤는데 쫄깃하고 별미네요. 마을 분위기 구경하면서 먹는 재미도 있어요. 가족 어른들도 좋아하셨습니다.', 5, now() - interval '22 days', now() - interval '22 days');

  raise notice '시드 완료';
end $$;

-- 결과 확인
select count(*) as 후기수, round(avg(rating), 1) as 평균별점 from public.reviews;
