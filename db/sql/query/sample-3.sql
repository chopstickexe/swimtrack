SELECT users.name, teams.name, results.record, results.rank, meets.start_date, meets.name, events.sex, events.distance, events.style, user_result.swim_order
  FROM results, users, teams, user_team, user_result, meets, events, races
  WHERE results.id = user_result.result_id
  AND results.race_id = races.id
  AND races.meet_id = meets.id
  AND races.event_id = events.id
  AND user_result.user_id = users.id
  AND user_team.user_id = users.id
  AND user_team.team_id = teams.id
  AND teams.name = 'チームとびっ子'
  AND meets.name = '第2回東京都水泳大会'
  ORDER BY events.sex, events.distance, events.style, user_result.swim_order;
