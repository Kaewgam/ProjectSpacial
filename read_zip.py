import io
with io.open('zip_contents.txt', 'r', encoding='utf-8', errors='ignore') as f:
    for line in f.readlines()[:20]:
        print(line.strip())
