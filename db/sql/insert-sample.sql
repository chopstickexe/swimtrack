INSERT INTO venues(name, city)
  VALUES ('東京国際水泳場', '東京');

INSERT INTO meets(name, start_date, dates, venue_id, course)
  VALUES ('第1回東京都水泳大会', '2016-01-01', '{"2016-01-01"}', 1, '長水路'),
  ('第2回東京都水泳大会', '2016-04-01', '{"2016-04-01", "2016-04-02"}',1, '長水路');

INSERT INTO events(sex, distance, style, age, relay)
  VALUES ('男子', 100, '背泳ぎ', '30〜35歳', 'false'),
   ('男子', 100, '背泳ぎ', '40〜45歳', 'false'),
   ('混合', 200, 'メドレーリレー', '200〜239歳', 'true');

INSERT INTO races(meet_id, event_id)
  VALUES (1, 1), (1, 2), (2, 1), (2, 2), (2, 3);

INSERT INTO users(name)
  VALUES ('鈴木一郎'), ('田中二郎'), ('佐藤三子'), ('中村四美'), ('黒板五郎');

INSERT INTO teams(name)
  VALUES ('チームとびっ子'), ('さんまSC');

INSERT INTO user_team(user_id, team_id, first_meet_id)
  VALUES (1, 1, 1), (2, 2, 1), (3, 1, 2), (4, 1, 2), (5, 1, 1);

INSERT INTO results(race_id, rank, record)
  VALUES (1, 1, '1 minute 03.97 seconds'),
  (1, 2, '1 minute 05.23 seconds'),
  (3, 1, '1 minute 01.40 seconds'),
  (3, 2, '1 minute 10.81 seconds'),
  (3, 3, '1 minute 11.21 seconds'),
  (5, 1, '2 minute 30.53 seconds');

INSERT INTO user_result(user_id, result_id, swim_order)
  VALUES (2, 1, 0), (1, 2, 0), (1, 3, 0), (5, 4, 0), (2, 5, 0), (1, 6, 1), (3, 6, 2), (4, 6, 3), (5, 6, 4);
