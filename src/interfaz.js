// Capa fina de interfaz: lee lo que hace el usuario, llama a la lista de Tareas
// y vuelve a pintar. Sin lógica de negocio.
(function () {
  // Algunos navegadores bloquean el almacenamiento local (por ejemplo, desde
  // file:// con cierta configuración); en ese caso la app funciona en memoria.
  function almacenamientoDelNavegador() {
    try {
      return window.localStorage;
    } catch {
      const datos = {};
      return {
        getItem: (clave) => (clave in datos ? datos[clave] : null),
        setItem: (clave, valor) => {
          datos[clave] = String(valor);
        },
      };
    }
  }

  const lista = crearListaDeTareas(almacenamientoDelNavegador());
  const formulario = document.getElementById("formulario-agregar");
  const campo = document.getElementById("texto-tarea");
  const elementoLista = document.getElementById("lista");

  function pintar() {
    elementoLista.replaceChildren(
      ...lista.tareas().map((tarea) => {
        const elemento = document.createElement("li");
        elemento.textContent = tarea.texto;
        elemento.dataset.estado = tarea.estado;
        return elemento;
      }),
    );
  }

  formulario.addEventListener("submit", (evento) => {
    evento.preventDefault();
    const antes = lista.tareas().length;
    lista.agregar(campo.value);
    if (lista.tareas().length > antes) {
      campo.value = "";
      pintar();
    }
    campo.focus();
  });

  pintar();
})();
