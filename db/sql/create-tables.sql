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
  venue_id   INTEGER REFERENCES venues(id),
  course     course_type,
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
  meet_id    INTEGER REFERENCES meets(id),
  event_id   INTEGER REFERENCES events(id),
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
  team_id INTEGER REFERENCES teams(id),
  meet_id INTEGER REFERENCES meets(id)
);

CREATE INDEX name_on_players ON players(name);

CREATE TABLE user_player(
  user_id   INTEGER REFERENCES users(id),
  player_id INTEGER REFERENCES players(id),
  PRIMARY KEY (user_id, player_id)
);

CREATE TABLE results(
  id       INTEGER PRIMARY KEY,
  race_id  INTEGER REFERENCES races(id),
  rank     INTEGER,
  record   INTERVAL HOUR TO SECOND NOT NULL,
  raps     INTERVAL HOUR TO SECOND[],
  UNIQUE(race_id, rank, record)
);

CREATE TABLE player_result(
  player_id    INTEGER REFERENCES players(id),
  result_id  INTEGER REFERENCES results(id),
  swim_order INTEGER,
  PRIMARY KEY (player_id, result_id)
);
