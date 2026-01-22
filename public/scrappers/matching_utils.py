
import re
import unicodedata
from typing import Optional, Set, Dict, Any


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


# =============================================================================
# FUNCIONES DE MATCHING POR ESPECIFICACIONES TÉCNICAS
# =============================================================================

def parse_weight(weight_str: Optional[str]) -> Optional[tuple[int, int]]:
    """
    Extrae el peso en gramos de un string.
    Retorna una tupla (min, max) o None si no se puede parsear.
    Ejemplos:
        "360-375gr" -> (360, 375)
        "360gr" -> (360, 360)
        "Peso: 360-375 gramos" -> (360, 375)
    """
    if not weight_str:
        return None

    # Buscar patrones de peso
    patterns = [
        r'(\d+)\s*[-–]\s*(\d+)\s*g\s*(?:r)?(?:ramos)?',  # 360-375gr
        r'(\d+)\s*g\s*(?:r)?(?:ramos)?',                    # 360gr
        r'(\d+)\s*[-–]\s*(\d+)\s*gr',                      # 360-375 gr (sin punto)
        r'peso[:\s]+(\d+[-–]\d+)\s*gr',                    # peso: 360-375gr
        r'peso[:\s]+(\d+)\s*gr',                           # peso: 360gr
    ]

    for pattern in patterns:
        match = re.search(pattern, weight_str, re.IGNORECASE)
        if match:
            if len(match.groups()) == 2:
                return (int(match.group(1)), int(match.group(2)))
            else:
                val = int(match.group(1))
                return (val, val)

    return None


def parse_year(year_str: Optional[str]) -> Optional[int]:
    """
    Extrae el año de un string.
    Retorna el año como entero o None si no se puede parsear.
    Ejemplos:
        "2026" -> 2026
        "Modelo 2025" -> 2025
        "Año: 2024" -> 2024
    """
    if not year_str:
        return None

    # Buscar años entre 2000 y 2030 (palas de pádel modernas)
    match = re.search(r'\b(20[1-3][0-9])\b', year_str)
    if match:
        return int(match.group(1))

    return None


def parse_profile(profile_str: Optional[str]) -> Optional[int]:
    """
    Extrae el grosor/perfil en mm de un string.
    Retorna el grosor como entero o None si no se puede parsear.
    Ejemplos:
        "38mm" -> 38
        "Profile: 36mm" -> 36
        "Grosor: 38 mm" -> 38
    """
    if not profile_str:
        return None

    # Buscar patrones de grosor (típicamente 36-38mm)
    patterns = [
        r'(\d+)\s*mm',
        r'perfil[:\s]+(\d+)',
        r'grosor[:\s]+(\d+)',
        r'profile[:\s]+(\d+)',
    ]

    for pattern in patterns:
        match = re.search(pattern, profile_str, re.IGNORECASE)
        if match:
            val = int(match.group(1))
            # Los perfiles de palas suelen estar entre 30 y 50mm
            if 30 <= val <= 50:
                return val

    return None


def normalize_shape(shape: Optional[str]) -> Optional[str]:
    """
    Normaliza el nombre de la forma de la pala.
    """
    if not shape:
        return None

    s = shape.lower().strip()
    shape_mapping = {
        'lágrima': 'teardrop',
        'lagrima': 'teardrop',
        'teardrop': 'teardrop',
        'diamante': 'diamond',
        'diamond': 'diamond',
        'redonda': 'round',
        'round': 'round',
        'cuadrada': 'square',
        'square': 'square',
    }
    return shape_mapping.get(s, s)


def normalize_balance(balance: Optional[str]) -> Optional[str]:
    """
    Normaliza el balance de la pala.
    """
    if not balance:
        return None

    b = balance.lower().strip()
    balance_mapping = {
        'bajo': 'low',
        'low': 'low',
        'medio': 'medium',
        'media': 'medium',
        'medium': 'medium',
        'alto': 'high',
        'high': 'high',
    }
    return balance_mapping.get(b, b)


