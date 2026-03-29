"""
paddle_normalizer.py — Normalizador universal de nombres de palas (Smashly).

Resuelve el problema de duplicados causados por variaciones de sintaxis entre
tiendas: "Noxat10", "NOXAT10", "pala Noxat10" → todos producen "noxat10".

Uso:
    from src.scrapers.paddle_normalizer import normalize_paddle_name, slugify_paddle

    normalize_paddle_name("pala Noxat10")   # → "noxat10"
    normalize_paddle_name("NOXAT10")        # → "noxat10"
    slugify_paddle("Head Delta Pro 2024")   # → "head-delta-pro-2024"
"""

import re
import unicodedata


# ── Prefijos/sufijos de "ruido" que añaden las tiendas ───────────────────────
# Se eliminan al inicio o al final del nombre, en cualquier capitalización.
_NOISE_TOKENS = [
    "pala de padel",
    "pala padel",
    "pala de pádel",
    "pala pádel",
    "pala",
    "padel",
    "pádel",
    "racket",
    "raqueta",
]

# Palabras gramaticales de relleno que aparecen entre tokens reales
_FILLER_WORDS = {"de", "del", "la", "el", "los", "las", "para", "y"}


def normalize_paddle_name(raw_name: str) -> str:
    """
    Devuelve el nombre de pala normalizado para almacenamiento y búsqueda.

    Transformaciones aplicadas (en orden):
      1. Convertir a minúsculas
      2. Eliminar prefijos/sufijos de tienda ("pala", "padel", etc.)
      3. Eliminar palabras de relleno sueltas
      4. Colapsar espacios múltiples
      5. Strip de espacios inicio/final

    El resultado es solo texto alfanumérico + espacios internos + guiones,
    en minúsculas. NO se eliminan guiones internos porque forman parte del
    nombre real de muchos modelos (p.ej. "vibor-a black mamba").

    Ejemplos:
        "Noxat10"          → "noxat10"
        "NOXAT10"          → "noxat10"
        "pala Noxat10"     → "noxat10"
        "Pala De Padel Bullpadel Hack 03" → "bullpadel hack 03"
        "HEAD Delta Pro Woman 2024"        → "head delta pro woman 2024"
    """
    if not raw_name or not isinstance(raw_name, str):
        return ""

    name = raw_name.strip().lower()

    # 1. Eliminar prefijos/sufijos de tienda (orden importa: más largos primero)
    for noise in sorted(_NOISE_TOKENS, key=len, reverse=True):
        # Al principio
        if name.startswith(noise):
            name = name[len(noise):].strip()
        # Al final
        if name.endswith(noise):
            name = name[: -len(noise)].strip()

    # 2. Eliminar palabras de relleno que queden sueltas al principio
    tokens = name.split()
    while tokens and tokens[0] in _FILLER_WORDS:
        tokens.pop(0)
    while tokens and tokens[-1] in _FILLER_WORDS:
        tokens.pop()
    name = " ".join(tokens)

    # 3. Colapsar espacios múltiples y strip final
    name = re.sub(r"\s+", " ", name).strip()

    return name


def normalize_for_comparison(raw_name: str) -> str:
    """
    Versión más agresiva para deduplicación/comparación fuzzy.

    Sobre normalize_paddle_name añade:
      - Elimina años (2020-2029)
      - Elimina puntuación (excepto guiones internos)
      - Elimina nombres de jugadores conocidos
      - Normaliza versiones decimales ("1.0" → "1")

    NO usar para almacenamiento; usar solo para comparar si dos nombres
    son el mismo modelo.
    """
    name = normalize_paddle_name(raw_name)

    # Eliminar años
    name = re.sub(r"\b202\d\b", "", name)

    # Eliminar nombres de jugadores (ruido de marketing)
    _PLAYER_NAMES = [
        "jon sanz", "paquito", "navarro", "lebron", "galan", "tapia",
        "coello", "chingotto", "stupa", "di nenno", "sanyo", "bela",
        "belasteguin", "momo", "alex ruiz", "tello", "yanguas", "garrido",
        "ari sanchez", "paulita", "josemaria", "triay", "salazar",
        "bea gonzalez", "martita", "ortega",
    ]
    for player in _PLAYER_NAMES:
        name = name.replace(player, "")

    # Normalizar versiones decimales: "1.0" → "1"
    name = re.sub(r"\.0\b", "", name)

    # Eliminar puntuación (conservar guiones internos entre letras/números)
    name = re.sub(r"(?<!\w)-(?!\w)", " ", name)   # guiones no internos → espacio
    name = re.sub(r"[^\w\s-]", "", name)

    # Colapsar y strip
    name = re.sub(r"\s+", " ", name).strip()

    return name


