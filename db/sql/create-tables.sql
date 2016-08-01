CREATE TYPE course_type AS ENUM ('長水路', '短水路');
CREATE TYPE sex_type AS ENUM ('男子', '女子', '混合');

CREATE TABLE venues(
  id   SERIAL PRIMARY KEY,
  name VARCHAR(50),
  city VARCHAR(50),
  UNIQUE(name, city)
);

CREATE TABLE meets(
  id         SERIAL PRIMARY KEY,
  name       VARCHAR(100),
  start_date DATE,
  dates      DATE[],
  venue_id   INTEGER REFERENCES venues(id),
  course     course_type,
  UNIQUE(name, start_date, venue_id)
);

CREATE TABLE events(
  id       SERIAL PRIMARY KEY,
  sex      sex_type,
  distance INTEGER,
  style    VARCHAR(10),
  age      VARCHAR(10),
  relay    BOOLEAN
);

CREATE INDEX sex_on_events ON events(sex);

CREATE INDEX distance_on_events ON events(distance);

CREATE INDEX style_on_events ON events(style);

CREATE TABLE races(
  id         SERIAL PRIMARY KEY,
  meet_id    INTEGER REFERENCES meets(id),
  event_id   INTEGER REFERENCES events(id)
);

CREATE TABLE users(
  id   SERIAL PRIMARY KEY,
  name VARCHAR(30)
);

CREATE INDEX name_on_users ON users(name);

CREATE TABLE teams(
  id   SERIAL PRIMARY KEY,
  name VARCHAR(30)
);

CREATE TABLE user_team_meet(
  user_id  INTEGER REFERENCES users(id),
  team_id  INTEGER REFERENCES teams(id),
  meet_id INTEGER REFERENCES meets(id),
  PRIMARY KEY (user_id, team_id, meet_id)
);

CREATE TABLE results(
  id       SERIAL PRIMARY KEY,
  race_id INTEGER REFERENCES races(id),
  rank     INTEGER,
  record   INTERVAL HOUR TO SECOND NOT NULL,
  raps     INTERVAL HOUR TO SECOND[]
);

CREATE TABLE user_result(
  user_id    INTEGER REFERENCES users(id),
  result_id  INTEGER REFERENCES results(id),
  swim_order INTEGER,
  PRIMARY KEY (user_id, result_id)
);
