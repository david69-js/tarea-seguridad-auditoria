# =====================================================================
#  Imagen para el POS Libreria (PHP 8.3 + Apache)
#  Funciona igual en local (docker compose) y en Railway.app
# =====================================================================
FROM php:8.3-apache

# ---------------------------------------------------------------------
#  Extensiones de PHP + modulos de Apache
#
#  IMPORTANTE (error AH00534 "se ha cargado mas de un MPM"):
#  a2dismod/a2enmod no son fiables aqui, asi que los enlaces de los MPM
#  se manejan a mano: se borran TODOS y se deja unicamente prefork,
#  que es el unico compatible con mod_php.
# ---------------------------------------------------------------------
RUN set -eux; \
    docker-php-ext-install pdo_mysql mysqli; \
    rm -f /etc/apache2/mods-enabled/mpm_*.load /etc/apache2/mods-enabled/mpm_*.conf; \
    ln -s ../mods-available/mpm_prefork.load /etc/apache2/mods-enabled/mpm_prefork.load; \
    ln -s ../mods-available/mpm_prefork.conf /etc/apache2/mods-enabled/mpm_prefork.conf; \
    a2enmod rewrite headers

# ---------------------------------------------------------------------
#  Configuracion del sitio (document root = public/)
#  La plantilla se materializa aqui con el puerto 80 para poder validar
#  la sintaxis en build; el entrypoint la regenera con el $PORT real.
# ---------------------------------------------------------------------
COPY docker/vhost.conf.tpl /etc/apache2/vhost.conf.tpl
COPY docker/entrypoint.sh  /usr/local/bin/entrypoint.sh
RUN set -eux; \
    chmod +x /usr/local/bin/entrypoint.sh; \
    sed 's/__PORT__/80/g' /etc/apache2/vhost.conf.tpl \
        > /etc/apache2/sites-available/000-default.conf; \
    echo 'ServerName localhost' > /etc/apache2/conf-available/servername.conf; \
    a2enconf servername

# Copiar el codigo de la aplicacion
COPY . /var/www/html

# Permisos de escritura para las imagenes subidas
RUN set -eux; \
    mkdir -p /var/www/html/public/uploads; \
    chown -R www-data:www-data /var/www/html/public/uploads

# ---------------------------------------------------------------------
#  Verificacion en tiempo de build: exactamente UN MPM y sintaxis valida.
#  Si esto falla, falla el build (en vez de romperse en Railway).
# ---------------------------------------------------------------------
RUN set -eux; \
    mpms="$(ls /etc/apache2/mods-enabled/ | grep -c '^mpm_.*\.load$' || true)"; \
    echo "MPM cargados: ${mpms}"; \
    test "${mpms}" = "1"; \
    apache2ctl -t

EXPOSE 80
CMD ["/usr/local/bin/entrypoint.sh"]
