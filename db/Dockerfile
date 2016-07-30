FROM postgres:latest
ARG INIT_SQL=${INIT_SQL}
COPY ${INIT_SQL} /docker-entrypoint-initdb.d/
COPY sql /opt/app/sqls
