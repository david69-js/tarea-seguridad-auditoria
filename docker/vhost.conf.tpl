# =====================================================================
#  VirtualHost del POS Libreria.
#  __PORT__ lo reemplaza docker/entrypoint.sh con el valor de $PORT
#  (Railway inyecta un puerto aleatorio; en local es 80).
# =====================================================================
<VirtualHost *:__PORT__>
    ServerName localhost
    DocumentRoot /var/www/html/public

    <Directory /var/www/html/public>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>

    # -----------------------------------------------------------------
    #  Cache de los archivos estaticos
    #
    #  Sin cabecera Cache-Control el navegador aplica cache heuristica y
    #  puede reutilizar un CSS o un JS viejo durante horas. Con HTML nuevo
    #  y CSS viejo la interfaz se ve rota. "no-cache" no impide guardar el
    #  archivo: obliga a revalidarlo, asi que si no cambio la respuesta es
    #  un 304 vacio (rapido) y si cambio se descarga la version nueva.
    #  Las URLs ademas llevan ?v=<fecha> (ver asset_url en helpers.php).
    # -----------------------------------------------------------------
    <IfModule mod_headers.c>
        <LocationMatch "^/assets/">
            Header set Cache-Control "no-cache"
        </LocationMatch>
    </IfModule>

    # El codigo de la aplicacion nunca debe servirse directamente.
    <Directory /var/www/html/app>
        Require all denied
    </Directory>

    # Logs a la salida estandar para que Railway los muestre.
    ErrorLog /dev/stderr
    CustomLog /dev/stdout combined
</VirtualHost>
