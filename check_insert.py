import io
has_insert = False
with io.open('Backup.sql', 'r', encoding='utf-8', errors='ignore') as f:
    for line in f:
        if line.startswith('INSERT INTO'):
            has_insert = True
            print("Found INSERT:", line.strip()[:100])
            break
if not has_insert:
    print("No INSERT statements found either.")
