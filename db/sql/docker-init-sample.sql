CREATE DATABASE swimtrack;

\c swimtrack;

CREATE TYPE course_type AS ENUM ('長水路', '短水路');
CREATE TYPE sex_type AS ENUM ('男子', '女子', '混合');

CREATE TABLE venues(
  id   SERIAL PRIMARY KEY,
  name VARCHAR(50),
  city VARCHAR(50)
);

CREATE TABLE meets(
  id         SERIAL PRIMARY KEY,
  name       VARCHAR(100),
  start_date DATE,
  dates      DATE[],
  venue_id   INTEGER REFERENCES venues(id),
  course     course_type
);

CREATE TABLE events(
  id       SERIAL PRIMARY KEY,
  sex      sex_type,
  distance INTEGER,
  style    VARCHAR(10),
  age      INTEGER,
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

CREATE TABLE user_team(
  user_id  INTEGER REFERENCES users(id),
  team_id  INTEGER REFERENCES teams(id),
  first_meet_id INTEGER REFERENCES meets(id),
  PRIMARY KEY (user_id, team_id)
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

INSERT INTO venues(name, city)
  VALUES ('東京国際水泳場', '東京');

INSERT INTO meets(name, start_date, dates, venue_id, course)
  VALUES ('第1回東京都水泳大会', '2016-01-01', '{"2016-01-01"}', 1, '長水路'),
  ('第2回東京都水泳大会', '2016-04-01', '{"2016-04-01", "2016-04-02"}',1, '長水路');

INSERT INTO events(sex, distance, style, age, relay)
  VALUES ('男子', 100, '背泳ぎ', 30, 'false'),
   ('男子', 100, '背泳ぎ', 40, 'false'),
   ('混合', 200, 'メドレーリレー', 200, 'true');

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
