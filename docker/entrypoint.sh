#!/bin/sh
# =====================================================================
#  Arranque de Apache.
#  Railway asigna el puerto en $PORT; en local se usa 80.
#  Se regenera la configuracion desde la plantilla en cada arranque,
#  de modo que reiniciar el contenedor sea idempotente.
# =====================================================================
set -eu

# ---------------------------------------------------------------------
#  Red de seguridad contra AH00534 ("More than one MPM loaded").
#  El Dockerfile ya deja un unico MPM, pero si la imagen se reconstruye
#  con capas cacheadas o alguien habilita mpm_event por fuera, aqui se
#  vuelve a forzar prefork (el unico compatible con mod_php).
# ---------------------------------------------------------------------
rm -f /etc/apache2/mods-enabled/mpm_*.load /etc/apache2/mods-enabled/mpm_*.conf
ln -s ../mods-available/mpm_prefork.load /etc/apache2/mods-enabled/mpm_prefork.load
ln -s ../mods-available/mpm_prefork.conf /etc/apache2/mods-enabled/mpm_prefork.conf

PORT="${PORT:-80}"

echo "Listen ${PORT}" > /etc/apache2/ports.conf
sed "s/__PORT__/${PORT}/g" /etc/apache2/vhost.conf.tpl \
    > /etc/apache2/sites-available/000-default.conf

echo "[entrypoint] Apache escuchando en el puerto ${PORT}"
echo "[entrypoint] MPM cargado: $(ls /etc/apache2/mods-enabled/ | grep '^mpm_.*\.load$' | tr '\n' ' ')"

# Carga inicial del esquema si la base esta vacia (no aborta el arranque).
php /var/www/html/docker/migrate.php || true

exec apache2-foreground "$@"
