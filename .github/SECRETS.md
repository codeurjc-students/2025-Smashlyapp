# 🔐 GitHub Secrets Configuration Guide

Este archivo documenta todos los secretos que deben configurarse en GitHub para que el CI/CD funcione correctamente.

## ⚙️ Cómo configurar los secretos

1. Ve a tu repositorio en GitHub
2. Ve a **Settings** → **Secrets and variables** → **Actions**
3. Haz clic en **New repository secret**
4. Añade cada uno de los siguientes secretos:

## 🔑 Secretos requeridos

### Supabase Configuration
```
SUPABASE_URL=https://lrdgyfmkkboyhoycrnov.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxyZGd5Zm1ra2JveWhveWNybm92Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTQ3MTg0NSwiZXhwIjoyMDY3MDQ3ODQ1fQ.etjT9fa5Ev8OX56IP1mRRwh-Ow7lZl93MfLvxfTM8mc
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxyZGd5Zm1ra2JveWhveWNybm92Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0NzE4NDUsImV4cCI6MjA2NzA0Nzg0NX0.GX_TUnPCr6VaOZXnpwOn-4wqfYFPfIuYdSIdkkqfvHM
```

### JWT Configuration
```
JWT_SECRET=ykVwy+BFSupNZmY9CqoStbZBXUZgFAEWk1KjgvBQW7Ht5u50YnUfIiUC/A53EOh5KCjP5410fprs/TtVyI72ew==
```

### SonarQube Configuration (opcional)
```
SONAR_TOKEN=your_sonarqube_token_here
SONAR_HOST_URL=https://sonarcloud.io
```

## 📝 Cómo obtener los tokens de SonarQube

### Para SonarCloud (recomendado)
1. Ve a [SonarCloud](https://sonarcloud.io)
2. Inicia sesión con tu cuenta de GitHub
3. Ve a **My Account** → **Security**
4. Genera un nuevo token
5. Añade tu proyecto:
   - Organization: tu-usuario-github
   - Project Key: smashly-app
   - Project Name: Smashly - Padel Rackets App

### Para SonarQube local
1. Instala SonarQube localmente
2. Ve a Administration → Security → Users
3. Genera un token para el usuario admin
4. Configura SONAR_HOST_URL con tu URL local

## 🚨 Importante

- **NUNCA** commites estos secretos en el código
- **NUNCA** los pongas en archivos .env que se suban al repositorio
- Estos valores deben ir SOLO en GitHub Secrets
- Si necesitas cambiar algún valor, actualízalo tanto en GitHub Secrets como en tu .env local

## ✅ Verificación

Para verificar que los secretos están bien configurados:

1. Ve a tu repositorio en GitHub
2. Ve a **Actions**
3. Ejecuta manualmente el workflow "Basic Quality Check"
4. Si todo está bien configurado, debería pasar todos los tests

## 🔒 Seguridad adicional

### Recomendaciones:
- Usa diferentes bases de datos para testing y producción
- Rota los tokens periódicamente
- Monitorea el uso de la API de Supabase
- Considera usar GitHub Environments para separar staging/production

### Branch Protection Rules
Configura estas reglas en **Settings** → **Branches** → **Add rule**:
- Require pull request reviews before merging
- Require status checks to pass before merging
- Require branches to be up to date before merging
- Include administrators