def compare_specs(specs1: Dict[str, Any], specs2: Dict[str, Any]) -> float:
    """
    Compara especificaciones técnicas de dos productos.
    Retorna un score entre 0 y 1 indicando qué tan similares son las specs.

    Ponderaciones:
    - Peso: 30% (muy importante)
    - Forma: 25% (importante)
    - Balance: 20%
    - Perfil: 15%
    - Año: 10% (menos crítico, puede haber variaciones)
    """
    if not specs1 or not specs2:
        return 0.0

    scores = []
    weights = []

    # 1. Comparación de peso
    weight1 = parse_weight(str(specs1.get('peso') or specs1.get('weight') or ''))
    weight2 = parse_weight(str(specs2.get('peso') or specs2.get('weight') or ''))

    if weight1 and weight2:
        # Calcular solapamiento de rangos
        min1, max1 = weight1
        min2, max2 = weight2
        overlap = max(0, min(max1, max2) - max(min1, min2))
        total_range = max(max1, max2) - min(min1, min2)
        weight_score = overlap / total_range if total_range > 0 else 1.0
        scores.append(weight_score)
        weights.append(0.30)

    # 2. Comparación de forma
    shape1 = normalize_shape(specs1.get('shape') or specs1.get('forma') or specs1.get('characteristics_shape'))
    shape2 = normalize_shape(specs2.get('shape') or specs2.get('forma') or specs2.get('characteristics_shape'))

    if shape1 and shape2:
        shape_score = 1.0 if shape1 == shape2 else 0.0
        scores.append(shape_score)
        weights.append(0.25)

    # 3. Comparación de balance
    balance1 = normalize_balance(specs1.get('balance') or specs1.get('characteristics_balance'))
    balance2 = normalize_balance(specs2.get('balance') or specs2.get('characteristics_balance'))

    if balance1 and balance2:
        balance_score = 1.0 if balance1 == balance2 else 0.5  # Balance diferente no es tan crítico
        scores.append(balance_score)
        weights.append(0.20)

    # 4. Comparación de perfil/grosor
    profile1 = parse_profile(str(specs1.get('grosor') or specs1.get('profile') or specs1.get('thickness') or ''))
    profile2 = parse_profile(str(specs2.get('grosor') or specs2.get('profile') or specs2.get('thickness') or ''))

    if profile1 and profile2:
        # Diferencia de hasta 2mm se considera similar
        profile_diff = abs(profile1 - profile2)
        profile_score = max(0, 1.0 - (profile_diff / 2.0))
        scores.append(profile_score)
        weights.append(0.15)

    # 5. Comparación de año
    year1 = parse_year(str(specs1.get('to') or specs1.get('year') or specs1.get('año') or ''))
    year2 = parse_year(str(specs2.get('to') or specs2.get('year') or specs2.get('año') or ''))

    if year1 and year2:
        # Diferencia de 1 año es aceptable (mismas series)
        year_diff = abs(year1 - year2)
        year_score = 1.0 if year_diff == 0 else 0.7 if year_diff == 1 else 0.3
        scores.append(year_score)
        weights.append(0.10)

    if not scores:
        return 0.0

    # Calcular promedio ponderado
    total_weight = sum(weights)
    weighted_sum = sum(s * w for s, w in zip(scores, weights))
    return weighted_sum / total_weight if total_weight > 0 else 0.0


def extract_specs_from_product(product: Dict[str, Any]) -> Dict[str, Any]:
    """
    Extrae todas las especificaciones técnicas de un producto en un formato unificado.
    """
    specs: Dict[str, Any] = {}

    # Desde el campo specs
    product_specs = product.get('specs') or {}
    if isinstance(product_specs, dict):
        specs.update(product_specs)

    # Desde características individuales
    characteristics_fields = [
        'characteristics_shape', 'characteristics_balance', 'characteristics_core',
        'characteristics_face', 'characteristics_hardness', 'characteristics_surface',
        'characteristics_game_level'
    ]

    for field in characteristics_fields:
        value = product.get(field)
        if value:
            # Mapear al nombre simplificado
            key = field.replace('characteristics_', '')
            specs[key] = value

    # Añadir campos anidados si existen
    if product.get('peso') or product.get('weight'):
        specs['peso'] = product.get('peso') or product.get('weight')
    if product.get('to') or product.get('year'):
        specs['to'] = product.get('to') or product.get('year')

    return specs


