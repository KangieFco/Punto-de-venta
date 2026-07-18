## Configuración de QZ Tray

Crear la carpeta:

secrets/qz/

Copiar:

- digital-certificate.txt
- private-key.pem

En docker-compose.yml:

volumes:
  - ./uploads/images:/app/wwwroot/images
  - ./secrets/qz:/app/QzCertificates:ro

Después ejecutar:

docker compose up -d --force-recreate backend
