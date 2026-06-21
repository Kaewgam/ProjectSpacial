@echo off
"C:\Program Files\PostgreSQL\17\bin\pg_restore.exe" -v --clean --if-exists --no-owner --no-privileges -d "postgresql://postgres.bgvlubrowdyaeidbfuxg:IjoLwdzxpDVgj7Ch@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres" Backup.sql
