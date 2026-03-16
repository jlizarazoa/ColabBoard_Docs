---
id: overview
title: Session Database
sidebar_label: Overview
---

# Session Database

La "Session Database" en ColabBoard no es una base de datos tradicional, sino **Firebase Authentication**. Este servicio gestionado de Google proporciona:

- Almacenamiento seguro de credenciales de usuario
- Generación y validación de tokens JWT
- Gestión de sesiones y revocación
- Soporte multi-factor (SMS, email, OAuth)

## ¿Por qué Firebase?

- **Seguridad**: Firebase maneja el hashing de contraseñas, encriptación y protección contra ataques comunes
- **Escalabilidad**: Servicio gestionado que escala automáticamente
- **Integración**: SDKs para web, móvil y servidor
- **Multi-proveedor**: Soporte para email/contraseña, teléfono, Google, etc.

## Datos Almacenados

Firebase Authentication almacena:

- **Credenciales**: Email, contraseña hasheada, número de teléfono
- **Perfil básico**: UID, email, nombre, foto
- **Metadatos**: Fecha de creación, último login, email verificado
- **Tokens**: Refresh tokens para renovación automática

## Arquitectura

```
Cliente → API Gateway → Session Service → Firebase Authentication
                                      ↓
                               Valida tokens y devuelve info
```

El Session Service actúa como proxy, exponiendo una API REST consistente mientras delega la seguridad a Firebase.

## Migración y Backup

Como servicio gestionado, Firebase maneja backups y recuperación. Para migración:

1. Exportar usuarios via Firebase Admin SDK
2. Importar al nuevo proyecto
3. Actualizar configuración en Session Service

## Consideraciones de Costo

- **Spark Plan**: Gratuito hasta 50k usuarios
- **Blaze Plan**: Pago por uso (muy económico para proyectos pequeños)

## Seguridad

- **Encriptación**: Todos los datos en tránsito y reposo
- **Rate Limiting**: Protección contra ataques de fuerza bruta
- **Auditoría**: Logs de actividad disponibles en Firebase Console
