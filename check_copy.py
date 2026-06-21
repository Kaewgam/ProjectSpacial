import io
has_copy = False
with io.open('Backup.sql', 'r', encoding='utf-8', errors='ignore') as f:
    for line in f:
        if line.startswith('COPY '):
            has_copy = True
            print("Found COPY:", line.strip())
            break
if not has_copy:
    print("No COPY statements found.")