def calculate_composite_score(
    product1: Dict[str, Any],
    product2: Dict[str, Any],
    name_weight: float = 0.6,
    specs_weight: float = 0.4
) -> tuple[float, Dict[str, Any]]:
    """
    Calcula un score compuesto de similitud entre dos productos.

    Combina:
    1. Similitud de nombres (tokens + Levenshtein)
    2. Similitud de especificaciones técnicas

    Retorna:
        - score_composite: Score total entre 0 y 1
        - details: Diccionario con detalles del cálculo
    """
    details = {
        'name_similarity': 0.0,
        'specs_similarity': 0.0,
        'name_score_used': '',
        'critical_check': True,
    }

    name1 = product1.get('name', '')
    name2 = product2.get('name', '')

    # 1. Verificar palabras críticas primero
    if not check_critical_keywords(name1, name2):
        details['critical_check'] = False
        return 0.0, details

    # 2. Calcular similitud de nombres
    token_sim = calculate_token_similarity(name1, name2)
    key1 = create_comparison_key(name1) or ''
    key2 = create_comparison_key(name2) or ''
    seq_sim = calculate_similarity(key1, key2)
    name_sim = max(token_sim, seq_sim)

    details['name_similarity'] = round(name_sim, 3)
    details['name_score_used'] = 'tokens' if token_sim > seq_sim else 'sequence'

    # 3. Calcular similitud de especificaciones
    specs1 = extract_specs_from_product(product1)
    specs2 = extract_specs_from_product(product2)
    specs_sim = compare_specs(specs1, specs2)

    details['specs_similarity'] = round(specs_sim, 3)

    # 4. Calcular score compuesto
    # Si specs_similarity > 0, dar un boost al score de nombre
    if specs_sim > 0.5:
        # Las specs coinciden moderadamente, aumentar confianza
        composite = (name_sim * name_weight) + (specs_sim * specs_weight)
    elif specs_sim > 0:
        # Las specs tienen algo de coincidencia, dar un pequeño boost
        composite = (name_sim * 0.85) + (specs_sim * 0.15)
    else:
        # Sin specs confiables, usar solo nombre
        composite = name_sim

    # Penalización si las specs son claramente diferentes
    if specs_sim == 0 and name_sim > 0.8:
        # Nombres muy similares pero specs completamente diferentes = sospechoso
        composite *= 0.7

    return min(1.0, round(composite, 3)), details


def find_best_match(
    target: Dict[str, Any],
    candidates: list[Dict[str, Any]],
    threshold: float = 0.85,
    require_specs_boost: bool = False
) -> tuple[Optional[int], Dict[str, Any]]:
    """
    Busca el mejor candidato para un producto objetivo.

    Args:
        target: Producto a buscar
        candidates: Lista de productos candidatos
        threshold: Umbral mínimo de similitud (0-1)
        require_specs_boost: Si True, requiere que las specs den un boost positivo

    Returns:
        - Índice del mejor match o None
        - Detalles del matching
    """
    best_idx = None
    best_score = 0.0
    best_details = {}

    for idx, candidate in enumerate(candidates):
        score, details = calculate_composite_score(target, candidate)

        if score > best_score:
            # Verificar requisito de specs boost
            if require_specs_boost and details['specs_similarity'] <= 0:
                continue

            best_score = score
            best_idx = idx
            best_details = details

    if best_score >= threshold:
        return best_idx, {
            'score': best_score,
            'details': best_details,
            'matched_name': candidates[best_idx].get('name') if best_idx is not None else None
        }

    return None, {
        'score': best_score,
        'details': best_details,
        'reason': 'below_threshold' if best_score < threshold else 'no_candidates'
    }
