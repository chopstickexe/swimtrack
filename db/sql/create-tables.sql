CREATE TYPE course_type AS ENUM ('長水路', '短水路');
CREATE TYPE sex_type AS ENUM ('男子', '女子', '混合');

CREATE TABLE venues(
  id   INTEGER PRIMARY KEY,
  name VARCHAR(50),
  city VARCHAR(50),
  UNIQUE(name, city)
);

CREATE TABLE meets(
  id         INTEGER PRIMARY KEY,
  name       VARCHAR(100),
  start_date DATE,
  dates      DATE[],
  venue_id   INTEGER,
  course     course_type,
  url        VARCHAR(200),
  UNIQUE(name, start_date, venue_id)
);

CREATE TABLE events(
  id       INTEGER PRIMARY KEY,
  sex      sex_type,
  distance INTEGER,
  style    VARCHAR(50),
  age      VARCHAR(50),
  relay    BOOLEAN,
  UNIQUE(sex, distance, style, age, relay)
);

CREATE INDEX sex_on_events ON events(sex);

CREATE INDEX distance_on_events ON events(distance);

CREATE INDEX style_on_events ON events(style);

CREATE TABLE races(
  id         INTEGER PRIMARY KEY,
  meet_id    INTEGER,
  event_id   INTEGER,
  url        VARCHAR(200),
  UNIQUE(meet_id, event_id)
);

CREATE TABLE users(
  id          INTEGER PRIMARY KEY,
  name        VARCHAR(100),
  screen_name VARCHAR(100)
);

CREATE TABLE teams(
  id   INTEGER PRIMARY KEY,
  name VARCHAR(50),
  UNIQUE(name)
);

CREATE TABLE players(
  id      INTEGER PRIMARY KEY,
  name    VARCHAR(100),
  team_id INTEGER,
  meet_id INTEGER,
  UNIQUE(name, team_id, meet_id)
);

CREATE INDEX name_on_players ON players(name);

CREATE TABLE user_player(
  user_id   INTEGER,
  player_id INTEGER,
  PRIMARY KEY (user_id, player_id)
);

CREATE TABLE results(
  id       INTEGER PRIMARY KEY,
  race_id  INTEGER,
  rank     INTEGER,
  record   INTERVAL HOUR TO SECOND NOT NULL,
  raps     INTERVAL HOUR TO SECOND[]
);

CREATE TABLE player_result(
  player_id    INTEGER,
  result_id  INTEGER,
  swim_order INTEGER,
  PRIMARY KEY (player_id, result_id)
);
