import io
with io.open('list.txt', 'r', encoding='utf-16le', errors='ignore') as f:
    for line in f.readlines()[:50]:
        print(line.strip())
