
import re
import unicodedata
from typing import Optional, Set


KNOWN_BRANDS = [
    "NOX", "BULLPADEL", "ADIDAS", "HEAD", "BABOLAT", "SIUX", "STARVIE", 
    "VIBOR-A", "VIBORA", "DUNLOP", "BLACK CROWN", "ROYAL PADEL", "DROP SHOT", 
    "VARLION", "WILSON", "KUIKMA", "ENEBE", "NB", "RS PADEL", "LOK", 
    "OXDOG", "TECNIFIBRE", "PUMA", "ASICS", "JOMA", "MUNICH", "HYDROGEN",
    "TACTICAL PADEL", "SHOOTER", "JUST TEN", "J'HAYBER", "KELME", "AKKERON",
    "ARES", "KAITT", "LEGEND", "LEVEL", "LORD PADEL", "LOTUS", "MADP", 
    "MIDDLE MOON", "MYSTICA", "ORYGEN", "POWER PADEL", "SET", "SIDE SPIN",
    "SANE", "SOFTEE", "SPADDAL", "STEEL CUSTOM", "VAIRO", "VOLKL", "WINGPADEL"
]

def extract_brand_from_name(name: str) -> tuple[Optional[str], str]:
    """
    Intenta extraer la marca del inicio del nombre si no viene explícita.
    Retorna (marca, modelo_limpio).
    """
    if not name:
        return None, ""
        
    n_upper = name.upper()
    
    # Ordenar marcas por longitud descendente para evitar parciales (ej: "RS" vs "RS PADEL")
    sorted_brands = sorted(KNOWN_BRANDS, key=len, reverse=True)
    
    for brand in sorted_brands:
        # Chequear si empieza con la marca
        if n_upper.startswith(brand):
            # Verificar que sea palabra completa (seguida de espacio o fin de string)
            rem = n_upper[len(brand):]
            if not rem or rem[0] == " " or rem[0] == "-":
                # Encontramos la marca
                # Limpiar el nombre original
                clean_model = name[len(brand):].strip()
                # Quitar guiones o 'by' iniciales
                clean_model = re.sub(r"^[-–]\s*", "", clean_model)
                return brand, clean_model
                
    return None, name


def normalize_name(name: Optional[str]) -> Optional[str]:
    """
    Normaliza un nombre de pala para comparación.
    Elimina prefijos/sufijos, espacios extra, y convierte a minúsculas.
    """
    if not name:
        return None
    n = name.strip()
    # Quitar sufijos/prefijos comunes de scraping
    # "(Pala)" al final
    n = re.sub(r"\s*[\(\[]Pala[\)\]]\s*$", "", n, flags=re.IGNORECASE)
    # "Pala " al principio
    n = re.sub(r"^\s*Pala\s+", "", n, flags=re.IGNORECASE)
    
    # Normalizar espacios múltiples
    n = re.sub(r"\s+", " ", n)
    return n.lower()

def create_comparison_key(name: Optional[str]) -> Optional[str]:
    """
    Crea una clave de comparación estricta (alfanumérica).
    """
    if not name:
        return None
    key = normalize_name(name)
    if not key:
        return None
        
    # Eliminar acentos
    key = unicodedata.normalize('NFKD', key).encode('ASCII', 'ignore').decode('ASCII')
    
    # Eliminar todo excepto letras y números
    key = re.sub(r'[^a-z0-9]', '', key)
    return key

def tokenize_name(name: str) -> Set[str]:
    """
    Tokeniza un nombre en componentes significativos.
    Incluye lógica mejorada para tokens cortos (ej: w, v2).
    """
    normalized = normalize_name(name) or ""
    tokens = set()
    
    # Patrón para palabras y números
    for word in re.findall(r'[a-z0-9]+', normalized):
        # 1. Palabras de 2+ caracteres
        # 2. Tokens cortos críticos: w (woman), v (version), s (super), x (extreme)
        if len(word) >= 2 or word in ['w', 'v', 's', 'x']:
            tokens.add(word)
            
    return tokens

def check_critical_keywords(name1: str, name2: str) -> bool:
    """
    Verifica si hay discrepancias en palabras clave críticas.
    Retorna True si la validación pasa (son compatibles), False si fallan.
    Esto previene que 'Attack' haga match con 'Control' o 'Junior' con versión normal.
    """
    if not name1 or not name2:
        # Si falta nombre, no podemos validar => asumimos compatible para que no rompa,
        # pero el match score será bajo de todas formas.
        return True
        
    n1 = normalize_name(name1) or ""
    n2 = normalize_name(name2) or ""
    
    # Palabras que si aparecen en uno, DEBEN aparecer en el otro
    critical_keywords = [
        "attack", "control", "hybrid", "air", "pro", "master", 
        "ltd", "limited", "team", "junior", "jr", "woman", "light",
        "comfort", "ultimate", "motion", "elite", "flow", "drive",
        "soft", "hard", "tour", "precision"
    ]
    
    # Casos especiales de palabras cortas (deben ser token exacto)
    short_critical = ["w", "ls", "xs", "ul"]
    
    tokens1 = set(re.findall(r'[a-z0-9]+', n1))
    tokens2 = set(re.findall(r'[a-z0-9]+', n2))
    
    # Verificar keywords normales (substring search suele ser suficiente pero arriesgado,
    # mejor usar token existence para mayor precisión, o ' in ' con espacios)
    # Usaremos ' in ' sobre el string normalizado para capturar compuestas,
    # pero requiere cuidado. Para mayor seguridad, check de tokens.
    
    for kw in critical_keywords:
        # Check existencia como token para evitar falsos positivos (ej: "protection" contiene "pro")
        has_kw1 = kw in tokens1
        has_kw2 = kw in tokens2
        if has_kw1 != has_kw2:
            return False
            
    # Verificar keywords cortas
    for kw in short_critical:
        has_kw1 = kw in tokens1
        has_kw2 = kw in tokens2
        if has_kw1 != has_kw2:
            return False
            
    return True

def calculate_similarity(str1: str, str2: str) -> float:
    """
    Calcula similitud secuencia (Levenshtein simplificado).
    """
    if str1 == str2: return 1.0
    len1, len2 = len(str1), len(str2)
    if len1 == 0 or len2 == 0: return 0.0
    
    distances = [[0] * (len2 + 1) for _ in range(len1 + 1)]
    for i in range(len1 + 1): distances[i][0] = i
    for j in range(len2 + 1): distances[0][j] = j
    
    for i in range(1, len1 + 1):
        for j in range(1, len2 + 1):
            cost = 0 if str1[i-1] == str2[j-1] else 1
            distances[i][j] = min(
                distances[i-1][j] + 1,
                distances[i][j-1] + 1,
                distances[i-1][j-1] + cost
            )
            
    max_len = max(len1, len2)
    return 1 - (distances[len1][len2] / max_len)

def calculate_token_similarity(name1: str, name2: str) -> float:
    """
    Calcula similitud Jaccard de tokens.
    """
    tokens1 = tokenize_name(name1)
    tokens2 = tokenize_name(name2)
    
    if not tokens1 or not tokens2:
        return 0.0
        
    intersection = len(tokens1 & tokens2)
    union = len(tokens1 | tokens2)
    
    return intersection / union if union > 0 else 0.0
