import io
with io.open('Backup.sql', 'r', encoding='utf-8', errors='ignore') as f:
    print(f.read(1000))
