import os
import sys

if len(sys.argv) != 4:
    print("Uso: python replace_md.py <pasta> <texto_antigo> <texto_novo>")
    sys.exit(1)

folder = sys.argv[1]
old = sys.argv[2]
new = sys.argv[3]

print(f"Pasta: {folder}")
print(f"Procurar: {old!r}")
print(f"Substituir por: {new!r}")

for root, dirs, files in os.walk(folder):
    for filename in files:
        if filename.endswith(".md"):
            path = os.path.join(root, filename)
            print(f"-> Ficheiro: {path}")
            with open(path, "r", encoding="utf-8") as f:
                content = f.read()

            if old in content:
                print(f"   Encontrado em: {path}")
                content = content.replace(old, new)
                with open(path, "w", encoding="utf-8") as f:
                    f.write(content)
            else:
                print(f"   NÃO contém o texto antigo.")

print("Terminado.")
