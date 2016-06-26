SELECT results.rank, users.name, teams.name, results.record, meets.name, events.sex, events.distance, events.style
  FROM results, users, teams, user_team, user_result, meets, events, races
  WHERE results.id = user_result.result_id
  AND results.race_id = races.id
  AND races.meet_id = meets.id
  AND races.event_id = events.id
  AND user_result.user_id = users.id
  AND user_team.user_id = users.id
  AND user_team.team_id = teams.id
  AND meets.name = '第1回東京都水泳大会'
  AND events.sex = '男子'
  AND events.distance = 100
  AND events.style = '背泳ぎ'
  ORDER BY results.rank;
