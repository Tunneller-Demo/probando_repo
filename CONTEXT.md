# Lista de tareas

Una lista personal de cosas por hacer, que vive en el navegador de quien la usa.

## Language

**Tarea**:
Algo que el usuario tiene que hacer, descrito por un texto. Siempre está en uno de dos estados: Pendiente o Hecha.
_Avoid_: ítem, to-do, elemento

**Pendiente**:
Estado de una Tarea que aún no se ha hecho. Toda Tarea nueva empieza Pendiente.

**Hecha**:
Estado de una Tarea que el usuario ya terminó. Puede volver a Pendiente.
_Avoid_: completada, terminada

**Vista**:
Qué Tareas se están mirando: **Todas**, solo las **Pendientes** o solo las **Hechas**. Elegir una Vista no cambia ninguna Tarea.
_Avoid_: filtro (como sustantivo del dominio)

**Exportar**:
Guardar en un archivo todas las Tareas de la lista, con su texto y su estado, sea cual sea la Vista, para llevarlas a otro navegador.
_Avoid_: descargar, copia de seguridad

**Importar**:
Sustituir la lista por las Tareas de un archivo exportado: las Tareas que había dejan de estar. Si el archivo no es una lista de Tareas o no trae ninguna, la lista no cambia.
_Avoid_: subir, restaurar
