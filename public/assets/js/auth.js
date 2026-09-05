/* =====================================================================
 *  auth.js  -  Utilidades de las pantallas de login y registro.
 *  Botón "mostrar/ocultar contraseña": la contraseña nunca se muestra
 *  por defecto; es el usuario quien decide revelarla.
 * ===================================================================== */
document.querySelectorAll('[data-toggle-pass]').forEach((btn) => {
    btn.addEventListener('click', () => {
        const campo = document.getElementById(btn.dataset.togglePass);
        if (!campo) return;

        const visible = campo.type === 'text';
        campo.type = visible ? 'password' : 'text';

        btn.setAttribute('aria-pressed', String(!visible));
        btn.setAttribute('aria-label', visible ? 'Mostrar contraseña' : 'Ocultar contraseña');
        btn.querySelector('i').className = visible ? 'bi bi-eye' : 'bi bi-eye-slash';

        campo.focus();
    });
});
