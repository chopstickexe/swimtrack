SELECT users.name, teams.name, results.record, results.rank, meets.start_date, meets.name, events.sex, events.distance, events.style
  FROM results, users, teams, user_team_meet, user_result, meets, events, races
  WHERE results.id = user_result.result_id
  AND results.race_id = races.id
  AND races.meet_id = meets.id
  AND races.event_id = events.id
  AND user_result.user_id = users.id
  AND user_team_meet.user_id = users.id
  AND user_team_meet.team_id = teams.id
  AND user_team_meet.meet_id = meets.id
  AND users.name = '鈴木一郎'
  ORDER BY meets.start_date;
