INSTRUCCIONES DE INSTALACIÓN Y EJECUCIÓN.

1. Clona el repositorio en tu equipo.
2. Ubicate en la carpeta donde se encuentran los archivos, da click derecho, selecciona la terminal y allí escribes el comando "code .".
3. Una ves en tu editor de codigo abre una terminal.
4. Ejecuta el comando "npm install".
5. Luego ejecuta el comando "npm install express"
6. Luego ejecuta el comando "npm install mysql2"

Descarga el script de la base de datos.
Y para ejecutarla necesitas un gestor de base de datoas como MySQL Workbench o MySQL Front.
Una ves descargado el script, lo abres y ejecutas.

De regreso en el VS Code o tu editor de codigo de preferencia, ejecutas el comando "npm run dev"
Y debe apatrecerte los siguentes mensajes con el programa corriendo perfectamente.

[nodemon] watching path(s): *.*
[nodemon] watching extensions: js,mjs,cjs,json
[nodemon] starting `node server.js`
◇ injected env (0) from .env // tip: ⌘ custom filepath { path: '/custom/path/.env' }
Conectado a MySQL correctamente
Servidor corriendo en http://localhost:3000

EN ESTA RUTA PUEDES VER LA PAGINA PRINCIPAL,
En VS Code con la estensión Live Server.
(http://127.0.0.1:5500/index.html)
