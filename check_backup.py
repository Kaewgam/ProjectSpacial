import io

with io.open('Backup.sql', 'r', encoding='utf-8', errors='replace') as f:
    for _ in range(50):
        print(f.readline().strip())
