FROM postgres:latest
ARG INIT_SQL=${INIT_SQL}
COPY ${INIT_SQL} /docker-entrypoint-initdb.d/
COPY sqls/query /opt/app/sqls/query/
