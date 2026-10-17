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
  const contador = document.getElementById("contador");

  // Al repintar se pierde el foco: se devuelve a un control de la Tarea
  // indicada para que quien usa el teclado no tenga que volver a buscarlo.
  function enfocar(id, selectorDelControl) {
    const control = elementoLista.querySelector(
      `li[data-id="${id}"] ${selectorDelControl}`,
    );
    if (control) control.focus();
  }

  function elementoDeTarea(tarea) {
    const elemento = document.createElement("li");
    elemento.dataset.id = tarea.id;
    elemento.dataset.estado = tarea.estado;

    const etiqueta = document.createElement("label");
    const casilla = document.createElement("input");
    casilla.type = "checkbox";
    casilla.checked = tarea.estado === "hecha";
    casilla.addEventListener("change", () => {
      lista.cambiarEstado(tarea.id);
      pintar();
      enfocar(tarea.id, 'input[type="checkbox"]');
    });
    const texto = document.createElement("span");
    texto.textContent = tarea.texto;
    etiqueta.append(casilla, texto);

    const botonBorrar = document.createElement("button");
    botonBorrar.type = "button";
    botonBorrar.className = "borrar";
    botonBorrar.textContent = "Borrar";
    botonBorrar.setAttribute("aria-label", `Borrar «${tarea.texto}»`);
    botonBorrar.addEventListener("click", () => {
      // Tras borrar, el foco pasa a la Tarea siguiente, o a la anterior si era
      // la última; si la lista queda vacía, al campo de texto.
      const ids = lista.tareas().map((otra) => otra.id);
      const posicion = ids.indexOf(tarea.id);
      const vecina = ids[posicion + 1] || ids[posicion - 1];
      lista.borrar(tarea.id);
      pintar();
      if (vecina) enfocar(vecina, "button.borrar");
      else campo.focus();
    });

    elemento.append(etiqueta, botonBorrar);
    return elemento;
  }

  function pintar() {
    elementoLista.replaceChildren(...lista.tareas().map(elementoDeTarea));
    const pendientes = lista.pendientes();
    contador.textContent =
      pendientes === 1 ? "1 Tarea pendiente" : `${pendientes} Tareas pendientes`;
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
