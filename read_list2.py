import io
with io.open('list.txt', 'r', encoding='utf-16le', errors='ignore') as f:
    content = f.read()
    print("Has department:", "accounts_department" in content)
    print("Has posts:", "posts_post" in content)
    print("Has faculty:", "accounts_faculty" in content)
