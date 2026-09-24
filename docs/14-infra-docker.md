# 14. Infra Docker/WSL2 (reglas para que no muera Docker)

Traído de `projects/odontoflow` (repo SOLO LECTURA; patrón verificado en producción ahí). Regla de este repo: **SOLO corren los contenedores de este proyecto.**

## Docker en esta máquina
- Docker Engine 29.7.2 corre DENTRO de WSL2 (Ubuntu, `systemd=true` en `/etc/wsl.conf`). NO hay Docker Desktop.
- `docker` NO está en el PATH de Windows (Git Bash): ejecutar vía `wsl.exe -e bash -lc "docker ..."` o abrir `wsl -d Ubuntu`. `docker compose` plugin instalado (docker-compose-plugin).
- Instalado vía Docker CE apt (patrón `install-docker.sh` de odontoflow: keyrings + docker-ce + cli + buildx + compose, usuario en grupo docker, `systemctl enable docker`).

## La regla keepalive (por qué muere Docker y cómo se evita)
- **Problema:** al cerrar la última sesión interactiva de WSL, `wslservice` apaga la distro por inactividad (force kill en `InitTerminateInstanceInternal`) → mata dockerd y todos los contenedores. `.wslconfig` con `vmIdleTimeout=-1` no siempre se honra sin un `wsl --shutdown` previo.
- **Solución (ya activa en esta máquina):** sesión WSL persistente OCULTA (`wsl.exe -d Ubuntu --exec sleep infinity`, sin ventana) lanzada por la tarea programada **`OdontoFlow-WSL-Boot`** (State: Ready, verificada 2026-09-23). La creó odontoflow pero sirve igual para este proyecto: solo mantiene la distro viva. Triggers: logon + repetición cada 1 min (3650 días), `MultipleInstances=IgnoreNew`, sin límite de ejecución, con baterías. Si el sleeper muere, el siguiente tick lo relanza.
- Verificar: `powershell.exe Get-ScheduledTask -TaskName 'OdontoFlow-WSL-Boot'` + `wsl.exe -l -v` (Ubuntu Running).
- Si algún día se recrea aquí: copiar `scripts/configurar-keepalive-wsl.ps1` + `keepalive-sesion.vbs` de odontoflow y renombrar la tarea a `Ecommerce-WSL-Boot`.

## Higiene: solo este proyecto corriendo
- Patrón odontoflow `marsmode-solo-prod.sh` adaptado — detiene todo contenedor de otro compose-project y le quita la política restart para que el daemon no lo auto-encienda:
  ```bash
  #!/usr/bin/env bash
  # ecommerce-solo.sh — deja corriendo SOLO los contenedores de este repo.
  set -u
  PROYECTO="${1:-ecommerce}"
  ids=$(sudo docker ps -q)
  for id in $ids; do
    labels=$(sudo docker inspect -f '{{.Config.Labels}}' "$id")
    case "$labels" in
      *com.docker.compose.project:$PROYECTO*) ;;
      *) sudo docker update --restart=no "$id"; sudo docker stop "$id" ;;
    esac
  done
  sudo docker ps --format '{{.Names}}'
  ```
- **Estado aplicado 2026-09-23:** 30 contenedores de otros repos detenidos + `--restart=no` verificado (marsmode-web+cloudflared, rest-prod-* x10, supabase_gimnasio x12, clinicflow-* x4, odontoflow-* x4). Quedó `docker ps` vacío.
- Recuperar cualquiera si hiciera falta: `docker start <nombre>` o `docker compose up` en su repo (restart=no no rompe nada).

## Receta T1: Postgres + Redis (compose del MVP)
```yaml
# apps/backend/docker-compose.yml (YA existe en el repo desde T1, commit 691aa45; levantado y healthy 2026-09-23.
# Comando: wsl.exe -e bash -lc "cd /mnt/c/Users/Administrator/Documents/projects/ecommerce/apps/backend && docker compose -p ecommerce up -d")
services:
  db:
    image: postgres:16-alpine
    container_name: ecommerce-db
    restart: unless-stopped
    environment:
      POSTGRES_USER: ecommerce
      POSTGRES_PASSWORD: ecommerce_dev   # solo dev local; prod via secret del deploy
      POSTGRES_DB: ecommerce
    ports: ["5432:5432"]
    volumes: [pgdata:/var/lib/postgresql/data]
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ecommerce -d ecommerce"]
      interval: 5s
      timeout: 3s
      retries: 10
  redis:
    image: redis:7-alpine
    container_name: ecommerce-redis
    restart: unless-stopped
    ports: ["6379:6379"]
    volumes: [redisdata:/data]
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 3s
      retries: 10
volumes:
  pgdata:
  redisdata:
```
- `DATABASE_URL=postgresql://ecommerce:ecommerce_dev@localhost:5432/ecommerce` + `REDIS_URL=redis://localhost:6379` en `apps/backend/.env` (gitignored).

## Redes en WSL-Docker (gotcha verificado en odontoflow)
- Dentro de WSL-Docker, `host.docker.internal` apunta al bridge de Docker (172.18.0.1), **NO a Windows**. La ruta que alcanza al host Windows es la IP de `vEthernet (WSL)` (p.ej. 172.17.48.1). Si un contenedor debe llamar a un servicio en Windows: `extra_hosts: ["host.docker.internal:host-gateway"]` + sobrescribir la IP por env.
- Para webhooks de Culqi/Stripe en dev (su nube → backend local): exponer el backend con túnel (cloudflared, patrón de odontoflow) o port-forward de Windows. Nunca en el request path de compra (C4).

## Fuentes
`projects/odontoflow/scripts/{configurar-keepalive-wsl.ps1, keepalive-sesion.vbs, setup-post-reboot.ps1, marsmode-solo-prod.sh, install-docker.sh}` + `docker-compose.yml` de odontoflow (healthchecks + nota `host.docker.internal`). Verificado en esta máquina 2026-09-23: Docker 29.7.2 en WSL Ubuntu, 30 contenedores ajenos detenidos + restart=no, tarea `OdontoFlow-WSL-Boot` Ready.
