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
    #  Vite pone un hash en el nombre de cada JS/CSS compilado
    #  (index-3f9a1c.js): si el archivo cambia, cambia la URL. Por eso se
    #  pueden cachear un ano sin riesgo de servir una version vieja. El
    #  index.html que los referencia se marca no-cache en .htaccess.
    # -----------------------------------------------------------------
    <IfModule mod_headers.c>
        <LocationMatch "^/app/assets/">
            Header set Cache-Control "public, max-age=31536000, immutable"
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