def slugify_paddle(brand: str, model: str) -> str:
    """
    Genera un slug URL-safe a partir de marca + modelo normalizado.

    Ejemplo:
        slugify_paddle("Bullpadel", "Hack 03 2024") → "bullpadel-hack-03-2024"
    """
    text = f"{brand}-{model}"
    text = text.lower()
    text = unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode("utf-8")
    text = re.sub(r"[^\w\s-]", "", text)
    text = re.sub(r"[-\s]+", "-", text).strip("-")
    return text


def names_are_equivalent(name_a: str, name_b: str) -> bool:
    """
    Comprueba si dos nombres de pala crudos son equivalentes tras normalización.

    Útil para validaciones rápidas sin fuzzy matching.

    Ejemplo:
        names_are_equivalent("pala Noxat10", "NOXAT10")  → True
        names_are_equivalent("Nox AT10", "Nox AT12")     → False
    """
    return normalize_for_comparison(name_a) == normalize_for_comparison(name_b)


# ── Tests inline ──────────────────────────────────────────────────────────────
if __name__ == "__main__":
    test_cases = [
        # (input, expected_normalized)
        ("Noxat10",                             "noxat10"),
        ("NOXAT10",                             "noxat10"),
        ("pala Noxat10",                        "noxat10"),
        ("Pala Noxat10",                        "noxat10"),
        ("PALA NOXAT10",                        "noxat10"),
        ("pala de padel Noxat10",               "noxat10"),
        ("pala pádel Noxat10",                  "noxat10"),
        ("Noxat10 pala",                        "noxat10"),
        ("HEAD Delta Pro Woman 2024",            "head delta pro woman 2024"),
        ("Bullpadel Hack 03 2024",              "bullpadel hack 03 2024"),
        ("  pala   Bullpadel  Hack 03  ",       "bullpadel hack 03"),
        ("VIBOR-A Black Mamba",                 "vibor-a black mamba"),
        ("pala padel nox x-one evo",            "nox x-one evo"),
    ]

    print("=" * 60)
    print("TEST: normalize_paddle_name()")
    print("=" * 60)
    passed = 0
    failed = 0
    for raw, expected in test_cases:
        result = normalize_paddle_name(raw)
        ok = result == expected
        status = "✅" if ok else "❌"
        if ok:
            passed += 1
        else:
            failed += 1
        print(f"  {status} '{raw}'")
        if not ok:
            print(f"       Expected : '{expected}'")
            print(f"       Got      : '{result}'")

    print(f"\nResultado: {passed}/{len(test_cases)} passed, {failed} failed\n")

    print("=" * 60)
    print("TEST: names_are_equivalent()")
    print("=" * 60)
    equiv_cases = [
        ("Noxat10",        "NOXAT10",          True),
        ("pala Noxat10",   "noxat10",           True),
        ("PALA NOXAT10",   "Noxat10",           True),
        ("Nox AT10",       "Nox AT12",          False),
        ("HEAD Delta Pro",  "HEAD Delta Pro Woman", False),
    ]
    for a, b, expected in equiv_cases:
        result = names_are_equivalent(a, b)
        ok = result == expected
        status = "✅" if ok else "❌"
        print(f"  {status} '{a}' ≡ '{b}' → {result} (expected {expected})")

    print()
    print("=" * 60)
    print("TEST: slugify_paddle()")
    print("=" * 60)
    slug_cases = [
        ("Bullpadel", "Hack 03 2024",  "bullpadel-hack-03-2024"),
        ("NOX",       "X-ONE Evo",     "nox-x-one-evo"),
        ("HEAD",      "Delta Pro",     "head-delta-pro"),
    ]
    for brand, model, expected in slug_cases:
        result = slugify_paddle(brand, model)
        ok = result == expected
        status = "✅" if ok else "❌"
        print(f"  {status} slugify('{brand}', '{model}') → '{result}'")
        if not ok:
            print(f"       Expected: '{expected}'")
